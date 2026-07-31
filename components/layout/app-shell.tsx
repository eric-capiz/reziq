import Link from "next/link";
import type { ReactNode } from "react";
import { auth } from "@/lib/auth";
import { LogoutButton } from "@/components/auth/logout-button";

export async function AppShell({
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
  const session = await auth();

  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-[#0B0F14] text-white">
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
          <div className="flex flex-wrap items-center justify-end gap-2">
            {actions}
            {session?.user ? <LogoutButton /> : null}
          </div>
        </div>
      </header>

      <div className="relative z-10 flex flex-1 flex-col">{children}</div>

      <footer className="relative z-10 mt-auto border-t border-white/10 px-4 py-6 text-center text-sm text-white/45 sm:px-6">
        <p>
          <Link
            href="/privacy"
            className="text-white/60 underline-offset-4 transition-colors duration-200 hover:text-[#7CFFB2] hover:underline"
          >
            Privacy
          </Link>
          {" · "}© {new Date().getFullYear()} · Developed by{" "}
          <a
            href="https://www.ericcapiz.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[#7CFFB2] underline-offset-4 transition-colors duration-200 hover:text-white hover:underline"
          >
            Eric Capiz
          </a>
        </p>
      </footer>
    </div>
  );
}
