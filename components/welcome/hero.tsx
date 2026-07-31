"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/auth/auth-modal";

export function WelcomeHero() {
  const { data: session } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <section className="relative min-h-[100svh] overflow-hidden bg-[#0B0F14] text-white">
        <div
          aria-hidden
          className="absolute -top-24 right-[-10%] size-[28rem] rounded-full bg-[#FF5C35]/25 blur-3xl sm:size-[36rem]"
        />
        <div
          aria-hidden
          className="absolute bottom-[-10%] left-[-10%] size-[24rem] rounded-full bg-[#00C2FF]/20 blur-3xl sm:size-[32rem]"
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col justify-end px-4 pb-12 pt-28 sm:px-6 sm:pb-16 lg:justify-center lg:pt-24">
          <div className="grid items-end gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="animate-in fade-in slide-in-from-left-4 duration-700">
              <p className="mb-4 inline-flex rounded-full border border-[#7CFFB2]/40 bg-[#7CFFB2]/10 px-3 py-1 text-xs font-medium tracking-[0.2em] text-[#7CFFB2] uppercase">
                Career signal, not spin
              </p>
              <h1 className="font-[family-name:var(--font-editorial)] text-6xl leading-[0.9] font-medium tracking-tight sm:text-7xl md:text-8xl">
                <span className="italic text-[#FF5C35]">Rez</span>IQ
              </h1>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-white/75 sm:text-xl">
                Match your resume to a real job with proof. Improve only what you
                can honestly claim.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {session?.user ? (
                  <Button
                    type="button"
                    size="lg"
                    className="rounded-full bg-[#7CFFB2] text-[#0B0F14] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_10px_30px_rgba(124,255,178,0.35)]"
                    onClick={() => router.push("/dashboard")}
                  >
                    Open Rez Desk
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="lg"
                    className="rounded-full bg-[#FF5C35] text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#ff7a57] hover:shadow-[0_10px_30px_rgba(255,92,53,0.45)]"
                    onClick={() => setOpen(true)}
                  >
                    Start free
                  </Button>
                )}
                <a
                  href="#pulse"
                  className="inline-flex h-9 items-center justify-center rounded-full px-4 text-sm text-white/80 underline-offset-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/10 hover:text-white hover:underline"
                >
                  Why RezIQ exists
                </a>
              </div>
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-6 relative h-56 sm:h-72 lg:h-80">
              <div className="absolute top-6 left-4 w-[78%] rotate-[-6deg] rounded-2xl border border-white/15 bg-[#151B24] p-4 shadow-2xl">
                <div className="h-2 w-24 rounded bg-[#00C2FF]" />
                <div className="mt-4 space-y-2">
                  <div className="h-2 w-full rounded bg-white/15" />
                  <div className="h-2 w-5/6 rounded bg-white/10" />
                  <div className="h-2 w-4/6 rounded bg-white/10" />
                </div>
              </div>
              <div className="absolute top-16 right-2 w-[78%] rotate-[5deg] rounded-2xl border border-[#FF5C35]/40 bg-[#1A1010] p-4 shadow-2xl">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs tracking-wide text-[#FF5C35] uppercase">
                    Fit pulse
                  </span>
                  <span className="rounded-full bg-[#7CFFB2]/15 px-2 py-0.5 text-xs text-[#7CFFB2]">
                    Possible
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-white/70">
                  Evidence first. Suggestions only when you are close enough.
                </p>
              </div>
              <div className="absolute bottom-2 left-10 w-[70%] rounded-2xl border border-[#7CFFB2]/30 bg-[#0F1A16] p-4">
                <p className="text-xs text-[#7CFFB2]">Export ready</p>
                <p className="mt-1 text-sm text-white/80">DOCX or PDF · clean ATS layout</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <AuthModal open={open} onOpenChange={setOpen} initialMode="register" />
    </>
  );
}
