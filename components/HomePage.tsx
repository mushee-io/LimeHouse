"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeftRight, ArrowRightCircle, BarChart3, Layers3, Menu, X, Zap } from "lucide-react";
import LimeLogo from "@/components/LimeLogo";

const navigation = [
  { label: "Trade", href: "/trade" },
  { label: "Swap", href: "/swap" },
  { label: "Pools", href: "/pools" },
  { label: "Liquidity", href: "/liquidity" },
  { label: "Analytics", href: "/analytics" }
] as const;
const ease = [0.22, 1, 0.36, 1] as const;
const videoUrl = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260518_003132_8b7edcb6-c64d-4a52-a9ca-879942e122ad.mp4";

function fadeUp(index: number) {
  return {
    hidden: { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0, transition: { delay: index * 0.15, duration: 0.6, ease } }
  };
}

function Brand({ onClick }: { onClick?: () => void }) {
  return (
    <Link href="/" className="vs-brand" aria-label="LimeHouse homepage" onClick={onClick}>
      <LimeLogo compact />
      <span className="vs-brand-name">LimeHouse</span>
    </Link>
  );
}

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuCloseRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    menuCloseRef.current?.focus();
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  return (
    <main className="vs-home relative min-h-screen w-full overflow-hidden">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src={videoUrl}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
      />
      <div className="vs-video-tint pointer-events-none absolute inset-0" aria-hidden="true" />

      <header className="vs-nav relative z-10 mx-auto flex w-full max-w-[1280px] items-center justify-between px-5 py-4 sm:px-8 sm:py-5">
        <Brand />

        <nav className="hidden items-center gap-7 md:flex" aria-label="Main navigation">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} className="vs-nav-link text-sm font-medium">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/trade" className="vs-nav-cta vs-nav-cta-primary">Explore DEX</Link>
          <Link href="/pools" className="vs-nav-cta vs-nav-cta-light">View Pools</Link>
        </div>

        <button
          type="button"
          className="vs-menu-trigger md:hidden"
          aria-label="Open navigation"
          aria-controls="vs-mobile-menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <Menu size={26} strokeWidth={1.8} />
        </button>
      </header>

      <section className="vs-hero relative z-[1] mx-auto w-full max-w-[1280px] px-5 sm:px-8" aria-labelledby="vs-hero-title">
        <div className="vs-hero-copy max-w-[560px]">
          <motion.p
            className="vs-hero-kicker"
            variants={fadeUp(0)}
            initial="hidden"
            animate="visible"
          >
            THE ULTRA-NATIVE DECENTRALIZED EXCHANGE
          </motion.p>

          <motion.h1
            id="vs-hero-title"
            className="vs-hero-title"
            variants={fadeUp(0)}
            initial="hidden"
            animate="visible"
          >
            <Zap className="vs-inline-icon" aria-hidden="true" />{" "}
            Trade, Swap &amp; Explore{" "}
            <ArrowLeftRight className="vs-inline-icon" aria-hidden="true" />{" "}
            DeFi on Ultra with LimeHouse{" "}
            <Layers3 className="vs-inline-icon" aria-hidden="true" />
          </motion.h1>

          <motion.p className="vs-hero-subtext" variants={fadeUp(1)} initial="hidden" animate="visible">
            Your gateway to liquidity on Ultra. Swap tokens, explore pools, and manage your onchain portfolio — all through one seamless decentralized trading experience.
          </motion.p>

          <motion.div
            className="vs-hero-actions"
            variants={fadeUp(2)}
            initial="hidden"
            animate="visible"
          >
            <motion.div whileHover={{ scale: 1.04, filter: "brightness(1.1)" }} whileTap={{ scale: 0.96 }} transition={{ duration: 0.2 }}>
              <Link href="/trade" className="vs-hero-cta">
                <span>Explore LimeHouse</span>
                <ArrowRightCircle size={20} strokeWidth={1.8} aria-hidden="true" />
              </Link>
            </motion.div>
            <Link href="/pools" className="vs-secondary-link">
              Explore Pools <BarChart3 size={17} aria-hidden="true" />
            </Link>
          </motion.div>
        </div>
      </section>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.button
              type="button"
              className="vs-mobile-backdrop fixed inset-0 z-40"
              aria-label="Close navigation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
            />
            <motion.aside
              id="vs-mobile-menu"
              className="vs-mobile-sheet fixed right-0 top-0 z-50 flex flex-col"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation"
              initial={{ x: "100%" }}
              animate={{ x: 0, transition: { ease, duration: 0.45 } }}
              exit={{ x: "100%", transition: { ease, duration: 0.35 } }}
            >
              <div className="flex items-center justify-between px-7 py-7">
                <Brand onClick={() => setMenuOpen(false)} />
                <button
                  ref={menuCloseRef}
                  type="button"
                  className="vs-close-button"
                  aria-label="Close menu"
                  onClick={() => setMenuOpen(false)}
                ><X size={25} /></button>
              </div>
              <div className="vs-sheet-rule" />
              <nav className="flex flex-col gap-1 px-7 py-9" aria-label="Mobile navigation links">
                {navigation.map((item, index) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0, transition: { delay: 0.18 + index * 0.07, duration: 0.45, ease } }}
                  >
                    <Link
                      href={item.href}
                      className="vs-mobile-link"
                      onClick={() => setMenuOpen(false)}
                    >{item.label}</Link>
                  </motion.div>
                ))}
              </nav>
              <div className="mt-auto flex flex-col gap-3 px-7 pb-9">
                <Link href="/trade" className="vs-nav-cta vs-nav-cta-primary w-full" onClick={() => setMenuOpen(false)}>Explore LimeHouse</Link>
                <Link href="/pools" className="vs-nav-cta vs-nav-cta-light w-full" onClick={() => setMenuOpen(false)}>Explore Pools</Link>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
