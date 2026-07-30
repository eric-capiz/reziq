import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getUserUsageSummary } from "@/lib/usage";
import { Button } from "@/components/ui/button";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/");
  }

  await connectDB();
  const usage = await getUserUsageSummary(session.user.id);
  const dailyAllowance = usage?.dailyAllowance ?? 0;
  const usesUsedToday = usage?.usesUsedToday ?? 0;
  const remainingUses = usage?.remainingUses ?? 0;
  const params = await searchParams;
  const justRegistered = params.welcome === "1";

  return (
    <div className="min-h-full bg-[color:var(--mist)]">
      <header className="border-b border-black/5 bg-[#0B0F14] text-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="font-[family-name:var(--font-editorial)] text-xl italic tracking-tight"
          >
            RezIQ
          </Link>
          <div className="flex items-center gap-2">
            {session.user.role === "admin" && (
              <Link
                href="/admin"
                className="inline-flex h-7 items-center rounded-full bg-white/10 px-3 text-[0.8rem] font-medium transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#7CFFB2] hover:text-[#0B0F14]"
              >
                Admin
              </Link>
            )}
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="rounded-full text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/15 hover:text-white"
              >
                Log out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="font-[family-name:var(--font-editorial)] text-3xl font-medium text-[#0B0F14] sm:text-4xl">
          Hey {session.user.username}
        </h1>
        <p className="mt-2 text-slate-600">
          Role: {session.user.role} · Today: {usesUsedToday} used · {remainingUses}{" "}
          left of {dailyAllowance} daily
        </p>

        {remainingUses === 0 && (
          <div className="mt-6 rounded-3xl border border-[#FF5C35]/30 bg-[#FF5C35]/10 px-4 py-4 text-[#0B0F14]">
            <p className="font-semibold">
              {justRegistered
                ? "Thanks for registering"
                : dailyAllowance === 0
                  ? "No daily uses assigned yet"
                  : "No uses left today"}
            </p>
            <p className="mt-1 text-sm leading-relaxed sm:text-base">
              {dailyAllowance === 0
                ? "An admin will assign your daily uses. Please check back later before starting an analysis."
                : "Your daily allowance is used up. It refills on the next daily reset, or an admin can raise your allowance."}
            </p>
          </div>
        )}

        <div className="mt-8 rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
          <h2 className="font-[family-name:var(--font-editorial)] text-xl text-[#0B0F14]">
            Next up
          </h2>
          <p className="mt-2 text-slate-600">
            Resume upload and analysis land in the next development batches.
            Analysis will only run when you have remaining daily uses.
          </p>
        </div>
      </main>
    </div>
  );
}
