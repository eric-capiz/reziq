import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Analysis } from "@/models/Analysis";
import { ExportRecord } from "@/models/Export";
import { Resume } from "@/models/Resume";
import { AppShell } from "@/components/layout/app-shell";
import { ProfileClient } from "@/components/profile/profile-client";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/");
  }

  await connectDB();

  const resumes = await Resume.find({ userId: session.user.id })
    .sort({ updatedAt: -1 })
    .select(
      "title originalFilename status createdAt updatedAt structuredDraft postingTitle postingCompany postingUrl"
    )
    .lean();

  const resumeIds = resumes.map((resume) => resume._id);

  const [analyses, exports] = await Promise.all([
    Analysis.find({ userId: session.user.id, resumeId: { $in: resumeIds } })
      .sort({ createdAt: -1 })
      .select("resumeId verdict createdAt")
      .lean(),
    ExportRecord.find({
      userId: session.user.id,
      resumeId: { $in: resumeIds },
    })
      .sort({ createdAt: -1 })
      .select("resumeId format createdAt filename")
      .lean(),
  ]);

  const latestVerdictByResume = new Map<string, string>();
  for (const analysis of analyses) {
    const key = String(analysis.resumeId);
    if (!latestVerdictByResume.has(key)) {
      latestVerdictByResume.set(key, analysis.verdict);
    }
  }

  const exportFlagsByResume = new Map<
    string,
    { hasDocx: boolean; hasPdf: boolean }
  >();
  for (const item of exports) {
    const key = String(item.resumeId);
    const current = exportFlagsByResume.get(key) ?? {
      hasDocx: false,
      hasPdf: false,
    };
    if (item.format === "docx") current.hasDocx = true;
    if (item.format === "pdf") current.hasPdf = true;
    exportFlagsByResume.set(key, current);
  }

  const initialResumes = resumes.map((resume) => {
    const id = String(resume._id);
    const flags = exportFlagsByResume.get(id) ?? {
      hasDocx: false,
      hasPdf: false,
    };
    return {
      id,
      title: resume.title || resume.originalFilename,
      originalFilename: resume.originalFilename,
      status: resume.status,
      hasDraft: Boolean(resume.structuredDraft),
      latestVerdict: latestVerdictByResume.get(id) ?? null,
      hasDocxExport: flags.hasDocx,
      hasPdfExport: flags.hasPdf,
      postingTitle: resume.postingTitle ?? "",
      postingCompany: resume.postingCompany ?? "",
      postingUrl: resume.postingUrl ?? "",
      updatedAt:
        resume.updatedAt instanceof Date
          ? resume.updatedAt.toISOString()
          : String(resume.updatedAt ?? ""),
      createdAt:
        resume.createdAt instanceof Date
          ? resume.createdAt.toISOString()
          : String(resume.createdAt ?? ""),
    };
  });

  return (
    <AppShell brandHref="/dashboard">
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="animate-in fade-in slide-in-from-left-4 duration-700">
          <p className="mb-4 inline-flex rounded-full border border-[#00C2FF]/40 bg-[#00C2FF]/10 px-3 py-1 text-xs font-medium tracking-[0.2em] text-[#00C2FF] uppercase">
            Your profile
          </p>
          <h1 className="font-[family-name:var(--font-editorial)] text-5xl leading-[0.92] font-medium tracking-tight sm:text-6xl md:text-7xl">
            History for{" "}
            <span className="italic text-[#FF5C35]">{session.user.username}</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/70">
            Rename saved resumes, track posting details, redownload exports, or
            delete what you no longer need.
          </p>
        </div>

        <div className="mt-12">
          <ProfileClient
            username={session.user.username}
            email={session.user.email ?? ""}
            initialResumes={initialResumes}
          />
        </div>
      </main>
    </AppShell>
  );
}
