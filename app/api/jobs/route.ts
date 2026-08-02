import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { structureJobText } from "@/lib/job-extract";
import { normalizePostingUrl } from "@/lib/posting-url";
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

  const postingUrl = normalizePostingUrl(parsed.data.postingUrl);
  if (postingUrl === null) {
    return NextResponse.json(
      { error: "Posting link must be a valid http or https URL" },
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
  const existingJobs = await JobInput.find({
    userId: session.user.id,
    resumeId: resume._id,
  }).sort({ updatedAt: -1 });

  let job = existingJobs[0] ?? null;
  const extras = existingJobs.slice(1);

  if (extras.length) {
    const extraIds = extras.map((item) => item._id);
    const analyses = await Analysis.find({
      userId: session.user.id,
      jobId: { $in: extraIds },
    }).select("_id");
    const analysisIds = analyses.map((item) => item._id);
    if (analysisIds.length) {
      await RecommendationSet.deleteMany({
        userId: session.user.id,
        analysisId: { $in: analysisIds },
      });
      await Analysis.deleteMany({
        userId: session.user.id,
        _id: { $in: analysisIds },
      });
    }
    await JobInput.deleteMany({
      userId: session.user.id,
      _id: { $in: extraIds },
    });
  }

  if (job) {
    job.rawText = parsed.data.rawText;
    job.structured = structured;
    await job.save();
  } else {
    job = await JobInput.create({
      userId: session.user.id,
      resumeId: resume._id,
      rawText: parsed.data.rawText,
      structured,
    });
  }

  await Resume.collection.updateOne(
    { _id: resume._id },
    {
      $set: {
        postingTitle: parsed.data.postingTitle,
        postingCompany: parsed.data.postingCompany,
        postingUrl,
      },
    }
  );

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
