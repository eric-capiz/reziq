import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { structureJobText } from "@/lib/job-extract";
import { cleanPostingUrl } from "@/lib/posting-url";
import { getUserUsageSummary } from "@/lib/usage";
import { Analysis } from "@/models/Analysis";
import { JobInput } from "@/models/JobInput";
import { RecommendationSet } from "@/models/RecommendationSet";
import { Resume } from "@/models/Resume";

const bodySchema = z.object({
  resumeId: z.string().min(1),
  rawText: z.string().trim().min(40).max(50000),
  postingTitle: z.string().trim().max(200).optional().default(""),
  postingCompany: z.string().trim().max(200).optional().default(""),
  postingUrl: z.string().trim().max(2000).optional().default(""),
});

async function deleteAnalysesForJobs(userId: string, jobIds: unknown[]) {
  if (!jobIds.length) return;
  const analyses = await Analysis.find({
    userId,
    jobId: { $in: jobIds },
  }).select("_id");
  const analysisIds = analyses.map((item) => item._id);
  if (!analysisIds.length) return;
  await RecommendationSet.deleteMany({
    userId,
    analysisId: { $in: analysisIds },
  });
  await Analysis.deleteMany({
    userId,
    _id: { $in: analysisIds },
  });
}

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
            ? "No daily uses assigned right now. An admin can grant uses when capacity allows. Please check back later."
            : "Out of uses today. Uses reset daily. Try again after the daily reset.",
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

  const postingUrl = cleanPostingUrl(parsed.data.postingUrl);

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
  const existingJobs = await JobInput.find({
    userId: session.user.id,
    resumeId: resume._id,
  }).sort({ updatedAt: -1 });

  let job = existingJobs[0] ?? null;
  const extras = existingJobs.slice(1);

  if (extras.length) {
    const extraIds = extras.map((item) => item._id);
    await deleteAnalysesForJobs(session.user.id, extraIds);
    await JobInput.deleteMany({
      userId: session.user.id,
      _id: { $in: extraIds },
    });
  }

  const jobTextChanged = Boolean(job && job.rawText !== parsed.data.rawText);

  if (job) {
    job.rawText = parsed.data.rawText;
    job.structured = structured;
    await job.save();
    if (jobTextChanged) {
      await deleteAnalysesForJobs(session.user.id, [job._id]);
    }
  } else {
    job = await JobInput.create({
      userId: session.user.id,
      resumeId: resume._id,
      rawText: parsed.data.rawText,
      structured,
    });
  }

  const resumeUpdate: Record<string, unknown> = {
    $set: {
      postingTitle: parsed.data.postingTitle,
      postingCompany: parsed.data.postingCompany,
      postingUrl,
    },
  };
  if (jobTextChanged) {
    resumeUpdate.$unset = { structuredDraft: "" };
  }

  await Resume.collection.updateOne({ _id: resume._id }, resumeUpdate);

  return NextResponse.json({
    id: String(job._id),
    resumeId: String(resume._id),
    postingTitle: parsed.data.postingTitle,
    postingCompany: parsed.data.postingCompany,
    postingUrl,
    structured: job.structured,
    remainingUses: usage.remainingUses,
  });
}
