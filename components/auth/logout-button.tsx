"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function LogoutButton({
  className,
}: {
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={
        className ??
        "rounded-full text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/15 hover:text-white"
      }
      onClick={() => signOut({ callbackUrl: "/" })}
    >
      Log out
    </Button>
  );
}
