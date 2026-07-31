import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getUserUsageSummary } from "@/lib/usage";
import { AnalysisFlow } from "@/components/dashboard/analysis-flow";
import { PulseStack } from "@/components/dashboard/pulse-stack";
import { AppShell } from "@/components/layout/app-shell";
import { LogoutButton } from "@/components/auth/logout-button";

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
  const canUpload = remainingUses > 0;
  const params = await searchParams;
  const justRegistered = params.welcome === "1";

  return (
    <AppShell
      actions={
        <>
          {session.user.role === "admin" && (
            <Link
              href="/admin"
              className="inline-flex h-7 items-center rounded-full bg-white/10 px-3 text-[0.8rem] font-medium transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#7CFFB2] hover:text-[#0B0F14]"
            >
              Admin
            </Link>
          )}
          <Link
            href="/profile"
            className="inline-flex h-7 items-center rounded-full bg-white/10 px-3 text-[0.8rem] font-medium transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#7CFFB2] hover:text-[#0B0F14]"
          >
            Profile
          </Link>
          <LogoutButton />
        </>
      }
    >
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="grid items-end gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="animate-in fade-in slide-in-from-left-4 duration-700">
            <p className="mb-4 inline-flex rounded-full border border-[#7CFFB2]/40 bg-[#7CFFB2]/10 px-3 py-1 text-xs font-medium tracking-[0.2em] text-[#7CFFB2] uppercase">
              Rez Desk
            </p>
            <h1 className="font-[family-name:var(--font-editorial)] text-5xl leading-[0.92] font-medium tracking-tight sm:text-6xl md:text-7xl">
              Hey{" "}
              <span className="italic text-[#FF5C35]">{session.user.username}</span>
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-white/70">
              Upload a DOCX, paste a job, and get ready for an evidence based fit
              read.
            </p>
          </div>

          <PulseStack
            remainingUses={remainingUses}
            usesUsedToday={usesUsedToday}
            dailyAllowance={dailyAllowance}
          />
        </div>

        {justRegistered && dailyAllowance === 0 && (
          <div className="mt-12 rounded-3xl border border-[#00C2FF]/35 bg-[#101820] px-5 py-5">
            <p className="font-[family-name:var(--font-editorial)] text-2xl italic">
              Thanks for registering
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/65 sm:text-base">
              An admin will assign your daily uses. Please check back later before
              uploading a resume.
            </p>
          </div>
        )}

        <div className="mt-14">
          <AnalysisFlow
            canUpload={canUpload}
            dailyAllowance={dailyAllowance}
            remainingUses={remainingUses}
          />
        </div>
      </main>
    </AppShell>
  );
}
