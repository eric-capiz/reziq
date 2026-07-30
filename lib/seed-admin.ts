import { hash } from "bcryptjs";
import { User } from "@/models/User";

let seeded = false;

export async function ensureAdminUser() {
  if (seeded) return;

  const username = process.env.ADMIN_USERNAME?.trim().toLowerCase();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !email || !password) {
    seeded = true;
    return;
  }

  const existing = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!existing) {
    await User.create({
      username,
      email,
      passwordHash: await hash(password, 12),
      role: "admin",
      dailyAllowance: 20,
      usesUsedToday: 0,
      usageDate: "",
    });
  } else {
    let dirty = false;
    if (existing.role !== "admin") {
      existing.role = "admin";
      dirty = true;
    }
    if (
      typeof existing.dailyAllowance !== "number" ||
      existing.dailyAllowance <= 0
    ) {
      existing.dailyAllowance = 20;
      dirty = true;
    }
    if (dirty) await existing.save();
  }

  seeded = true;
}
