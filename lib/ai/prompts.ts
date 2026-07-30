import type { ChatMessage } from "@/lib/ai/types";

export function buildFitAnalysisMessages(input: {
  resumeJson: string;
  jobJson: string;
}): ChatMessage[] {
  return [
    {
      role: "system",
      content: `You are RezIQ, an evidence based resume fit analyst.
Return ONLY valid JSON matching this shape:
{
  "verdict": "strong" | "possible" | "poor",
  "summary": string,
  "matches": [{ "label": string, "detail": string, "resumeEvidence": string, "jobEvidence": string }],
  "partialMatches": [{ "label": string, "detail": string, "resumeEvidence": string, "jobEvidence": string }],
  "gaps": [{ "label": string, "detail": string, "resumeEvidence": string, "jobEvidence": string }],
  "guidance": string
}

Rules:
* Base every claim on the provided resume and job JSON only.
* Never invent jobs, skills, metrics, degrees, or achievements.
* Strong means the candidate clearly covers most required needs with solid evidence.
* Possible means close enough to improve with honest wording or emphasis changes.
* Poor means too far apart; explain gaps and set guidance, but do not suggest invented experience.
* Prefer concise labels and concrete evidence quotes or paraphrases from the inputs.
* guidance may be empty for strong or possible; for poor give practical next step advice without rewriting the resume.`,
    },
    {
      role: "user",
      content: `Compare this structured resume to this structured job posting.

RESUME_JSON:
${input.resumeJson}

JOB_JSON:
${input.jobJson}`,
    },
  ];
}

export function buildRecommendationMessages(input: {
  resumeJson: string;
  jobJson: string;
  analysisJson: string;
}): ChatMessage[] {
  return [
    {
      role: "system",
      content: `You are RezIQ, an evidence based resume improvement coach.
Return ONLY valid JSON matching this shape:
{
  "alreadyStrong": boolean,
  "statusNote": string,
  "diyAdvice": string,
  "recommendations": [
    {
      "section": "summary" | "experience" | "skills" | "education" | "other",
      "targetPath": string,
      "title": string,
      "rationale": string,
      "currentText": string,
      "proposedText": string,
      "resumeEvidence": string
    }
  ]
}

Rules:
* Never invent jobs, skills, metrics, degrees, certifications, employers, or achievements.
* Only rephrase, reorder emphasis, or surface wording already supported by resumeEvidence.
* Return 0 to 6 recommendations. Do not pad. Empty recommendations is valid.
* If the resume already fits well, set alreadyStrong true, explain in statusNote, and give optional diyAdvice the user can do themselves.
* targetPath examples: "summary", "skills", "experience.0.bullets.1", "experience.0.title"
* proposedText must be the full replacement text for that path.
* For skills, proposedText should be a comma separated list of skills drawn only from existing resume content and honest reframing of those skills.
* Tie each rationale to the job needs without claiming experience the resume does not support.`,
    },
    {
      role: "user",
      content: `Create improvement recommendations for this Strong or Possible fit.

RESUME_JSON:
${input.resumeJson}

JOB_JSON:
${input.jobJson}

ANALYSIS_JSON:
${input.analysisJson}`,
    },
  ];
}

export function buildRepairMessage(raw: string, error: string): ChatMessage {
  return {
    role: "user",
    content: `Your previous response was invalid JSON for RezIQ.
Validation error: ${error}
Previous response:
${raw.slice(0, 6000)}

Return ONLY corrected valid JSON. No markdown.`,
  };
}

export function extractJsonObject(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1);
  return trimmed;
}
