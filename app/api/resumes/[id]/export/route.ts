import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { buildDocxBuffer } from "@/lib/export-docx";
import { buildPdfBuffer } from "@/lib/export-pdf";
import type { StructuredResume } from "@/lib/resume-extract";
import { getResumeObjectBuffer, uploadResumeObject } from "@/lib/r2";
import { Analysis } from "@/models/Analysis";
import { ExportRecord } from "@/models/Export";
import { Resume } from "@/models/Resume";

export const maxDuration = 60;

const querySchema = z.object({
  format: z.enum(["docx", "pdf"]),
  analysisId: z.string().optional(),
  reuse: z
    .enum(["0", "1", "true", "false"])
    .optional()
    .transform((value) => value === "1" || value === "true"),
});

function slugifyName(name: string) {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "resume";
}

function asStructured(value: unknown): StructuredResume {
  const raw = (value ?? {}) as Partial<StructuredResume>;
  return {
    contact: {
      name: raw.contact?.name ?? "",
      email: raw.contact?.email ?? "",
      phone: raw.contact?.phone ?? "",
      links: raw.contact?.links ?? [],
    },
    summary: raw.summary ?? "",
    experience: raw.experience ?? [],
    education: raw.education ?? [],
    skills: raw.skills ?? [],
    otherSections: raw.otherSections ?? [],
  };
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = querySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams)
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "format must be docx or pdf" },
      { status: 400 }
    );
  }

  const { id } = await context.params;
  await connectDB();

  const resume = await Resume.findOne({
    _id: id,
    userId: session.user.id,
  });
  if (!resume) {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }

  const contentType =
    parsed.data.format === "docx"
      ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      : "application/pdf";

  if (parsed.data.reuse) {
    const existing = await ExportRecord.findOne({
      resumeId: resume._id,
      userId: session.user.id,
      format: parsed.data.format,
    }).sort({ createdAt: -1 });

    if (existing) {
      try {
        const buffer = await getResumeObjectBuffer(existing.storageKey);
        return new NextResponse(new Uint8Array(buffer), {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "Content-Disposition": `attachment; filename="${existing.filename}"`,
            "Cache-Control": "no-store",
          },
        });
      } catch (error) {
        console.error("Stored export read failed, regenerating", error);
      }
    }
  }

  let analysisId: string | null = null;
  if (parsed.data.analysisId) {
    const analysis = await Analysis.findOne({
      _id: parsed.data.analysisId,
      userId: session.user.id,
      resumeId: resume._id,
    });
    if (!analysis) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
    }
    analysisId = String(analysis._id);
  }

  const hasDraft = Boolean(resume.structuredDraft);
  const source = hasDraft ? "structuredDraft" : "structured";
  const structured = asStructured(
    hasDraft ? resume.structuredDraft : resume.structured
  );

  try {
    const buffer =
      parsed.data.format === "docx"
        ? await buildDocxBuffer(structured)
        : await buildPdfBuffer(structured);

    const stamp = Date.now();
    const displayName =
      resume.title ||
      structured.contact.name ||
      resume.originalFilename ||
      "resume";
    const safeName = slugifyName(displayName);
    const filename = `${safeName}-reziq.${parsed.data.format}`;
    const storageKey = `exports/${session.user.id}/${id}/${stamp}.${parsed.data.format}`;

    await uploadResumeObject({
      key: storageKey,
      body: buffer,
      contentType,
    });

    await ExportRecord.create({
      userId: session.user.id,
      resumeId: resume._id,
      analysisId,
      format: parsed.data.format,
      source,
      storageKey,
      filename,
      sizeBytes: buffer.length,
    });

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Export failed", error);
    return NextResponse.json(
      { error: "Could not generate export. Please try again." },
      { status: 500 }
    );
  }
}
