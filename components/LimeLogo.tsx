"use client";

export default function LimeLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className={compact ? "lime-logo moth-logo compact" : "lime-logo moth-logo"} aria-hidden="true">
      <img src="/limebay-moth.webp" alt="" draggable={false} decoding="async" />
    </span>
  );
}
