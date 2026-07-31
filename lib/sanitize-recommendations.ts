import type { RecommendationResult } from "@/lib/ai/types";

type StructuredLike = {
  skills?: string[];
  summary?: string;
  experience?: Array<{ bullets?: string[]; title?: string; company?: string }>;
  education?: unknown[];
  otherSections?: unknown[];
};

function normalize(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9.+#]/g, "");
}

function resumeTextBlob(structured: StructuredLike) {
  return JSON.stringify(structured ?? {}).toLowerCase();
}

function skillExistsOnResume(skill: string, resumeText: string, skills: string[]) {
  const trimmed = skill.trim();
  if (!trimmed) return false;
  const lower = trimmed.toLowerCase();
  if (resumeText.includes(lower)) return true;
  const norm = normalize(trimmed);
  if (!norm) return false;
  if (skills.some((s) => normalize(s) === norm || normalize(s).includes(norm) || norm.includes(normalize(s)))) {
    return true;
  }
  return resumeText.includes(norm) || normalize(resumeText).includes(norm);
}

function collectJobSkillHints(job: {
  requiredSkills?: string[];
  preferredSkills?: string[];
  keywords?: string[];
  atsPhrases?: string[];
}) {
  return [
    ...(job.requiredSkills ?? []),
    ...(job.preferredSkills ?? []),
    ...(job.keywords ?? []),
    ...(job.atsPhrases ?? []),
  ]
    .map((s) => s.trim())
    .filter(Boolean);
}

function proposalAddsMissingSkill(
  proposedText: string,
  resume: StructuredLike,
  jobSkills: string[]
) {
  const resumeText = resumeTextBlob(resume);
  const skills = resume.skills ?? [];
  const proposedLower = proposedText.toLowerCase();

  for (const skill of jobSkills) {
    const lower = skill.toLowerCase();
    if (lower.length < 2) continue;
    if (skillExistsOnResume(skill, resumeText, skills)) continue;
    // Job skill not on resume: reject proposal if it newly introduces it
    if (
      proposedLower.includes(lower) ||
      normalize(proposedText).includes(normalize(skill))
    ) {
      return skill;
    }
  }
  return null;
}

function sanitizeSkillsProposed(
  proposedText: string,
  resume: StructuredLike
) {
  const resumeText = resumeTextBlob(resume);
  const skills = resume.skills ?? [];
  const kept = proposedText
    .split(/,|\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((skill) => skillExistsOnResume(skill, resumeText, skills));
  return kept;
}

export function sanitizeRecommendationResult(
  result: RecommendationResult,
  resume: StructuredLike,
  job: {
    requiredSkills?: string[];
    preferredSkills?: string[];
    keywords?: string[];
    atsPhrases?: string[];
  }
): RecommendationResult {
  const jobSkills = collectJobSkillHints(job);
  const resumeText = resumeTextBlob(resume);
  const resumeSkills = resume.skills ?? [];

  const missingFromJob = jobSkills.filter(
    (skill) => !skillExistsOnResume(skill, resumeText, resumeSkills)
  );

  const uniqueMissing = Array.from(
    new Map(missingFromJob.map((s) => [normalize(s), s])).values()
  ).slice(0, 8);

  const adviceFromGaps = uniqueMissing.map((skill) => ({
    topic: skill,
    detail: `The job mentions ${skill}, but it is not clearly listed on your resume. If you have real experience with it, consider adding it yourself. RezIQ will not invent it for you.`,
  }));

  const modelAdvice = result.advice ?? [];
  const advice = [...modelAdvice, ...adviceFromGaps].slice(0, 10);

  const recommendations = result.recommendations
    .map((item) => {
      if (item.section === "skills" || item.targetPath === "skills") {
        const kept = sanitizeSkillsProposed(item.proposedText, resume);
        if (kept.length === 0) return null;
        const currentSkills = (item.currentText || resumeSkills.join(", "))
          .split(/,|\n/)
          .map((s) => s.trim())
          .filter(Boolean);
        const currentNorm = new Set(currentSkills.map(normalize));
        const addedOnlyExisting = kept.filter((s) => !currentNorm.has(normalize(s)));
        // Reordering / cleanup is fine; inventing new skills is not
        if (addedOnlyExisting.length > 0) {
          // kept already filtered to resume only, so additions must already exist somewhere on resume
          // Still disallow expanding skills list with terms not already in the skills section
          // unless they appear as skills array entries
          const skillSectionNorm = new Set(resumeSkills.map(normalize));
          const illegal = addedOnlyExisting.filter(
            (s) => !skillSectionNorm.has(normalize(s))
          );
          if (illegal.length) {
            // Only keep skills already in the skills list (reorder/cleanup)
            const cleaned = kept.filter((s) => skillSectionNorm.has(normalize(s)));
            if (cleaned.length === 0) return null;
            if (cleaned.map(normalize).join(",") === [...currentNorm].join(",")) {
              return null;
            }
            return {
              ...item,
              proposedText: cleaned.join(", "),
            };
          }
        }
        return {
          ...item,
          proposedText: kept.join(", "),
        };
      }

      const invented = proposalAddsMissingSkill(
        item.proposedText,
        resume,
        jobSkills
      );
      if (invented) return null;
      return item;
    })
    .filter(Boolean)
    .slice(0, 6) as RecommendationResult["recommendations"];

  const diyAdvice =
    result.diyAdvice ||
    (uniqueMissing.length
      ? `If you truly have experience with ${uniqueMissing
          .slice(0, 3)
          .join(", ")}, add it yourself with honest evidence. Do not claim skills you have not used.`
      : "");

  return {
    ...result,
    advice,
    diyAdvice,
    recommendations,
  };
}
