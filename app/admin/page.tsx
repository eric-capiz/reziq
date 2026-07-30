import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { getAiAdminStats } from "@/lib/ai-status";
import { getRemainingUses, syncUserDailyUsage } from "@/lib/usage";
import { AdminDashboardClient } from "@/components/admin/admin-dashboard-client";

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
    <div className="min-h-full bg-[color:var(--mist)]">
      <header className="border-b border-black/5 bg-[#0B0F14] text-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link
            href="/dashboard"
            className="font-[family-name:var(--font-editorial)] text-xl italic tracking-tight"
          >
            RezIQ Admin
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex h-7 items-center rounded-full bg-white/10 px-3 text-[0.8rem] font-medium transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#7CFFB2] hover:text-[#0B0F14]"
          >
            Back to dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="font-[family-name:var(--font-editorial)] text-3xl font-medium text-[#0B0F14] sm:text-4xl">
          Admin
        </h1>
        <p className="mt-2 text-slate-600">
          Manage daily allowances and watch AI provider capacity.
        </p>

        <div className="mt-8">
          <AdminDashboardClient
            initialUsers={initialUsers}
            initialAiStats={initialAiStats}
          />
        </div>
      </main>
    </div>
  );
}
