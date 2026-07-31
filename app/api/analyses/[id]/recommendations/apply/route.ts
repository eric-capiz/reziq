import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { applyAcceptedRecommendations } from "@/lib/apply-recommendations";
import {
  RecommendationSet,
  type RecommendationItemFields,
} from "@/models/RecommendationSet";
import { Resume } from "@/models/Resume";

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

  const set = await RecommendationSet.findOne({
    analysisId: id,
    userId: session.user.id,
  });
  if (!set) {
    return NextResponse.json({ error: "Recommendations not found" }, { status: 404 });
  }

  if (set.appliedAt) {
    return NextResponse.json(
      { error: "Accepted changes were already applied" },
      { status: 400 }
    );
  }

  const accepted = set.items.filter(
    (item: RecommendationItemFields) => item.decision === "accepted"
  );
  if (accepted.length === 0) {
    return NextResponse.json(
      { error: "Accept at least one recommendation before applying" },
      { status: 400 }
    );
  }

  const resume = await Resume.findOne({
    _id: set.resumeId,
    userId: session.user.id,
  });
  if (!resume) {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }

  try {
    const draft = applyAcceptedRecommendations(
      resume.structured as never,
      accepted.map((item: RecommendationItemFields) => ({
        targetPath: item.targetPath,
        proposedText: item.proposedText,
        decision: item.decision,
      }))
    );

    resume.structuredDraft = draft;
    await resume.save();
    set.appliedAt = new Date();
    await set.save();

    return NextResponse.json({
      ok: true,
      appliedCount: accepted.length,
      structuredDraft: draft,
      appliedAt: set.appliedAt,
    });
  } catch (error) {
    console.error("Apply recommendations failed", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not apply recommendations",
      },
      { status: 400 }
    );
  }
}
