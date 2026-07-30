import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { structureJobText } from "@/lib/job-extract";
import { getUserUsageSummary } from "@/lib/usage";
import { JobInput } from "@/models/JobInput";
import { Resume } from "@/models/Resume";

const bodySchema = z.object({
  resumeId: z.string().min(1),
  rawText: z.string().trim().min(40).max(50000),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const usage = await getUserUsageSummary(session.user.id);
  if (!usage || usage.remainingUses <= 0) {
    return NextResponse.json(
      {
        error:
          usage?.dailyAllowance === 0
            ? "No daily uses assigned yet. An admin will assign uses. Please check back later."
            : "Out of uses today. Try again tomorrow after the daily reset.",
        code: "OUT_OF_USES",
      },
      { status: 403 }
    );
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Paste a job description (at least a short paragraph)" },
      { status: 400 }
    );
  }

  const resume = await Resume.findOne({
    _id: parsed.data.resumeId,
    userId: session.user.id,
  });
  if (!resume) {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }
  if (resume.status !== "extracted") {
    return NextResponse.json(
      { error: "Resume must be extracted before adding a job" },
      { status: 400 }
    );
  }

  const structured = structureJobText(parsed.data.rawText);
  const job = await JobInput.create({
    userId: session.user.id,
    resumeId: resume._id,
    rawText: parsed.data.rawText,
    structured,
  });

  return NextResponse.json({
    id: String(job._id),
    resumeId: String(resume._id),
    structured: job.structured,
    remainingUses: usage.remainingUses,
  });
}
