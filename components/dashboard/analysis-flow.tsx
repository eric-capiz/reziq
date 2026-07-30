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

function StepMark({ n, active }: { n: string; active: boolean }) {
  return (
    <span
      className={`font-[family-name:var(--font-editorial)] text-5xl italic leading-none tracking-tight sm:text-6xl ${
        active ? "text-[#FF5C35]" : "text-white/15"
      }`}
    >
      {n}
    </span>
  );
}

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

  const step1Active = !resume;
  const step2Active = Boolean(resume) && !job;
  const step3Active = Boolean(resume && job);

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
    <div className="space-y-5">
      {!canUpload && (
        <div className="rounded-3xl border border-[#FF5C35]/40 bg-[#1A1010] px-5 py-5">
          <p className="font-[family-name:var(--font-editorial)] text-2xl italic text-[#FF5C35]">
            Upload locked
          </p>
          <p className="mt-2 text-sm leading-relaxed text-white/70 sm:text-base">
            {outOfUsesMessage}
          </p>
          <p className="mt-2 text-xs text-white/45">
            Uses left today: {remainingUses}
          </p>
        </div>
      )}

      <section className="rounded-3xl border border-white/10 bg-[#151B24]/90 p-5 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-[#00C2FF] uppercase">
              Upload
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-editorial)] text-3xl sm:text-5xl">
              Drop in your resume
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/60 sm:text-base">
              DOCX only. We store your file until you delete it. Export later will be
              a clean new document, not a visual clone of the original.
            </p>
          </div>
          <StepMark n="01" active={step1Active} />
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-2 block text-sm text-white/55" htmlFor="resume">
              Resume file
            </label>
            <Input
              id="resume"
              type="file"
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              disabled={!canUpload || pending}
              className="h-11 rounded-2xl border-white/15 bg-[#0B0F14] text-white file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-white"
              onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
            />
          </div>
          <Button
            type="button"
            className="rounded-full bg-[#FF5C35] px-5 text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#ff7a57] hover:shadow-[0_12px_30px_rgba(255,92,53,0.45)]"
            disabled={!canUpload || pending || !file}
            onClick={uploadResume}
          >
            Upload and extract
          </Button>
        </div>

        {file ? (
          <p className="mt-3 text-xs text-white/45">
            Selected: {file.name} ({Math.round(file.size / 1024)} KB)
          </p>
        ) : null}

        {resume ? (
          <div className="mt-7 rounded-3xl border border-[#7CFFB2]/30 bg-[#0F1A16] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs tracking-[0.16em] text-[#7CFFB2] uppercase">
                  Extracted
                </p>
                <p className="mt-1 font-medium text-white">
                  {resume.originalFilename}
                </p>
                <p className="text-xs text-white/45">Status: {resume.status}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-full text-white hover:bg-white/10 hover:text-white"
                disabled={pending}
                onClick={deleteResume}
              >
                Delete resume
              </Button>
            </div>

            {resume.extractionError ? (
              <p className="mt-3 text-sm text-[#FF5C35]">{resume.extractionError}</p>
            ) : (
              <div className="mt-4 grid gap-3 text-sm text-white/70 sm:grid-cols-2">
                <p>
                  <span className="text-white">Name:</span>{" "}
                  {resume.structured.contact.name || "Not detected"}
                </p>
                <p>
                  <span className="text-white">Email:</span>{" "}
                  {resume.structured.contact.email || "Not detected"}
                </p>
                <p className="sm:col-span-2">
                  <span className="text-white">Summary:</span>{" "}
                  {resume.structured.summary
                    ? `${resume.structured.summary.slice(0, 220)}${
                        resume.structured.summary.length > 220 ? "..." : ""
                      }`
                    : "Not detected"}
                </p>
                <p>
                  <span className="text-white">Experience roles:</span>{" "}
                  {resume.structured.experience.length}
                </p>
                <p>
                  <span className="text-white">Skills found:</span>{" "}
                  {resume.structured.skills.length
                    ? resume.structured.skills.slice(0, 8).join(", ")
                    : "Not detected"}
                </p>
              </div>
            )}
          </div>
        ) : null}
      </section>

      <section className="rounded-3xl border border-[#FF5C35]/35 bg-[#1A1010]/95 p-5 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-[#FF5C35] uppercase">
              Job
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-editorial)] text-3xl sm:text-5xl">
              Paste the posting
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/60 sm:text-base">
              No URL import in MVP. Paste the posting text so we can structure title,
              skills, and requirements.
            </p>
          </div>
          <StepMark n="02" active={step2Active} />
        </div>

        <textarea
          className="mt-7 min-h-44 w-full rounded-3xl border border-white/15 bg-[#0B0F14] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#00C2FF] focus:ring-2 focus:ring-[#00C2FF]/25"
          placeholder="Paste the full job description here"
          value={jobText}
          disabled={!canUpload || pending || !resume || resume.status !== "extracted"}
          onChange={(e) => {
            setJobText(e.target.value);
            setJob(null);
          }}
        />

        <div className="mt-4">
          <Button
            type="button"
            className="rounded-full bg-[#7CFFB2] px-5 text-[#0B0F14] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_12px_30px_rgba(124,255,178,0.35)]"
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
          <div className="mt-7 rounded-3xl border border-[#00C2FF]/30 bg-[#0D1820] p-5 text-sm text-white/70">
            <p className="text-xs font-semibold tracking-[0.16em] text-[#00C2FF] uppercase">
              Structured job
            </p>
            <p className="mt-3">
              <span className="text-white">Title:</span>{" "}
              {job.structured.title || "Not detected"}
            </p>
            <p className="mt-2">
              <span className="text-white">Company:</span>{" "}
              {job.structured.company || "Not detected"}
            </p>
            <p className="mt-2">
              <span className="text-white">Required skills:</span>{" "}
              {job.structured.requiredSkills.length
                ? job.structured.requiredSkills.slice(0, 10).join(", ")
                : "Not detected"}
            </p>
            <p className="mt-2">
              <span className="text-white">Keywords:</span>{" "}
              {job.structured.keywords.length
                ? job.structured.keywords.slice(0, 12).join(", ")
                : "Not detected"}
            </p>
            <p className="mt-2">
              <span className="text-white">Responsibilities:</span>{" "}
              {job.structured.responsibilities.length}
            </p>
          </div>
        ) : null}
      </section>

      <section className="rounded-3xl border border-[#7CFFB2]/30 bg-[#0F1A16]/95 p-5 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-[#7CFFB2] uppercase">
              Analyze
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-editorial)] text-3xl sm:text-5xl">
              Read the fit
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/60 sm:text-base">
              Analysis lands in the next batch. Your resume and job stay ready here.
              One use will be deducted only after a successful analysis.
            </p>
          </div>
          <StepMark n="03" active={step3Active} />
        </div>
        <Button
          type="button"
          className="mt-7 rounded-full bg-white/10 px-5 text-white"
          disabled
        >
          Analyze (coming next)
        </Button>
      </section>
    </div>
  );
}
