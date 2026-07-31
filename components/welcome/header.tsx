"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/auth/auth-modal";

export function WelcomeHeader() {
  const router = useRouter();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");

  function openAuth(next: "login" | "register") {
    setMode(next);
    setOpen(true);
  }

  return (
    <>
      <header className="absolute inset-x-0 top-0 z-40 px-4 pt-4 sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between rounded-full border border-white/10 bg-[#0B0F14]/70 px-4 py-2 text-white shadow-lg backdrop-blur-xl sm:px-5">
          <Link
            href="/"
            className="font-[family-name:var(--font-editorial)] text-lg italic tracking-tight transition-colors duration-200 hover:text-[#7CFFB2] sm:text-xl"
          >
            RezIQ
          </Link>
          <div className="flex items-center gap-2">
            {session?.user ? (
              <>
                <Button
                  type="button"
                  size="sm"
                  className="rounded-full bg-[#7CFFB2] text-[#0B0F14] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_8px_24px_rgba(124,255,178,0.35)]"
                  onClick={() => router.push("/dashboard")}
                >
                  Rez Desk
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="rounded-full text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/15 hover:text-white"
                  onClick={() => router.push("/profile")}
                >
                  Profile
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/15 hover:text-white"
                  onClick={() => {
                    void signOut({
                      callbackUrl: `${window.location.origin}/`,
                    });
                  }}
                >
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/15 hover:text-white"
                  onClick={() => openAuth("login")}
                >
                  Log in
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="rounded-full bg-[#FF5C35] text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#ff7a57] hover:shadow-[0_8px_24px_rgba(255,92,53,0.4)]"
                  onClick={() => openAuth("register")}
                >
                  Join free
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      <AuthModal open={open} onOpenChange={setOpen} initialMode={mode} />
    </>
  );
}
