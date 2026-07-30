import mammoth from "mammoth";

export type StructuredResume = {
  contact: {
    name: string;
    email: string;
    phone: string;
    links: string[];
  };
  summary: string;
  experience: Array<{
    company: string;
    title: string;
    location: string;
    dates: string;
    bullets: string[];
  }>;
  education: Array<{
    school: string;
    degree: string;
    year: string;
    details: string;
  }>;
  skills: string[];
  otherSections: Array<{ title: string; content: string }>;
};

const SECTION_ALIASES: Array<{ key: string; patterns: RegExp[] }> = [
  {
    key: "summary",
    patterns: [/\b(summary|profile|objective)\b/i],
  },
  {
    key: "experience",
    patterns: [/\b(work experience|experience|employment)\b/i],
  },
  {
    key: "skills",
    patterns: [/\b(skills|technical skills|core skills)\b/i],
  },
  {
    key: "education",
    patterns: [/\b(education|academic)\b/i],
  },
];

function normalizeText(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function insertBreaksBeforeHeaders(text: string) {
  return text.replace(
    /(SUMMARY|PROFILE|OBJECTIVE|WORK EXPERIENCE|EXPERIENCE|EMPLOYMENT|SKILLS|TECHNICAL SKILLS|EDUCATION|CERTIFICATIONS|PROJECTS)/gi,
    "\n\n$1\n"
  );
}

function extractEmail(text: string) {
  const match = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match?.[0] ?? "";
}

function extractPhone(text: string) {
  const match = text.match(
    /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}/
  );
  return match?.[0] ?? "";
}

function extractLinks(text: string) {
  const matches = text.match(
    /(?:https?:\/\/|www\.|linkedin\.com\/|github\.com\/)[^\s|]+/gi
  );
  return Array.from(new Set((matches ?? []).map((m) => m.replace(/[.,)]+$/, ""))));
}

function splitSections(text: string) {
  const prepared = insertBreaksBeforeHeaders(normalizeText(text));
  const lines = prepared.split("\n").map((l) => l.trim()).filter(Boolean);
  const sections: Record<string, string[]> = {
    header: [],
    summary: [],
    experience: [],
    skills: [],
    education: [],
    other: [],
  };

  let current = "header";
  for (const line of lines) {
    const matched = SECTION_ALIASES.find((alias) =>
      alias.patterns.some((pattern) => {
        const onlyHeader = line.replace(/[^a-zA-Z\s]/g, "").trim();
        return (
          pattern.test(line) &&
          onlyHeader.split(/\s+/).length <= 4
        );
      })
    );
    if (matched) {
      current = matched.key;
      continue;
    }
    if (!sections[current]) sections[current] = [];
    sections[current].push(line);
  }
  return sections;
}

function parseExperience(lines: string[]) {
  const items: StructuredResume["experience"] = [];
  let current: StructuredResume["experience"][number] | null = null;

  for (const line of lines) {
    const looksLikeJob =
      /\|/.test(line) ||
      /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\b.*\d{4}/i.test(
        line
      ) ||
      /\d{4}\s*[–—-]\s*(\d{4}|Present|Current)/i.test(line);

    if (looksLikeJob && !line.startsWith("Built") && !line.startsWith("Developed")) {
      if (current) items.push(current);
      const parts = line.split("|").map((p) => p.trim());
      current = {
        company: parts[0] ?? line,
        title: parts[1] ?? "",
        location: parts[2] ?? "",
        dates: parts.slice(2).join(" | ") || parts[parts.length - 1] || "",
        bullets: [],
      };
      if (parts.length >= 2) {
        current.company = parts[0];
        current.title = parts[1];
        current.dates = parts.slice(2).join(" | ");
      }
      continue;
    }

    if (!current) {
      current = {
        company: "",
        title: "",
        location: "",
        dates: "",
        bullets: [line],
      };
      continue;
    }
    current.bullets.push(line);
  }
  if (current) items.push(current);
  return items;
}

function parseEducation(lines: string[]) {
  return lines.map((line) => {
    const yearMatch = line.match(/\b(19|20)\d{2}\b/);
    return {
      school: line,
      degree: "",
      year: yearMatch?.[0] ?? "",
      details: line,
    };
  });
}

function parseSkills(lines: string[]) {
  const joined = lines.join(" ");
  return joined
    .split(/[,•|–—-]|(?:\s{2,})/)
    .map((s) => s.replace(/^Frontend\s*/i, "").trim())
    .map((s) => s.replace(/^(State Management & UI|Tools & Workflow)\s*/i, "").trim())
    .filter((s) => s.length > 1 && s.length < 80);
}

export async function extractDocxText(buffer: Buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return normalizeText(result.value || "");
}

function guessName(headerLines: string[], email: string) {
  const first = headerLines[0] ?? "";
  let name = first
    .replace(email, "")
    .replace(
      /\b(Frontend|Backend|Full[\s-]?Stack|Software|Web)\s+Developer\b.*$/i,
      ""
    )
    .trim();

  const capsMatch = first.match(/^([A-Z][A-Z\s.'-]{1,60}?)(?=[A-Z][a-z])/);
  if (capsMatch?.[1]) {
    name = capsMatch[1].trim();
  }

  if (!name && first) {
    name = first.slice(0, 60).trim();
  }
  return name;
}

export function structureResumeText(rawText: string): StructuredResume {
  const sections = splitSections(rawText);
  const headerText = sections.header.join("\n");
  const email = extractEmail(rawText);
  const phone = extractPhone(rawText);
  const links = extractLinks(rawText);
  const cleanName = guessName(sections.header, email);

  return {
    contact: {
      name: cleanName,
      email,
      phone,
      links,
    },
    summary: sections.summary.join(" ").trim(),
    experience: parseExperience(sections.experience),
    education: parseEducation(sections.education),
    skills: parseSkills(sections.skills),
    otherSections: sections.other.length
      ? [{ title: "Other", content: sections.other.join("\n") }]
      : [],
  };
}

export async function extractAndStructureResume(buffer: Buffer) {
  const rawText = await extractDocxText(buffer);
  const structured = structureResumeText(rawText);
  return { rawText, structured };
}
