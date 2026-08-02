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
  "advice": [{ "topic": string, "detail": string }],
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

Hard rules:
* NEVER invent jobs, skills, tools, frameworks, metrics, degrees, certifications, employers, or achievements.
* If the job asks for a skill that is NOT on the resume (example: GraphQL), do NOT add it to summary, skills, or bullets.
* Put missing job skills or qualifications into "advice" instead, so the user can decide whether they honestly have that experience.
* recommendations are ONLY for light keyword alignment and clearer wording of experience already on the resume.
* Prefer experience bullet rewrites and summary emphasis changes when the resume already supports them.
* Do not force changes. 0 recommendations is valid.
* Do not pad. Return at most 6 recommendations.
* For skills section edits: only reorder, group, or rephrase skills already present. Never append new skills.
* proposedText must be fully supported by resumeEvidence from the resume JSON.
* proposedText is resume content. Never use hyphens or dash characters of any kind in proposedText (no ASCII hyphen, en dash, or em dash). Rephrase instead (example: write "full stack" not "full-stack"; write "2020 to 2023" not "2020-2023"; use commas or new sentences instead of dashes).
* targetPath examples: "summary", "skills", "experience.0.bullets.1", "experience.0.title"`,
    },
    {
      role: "user",
      content: `Create improvement recommendations for this Strong or Possible fit.

Missing job requirements must go in advice, not recommendations.

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
