import { stripResumeDashes } from "@/lib/sanitize-recommendations";

export type StructuredResumeLike = {
  contact?: Record<string, unknown>;
  summary?: string;
  experience?: Array<{
    company?: string;
    title?: string;
    location?: string;
    dates?: string;
    bullets?: string[];
  }>;
  education?: Array<{
    school?: string;
    degree?: string;
    year?: string;
    details?: string;
  }>;
  skills?: string[];
  otherSections?: Array<{ title?: string; content?: string }>;
};

function cloneStructured(structured: StructuredResumeLike): StructuredResumeLike {
  return JSON.parse(JSON.stringify(structured ?? {}));
}

export function applyRecommendationPath(
  structured: StructuredResumeLike,
  targetPath: string,
  proposedText: string
): StructuredResumeLike {
  const next = cloneStructured(structured);
  const path = targetPath.trim();
  const cleanText = stripResumeDashes(proposedText);

  if (path === "summary") {
    next.summary = cleanText;
    return next;
  }

  if (path === "skills") {
    next.skills = cleanText
      .split(/,|\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    return next;
  }

  const experienceBullet = path.match(/^experience\.(\d+)\.bullets\.(\d+)$/);
  if (experienceBullet) {
    const expIndex = Number(experienceBullet[1]);
    const bulletIndex = Number(experienceBullet[2]);
    if (!next.experience?.[expIndex]) {
      throw new Error(`Missing experience at ${path}`);
    }
    const bullets = [...(next.experience[expIndex].bullets ?? [])];
    bullets[bulletIndex] = cleanText;
    next.experience[expIndex] = {
      ...next.experience[expIndex],
      bullets,
    };
    return next;
  }

  const experienceField = path.match(/^experience\.(\d+)\.(company|title|location|dates)$/);
  if (experienceField) {
    const expIndex = Number(experienceField[1]);
    const field = experienceField[2] as "company" | "title" | "location" | "dates";
    if (!next.experience?.[expIndex]) {
      throw new Error(`Missing experience at ${path}`);
    }
    next.experience[expIndex] = {
      ...next.experience[expIndex],
      [field]: cleanText,
    };
    return next;
  }

  const educationField = path.match(/^education\.(\d+)\.(school|degree|year|details)$/);
  if (educationField) {
    const eduIndex = Number(educationField[1]);
    const field = educationField[2] as "school" | "degree" | "year" | "details";
    if (!next.education?.[eduIndex]) {
      throw new Error(`Missing education at ${path}`);
    }
    next.education[eduIndex] = {
      ...next.education[eduIndex],
      [field]: cleanText,
    };
    return next;
  }

  throw new Error(`Unsupported recommendation path: ${path}`);
}

export function applyAcceptedRecommendations(
  structured: StructuredResumeLike,
  items: Array<{ targetPath: string; proposedText: string; decision: string }>
) {
  let next = cloneStructured(structured);
  for (const item of items) {
    if (item.decision !== "accepted") continue;
    next = applyRecommendationPath(next, item.targetPath, item.proposedText);
  }
  return next;
}
