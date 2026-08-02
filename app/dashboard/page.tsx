import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getUserUsageSummary } from "@/lib/usage";
import { AppShell } from "@/components/layout/app-shell";
import { AnalysisFlow } from "@/components/dashboard/analysis-flow";
import { PulseStack } from "@/components/dashboard/pulse-stack";

export const metadata: Metadata = {
  title: "Rez Desk",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardPage() {
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

  return (
    <AppShell>
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
