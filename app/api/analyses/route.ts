import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { runFitAnalysis } from "@/lib/ai/service";
import { consumeSuccessfulAnalysis, getUserUsageSummary } from "@/lib/usage";
import { Analysis } from "@/models/Analysis";
import { JobInput } from "@/models/JobInput";
import { Resume } from "@/models/Resume";

export const maxDuration = 60;

const bodySchema = z.object({
  resumeId: z.string().min(1),
  jobId: z.string().min(1),
  force: z.boolean().optional(),
});

function publicAnalysis(doc: {
  _id: { toString(): string };
  resumeId: { toString(): string };
  jobId: { toString(): string };
  verdict: string;
  summary: string;
  matches: unknown[];
  partialMatches: unknown[];
  gaps: unknown[];
  guidance: string;
  cached?: boolean;
  createdAt?: Date;
}) {
  return {
    id: String(doc._id),
    resumeId: String(doc.resumeId),
    jobId: String(doc.jobId),
    verdict: doc.verdict,
    summary: doc.summary,
    matches: doc.matches,
    partialMatches: doc.partialMatches,
    gaps: doc.gaps,
    guidance: doc.guidance,
    cached: Boolean(doc.cached),
    createdAt: doc.createdAt,
  };
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Resume and job are required" }, { status: 400 });
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

  const resume = await Resume.findOne({
    _id: parsed.data.resumeId,
    userId: session.user.id,
  });
  if (!resume || resume.status !== "extracted") {
    return NextResponse.json({ error: "Resume not ready" }, { status: 404 });
  }

  const job = await JobInput.findOne({
    _id: parsed.data.jobId,
    userId: session.user.id,
    resumeId: resume._id,
  });
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const existing = await Analysis.findOne({
    userId: session.user.id,
    resumeId: resume._id,
    jobId: job._id,
  });
  if (existing && !parsed.data.force) {
    return NextResponse.json({
      analysis: publicAnalysis({ ...existing.toObject(), cached: true }),
      remainingUses: usage.remainingUses,
      cached: true,
    });
  }
  if (existing && parsed.data.force) {
    await existing.deleteOne();
  }

  try {
    const { result, provider } = await runFitAnalysis({
      resumeJson: resume.structured,
      jobJson: job.structured,
    });

    const analysis = await Analysis.create({
      userId: session.user.id,
      resumeId: resume._id,
      jobId: job._id,
      verdict: result.verdict,
      summary: result.summary,
      matches: result.matches,
      partialMatches: result.partialMatches,
      gaps: result.gaps,
      guidance: result.guidance,
      provider,
      cached: false,
    });

    const consumed = await consumeSuccessfulAnalysis(session.user.id);

    return NextResponse.json({
      analysis: publicAnalysis(analysis),
      remainingUses: consumed.remainingUses,
      cached: false,
    });
  } catch (error) {
    console.error("Fit analysis failed", error);
    const message =
      error instanceof Error
        ? error.message
        : "Could not complete analysis right now";
    const unavailable = message.toLowerCase().includes("unavailable");
    return NextResponse.json(
      {
        error: unavailable
          ? "Free AI processing is unavailable right now. Please try again later."
          : "Could not complete analysis right now. Please try again.",
      },
      { status: unavailable ? 503 : 500 }
    );
  }
}
