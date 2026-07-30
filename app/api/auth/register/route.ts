import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(32, "Username must be 32 characters or fewer")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only include letters, numbers, and underscores"
    ),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    await connectDB();

    const username = parsed.data.username.toLowerCase();
    const email = parsed.data.email.toLowerCase();

    const existing = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existing) {
      const field =
        existing.username === username ? "Username" : "Email";
      return NextResponse.json(
        { error: `${field} is already taken` },
        { status: 409 }
      );
    }

    await User.create({
      username,
      email,
      passwordHash: await hash(parsed.data.password, 12),
      role: "user",
      usesAssigned: 0,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to register right now" },
      { status: 500 }
    );
  }
}
