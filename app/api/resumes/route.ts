import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { uploadResumeObject, deleteResumeObject } from "@/lib/r2";
import { extractAndStructureResume } from "@/lib/resume-extract";
import { getUserUsageSummary } from "@/lib/usage";
import { Resume } from "@/models/Resume";

const MAX_BYTES = 5 * 1024 * 1024;
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function isDocx(file: File) {
  const name = file.name.toLowerCase();
  return name.endsWith(".docx") || file.type === DOCX_MIME;
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const resumes = await Resume.find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .limit(10)
    .select(
      "originalFilename sizeBytes status structured rawText createdAt extractionError"
    );

  return NextResponse.json({
    resumes: resumes.map((resume) => ({
      id: String(resume._id),
      originalFilename: resume.originalFilename,
      sizeBytes: resume.sizeBytes,
      status: resume.status,
      structured: resume.structured,
      extractionError: resume.extractionError,
      createdAt: resume.createdAt,
    })),
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const usage = await getUserUsageSummary(session.user.id);
  if (!usage || usage.remainingUses <= 0) {
    return NextResponse.json(
      {
        error:
          usage?.dailyAllowance === 0
            ? "No daily uses assigned yet. An admin will assign uses. Please check back later."
            : "Out of uses today. Try again tomorrow after the daily reset.",
        code: "OUT_OF_USES",
      },
      { status: 403 }
    );
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Resume file is required" }, { status: 400 });
  }
  if (!isDocx(file)) {
    return NextResponse.json(
      { error: "Only DOCX resumes are accepted" },
      { status: 400 }
    );
  }
  if (file.size <= 0 || file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File must be under 5 MB" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const storageKey = `resumes/${session.user.id}/${nanoid()}.docx`;

  try {
    await uploadResumeObject({
      key: storageKey,
      body: buffer,
      contentType: DOCX_MIME,
    });
  } catch (error) {
    console.error("R2 upload failed", error);
    return NextResponse.json(
      { error: "Could not store resume file" },
      { status: 500 }
    );
  }

  let rawText = "";
  let structured = undefined;
  let status: "extracted" | "error" = "extracted";
  let extractionError = "";

  try {
    const extracted = await extractAndStructureResume(buffer);
    rawText = extracted.rawText;
    structured = extracted.structured;
  } catch (error) {
    status = "error";
    extractionError =
      error instanceof Error ? error.message : "Extraction failed";
  }

  try {
    const resume = await Resume.create({
      userId: session.user.id,
      originalFilename: file.name,
      storageKey,
      mimeType: DOCX_MIME,
      sizeBytes: file.size,
      rawText,
      structured,
      status,
      extractionError,
    });

    return NextResponse.json({
      id: String(resume._id),
      originalFilename: resume.originalFilename,
      sizeBytes: resume.sizeBytes,
      status: resume.status,
      structured: resume.structured,
      extractionError: resume.extractionError,
      remainingUses: usage.remainingUses,
    });
  } catch (error) {
    console.error("Resume save failed", error);
    try {
      await deleteResumeObject(storageKey);
    } catch {
      // best effort cleanup
    }
    return NextResponse.json(
      { error: "Could not save resume record" },
      { status: 500 }
    );
  }
}
