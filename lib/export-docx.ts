import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
} from "docx";
import type { StructuredResume } from "@/lib/resume-extract";

function contactLine(structured: StructuredResume) {
  const parts = [
    structured.contact?.email,
    structured.contact?.phone,
    ...(structured.contact?.links ?? []),
  ].filter(Boolean);
  return parts.join("  |  ");
}

function sectionHeading(text: string) {
  return new Paragraph({
    spacing: { before: 240, after: 80 },
    border: {
      bottom: {
        color: "333333",
        space: 4,
        style: "single",
        size: 6,
      },
    },
    children: [
      new TextRun({
        text: text.toUpperCase(),
        bold: true,
        size: 22,
        font: "Calibri",
      }),
    ],
  });
}

function bodyParagraph(text: string) {
  return new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({
        text,
        size: 20,
        font: "Calibri",
      }),
    ],
  });
}

function bulletParagraph(text: string) {
  return new Paragraph({
    spacing: { after: 40 },
    indent: { left: 360 },
    children: [
      new TextRun({
        text: `• ${text}`,
        size: 20,
        font: "Calibri",
      }),
    ],
  });
}

export async function buildDocxBuffer(
  structured: StructuredResume
): Promise<Buffer> {
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: structured.contact?.name || "Resume",
          bold: true,
          size: 36,
          font: "Calibri",
        }),
      ],
    })
  );

  const line = contactLine(structured);
  if (line) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: line,
            size: 18,
            font: "Calibri",
            color: "444444",
          }),
        ],
      })
    );
  }

  if (structured.summary?.trim()) {
    children.push(sectionHeading("Summary"));
    children.push(bodyParagraph(structured.summary.trim()));
  }

  if (structured.skills?.length) {
    children.push(sectionHeading("Skills"));
    children.push(bodyParagraph(structured.skills.join(", ")));
  }

  if (structured.experience?.length) {
    children.push(sectionHeading("Experience"));
    for (const job of structured.experience) {
      const titleCompany = [job.title, job.company].filter(Boolean).join("  |  ");
      if (titleCompany) {
        children.push(
          new Paragraph({
            spacing: { before: 120, after: 20 },
            children: [
              new TextRun({
                text: titleCompany,
                bold: true,
                size: 20,
                font: "Calibri",
              }),
            ],
          })
        );
      }
      const meta = [job.location, job.dates].filter(Boolean).join("  |  ");
      if (meta) {
        children.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: meta,
                italics: true,
                size: 18,
                font: "Calibri",
                color: "555555",
              }),
            ],
          })
        );
      }
      for (const bullet of job.bullets ?? []) {
        if (bullet.trim()) children.push(bulletParagraph(bullet.trim()));
      }
    }
  }

  if (structured.education?.length) {
    children.push(sectionHeading("Education"));
    for (const edu of structured.education) {
      const heading = [edu.degree, edu.school].filter(Boolean).join("  |  ");
      if (heading) children.push(bodyParagraph(heading));
      const meta = [edu.year, edu.details].filter(Boolean).join("  |  ");
      if (meta) {
        children.push(
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({
                text: meta,
                size: 18,
                font: "Calibri",
                color: "555555",
              }),
            ],
          })
        );
      }
    }
  }

  for (const other of structured.otherSections ?? []) {
    if (!other.title?.trim() && !other.content?.trim()) continue;
    children.push(sectionHeading(other.title?.trim() || "Additional"));
    if (other.content?.trim()) children.push(bodyParagraph(other.content.trim()));
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              bottom: 720,
              left: 720,
              right: 720,
            },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
