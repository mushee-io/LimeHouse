"use client";

export default function LimeLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className={compact ? "lime-logo compact" : "lime-logo"} aria-hidden="true">
      <span className="lime-segment one" />
      <span className="lime-segment two" />
      <span className="lime-segment three" />
    </span>
  );
}
