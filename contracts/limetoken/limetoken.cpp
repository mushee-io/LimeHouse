#include <eosio/eosio.hpp>
#include <eosio/asset.hpp>

#include <string>

using namespace eosio;
using std::string;

/**
 * Lime Test Token
 *
 * Minimal EOSIO-style fungible token used only to bootstrap Lime B on Ultra
 * Testnet. It intentionally supports issue-to-issuer only; the issuer can then
 * transfer tokens normally.
 */
CONTRACT limetoken : public contract {
public:
    using contract::contract;

    ACTION create(name issuer, asset maximum_supply) {
        require_auth(get_self());

        check(is_account(issuer), "issuer account does not exist");
        check(maximum_supply.is_valid(), "invalid maximum supply");
        check(maximum_supply.amount > 0, "maximum supply must be positive");

        stats statstable(get_self(), maximum_supply.symbol.code().raw());
        check(statstable.find(maximum_supply.symbol.code().raw()) == statstable.end(),
              "token already exists");

        statstable.emplace(get_self(), [&](auto& row) {
            row.supply = asset{0, maximum_supply.symbol};
            row.max_supply = maximum_supply;
            row.issuer = issuer;
        });
    }

    ACTION issue(name to, asset quantity, string memo) {
        auto sym = quantity.symbol;
        check(sym.is_valid(), "invalid symbol");
        check(memo.size() <= 256, "memo is too long");

        stats statstable(get_self(), sym.code().raw());
        auto itr = statstable.require_find(sym.code().raw(), "token does not exist");

        require_auth(itr->issuer);
        check(to == itr->issuer, "test token can only be issued to its issuer");
        check(quantity.is_valid(), "invalid quantity");
        check(quantity.amount > 0, "must issue positive quantity");
        check(quantity.symbol == itr->supply.symbol, "symbol precision mismatch");
        check(quantity.amount <= itr->max_supply.amount - itr->supply.amount,
              "quantity exceeds available supply");

        statstable.modify(itr, same_payer, [&](auto& row) {
            row.supply += quantity;
        });

        add_balance(itr->issuer, quantity, itr->issuer);
    }

    ACTION transfer(name from, name to, asset quantity, string memo) {
        check(from != to, "cannot transfer to self");
        require_auth(from);
        check(is_account(to), "to account does not exist");

        auto sym = quantity.symbol.code();
        stats statstable(get_self(), sym.raw());
        const auto& st = statstable.get(sym.raw(), "token does not exist");

        check(quantity.is_valid(), "invalid quantity");
        check(quantity.amount > 0, "must transfer positive quantity");
        check(quantity.symbol == st.supply.symbol, "symbol precision mismatch");
        check(memo.size() <= 256, "memo is too long");

        require_recipient(from);
        require_recipient(to);

        sub_balance(from, quantity);
        add_balance(to, quantity, from);
    }

    static asset get_supply(name token_contract_account, symbol_code sym_code) {
        stats statstable(token_contract_account, sym_code.raw());
        return statstable.get(sym_code.raw()).supply;
    }

    static asset get_balance(name token_contract_account, name owner, symbol_code sym_code) {
        accounts accountstable(token_contract_account, owner.value);
        return accountstable.get(sym_code.raw()).balance;
    }

private:
    TABLE account {
        asset balance;
        uint64_t primary_key() const { return balance.symbol.code().raw(); }
    };

    TABLE currency_stats {
        asset supply;
        asset max_supply;
        name issuer;
        uint64_t primary_key() const { return supply.symbol.code().raw(); }
    };

    typedef multi_index<"accounts"_n, account> accounts;
    typedef multi_index<"stat"_n, currency_stats> stats;

    void sub_balance(name owner, asset value) {
        accounts from_acnts(get_self(), owner.value);
        const auto& from = from_acnts.get(value.symbol.code().raw(),
                                          "no balance object found");
        check(from.balance.amount >= value.amount, "overdrawn balance");

        if (from.balance.amount == value.amount) {
            from_acnts.erase(from);
        } else {
            from_acnts.modify(from, owner, [&](auto& row) {
                row.balance -= value;
            });
        }
    }

    void add_balance(name owner, asset value, name ram_payer) {
        accounts to_acnts(get_self(), owner.value);
        auto to = to_acnts.find(value.symbol.code().raw());

        if (to == to_acnts.end()) {
            to_acnts.emplace(ram_payer, [&](auto& row) {
                row.balance = value;
            });
        } else {
            to_acnts.modify(to, same_payer, [&](auto& row) {
                row.balance += value;
            });
        }
    }
};
