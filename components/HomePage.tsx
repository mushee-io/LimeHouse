"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRightCircle, Fingerprint, LockKeyhole, Menu, X, Zap } from "lucide-react";

const navigation = ["Vault", "Plans", "Install", "News", "Help"] as const;
const ease = [0.22, 1, 0.36, 1] as const;
const videoUrl = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260518_003132_8b7edcb6-c64d-4a52-a9ca-879942e122ad.mp4";

function fadeUp(index: number) {
  return {
    hidden: { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0, transition: { delay: index * 0.15, duration: 0.6, ease } }
  };
}

function VaultLogo() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      fill="none"
      overflow="visible"
      viewBox="0 0 256 256"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M 64 128 L 64.5 128 L 32 95 L 0 64 L 0 0 L 64 0 L 128 64 L 128 64.5 L 161 32 L 192 0 L 256 0 L 256 64 L 192 128 L 128 128 L 128 192 L 96 223 L 63.5 256 L 0 256 L 0 192 Z M 256 192 L 224 223 L 191.5 256 L 128 256 L 128 192 L 192 128 L 256 128 Z"
        fill="#192837"
      />
    </svg>
  );
}

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialog, setDialog] = useState<string | null>(null);
  const menuCloseRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    menuCloseRef.current?.focus();
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onEscape);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onEscape);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!dialog) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDialog(null);
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [dialog]);

  const openNotice = (label: string) => {
    setMenuOpen(false);
    setDialog(label);
  };

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
      <div className="vs-video-tint absolute inset-0 pointer-events-none" aria-hidden="true" />

      <header className="vs-nav relative z-10 mx-auto flex w-full max-w-[1280px] items-center justify-between px-5 py-4 sm:px-8 sm:py-5">
        <Link href="/" className="vs-brand" aria-label="VaultShield home">
          <VaultLogo />
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
          {navigation.map((label) => (
            <button
              key={label}
              type="button"
              className="vs-nav-link text-sm font-medium"
              onClick={() => openNotice(label)}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <button type="button" className="vs-nav-cta vs-nav-cta-primary" onClick={() => openNotice("Start For Free")}>
            Start For Free
          </button>
          <button type="button" className="vs-nav-cta vs-nav-cta-light" onClick={() => openNotice("Sign In")}>
            Sign In
          </button>
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

      <section id="vault" className="vs-hero relative z-[1] mx-auto w-full max-w-[1280px] px-5 sm:px-8" aria-labelledby="vs-hero-title">
        <div className="vs-hero-copy max-w-[560px]">
          <motion.h1
            id="vs-hero-title"
            className="vs-hero-title"
            variants={fadeUp(0)}
            initial="hidden"
            animate="visible"
          >
            <Zap className="vs-inline-icon" aria-hidden="true" />{" "}
            Lock Down Your Passwords{" "}
            <LockKeyhole className="vs-inline-icon" aria-hidden="true" />{" "}
            with Ironclad Security{" "}
            <Fingerprint className="vs-inline-icon" aria-hidden="true" />
          </motion.h1>

          <motion.p className="vs-hero-subtext" variants={fadeUp(1)} initial="hidden" animate="visible">
            Zero stress, total control. VaultShield keeps you covered with unbreakable storage, one-tap access, and pro-grade tools for your non-stop world.
          </motion.p>

          <motion.div variants={fadeUp(2)} initial="hidden" animate="visible">
            <motion.button
              type="button"
              className="vs-hero-cta"
              whileHover={{ scale: 1.04, filter: "brightness(1.1)" }}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.2 }}
              onClick={() => openNotice("Get It Free")}
            >
              <span>Get It Free</span>
              <ArrowRightCircle size={20} strokeWidth={1.8} aria-hidden="true" />
            </motion.button>
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
                <Link href="/" aria-label="VaultShield home" onClick={() => setMenuOpen(false)}><VaultLogo /></Link>
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
                {navigation.map((label, index) => (
                  <motion.button
                    type="button"
                    key={label}
                    className="vs-mobile-link"
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0, transition: { delay: 0.18 + index * 0.07, duration: 0.45, ease } }}
                    onClick={() => openNotice(label)}
                  >{label}</motion.button>
                ))}
              </nav>
              <div className="mt-auto flex flex-col gap-3 px-7 pb-9">
                <button type="button" className="vs-nav-cta vs-nav-cta-primary w-full" onClick={() => openNotice("Start For Free")}>Start For Free</button>
                <button type="button" className="vs-nav-cta vs-nav-cta-light w-full" onClick={() => openNotice("Sign In")}>Sign In</button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {dialog && (
          <motion.div className="vs-dialog-backdrop fixed inset-0 z-[60] grid place-items-center p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDialog(null)}>
            <motion.section
              className="vs-dialog relative w-full max-w-[420px]"
              role="dialog"
              aria-modal="true"
              aria-labelledby="vs-dialog-title"
              initial={{ opacity: 0, y: 18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.26, ease } }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="vs-close-button absolute right-5 top-5" type="button" aria-label="Close dialog" onClick={() => setDialog(null)}><X size={22} /></button>
              <VaultLogo />
              <h2 id="vs-dialog-title" className="vs-dialog-title">{dialog}</h2>
              <p>VaultShield&apos;s landing page is ready. This feature is not connected to an account or password vault yet.</p>
              <button type="button" className="vs-nav-cta vs-nav-cta-primary mt-6" onClick={() => setDialog(null)}>Got it</button>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
