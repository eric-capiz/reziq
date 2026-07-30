import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { runRecommendations } from "@/lib/ai/service";
import { Analysis } from "@/models/Analysis";
import { JobInput } from "@/models/JobInput";
import { RecommendationSet } from "@/models/RecommendationSet";
import { Resume } from "@/models/Resume";

export const maxDuration = 60;

function publicSet(doc: {
  _id: { toString(): string };
  analysisId: { toString(): string };
  alreadyStrong: boolean;
  statusNote: string;
  diyAdvice: string;
  items: unknown[];
  appliedAt?: Date | null;
}) {
  return {
    id: String(doc._id),
    analysisId: String(doc.analysisId),
    alreadyStrong: doc.alreadyStrong,
    statusNote: doc.statusNote,
    diyAdvice: doc.diyAdvice,
    items: doc.items,
    appliedAt: doc.appliedAt ?? null,
  };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  await connectDB();
  const set = await RecommendationSet.findOne({
    analysisId: id,
    userId: session.user.id,
  });
  if (!set) {
    return NextResponse.json({ set: null });
  }
  return NextResponse.json({ set: publicSet(set) });
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  await connectDB();

  const analysis = await Analysis.findOne({
    _id: id,
    userId: session.user.id,
  });
  if (!analysis) {
    return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
  }

  if (analysis.verdict === "poor") {
    return NextResponse.json(
      {
        error:
          "Poor fit results do not include rewrite recommendations. Review gaps and guidance instead.",
        code: "POOR_FIT",
      },
      { status: 400 }
    );
  }

  const existing = await RecommendationSet.findOne({
    analysisId: analysis._id,
    userId: session.user.id,
  });
  if (existing) {
    return NextResponse.json({ set: publicSet(existing), cached: true });
  }

  const resume = await Resume.findOne({
    _id: analysis.resumeId,
    userId: session.user.id,
  });
  const job = await JobInput.findOne({
    _id: analysis.jobId,
    userId: session.user.id,
  });
  if (!resume || !job) {
    return NextResponse.json({ error: "Resume or job missing" }, { status: 404 });
  }

  try {
    const { result, provider } = await runRecommendations({
      resumeJson: resume.structured,
      jobJson: job.structured,
      analysisJson: {
        verdict: analysis.verdict,
        summary: analysis.summary,
        matches: analysis.matches,
        partialMatches: analysis.partialMatches,
        gaps: analysis.gaps,
        guidance: analysis.guidance,
      },
    });

    const set = await RecommendationSet.create({
      userId: session.user.id,
      analysisId: analysis._id,
      resumeId: resume._id,
      jobId: job._id,
      alreadyStrong: result.alreadyStrong,
      statusNote: result.statusNote,
      diyAdvice: result.diyAdvice,
      provider,
      items: result.recommendations.slice(0, 6).map((item) => ({
        itemId: nanoid(),
        section: item.section,
        targetPath: item.targetPath,
        title: item.title,
        rationale: item.rationale,
        currentText: item.currentText,
        proposedText: item.proposedText,
        resumeEvidence: item.resumeEvidence,
        decision: "pending",
      })),
    });

    return NextResponse.json({ set: publicSet(set), cached: false });
  } catch (error) {
    console.error("Recommendations failed", error);
    const message =
      error instanceof Error ? error.message : "Could not generate recommendations";
    const unavailable = message.toLowerCase().includes("unavailable");
    return NextResponse.json(
      {
        error: unavailable
          ? "Free AI processing is unavailable right now. Please try again later."
          : "Could not generate recommendations right now. Please try again.",
      },
      { status: unavailable ? 503 : 500 }
    );
  }
}
