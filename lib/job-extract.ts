export type StructuredJob = {
  title: string;
  company: string;
  requiredSkills: string[];
  preferredSkills: string[];
  education: string;
  certifications: string[];
  experience: string;
  responsibilities: string[];
  keywords: string[];
  atsPhrases: string[];
};

function normalizeText(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function sectionAfter(text: string, headers: RegExp[]) {
  for (const header of headers) {
    const match = text.match(header);
    if (!match || match.index == null) continue;
    const start = match.index + match[0].length;
    const rest = text.slice(start);
    const nextHeader = rest.search(
      /\n\s*(requirements?|qualifications?|responsibilities|about the role|preferred|required|benefits|what you.?ll|education|experience)\b/i
    );
    return (nextHeader >= 0 ? rest.slice(0, nextHeader) : rest).trim();
  }
  return "";
}

function listItems(block: string) {
  return block
    .split(/\n/)
    .map((line) => line.replace(/^[-*•]+\s*/, "").replace(/^\d+[.)]\s+/, "").trim())
    .filter((line) => line.length > 2);
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

export function structureJobText(rawText: string): StructuredJob {
  const text = normalizeText(rawText);
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const title = lines[0] ?? "";

  const companyMatch =
    text.match(/\bat\s+([A-Z][A-Za-z0-9 &.,'-]{1,60})/) ||
    text.match(/\bCompany:\s*([^\n]+)/i);
  const company = companyMatch?.[1]?.trim() ?? "";

  const requiredBlock = sectionAfter(text, [
    /\brequired\s+(skills|qualifications)\b[:\s]*/i,
    /\brequirements?\b[:\s]*/i,
    /\bmust have\b[:\s]*/i,
  ]);
  const preferredBlock = sectionAfter(text, [
    /\bpreferred\s+(skills|qualifications)\b[:\s]*/i,
    /\bnice to have\b[:\s]*/i,
  ]);
  const responsibilitiesBlock = sectionAfter(text, [
    /\bresponsibilities\b[:\s]*/i,
    /\bwhat you.?ll do\b[:\s]*/i,
    /\bthe role\b[:\s]*/i,
  ]);
  const educationBlock = sectionAfter(text, [/\beducation\b[:\s]*/i]);
  const experienceBlock = sectionAfter(text, [
    /\bexperience\b[:\s]*/i,
    /\byears? of experience\b[:\s]*/i,
  ]);

  const requiredSkills = unique(
    listItems(requiredBlock).flatMap((line) =>
      line.includes(",") ? line.split(",").map((s) => s.trim()) : [line]
    )
  );
  const preferredSkills = unique(
    listItems(preferredBlock).flatMap((line) =>
      line.includes(",") ? line.split(",").map((s) => s.trim()) : [line]
    )
  );
  const responsibilities = unique(listItems(responsibilitiesBlock));

  const techKeywords = unique(
    (
      text.match(
        /\b(React|Next\.?js|TypeScript|JavaScript|Node\.?js|Python|Java|AWS|Docker|Kubernetes|SQL|MongoDB|GraphQL|Tailwind|Redux|CI\/CD|Agile|Scrum)\b/gi
      ) ?? []
    ).map((m) => m)
  );

  const atsPhrases = unique(
    (
      text.match(
        /\b(\d+\+?\s+years?[^\n.]{0,40}|bachelor[^\n.]{0,40}|master[^\n.]{0,40}|remote|hybrid|onsite)\b/gi
      ) ?? []
    ).map((m) => m.trim())
  );

  return {
    title,
    company,
    requiredSkills,
    preferredSkills,
    education: educationBlock.slice(0, 400),
    certifications: [],
    experience: experienceBlock.slice(0, 400),
    responsibilities,
    keywords: techKeywords,
    atsPhrases,
  };
}
