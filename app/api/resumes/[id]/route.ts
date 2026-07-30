import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { deleteResumeObject } from "@/lib/r2";
import { Resume } from "@/models/Resume";
import { JobInput } from "@/models/JobInput";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  await connectDB();
  const resume = await Resume.findOne({ _id: id, userId: session.user.id });
  if (!resume) {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }

  try {
    await deleteResumeObject(resume.storageKey);
  } catch (error) {
    console.error("R2 delete failed", error);
    return NextResponse.json(
      { error: "Could not delete stored file" },
      { status: 500 }
    );
  }

  await JobInput.deleteMany({ resumeId: resume._id, userId: session.user.id });
  await resume.deleteOne();

  return NextResponse.json({ ok: true });
}
