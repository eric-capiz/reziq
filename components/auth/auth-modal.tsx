"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Mode = "login" | "register";

type AuthModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode?: Mode;
};

export function AuthModal({
  open,
  onOpenChange,
  initialMode = "login",
}: AuthModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setError(null);
      setShowPassword(false);
    }
  }, [open, initialMode]);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    try {
      if (mode === "register") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Registration failed");
          return;
        }
      }

      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(
          mode === "login"
            ? "Invalid username or password"
            : "Account created, but sign in failed. Try logging in."
        );
        return;
      }

      onOpenChange(false);
      router.refresh();
      router.push(mode === "register" ? "/dashboard?welcome=1" : "/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (next) {
          setMode(initialMode);
          setError(null);
          setShowPassword(false);
        }
      }}
    >
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle className="font-[family-name:var(--font-editorial)] text-xl">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </DialogTitle>
          <DialogDescription>
            {mode === "login"
              ? "Log in with your username and password."
              : "Register to get started. New accounts begin with 2 daily uses."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
          <Button
            type="button"
            variant={mode === "login" ? "default" : "ghost"}
            onClick={() => switchMode("login")}
            className="w-full"
          >
            Log in
          </Button>
          <Button
            type="button"
            variant={mode === "register" ? "default" : "ghost"}
            onClick={() => switchMode("register")}
            className="w-full"
          >
            Register
          </Button>
        </div>

        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
            />
            <p className="text-xs text-muted-foreground">
              Usernames are not case sensitive.
            </p>
          </div>

          {mode === "register" && (
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Passwords are case sensitive.
            </p>
          </div>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={pending}
            className="w-full rounded-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(255,92,53,0.35)]"
            size="lg"
          >
            {pending
              ? "Please wait..."
              : mode === "login"
                ? "Log in"
                : "Create account"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
