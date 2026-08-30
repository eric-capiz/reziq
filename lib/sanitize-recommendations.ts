import type { RecommendationResult } from "@/lib/ai/types";

type StructuredLike = {
  skills?: string[];
  summary?: string;
  experience?: Array<{ bullets?: string[]; title?: string; company?: string }>;
  education?: unknown[];
  otherSections?: unknown[];
};

const ONES = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];

const TENS = [
  "",
  "",
  "twenty",
  "thirty",
  "forty",
  "fifty",
  "sixty",
  "seventy",
  "eighty",
  "ninety",
];

const STOP_WORDS = new Set([
  "that",
  "this",
  "with",
  "from",
  "into",
  "over",
  "after",
  "before",
  "about",
  "using",
  "across",
  "through",
  "their",
  "there",
  "have",
  "been",
  "were",
  "also",
  "plus",
]);

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function integerToWords(n: number) {
  if (!Number.isInteger(n) || n < 0 || n > 100) return [];
  if (n === 100) return ["one hundred"];
  if (n < 20) return [ONES[n]];
  const ten = TENS[Math.floor(n / 10)];
  const one = n % 10;
  if (one === 0) return [ten];
  return [`${ten} ${ONES[one]}`, `${ten}-${ONES[one]}`];
}

function normalize(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9.+#]/g, "");
}

function normalizeForCompare(text: string) {
  return text
    .toLowerCase()
    .replace(/(\d+(?:\.\d+)?)\s*per\s*-?cents?/g, "$1%")
    .replace(/(\d+)\s+plus\b/g, "$1+")
    .replace(/[^a-z0-9.+#$%]/g, "");
}

function meaningfulWords(text: string) {
  return (text.toLowerCase().match(/[a-z]{4,}/g) ?? []).filter(
    (word) => !STOP_WORDS.has(word)
  );
}

export function restoreOriginalMetrics(currentText: string, proposedText: string) {
  let next = proposedText;

  for (const match of currentText.matchAll(/(\d+(?:\.\d+)?)%/g)) {
    const token = match[0];
    const num = match[1];
    if (next.includes(token)) continue;

    const variants = [
      `${num} percent`,
      `${num} per cent`,
      `${num} percentage`,
      `${num}-percent`,
    ];
    const asNumber = Number(num);
    if (Number.isInteger(asNumber)) {
      for (const words of integerToWords(asNumber)) {
        variants.push(
          `${words} percent`,
          `${words} per cent`,
          `${words} percentage`
        );
      }
    }

    for (const variant of variants) {
      const re = new RegExp(escapeRegExp(variant).replace(/ /g, "\\s+"), "gi");
      const updated = next.replace(re, token);
      if (updated !== next) {
        next = updated;
        break;
      }
    }
  }

  for (const match of currentText.matchAll(/(\d+)\+/g)) {
    const token = match[0];
    const num = match[1];
    if (next.includes(token)) continue;
    next = next.replace(new RegExp(`${escapeRegExp(num)}\\s+plus\\b`, "gi"), token);
    const asNumber = Number(num);
    if (Number.isInteger(asNumber)) {
      for (const words of integerToWords(asNumber)) {
        next = next.replace(
          new RegExp(`${escapeRegExp(words)}\\s+plus\\b`, "gi"),
          token
        );
      }
    }
  }

  for (const match of currentText.matchAll(/\$[\d,]+(?:\.\d+)?k?\b/gi)) {
    const token = match[0];
    if (next.includes(token)) continue;
    const bare = token.slice(1);
    next = next.replace(
      new RegExp(`(?:usd\\s+)?${escapeRegExp(bare)}(?:\\s+dollars?)?`, "gi"),
      token
    );
  }

  return next;
}

export function stripUnsupportedClauses(currentText: string, proposedText: string) {
  const currentWords = new Set(meaningfulWords(currentText));
  const ending = proposedText.match(/[.!?]+$/)?.[0] ?? "";
  const core = proposedText.replace(/[.!?]+$/, "");
  const parts = core.split(/(?<=[a-z0-9%$+])[,;]\s+/);
  if (parts.length < 2) return proposedText;

  const kept = parts.filter((part, index) => {
    if (index === 0) return true;
    const words = meaningfulWords(part);
    if (words.length === 0) return true;
    const hits = words.filter((word) => currentWords.has(word)).length;
    return hits >= Math.ceil(words.length * 0.6);
  });

  if (kept.length === parts.length) return proposedText;
  if (kept.length === 0) return currentText;
  return `${kept.join(", ").replace(/[,;\s]+$/, "")}${ending}`;
}

function polishProposedText(currentText: string, proposedText: string) {
  const restored = restoreOriginalMetrics(currentText, proposedText);
  const withoutFluff = stripUnsupportedClauses(currentText, restored);
  return stripResumeDashes(withoutFluff);
}

function isNoOpRewrite(currentText: string, proposedText: string) {
  if (!currentText.trim()) return false;
  return normalizeForCompare(currentText) === normalizeForCompare(proposedText);
}

export function stripResumeDashes(text: string) {
  return text
    .replace(/[\u2014\u2013]/g, ", ")
    .replace(/[\-‐‑‒–—―−]/g, " ")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/ ?,\s*,+/g, ",")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
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
        // Reordering or cleanup is fine; inventing new skills is not
        if (addedOnlyExisting.length > 0) {
          // kept already filtered to resume only, so additions must already exist somewhere on resume
          // Still disallow expanding skills list with terms not already in the skills section
          // unless they appear as skills array entries
          const skillSectionNorm = new Set(resumeSkills.map(normalize));
          const illegal = addedOnlyExisting.filter(
            (s) => !skillSectionNorm.has(normalize(s))
          );
          if (illegal.length) {
            // Only keep skills already in the skills list (reorder or cleanup)
            const cleaned = kept.filter((s) => skillSectionNorm.has(normalize(s)));
            if (cleaned.length === 0) return null;
            if (cleaned.map(normalize).join(",") === [...currentNorm].join(",")) {
              return null;
            }
            return {
              ...item,
              proposedText: stripResumeDashes(cleaned.join(", ")),
            };
          }
        }
        return {
          ...item,
          proposedText: stripResumeDashes(kept.join(", ")),
        };
      }

      const proposedText = polishProposedText(
        item.currentText,
        item.proposedText
      );
      if (isNoOpRewrite(item.currentText, proposedText)) return null;
      const invented = proposalAddsMissingSkill(proposedText, resume, jobSkills);
      if (invented) return null;
      return {
        ...item,
        proposedText,
      };
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
