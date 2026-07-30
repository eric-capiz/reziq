"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type StructuredResume = {
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

type StructuredJob = {
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

type ResumeState = {
  id: string;
  originalFilename: string;
  sizeBytes: number;
  status: string;
  structured: StructuredResume;
  extractionError?: string;
};

type JobState = {
  id: string;
  structured: StructuredJob;
};

export function AnalysisFlow({
  canUpload,
  dailyAllowance,
  remainingUses,
}: {
  canUpload: boolean;
  dailyAllowance: number;
  remainingUses: number;
}) {
  const [pending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const [resume, setResume] = useState<ResumeState | null>(null);
  const [jobText, setJobText] = useState("");
  const [job, setJob] = useState<JobState | null>(null);

  const outOfUsesMessage = useMemo(() => {
    if (canUpload) return null;
    if (dailyAllowance === 0) {
      return "No daily uses assigned yet. An admin will assign your daily uses. Please check back later.";
    }
    return "Out of uses today. Try again tomorrow after the daily reset.";
  }, [canUpload, dailyAllowance]);

  function onFileChange(next: File | null) {
    setFile(next);
    setResume(null);
    setJob(null);
    setJobText("");
  }

  async function uploadResume() {
    if (!canUpload) {
      toast.error(outOfUsesMessage ?? "Out of uses today");
      return;
    }
    if (!file) {
      toast.error("Choose a DOCX resume first");
      return;
    }

    startTransition(async () => {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/resumes", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Upload failed");
        return;
      }
      setResume({
        id: data.id,
        originalFilename: data.originalFilename,
        sizeBytes: data.sizeBytes,
        status: data.status,
        structured: data.structured,
        extractionError: data.extractionError,
      });
      setJob(null);
      toast.success("Resume uploaded and structured");
    });
  }

  async function saveJob() {
    if (!canUpload) {
      toast.error(outOfUsesMessage ?? "Out of uses today");
      return;
    }
    if (!resume?.id) {
      toast.error("Upload a resume first");
      return;
    }
    if (jobText.trim().length < 40) {
      toast.error("Paste a fuller job description");
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId: resume.id, rawText: jobText }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not save job description");
        return;
      }
      setJob({ id: data.id, structured: data.structured });
      toast.success("Job description saved and structured");
    });
  }

  async function deleteResume() {
    if (!resume?.id) return;
    startTransition(async () => {
      const res = await fetch(`/api/resumes/${resume.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not delete resume");
        return;
      }
      setResume(null);
      setJob(null);
      setJobText("");
      setFile(null);
      toast.success("Resume deleted");
    });
  }

  return (
    <div className="space-y-6">
      {!canUpload && (
        <div className="rounded-3xl border border-[#FF5C35]/30 bg-[#FF5C35]/10 px-4 py-4 text-[#0B0F14]">
          <p className="font-semibold">Upload locked</p>
          <p className="mt-1 text-sm leading-relaxed sm:text-base">
            {outOfUsesMessage}
          </p>
          <p className="mt-2 text-xs text-slate-600">
            Uses left today: {remainingUses}
          </p>
        </div>
      )}

      <section className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Step 1
        </p>
        <h2 className="mt-1 font-[family-name:var(--font-editorial)] text-2xl text-[#0B0F14]">
          Upload your resume
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          DOCX only. We store your file until you delete it. Export later will be a
          clean new document, not a visual clone of the original.
        </p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-2 block text-sm text-slate-600" htmlFor="resume">
              Resume file
            </label>
            <Input
              id="resume"
              type="file"
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              disabled={!canUpload || pending}
              onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
            />
          </div>
          <Button
            type="button"
            className="rounded-full"
            disabled={!canUpload || pending || !file}
            onClick={uploadResume}
          >
            Upload and extract
          </Button>
        </div>

        {file ? (
          <p className="mt-3 text-xs text-slate-500">
            Selected: {file.name} ({Math.round(file.size / 1024)} KB)
          </p>
        ) : null}

        {resume ? (
          <div className="mt-6 rounded-2xl border border-black/5 bg-[#F3F6FA] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-[#0B0F14]">
                  {resume.originalFilename}
                </p>
                <p className="text-xs text-slate-500">
                  Status: {resume.status}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-full"
                disabled={pending}
                onClick={deleteResume}
              >
                Delete resume
              </Button>
            </div>

            {resume.extractionError ? (
              <p className="mt-3 text-sm text-[#FF5C35]">
                {resume.extractionError}
              </p>
            ) : (
              <div className="mt-4 space-y-3 text-sm text-slate-700">
                <p>
                  <span className="font-medium text-[#0B0F14]">Name:</span>{" "}
                  {resume.structured.contact.name || "Not detected"}
                </p>
                <p>
                  <span className="font-medium text-[#0B0F14]">Email:</span>{" "}
                  {resume.structured.contact.email || "Not detected"}
                </p>
                <p>
                  <span className="font-medium text-[#0B0F14]">Summary:</span>{" "}
                  {resume.structured.summary
                    ? `${resume.structured.summary.slice(0, 220)}${
                        resume.structured.summary.length > 220 ? "..." : ""
                      }`
                    : "Not detected"}
                </p>
                <p>
                  <span className="font-medium text-[#0B0F14]">Experience roles:</span>{" "}
                  {resume.structured.experience.length}
                </p>
                <p>
                  <span className="font-medium text-[#0B0F14]">Skills found:</span>{" "}
                  {resume.structured.skills.length
                    ? resume.structured.skills.slice(0, 12).join(", ")
                    : "Not detected"}
                </p>
              </div>
            )}
          </div>
        ) : null}
      </section>

      <section className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Step 2
        </p>
        <h2 className="mt-1 font-[family-name:var(--font-editorial)] text-2xl text-[#0B0F14]">
          Paste the job description
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          No URL import in MVP. Paste the posting text so we can structure title,
          skills, and requirements.
        </p>

        <textarea
          className="mt-5 min-h-40 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-[#0B0F14] outline-none ring-[#00C2FF] placeholder:text-slate-400 focus:ring-2"
          placeholder="Paste the full job description here"
          value={jobText}
          disabled={!canUpload || pending || !resume || resume.status !== "extracted"}
          onChange={(e) => {
            setJobText(e.target.value);
            setJob(null);
          }}
        />

        <div className="mt-3 flex flex-wrap gap-3">
          <Button
            type="button"
            className="rounded-full"
            disabled={
              !canUpload ||
              pending ||
              !resume ||
              resume.status !== "extracted" ||
              jobText.trim().length < 40
            }
            onClick={saveJob}
          >
            Save and structure job
          </Button>
        </div>

        {job ? (
          <div className="mt-6 rounded-2xl border border-black/5 bg-[#F3F6FA] p-4 text-sm text-slate-700">
            <p>
              <span className="font-medium text-[#0B0F14]">Title:</span>{" "}
              {job.structured.title || "Not detected"}
            </p>
            <p className="mt-2">
              <span className="font-medium text-[#0B0F14]">Company:</span>{" "}
              {job.structured.company || "Not detected"}
            </p>
            <p className="mt-2">
              <span className="font-medium text-[#0B0F14]">Required skills:</span>{" "}
              {job.structured.requiredSkills.length
                ? job.structured.requiredSkills.slice(0, 10).join(", ")
                : "Not detected"}
            </p>
            <p className="mt-2">
              <span className="font-medium text-[#0B0F14]">Keywords:</span>{" "}
              {job.structured.keywords.length
                ? job.structured.keywords.slice(0, 12).join(", ")
                : "Not detected"}
            </p>
            <p className="mt-2">
              <span className="font-medium text-[#0B0F14]">Responsibilities:</span>{" "}
              {job.structured.responsibilities.length}
            </p>
          </div>
        ) : null}
      </section>

      <section className="rounded-3xl border border-dashed border-black/10 bg-white/70 p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Step 3
        </p>
        <h2 className="mt-1 font-[family-name:var(--font-editorial)] text-2xl text-[#0B0F14]">
          Analyze fit
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Analysis lands in the next batch. Your resume and job stay ready here.
          One use will be deducted only after a successful analysis.
        </p>
        <Button type="button" className="mt-4 rounded-full" disabled>
          Analyze (coming next)
        </Button>
      </section>
    </div>
  );
}
