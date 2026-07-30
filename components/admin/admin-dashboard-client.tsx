"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AdminUser = {
  id: string;
  username: string;
  email: string;
  role: "admin" | "user";
  dailyAllowance: number;
  usesUsedToday: number;
  remainingUses: number;
};

type ProviderName = "groq" | "cerebras" | "gemini";

type ProviderStats = {
  lamp: "green" | "purple" | "red";
  requests: number;
  tokensIn: number;
  tokensOut: number;
  exhausted: boolean;
  estimatedAnalysesLeft: number;
  lastError: string;
  label: string;
  role: string;
};

type AiStats = {
  date: string;
  resetLabel: string;
  estimatedAnalysesLeft: number;
  breakdown: {
    groq: number;
    cerebras: number;
    gemini: number;
  };
  currentProvider: ProviderName | null;
  providers: Record<ProviderName, ProviderStats>;
};

const PROVIDER_ORDER: ProviderName[] = ["groq", "cerebras", "gemini"];

const lampStyles = {
  green: "bg-[#7CFFB2] text-[#0B0F14]",
  purple: "bg-[#A78BFA] text-white",
  red: "bg-[#FF5C35] text-white",
};

const lampLabels = {
  green: "Active now",
  purple: "Available",
  red: "Exhausted",
};

export function AdminDashboardClient({
  initialUsers,
  initialAiStats,
}: {
  initialUsers: AdminUser[];
  initialAiStats: AiStats;
}) {
  const [users, setUsers] = useState(initialUsers);
  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      initialUsers.map((user) => [user.id, String(user.dailyAllowance)])
    )
  );
  const [aiStats, setAiStats] = useState(initialAiStats);
  const [pending, startTransition] = useTransition();

  const totalAllowance = useMemo(
    () => users.reduce((sum, user) => sum + user.dailyAllowance, 0),
    [users]
  );
  const totalUsed = useMemo(
    () => users.reduce((sum, user) => sum + user.usesUsedToday, 0),
    [users]
  );

  async function saveAllowance(userId: string) {
    const value = Number(drafts[userId]);
    if (!Number.isFinite(value) || value < 0) {
      toast.error("Enter a valid daily allowance");
      return;
    }

    startTransition(async () => {
      const res = await fetch(`/api/admin/users/${userId}/allowance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dailyAllowance: value }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not update allowance");
        return;
      }

      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId
            ? {
                ...user,
                dailyAllowance: data.dailyAllowance,
                usesUsedToday: data.usesUsedToday,
                remainingUses: data.remainingUses,
              }
            : user
        )
      );
      toast.success("Daily allowance updated");
    });
  }

  async function refreshAiStats() {
    startTransition(async () => {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not refresh AI stats");
        return;
      }
      setAiStats(data);
      toast.success("AI stats refreshed");
    });
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-[family-name:var(--font-editorial)] text-2xl text-[#0B0F14]">
              AI capacity
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Estimated analyses left today:{" "}
              <span className="font-semibold text-[#0B0F14]">
                {aiStats.estimatedAnalysesLeft}
              </span>
            </p>
            <p className="mt-2 text-sm text-[#0B0F14]">
              Breakdown: Groq {aiStats.breakdown.groq} · Cerebras{" "}
              {aiStats.breakdown.cerebras} · Gemini Flash Lite{" "}
              {aiStats.breakdown.gemini}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Usage date {aiStats.date} · Resets around {aiStats.resetLabel}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            className="rounded-full"
            disabled={pending}
            onClick={refreshAiStats}
          >
            Refresh stats
          </Button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {PROVIDER_ORDER.map((provider) => {
            const stats = aiStats.providers[provider];
            return (
              <article
                key={provider}
                className="rounded-2xl border border-black/5 bg-[#F3F6FA] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold tracking-wide text-[#0B0F14]">
                      {stats.label}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {stats.role}
                      {aiStats.currentProvider === provider
                        ? " · Preferred / in rotation"
                        : ""}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${lampStyles[stats.lamp]}`}
                  >
                    {lampLabels[stats.lamp]}
                  </span>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-slate-500">Requests today</dt>
                    <dd className="font-medium text-[#0B0F14]">{stats.requests}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Est. analyses left</dt>
                    <dd className="font-medium text-[#0B0F14]">
                      {stats.estimatedAnalysesLeft}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Tokens in</dt>
                    <dd className="font-medium text-[#0B0F14]">{stats.tokensIn}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Tokens out</dt>
                    <dd className="font-medium text-[#0B0F14]">{stats.tokensOut}</dd>
                  </div>
                </dl>
                {stats.lastError ? (
                  <p className="mt-3 text-xs text-[#FF5C35]">{stats.lastError}</p>
                ) : null}
              </article>
            );
          })}
        </div>

        <p className="mt-4 text-xs text-slate-500">
          Green means actively used recently. Purple means quota remains but idle.
          Red means daily limit reached. Estimates get sharper once real analyses
          run.
        </p>
      </section>

      <section className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="font-[family-name:var(--font-editorial)] text-2xl text-[#0B0F14]">
          User daily allowances
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Set how many analyses each person gets every day. Totals today: {totalUsed}{" "}
          used across {totalAllowance} allotted.
        </p>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-[#F3F6FA] text-slate-600">
              <tr>
                <th className="px-3 py-3 font-medium">Username</th>
                <th className="px-3 py-3 font-medium">Email</th>
                <th className="px-3 py-3 font-medium">Role</th>
                <th className="px-3 py-3 font-medium">Used today</th>
                <th className="px-3 py-3 font-medium">Daily allowance</th>
                <th className="px-3 py-3 font-medium">Left</th>
                <th className="px-3 py-3 font-medium">Save</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-slate-100">
                  <td className="px-3 py-3 font-medium text-[#0B0F14]">
                    {user.username}
                  </td>
                  <td className="px-3 py-3 text-slate-600">{user.email}</td>
                  <td className="px-3 py-3 text-slate-600">{user.role}</td>
                  <td className="px-3 py-3 text-slate-600">{user.usesUsedToday}</td>
                  <td className="px-3 py-3">
                    <Input
                      type="number"
                      min={0}
                      className="w-24"
                      value={drafts[user.id] ?? "0"}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [user.id]: e.target.value,
                        }))
                      }
                    />
                  </td>
                  <td className="px-3 py-3 text-slate-600">{user.remainingUses}</td>
                  <td className="px-3 py-3">
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-full"
                      disabled={pending}
                      onClick={() => saveAllowance(user.id)}
                    >
                      Save
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
