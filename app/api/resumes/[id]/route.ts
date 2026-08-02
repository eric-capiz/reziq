import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { deleteResumeCascade } from "@/lib/delete-user-data";
import { normalizePostingUrl } from "@/lib/posting-url";
import { Resume } from "@/models/Resume";

const patchSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Title is required")
      .max(120, "Title must be 120 characters or fewer")
      .optional(),
    postingTitle: z.string().trim().max(200).optional(),
    postingCompany: z.string().trim().max(200).optional(),
    postingUrl: z.string().trim().max(2000).optional(),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.postingTitle !== undefined ||
      data.postingCompany !== undefined ||
      data.postingUrl !== undefined,
    { message: "No changes provided" }
  );

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid update" },
      { status: 400 }
    );
  }

  const { id } = await context.params;
  await connectDB();
  const resume = await Resume.findOne({ _id: id, userId: session.user.id });
  if (!resume) {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }

  if (parsed.data.title !== undefined) {
    resume.title = parsed.data.title;
    await resume.save();
  }

  const postingUpdate: {
    postingTitle?: string;
    postingCompany?: string;
    postingUrl?: string;
  } = {};

  if (parsed.data.postingTitle !== undefined) {
    postingUpdate.postingTitle = parsed.data.postingTitle;
  }
  if (parsed.data.postingCompany !== undefined) {
    postingUpdate.postingCompany = parsed.data.postingCompany;
  }
  if (parsed.data.postingUrl !== undefined) {
    const postingUrl = normalizePostingUrl(parsed.data.postingUrl);
    if (postingUrl === null) {
      return NextResponse.json(
        { error: "Posting link must be a valid http or https URL" },
        { status: 400 }
      );
    }
    postingUpdate.postingUrl = postingUrl;
  }

  if (Object.keys(postingUpdate).length) {
    await Resume.collection.updateOne(
      { _id: resume._id },
      { $set: postingUpdate }
    );
  }

  const fresh = await Resume.findById(resume._id).lean();

  return NextResponse.json({
    id: String(resume._id),
    title: fresh?.title ?? resume.title,
    postingTitle: fresh?.postingTitle ?? "",
    postingCompany: fresh?.postingCompany ?? "",
    postingUrl: fresh?.postingUrl ?? "",
  });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  await connectDB();
  const result = await deleteResumeCascade({
    resumeId: id,
    userId: session.user.id,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
