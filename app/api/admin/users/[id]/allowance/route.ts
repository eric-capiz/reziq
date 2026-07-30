import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { getRemainingUses, syncUserDailyUsage } from "@/lib/usage";

const bodySchema = z.object({
  dailyAllowance: z.number().int().min(0).max(1000),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid allowance" }, { status: 400 });
  }

  await connectDB();
  const user = await User.findById(id);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await syncUserDailyUsage(user);
  user.dailyAllowance = parsed.data.dailyAllowance;
  await user.save();

  return NextResponse.json({
    id: String(user._id),
    dailyAllowance: user.dailyAllowance,
    usesUsedToday: user.usesUsedToday,
    remainingUses: getRemainingUses(user),
  });
}
