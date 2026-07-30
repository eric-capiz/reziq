import fs from "fs";
import { extractAndStructureResume } from "../lib/resume-extract";
import { structureJobText } from "../lib/job-extract";

async function main() {
  const buf = fs.readFileSync("fixtures/sample-resume.docx");
  const result = await extractAndStructureResume(buf);
  console.log(
    JSON.stringify(
      {
        name: result.structured.contact.name,
        email: result.structured.contact.email,
        phone: result.structured.contact.phone,
        summaryLen: result.structured.summary.length,
        experience: result.structured.experience.map((e) => ({
          company: e.company,
          title: e.title,
          bullets: e.bullets.length,
        })),
        skills: result.structured.skills.slice(0, 10),
        education: result.structured.education.length,
      },
      null,
      2
    )
  );

  const job = structureJobText(`Frontend Developer at Acme Corp

Requirements:
- React
- TypeScript
- 3+ years experience

Responsibilities:
- Build UI features
- Collaborate with designers

Preferred skills:
- Next.js
- Tailwind
`);
  console.log("JOB", JSON.stringify(job, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
