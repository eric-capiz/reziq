import { User, type UserDocument } from "@/models/User";

export const USAGE_TIME_ZONE = "America/Denver";

export function getUsageDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: USAGE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function getNextResetLabel(date = new Date()) {
  const key = getUsageDateKey(date);
  const [year, month, day] = key.split("-").map(Number);
  const nextUtcGuess = new Date(Date.UTC(year, month - 1, day + 1, 6, 0, 0));
  return new Intl.DateTimeFormat("en-US", {
    timeZone: USAGE_TIME_ZONE,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(nextUtcGuess);
}

type UsageFields = {
  dailyAllowance?: number;
  usesUsedToday?: number;
  usageDate?: string;
};

export function getRemainingUses(user: UsageFields) {
  const allowance = user.dailyAllowance ?? 0;
  const used = user.usesUsedToday ?? 0;
  return Math.max(0, allowance - used);
}

export async function syncUserDailyUsage(user: UserDocument) {
  const today = getUsageDateKey();
  if (user.usageDate !== today) {
    user.usageDate = today;
    user.usesUsedToday = 0;
    await user.save();
  }
  return user;
}

export async function getUserUsageSummary(userId: string) {
  const user = await User.findById(userId);
  if (!user) return null;
  await syncUserDailyUsage(user);
  return {
    dailyAllowance: user.dailyAllowance,
    usesUsedToday: user.usesUsedToday,
    remainingUses: getRemainingUses(user),
    usageDate: user.usageDate,
    canAnalyze: getRemainingUses(user) > 0,
  };
}

export async function consumeSuccessfulAnalysis(userId: string) {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }
  await syncUserDailyUsage(user);
  if (getRemainingUses(user) <= 0) {
    throw new Error("No uses remaining today");
  }
  user.usesUsedToday += 1;
  await user.save();
  return {
    dailyAllowance: user.dailyAllowance,
    usesUsedToday: user.usesUsedToday,
    remainingUses: getRemainingUses(user),
  };
}
