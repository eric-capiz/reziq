import { compare, hash } from "bcryptjs";
import { User } from "@/models/User";

let seeded = false;

export async function ensureAdminUser() {
  if (seeded) return;

  const username = process.env.ADMIN_USERNAME?.trim().toLowerCase();
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !email || !password) {
    console.warn(
      "Admin seed skipped: set ADMIN_USERNAME, ADMIN_EMAIL, and ADMIN_PASSWORD on the host."
    );
    return;
  }

  let existing = await User.findOne({ username });
  if (!existing) {
    existing = await User.findOne({ email });
  }

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
    seeded = true;
    return;
  }

  let dirty = false;

  if (existing.username !== username) {
    const taken = await User.findOne({
      username,
      _id: { $ne: existing._id },
    });
    if (!taken) {
      existing.username = username;
      dirty = true;
    }
  }

  if (existing.email !== email) {
    const taken = await User.findOne({
      email,
      _id: { $ne: existing._id },
    });
    if (!taken) {
      existing.email = email;
      dirty = true;
    }
  }

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

  const passwordMatches = await compare(password, existing.passwordHash);
  if (!passwordMatches) {
    existing.passwordHash = await hash(password, 12);
    dirty = true;
  }

  if (dirty) await existing.save();
  seeded = true;
}
