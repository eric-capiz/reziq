import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/");
  if (session.user.role !== "admin") redirect("/dashboard");

  await connectDB();
  const users = await User.find({})
    .select("username email role usesAssigned createdAt")
    .sort({ createdAt: -1 })
    .lean();

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
          Users
        </h1>
        <p className="mt-2 text-slate-600">
          Assigning uses and capacity meters come next. You can already see who
          registered.
        </p>

        <div className="mt-8 overflow-x-auto rounded-3xl border border-black/5 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-[#F3F6FA] text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Username</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Uses</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={String(user._id)} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium text-[#0B0F14]">
                    {user.username}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{user.email}</td>
                  <td className="px-4 py-3 text-slate-600">{user.role}</td>
                  <td className="px-4 py-3 text-slate-600">{user.usesAssigned}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
