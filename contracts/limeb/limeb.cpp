#include <eosio/eosio.hpp>
#include <eosio/asset.hpp>
#include <eosio/action.hpp>

#include <string>
#include <tuple>

using namespace eosio;
using std::string;

/**
 * Lime B AMM
 *
 * Ultra-native constant-product AMM for registered EOSIO-style fungible token contracts.

 * Each symbol is registered to exactly one token contract. This lets Lime B pair
 * native UOS from eosio.token with project tokens deployed on separate contracts.
 *
 * Flow:
 *  1. User transfers tokens to this contract. ontransfer credits an internal balance.
 *  2. User calls addliq or swap in the same atomic transaction.
 *  3. Unused internal balances can always be withdrawn by the owner.
 *
 * The contract account must have eosio.code on its active permission so it can
 * send output assets and liquidity withdrawals using eosio.token::transfer.
 */
CONTRACT limeb : public contract {
public:
    using contract::contract;

    static constexpr uint16_t MAX_FEE_BPS = 1000; // 10%
    static constexpr uint16_t BPS_DENOM = 10000;

    ACTION regtoken(name token_contract, symbol token_symbol, bool enabled) {
        require_auth(get_self());

        check(is_account(token_contract), "token contract account does not exist");
        check(token_symbol.is_valid(), "token symbol is invalid");

        tokens_t tokens(get_self(), get_self().value);
        auto itr = tokens.find(token_symbol.code().raw());

        if (itr == tokens.end()) {
            tokens.emplace(get_self(), [&](auto& row) {
                row.symbol_code_raw = token_symbol.code().raw();
                row.token_contract = token_contract;
                row.token_symbol = token_symbol;
                row.enabled = enabled;
            });
            return;
        }

        check(itr->token_symbol == token_symbol,
              "registered token precision mismatch");

        tokens.modify(itr, same_payer, [&](auto& row) {
            row.token_contract = token_contract;
            row.enabled = enabled;
        });
    }

    ACTION erasepool(uint64_t pool_id) {
        require_auth(get_self());

        pools_t pools(get_self(), get_self().value);
        auto itr = pools.require_find(pool_id, "pool not found");

        check(itr->reserve0.amount == 0 && itr->reserve1.amount == 0,
              "cannot erase a funded pool");
        check(itr->total_shares == 0, "cannot erase a pool with LP shares");

        pools.erase(itr);
    }

    ACTION createpool(symbol token0, symbol token1, uint16_t fee_bps) {
        require_auth(get_self());

        check(token0.is_valid(), "token0 symbol is invalid");
        check(token1.is_valid(), "token1 symbol is invalid");
        check(token0 != token1, "pool tokens must be different");
        check(fee_bps <= MAX_FEE_BPS, "fee exceeds maximum");
        require_registered_token(token0);
        require_registered_token(token1);

        pools_t pools(get_self(), get_self().value);
        auto pair_index = pools.get_index<"bypair"_n>();
        check(pair_index.find(make_pair_key(token0, token1)) == pair_index.end(),
              "pool already exists");

        uint64_t id = pools.available_primary_key();
        if (id == 0 && pools.begin() != pools.end()) {
            id = pools.rbegin()->id + 1;
        }

        pools.emplace(get_self(), [&](auto& row) {
            row.id = id;
            row.reserve0 = asset{0, token0};
            row.reserve1 = asset{0, token1};
            row.total_shares = 0;
            row.fee_bps = fee_bps;
            row.enabled = true;
        });
    }

    ACTION setenabled(uint64_t pool_id, bool enabled) {
        require_auth(get_self());

        pools_t pools(get_self(), get_self().value);
        auto itr = pools.require_find(pool_id, "pool not found");

        pools.modify(itr, same_payer, [&](auto& row) {
            row.enabled = enabled;
        });
    }

    ACTION setfee(uint64_t pool_id, uint16_t fee_bps) {
        require_auth(get_self());
        check(fee_bps <= MAX_FEE_BPS, "fee exceeds maximum");

        pools_t pools(get_self(), get_self().value);
        auto itr = pools.require_find(pool_id, "pool not found");

        pools.modify(itr, same_payer, [&](auto& row) {
            row.fee_bps = fee_bps;
        });
    }

    /**
     * Supply liquidity using previously deposited balances.
     *
     * max0/max1 are maximum amounts the user is willing to contribute.
     * On an existing pool, only the proportional amounts needed for the minted
     * shares are consumed; any remainder stays in the user's credit balance.
     */
    ACTION addliq(name user,
                  uint64_t pool_id,
                  asset max0,
                  asset max1,
                  uint64_t min_shares) {
        require_auth(user);

        check(max0.amount > 0 && max1.amount > 0, "liquidity amounts must be positive");

        pools_t pools(get_self(), get_self().value);
        auto pitr = pools.require_find(pool_id, "pool not found");

        check(pitr->enabled, "pool is disabled");
        check(max0.symbol == pitr->reserve0.symbol, "max0 symbol mismatch");
        check(max1.symbol == pitr->reserve1.symbol, "max1 symbol mismatch");

        require_credit(user, max0);
        require_credit(user, max1);

        int64_t used0 = 0;
        int64_t used1 = 0;
        uint64_t minted = 0;

        if (pitr->total_shares == 0) {
            check(pitr->reserve0.amount == 0 && pitr->reserve1.amount == 0,
                  "invalid initial pool state");

            used0 = max0.amount;
            used1 = max1.amount;

            unsigned __int128 product =
                static_cast<unsigned __int128>(used0) *
                static_cast<unsigned __int128>(used1);

            minted = integer_sqrt(product);
            check(minted > 0, "initial liquidity is too small");
        } else {
            check(pitr->reserve0.amount > 0 && pitr->reserve1.amount > 0,
                  "invalid pool reserves");

            uint64_t shares0 = mul_div_floor(
                static_cast<uint64_t>(max0.amount),
                pitr->total_shares,
                static_cast<uint64_t>(pitr->reserve0.amount));

            uint64_t shares1 = mul_div_floor(
                static_cast<uint64_t>(max1.amount),
                pitr->total_shares,
                static_cast<uint64_t>(pitr->reserve1.amount));

            minted = shares0 < shares1 ? shares0 : shares1;
            check(minted > 0, "liquidity contribution is too small");

            used0 = static_cast<int64_t>(mul_div_ceil(
                minted,
                static_cast<uint64_t>(pitr->reserve0.amount),
                pitr->total_shares));

            used1 = static_cast<int64_t>(mul_div_ceil(
                minted,
                static_cast<uint64_t>(pitr->reserve1.amount),
                pitr->total_shares));

            check(used0 <= max0.amount && used1 <= max1.amount,
                  "calculated liquidity exceeds maximum");
        }

        check(minted >= min_shares, "minted shares below minimum");
        check(pitr->total_shares + minted >= pitr->total_shares, "share overflow");

        asset amount0{used0, pitr->reserve0.symbol};
        asset amount1{used1, pitr->reserve1.symbol};

        sub_credit(user, amount0);
        sub_credit(user, amount1);
        add_position(user, pool_id, minted);

        pools.modify(pitr, same_payer, [&](auto& row) {
            row.reserve0.amount += used0;
            row.reserve1.amount += used1;
            row.total_shares += minted;
        });
    }

    /**
     * Burn LP shares and receive proportional pool reserves.
     */
    ACTION removeliq(name user,
                     uint64_t pool_id,
                     uint64_t shares,
                     asset min0,
                     asset min1) {
        require_auth(user);
        check(shares > 0, "shares must be positive");

        pools_t pools(get_self(), get_self().value);
        auto pitr = pools.require_find(pool_id, "pool not found");

        check(min0.symbol == pitr->reserve0.symbol, "min0 symbol mismatch");
        check(min1.symbol == pitr->reserve1.symbol, "min1 symbol mismatch");
        check(min0.amount >= 0 && min1.amount >= 0, "minimum output cannot be negative");
        check(pitr->total_shares > 0, "pool has no liquidity");

        positions_t positions(get_self(), get_self().value);
        auto pos_index = positions.get_index<"byuserpool"_n>();
        auto positr = pos_index.find(make_user_pool_key(user, pool_id));

        check(positr != pos_index.end(), "liquidity position not found");
        check(positr->shares >= shares, "insufficient LP shares");

        int64_t out0 = static_cast<int64_t>(mul_div_floor(
            shares,
            static_cast<uint64_t>(pitr->reserve0.amount),
            pitr->total_shares));

        int64_t out1 = static_cast<int64_t>(mul_div_floor(
            shares,
            static_cast<uint64_t>(pitr->reserve1.amount),
            pitr->total_shares));

        check(out0 > 0 && out1 > 0, "withdrawal output is too small");
        check(out0 >= min0.amount && out1 >= min1.amount,
              "liquidity output below minimum");

        asset quantity0{out0, pitr->reserve0.symbol};
        asset quantity1{out1, pitr->reserve1.symbol};

        pools.modify(pitr, same_payer, [&](auto& row) {
            row.reserve0.amount -= out0;
            row.reserve1.amount -= out1;
            row.total_shares -= shares;
        });

        if (positr->shares == shares) {
            pos_index.erase(positr);
        } else {
            pos_index.modify(positr, same_payer, [&](auto& row) {
                row.shares -= shares;
            });
        }

        send_token(user, quantity0, "Lime B liquidity withdrawal");
        send_token(user, quantity1, "Lime B liquidity withdrawal");
    }

    /**
     * Swap a credited input asset against a pool.
     *
     * Constant-product quote:
     * out = reserveOut * (amountIn * (10000-fee))
     *       / (reserveIn*10000 + amountIn*(10000-fee))
     */
    ACTION swap(name user,
                uint64_t pool_id,
                asset amount_in,
                asset min_out) {
        require_auth(user);

        check(amount_in.amount > 0, "swap input must be positive");
        check(min_out.amount >= 0, "minimum output cannot be negative");

        pools_t pools(get_self(), get_self().value);
        auto pitr = pools.require_find(pool_id, "pool not found");

        check(pitr->enabled, "pool is disabled");
        check(pitr->reserve0.amount > 0 && pitr->reserve1.amount > 0,
              "pool has no liquidity");

        const bool zero_for_one = amount_in.symbol == pitr->reserve0.symbol;
        const bool one_for_zero = amount_in.symbol == pitr->reserve1.symbol;

        check(zero_for_one || one_for_zero, "input token is not in this pool");

        symbol expected_out =
            zero_for_one ? pitr->reserve1.symbol : pitr->reserve0.symbol;
        check(min_out.symbol == expected_out, "minimum output symbol mismatch");

        require_credit(user, amount_in);

        int64_t reserve_in =
            zero_for_one ? pitr->reserve0.amount : pitr->reserve1.amount;
        int64_t reserve_out =
            zero_for_one ? pitr->reserve1.amount : pitr->reserve0.amount;

        uint64_t fee_factor = static_cast<uint64_t>(BPS_DENOM - pitr->fee_bps);

        unsigned __int128 amount_with_fee =
            static_cast<unsigned __int128>(amount_in.amount) * fee_factor;

        unsigned __int128 numerator =
            amount_with_fee * static_cast<uint64_t>(reserve_out);

        unsigned __int128 denominator =
            static_cast<unsigned __int128>(reserve_in) * BPS_DENOM +
            amount_with_fee;

        check(denominator > 0, "invalid swap denominator");

        uint64_t raw_out = static_cast<uint64_t>(numerator / denominator);
        check(raw_out > 0, "swap output is too small");
        check(raw_out < static_cast<uint64_t>(reserve_out),
              "swap would drain the pool");
        check(raw_out <= static_cast<uint64_t>(INT64_MAX), "swap output overflow");

        int64_t output_amount = static_cast<int64_t>(raw_out);
        check(output_amount >= min_out.amount, "swap output below minimum");

        sub_credit(user, amount_in);

        pools.modify(pitr, same_payer, [&](auto& row) {
            if (zero_for_one) {
                row.reserve0.amount += amount_in.amount;
                row.reserve1.amount -= output_amount;
            } else {
                row.reserve1.amount += amount_in.amount;
                row.reserve0.amount -= output_amount;
            }
        });

        send_token(user, asset{output_amount, expected_out}, "Lime B swap");
    }

    /**
     * Withdraw tokens deposited but not committed to a pool or swap.
     */
    ACTION withdraw(name user, asset quantity) {
        require_auth(user);
        check(quantity.amount > 0, "withdraw quantity must be positive");

        sub_credit(user, quantity);
        send_token(user, quantity, "Lime B credit withdrawal");
    }

    /**
     * Every eosio.token transfer into the contract becomes user credit.
     * Transfers sent by the contract itself are ignored to avoid re-crediting
     * swap outputs and liquidity withdrawals.
     */
    [[eosio::on_notify("*::transfer")]]
    void ontransfer(name from, name to, asset quantity, string memo) {
        if (to != get_self() || from == get_self()) {
            return;
        }

        check(quantity.is_valid(), "invalid deposit quantity");
        check(quantity.amount > 0, "deposit must be positive");

        tokens_t tokens(get_self(), get_self().value);
        auto itr = tokens.require_find(quantity.symbol.code().raw(),
                                       "token is not registered");
        check(itr->enabled, "token is disabled");
        check(itr->token_symbol == quantity.symbol,
              "registered token precision mismatch");
        check(itr->token_contract == get_first_receiver(),
              "transfer came from the wrong token contract");

        add_credit(from, quantity);
    }

    TABLE tokenreg {
        uint64_t symbol_code_raw;
        name token_contract;
        symbol token_symbol;
        bool enabled;

        uint64_t primary_key() const { return symbol_code_raw; }
    };

    typedef multi_index<"tokens"_n, tokenreg> tokens_t;

    TABLE pool {
        uint64_t id;
        asset reserve0;
        asset reserve1;
        uint64_t total_shares;
        uint16_t fee_bps;
        bool enabled;

        uint64_t primary_key() const { return id; }

        uint128_t by_pair() const {
            return make_pair_key(reserve0.symbol, reserve1.symbol);
        }
    };

    TABLE credit {
        uint64_t id;
        name owner;
        asset balance;

        uint64_t primary_key() const { return id; }

        uint128_t by_owner_symbol() const {
            return make_owner_symbol_key(owner, balance.symbol.code());
        }
    };

    TABLE position {
        uint64_t id;
        name owner;
        uint64_t pool_id;
        uint64_t shares;

        uint64_t primary_key() const { return id; }

        uint128_t by_user_pool() const {
            return make_user_pool_key(owner, pool_id);
        }
    };

    typedef multi_index<
        "pools"_n,
        pool,
        indexed_by<"bypair"_n,
            const_mem_fun<pool, uint128_t, &pool::by_pair>>
    > pools_t;

    typedef multi_index<
        "credits"_n,
        credit,
        indexed_by<"byownersym"_n,
            const_mem_fun<credit, uint128_t, &credit::by_owner_symbol>>
    > credits_t;

    typedef multi_index<
        "positions"_n,
        position,
        indexed_by<"byuserpool"_n,
            const_mem_fun<position, uint128_t, &position::by_user_pool>>
    > positions_t;

private:
    static uint128_t make_pair_key(symbol a, symbol b) {
        uint64_t x = a.code().raw();
        uint64_t y = b.code().raw();

        if (x > y) {
            uint64_t tmp = x;
            x = y;
            y = tmp;
        }

        return (static_cast<uint128_t>(x) << 64) |
               static_cast<uint128_t>(y);
    }

    static uint128_t make_owner_symbol_key(name owner, symbol_code sym) {
        return (static_cast<uint128_t>(owner.value) << 64) |
               static_cast<uint128_t>(sym.raw());
    }

    static uint128_t make_user_pool_key(name user, uint64_t pool_id) {
        return (static_cast<uint128_t>(user.value) << 64) |
               static_cast<uint128_t>(pool_id);
    }

    static uint64_t mul_div_floor(uint64_t a, uint64_t b, uint64_t d) {
        check(d > 0, "division by zero");
        unsigned __int128 result =
            (static_cast<unsigned __int128>(a) * b) / d;
        check(result <= static_cast<unsigned __int128>(UINT64_MAX),
              "math overflow");
        return static_cast<uint64_t>(result);
    }

    static uint64_t mul_div_ceil(uint64_t a, uint64_t b, uint64_t d) {
        check(d > 0, "division by zero");

        unsigned __int128 product =
            static_cast<unsigned __int128>(a) * b;

        unsigned __int128 result =
            (product + d - 1) / d;

        check(result <= static_cast<unsigned __int128>(UINT64_MAX),
              "math overflow");

        return static_cast<uint64_t>(result);
    }

    static uint64_t integer_sqrt(unsigned __int128 value) {
        if (value == 0) {
            return 0;
        }

        unsigned __int128 low = 1;
        unsigned __int128 high =
            value < static_cast<unsigned __int128>(UINT64_MAX)
                ? value
                : static_cast<unsigned __int128>(UINT64_MAX);

        unsigned __int128 answer = 0;

        while (low <= high) {
            unsigned __int128 mid = low + ((high - low) >> 1);

            if (mid <= value / mid) {
                answer = mid;
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }

        return static_cast<uint64_t>(answer);
    }

    void require_registered_token(symbol token_symbol) {
        tokens_t tokens(get_self(), get_self().value);
        auto itr = tokens.require_find(token_symbol.code().raw(),
                                       "token is not registered");
        check(itr->enabled, "token is disabled");
        check(itr->token_symbol == token_symbol,
              "registered token precision mismatch");
    }

    name token_contract_for(symbol token_symbol) {
        tokens_t tokens(get_self(), get_self().value);
        auto itr = tokens.require_find(token_symbol.code().raw(),
                                       "token is not registered");
        check(itr->enabled, "token is disabled");
        check(itr->token_symbol == token_symbol,
              "registered token precision mismatch");
        return itr->token_contract;
    }

    void add_credit(name owner, asset quantity) {
        credits_t credits(get_self(), get_self().value);
        auto index = credits.get_index<"byownersym"_n>();
        auto key = make_owner_symbol_key(owner, quantity.symbol.code());
        auto itr = index.find(key);

        if (itr == index.end()) {
            uint64_t id = credits.available_primary_key();
            if (id == 0 && credits.begin() != credits.end()) {
                id = credits.rbegin()->id + 1;
            }

            credits.emplace(get_self(), [&](auto& row) {
                row.id = id;
                row.owner = owner;
                row.balance = quantity;
            });
            return;
        }

        check(itr->balance.symbol == quantity.symbol,
              "deposit symbol precision mismatch");
        check(itr->balance.amount <= INT64_MAX - quantity.amount,
              "credit balance overflow");

        index.modify(itr, same_payer, [&](auto& row) {
            row.balance += quantity;
        });
    }

    void require_credit(name owner, asset quantity) {
        credits_t credits(get_self(), get_self().value);
        auto index = credits.get_index<"byownersym"_n>();
        auto itr = index.find(
            make_owner_symbol_key(owner, quantity.symbol.code()));

        check(itr != index.end(), "token credit not found");
        check(itr->balance.symbol == quantity.symbol,
              "credit symbol precision mismatch");
        check(itr->balance.amount >= quantity.amount,
              "insufficient deposited balance");
    }

    void sub_credit(name owner, asset quantity) {
        check(quantity.amount > 0, "credit debit must be positive");

        credits_t credits(get_self(), get_self().value);
        auto index = credits.get_index<"byownersym"_n>();
        auto itr = index.find(
            make_owner_symbol_key(owner, quantity.symbol.code()));

        check(itr != index.end(), "token credit not found");
        check(itr->balance.symbol == quantity.symbol,
              "credit symbol precision mismatch");
        check(itr->balance.amount >= quantity.amount,
              "insufficient deposited balance");

        if (itr->balance.amount == quantity.amount) {
            index.erase(itr);
        } else {
            index.modify(itr, same_payer, [&](auto& row) {
                row.balance -= quantity;
            });
        }
    }

    void add_position(name owner, uint64_t pool_id, uint64_t shares) {
        positions_t positions(get_self(), get_self().value);
        auto index = positions.get_index<"byuserpool"_n>();
        auto key = make_user_pool_key(owner, pool_id);
        auto itr = index.find(key);

        if (itr == index.end()) {
            uint64_t id = positions.available_primary_key();
            if (id == 0 && positions.begin() != positions.end()) {
                id = positions.rbegin()->id + 1;
            }

            positions.emplace(get_self(), [&](auto& row) {
                row.id = id;
                row.owner = owner;
                row.pool_id = pool_id;
                row.shares = shares;
            });
            return;
        }

        check(itr->shares + shares >= itr->shares, "position share overflow");

        index.modify(itr, same_payer, [&](auto& row) {
            row.shares += shares;
        });
    }

    void send_token(name to, asset quantity, const string& memo) {
        check(quantity.amount > 0, "transfer quantity must be positive");

        action(
            permission_level{get_self(), "active"_n},
            token_contract_for(quantity.symbol),
            "transfer"_n,
            std::make_tuple(get_self(), to, quantity, memo)
        ).send();
    }
};
