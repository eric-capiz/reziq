import Link from "next/link";
import type { ReactNode } from "react";

export function AppShell({
  brandHref = "/",
  brandLabel = (
    <>
      <span className="italic text-[#FF5C35]">Rez</span>IQ
    </>
  ),
  actions,
  children,
}: {
  brandHref?: string;
  brandLabel?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-full overflow-hidden bg-[#0B0F14] text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-[-10%] size-[24rem] rounded-full bg-[#FF5C35]/25 blur-3xl sm:size-[34rem]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[-8%] left-[-12%] size-[22rem] rounded-full bg-[#00C2FF]/20 blur-3xl sm:size-[30rem]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-[40%] right-[10%] size-[16rem] rounded-full bg-[#7CFFB2]/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <header className="relative z-10 border-b border-white/10 bg-[#0B0F14]/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link
            href={brandHref}
            className="font-[family-name:var(--font-editorial)] text-xl tracking-tight transition-opacity hover:opacity-90"
          >
            {brandLabel}
          </Link>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      </header>

      <div className="relative z-10">{children}</div>
    </div>
  );
}
