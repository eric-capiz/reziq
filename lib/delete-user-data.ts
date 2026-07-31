import { deleteResumeObject } from "@/lib/r2";
import { Analysis } from "@/models/Analysis";
import { ExportRecord } from "@/models/Export";
import { JobInput } from "@/models/JobInput";
import { RecommendationSet } from "@/models/RecommendationSet";
import { Resume } from "@/models/Resume";
import { User } from "@/models/User";

async function deleteStoredKey(key: string) {
  try {
    await deleteResumeObject(key);
  } catch (error) {
    console.error("R2 delete failed for key", key, error);
  }
}

export async function deleteResumeCascade(input: {
  resumeId: string;
  userId: string;
}) {
  const resume = await Resume.findOne({
    _id: input.resumeId,
    userId: input.userId,
  });
  if (!resume) {
    return { ok: false as const, error: "Resume not found" };
  }

  const exports = await ExportRecord.find({
    resumeId: resume._id,
    userId: input.userId,
  }).select("storageKey");

  for (const item of exports) {
    await deleteStoredKey(item.storageKey);
  }

  await deleteStoredKey(resume.storageKey);

  const analyses = await Analysis.find({
    resumeId: resume._id,
    userId: input.userId,
  }).select("_id");
  const analysisIds = analyses.map((a) => a._id);

  if (analysisIds.length) {
    await RecommendationSet.deleteMany({
      userId: input.userId,
      analysisId: { $in: analysisIds },
    });
  }

  await Analysis.deleteMany({ resumeId: resume._id, userId: input.userId });
  await JobInput.deleteMany({ resumeId: resume._id, userId: input.userId });
  await ExportRecord.deleteMany({ resumeId: resume._id, userId: input.userId });
  await resume.deleteOne();

  return { ok: true as const };
}

export async function deleteAccountCascade(userId: string) {
  const resumes = await Resume.find({ userId }).select("_id");
  for (const resume of resumes) {
    await deleteResumeCascade({
      resumeId: String(resume._id),
      userId,
    });
  }

  // Safety net for orphaned rows
  await RecommendationSet.deleteMany({ userId });
  await Analysis.deleteMany({ userId });
  await JobInput.deleteMany({ userId });
  await ExportRecord.deleteMany({ userId });
  await Resume.deleteMany({ userId });
  await User.deleteOne({ _id: userId });

  return { ok: true as const };
}
