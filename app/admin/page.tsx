import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { getAiAdminStats } from "@/lib/ai-status";
import { getRemainingUses, syncUserDailyUsage } from "@/lib/usage";
import { AdminDashboardClient } from "@/components/admin/admin-dashboard-client";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: "Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/");
  if (session.user.role !== "admin") redirect("/dashboard");

  await connectDB();
  const users = await User.find({})
    .select("username email role dailyAllowance usesUsedToday usageDate")
    .sort({ createdAt: -1 });

  for (const user of users) {
    await syncUserDailyUsage(user);
  }

  const initialUsers = users.map((user) => ({
    id: String(user._id),
    username: user.username,
    email: user.email,
    role: user.role as "admin" | "user",
    dailyAllowance: user.dailyAllowance,
    usesUsedToday: user.usesUsedToday,
    remainingUses: getRemainingUses(user),
  }));

  const initialAiStats = await getAiAdminStats();

  return (
    <AppShell
      brandHref="/dashboard"
      brandLabel={
        <>
          <span className="italic text-[#FF5C35]">Rez</span>IQ{" "}
          <span className="text-white/45">Admin</span>
        </>
      }
    >
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="animate-in fade-in slide-in-from-left-4 duration-700">
          <p className="mb-4 inline-flex rounded-full border border-[#FF5C35]/40 bg-[#FF5C35]/10 px-3 py-1 text-xs font-medium tracking-[0.2em] text-[#FF5C35] uppercase">
            Control room
          </p>
          <h1 className="font-[family-name:var(--font-editorial)] text-5xl leading-[0.92] font-medium tracking-tight sm:text-6xl md:text-7xl">
            Admin
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-white/70">
            Manage daily allowances and watch AI provider capacity.
          </p>
        </div>

        <div className="mt-12">
          <AdminDashboardClient
            initialUsers={initialUsers}
            initialAiStats={initialAiStats}
          />
        </div>
      </main>
    </AppShell>
  );
}
