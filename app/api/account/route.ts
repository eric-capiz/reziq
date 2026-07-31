import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { deleteAccountCascade } from "@/lib/delete-user-data";

export async function DELETE() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  await deleteAccountCascade(session.user.id);

  return NextResponse.json({ ok: true });
}
