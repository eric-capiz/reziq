import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { StructuredResume } from "@/lib/resume-extract";

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
    lineHeight: 1.4,
  },
  name: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginBottom: 4,
  },
  contact: {
    fontSize: 9,
    color: "#444444",
    textAlign: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
    paddingBottom: 2,
    marginTop: 12,
    marginBottom: 6,
  },
  body: {
    marginBottom: 4,
  },
  jobTitle: {
    fontFamily: "Helvetica-Bold",
    marginTop: 6,
  },
  meta: {
    fontSize: 9,
    color: "#555555",
    fontFamily: "Helvetica-Oblique",
    marginBottom: 2,
  },
  bullet: {
    marginLeft: 10,
    marginBottom: 2,
  },
});

function contactLine(structured: StructuredResume) {
  return [
    structured.contact?.email,
    structured.contact?.phone,
    ...(structured.contact?.links ?? []),
  ]
    .filter(Boolean)
    .join("  |  ");
}

function ResumeDocument({ structured }: { structured: StructuredResume }) {
  const line = contactLine(structured);

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "LETTER", style: styles.page },
      React.createElement(
        Text,
        { style: styles.name },
        structured.contact?.name || "Resume"
      ),
      line
        ? React.createElement(Text, { style: styles.contact }, line)
        : null,
      structured.summary?.trim()
        ? React.createElement(
            View,
            null,
            React.createElement(Text, { style: styles.sectionTitle }, "Summary"),
            React.createElement(
              Text,
              { style: styles.body },
              structured.summary.trim()
            )
          )
        : null,
      structured.skills?.length
        ? React.createElement(
            View,
            null,
            React.createElement(Text, { style: styles.sectionTitle }, "Skills"),
            React.createElement(
              Text,
              { style: styles.body },
              structured.skills.join(", ")
            )
          )
        : null,
      structured.experience?.length
        ? React.createElement(
            View,
            null,
            React.createElement(
              Text,
              { style: styles.sectionTitle },
              "Experience"
            ),
            ...structured.experience.map((job, index) =>
              React.createElement(
                View,
                { key: `exp-${index}` },
                React.createElement(
                  Text,
                  { style: styles.jobTitle },
                  [job.title, job.company].filter(Boolean).join("  |  ")
                ),
                [job.location, job.dates].filter(Boolean).length
                  ? React.createElement(
                      Text,
                      { style: styles.meta },
                      [job.location, job.dates].filter(Boolean).join("  |  ")
                    )
                  : null,
                ...(job.bullets ?? [])
                  .filter((b) => b.trim())
                  .map((bullet, bIndex) =>
                    React.createElement(
                      Text,
                      { key: `b-${index}-${bIndex}`, style: styles.bullet },
                      `• ${bullet.trim()}`
                    )
                  )
              )
            )
          )
        : null,
      structured.education?.length
        ? React.createElement(
            View,
            null,
            React.createElement(
              Text,
              { style: styles.sectionTitle },
              "Education"
            ),
            ...structured.education.map((edu, index) =>
              React.createElement(
                View,
                { key: `edu-${index}`, style: { marginBottom: 4 } },
                React.createElement(
                  Text,
                  { style: styles.body },
                  [edu.degree, edu.school].filter(Boolean).join("  |  ")
                ),
                [edu.year, edu.details].filter(Boolean).length
                  ? React.createElement(
                      Text,
                      { style: styles.meta },
                      [edu.year, edu.details].filter(Boolean).join("  |  ")
                    )
                  : null
              )
            )
          )
        : null,
      ...(structured.otherSections ?? [])
        .filter((s) => s.title?.trim() || s.content?.trim())
        .map((other, index) =>
          React.createElement(
            View,
            { key: `other-${index}` },
            React.createElement(
              Text,
              { style: styles.sectionTitle },
              other.title?.trim() || "Additional"
            ),
            other.content?.trim()
              ? React.createElement(
                  Text,
                  { style: styles.body },
                  other.content.trim()
                )
              : null
          )
        )
    )
  );
}

export async function buildPdfBuffer(
  structured: StructuredResume
): Promise<Buffer> {
  const buffer = await renderToBuffer(
    React.createElement(ResumeDocument, { structured }) as never
  );
  return Buffer.from(buffer);
}
