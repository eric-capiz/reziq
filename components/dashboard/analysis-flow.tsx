"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

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

type EvidenceItem = {
  label: string;
  detail: string;
  resumeEvidence: string;
  jobEvidence: string;
};

type AnalysisState = {
  id: string;
  verdict: "strong" | "possible" | "poor";
  summary: string;
  matches: EvidenceItem[];
  partialMatches: EvidenceItem[];
  gaps: EvidenceItem[];
  guidance: string;
  cached: boolean;
};

type RecommendationItem = {
  itemId: string;
  section: string;
  targetPath: string;
  title: string;
  rationale: string;
  currentText: string;
  proposedText: string;
  resumeEvidence: string;
  decision: "pending" | "accepted" | "rejected";
};

type RecommendationSetState = {
  id: string;
  analysisId: string;
  alreadyStrong: boolean;
  statusNote: string;
  diyAdvice: string;
  items: RecommendationItem[];
  appliedAt: string | null;
};

const verdictStyles = {
  strong: {
    label: "Strong fit",
    className: "border-[#7CFFB2]/40 bg-[#0F1A16] text-[#7CFFB2]",
  },
  possible: {
    label: "Possible fit",
    className: "border-[#00C2FF]/40 bg-[#0D1820] text-[#00C2FF]",
  },
  poor: {
    label: "Poor fit",
    className: "border-[#FF5C35]/40 bg-[#1A1010] text-[#FF5C35]",
  },
} as const;

const STEP_META = [
  {
    n: "01",
    label: "Upload",
    accent: "text-[#00C2FF]",
    active:
      "border-[#00C2FF]/45 bg-[#00C2FF]/12 text-white shadow-[0_0_24px_rgba(0,194,255,0.22)]",
    hover:
      "hover:-translate-y-0.5 hover:border-[#00C2FF]/35 hover:bg-[#00C2FF]/10 hover:shadow-[0_0_18px_rgba(0,194,255,0.16)]",
    dot: "bg-[#00C2FF] shadow-[0_0_14px_rgba(0,194,255,0.45)]",
  },
  {
    n: "02",
    label: "Job",
    accent: "text-[#FF5C35]",
    active:
      "border-[#FF5C35]/45 bg-[#FF5C35]/12 text-white shadow-[0_0_24px_rgba(255,92,53,0.22)]",
    hover:
      "hover:-translate-y-0.5 hover:border-[#FF5C35]/35 hover:bg-[#FF5C35]/10 hover:shadow-[0_0_18px_rgba(255,92,53,0.16)]",
    dot: "bg-[#FF5C35] shadow-[0_0_14px_rgba(255,92,53,0.45)]",
  },
  {
    n: "03",
    label: "Analyze",
    accent: "text-[#7CFFB2]",
    active:
      "border-[#7CFFB2]/45 bg-[#7CFFB2]/12 text-white shadow-[0_0_24px_rgba(124,255,178,0.2)]",
    hover:
      "hover:-translate-y-0.5 hover:border-[#7CFFB2]/35 hover:bg-[#7CFFB2]/10 hover:shadow-[0_0_18px_rgba(124,255,178,0.16)]",
    dot: "bg-[#7CFFB2] shadow-[0_0_14px_rgba(124,255,178,0.4)]",
  },
  {
    n: "04",
    label: "Improve",
    accent: "text-[#FF5C35]",
    active:
      "border-[#FF5C35]/45 bg-[#FF5C35]/12 text-white shadow-[0_0_24px_rgba(255,92,53,0.22)]",
    hover:
      "hover:-translate-y-0.5 hover:border-[#FF5C35]/35 hover:bg-[#FF5C35]/10 hover:shadow-[0_0_18px_rgba(255,92,53,0.16)]",
    dot: "bg-[#FF5C35] shadow-[0_0_14px_rgba(255,92,53,0.45)]",
  },
] as const;

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
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [resume, setResume] = useState<ResumeState | null>(null);
  const [jobText, setJobText] = useState("");
  const [job, setJob] = useState<JobState | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisState | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [recommendationSet, setRecommendationSet] =
    useState<RecommendationSetState | null>(null);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [structuredDraft, setStructuredDraft] = useState<StructuredResume | null>(
    null
  );
  const [usesLeft, setUsesLeft] = useState(remainingUses);

  const outOfUsesMessage = useMemo(() => {
    if (canUpload) return null;
    if (dailyAllowance === 0) {
      return "No daily uses assigned yet. An admin will assign your daily uses. Please check back later.";
    }
    return "Out of uses today. Try again tomorrow after the daily reset.";
  }, [canUpload, dailyAllowance]);

  const maxStep = analysis ? 3 : job ? 2 : resume ? 1 : 0;

  useEffect(() => {
    if (step > maxStep) setStep(maxStep);
  }, [step, maxStep]);

  function goTo(next: number) {
    const clamped = Math.max(0, Math.min(3, next));
    if (clamped > maxStep) {
      toast.message(
        clamped === 1
          ? "Finish uploading your resume first"
          : clamped === 2
            ? "Save a job description first"
            : "Run a fit analysis first"
      );
      return;
    }
    setStep(clamped);
  }

  function onFileChange(next: File | null) {
    setFile(next);
    setResume(null);
    setJob(null);
    setJobText("");
    setAnalysis(null);
    setRecommendationSet(null);
    setStructuredDraft(null);
    setStep(0);
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
      setAnalysis(null);
      setRecommendationSet(null);
      setStructuredDraft(null);
      toast.success("Resume uploaded and structured");
      setStep(1);
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
      setAnalysis(null);
      setRecommendationSet(null);
      setStructuredDraft(null);
      toast.success("Job description saved and structured");
      setStep(2);
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
      setAnalysis(null);
      setRecommendationSet(null);
      setStructuredDraft(null);
      setStep(0);
      toast.success("Resume deleted");
    });
  }

  async function runAnalysis(force = false) {
    if (usesLeft <= 0) {
      toast.error(outOfUsesMessage ?? "Out of uses today");
      return;
    }
    if (!resume?.id || !job?.id) {
      toast.error("Resume and job are required");
      return;
    }

    setAnalyzing(true);
    startTransition(async () => {
      try {
        const res = await fetch("/api/analyses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resumeId: resume.id,
            jobId: job.id,
            force,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error ?? "Analysis failed");
          return;
        }
        setAnalysis({
          id: data.analysis.id,
          verdict: data.analysis.verdict,
          summary: data.analysis.summary,
          matches: data.analysis.matches ?? [],
          partialMatches: data.analysis.partialMatches ?? [],
          gaps: data.analysis.gaps ?? [],
          guidance: data.analysis.guidance ?? "",
          cached: Boolean(data.cached),
        });
        if (force) {
          setRecommendationSet(null);
          setStructuredDraft(null);
        }
        if (typeof data.remainingUses === "number") {
          setUsesLeft(data.remainingUses);
        }
        toast.success(
          data.cached ? "Loaded saved fit result" : "Fit analysis complete"
        );
      } finally {
        setAnalyzing(false);
      }
    });
  }

  async function loadRecommendations() {
    if (!analysis?.id) return;
    if (analysis.verdict === "poor") {
      toast.message("Poor fit results do not include rewrite recommendations");
      return;
    }

    setLoadingRecs(true);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/analyses/${analysis.id}/recommendations`, {
          method: "POST",
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error ?? "Could not get recommendations");
          return;
        }
        setRecommendationSet({
          id: data.set.id,
          analysisId: data.set.analysisId,
          alreadyStrong: data.set.alreadyStrong,
          statusNote: data.set.statusNote,
          diyAdvice: data.set.diyAdvice,
          items: data.set.items ?? [],
          appliedAt: data.set.appliedAt,
        });
        toast.success(
          data.cached ? "Loaded saved recommendations" : "Recommendations ready"
        );
      } finally {
        setLoadingRecs(false);
      }
    });
  }

  async function setDecision(
    itemId: string,
    decision: "pending" | "accepted" | "rejected"
  ) {
    if (!analysis?.id) return;
    startTransition(async () => {
      const res = await fetch(
        `/api/analyses/${analysis.id}/recommendations/decision`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId, decision }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not update decision");
        return;
      }
      setRecommendationSet((prev) =>
        prev
          ? {
              ...prev,
              items: (data.items as RecommendationItem[]) ?? prev.items,
            }
          : prev
      );
    });
  }

  async function applyAccepted() {
    if (!analysis?.id) return;
    startTransition(async () => {
      const res = await fetch(
        `/api/analyses/${analysis.id}/recommendations/apply`,
        { method: "POST" }
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not apply changes");
        return;
      }
      setStructuredDraft(data.structuredDraft);
      setRecommendationSet((prev) =>
        prev ? { ...prev, appliedAt: data.appliedAt } : prev
      );
      toast.success("Accepted changes applied to your resume draft");
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {STEP_META.map((meta, index) => {
            const unlocked = index <= maxStep;
            const active = step === index;
            return (
              <button
                key={meta.n}
                type="button"
                onClick={() => goTo(index)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium tracking-[0.14em] uppercase transition-all duration-200 ${
                  active
                    ? meta.active
                    : unlocked
                      ? `border-white/15 bg-white/5 text-white ${meta.hover}`
                      : "cursor-not-allowed border-white/5 bg-transparent text-white/25"
                }`}
              >
                <span className={meta.accent}>{meta.n}</span>
                {meta.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-full border border-white/15 text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/10 hover:text-white hover:shadow-[0_0_16px_rgba(255,255,255,0.12)]"
            disabled={step === 0 || pending}
            onClick={() => goTo(step - 1)}
          >
            Back
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-full border border-white/15 text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/10 hover:text-white hover:shadow-[0_0_16px_rgba(255,255,255,0.12)]"
            disabled={step >= maxStep || pending}
            onClick={() => goTo(step + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-white/10 shadow-2xl">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${step * 100}%)` }}
        >
          <section className="min-w-full bg-[#151B24] p-5 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.2em] text-[#00C2FF] uppercase">
                  Upload
                </p>
                <h2 className="mt-3 font-[family-name:var(--font-editorial)] text-3xl sm:text-5xl">
                  Drop in your resume
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/60 sm:text-base">
                  DOCX only. We store your file until you delete it. Export later will
                  be a clean new document, not a visual clone of the original.
                </p>
              </div>
              <span className="font-[family-name:var(--font-editorial)] text-5xl italic text-[#FF5C35] sm:text-6xl">
                01
              </span>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="mb-2 block text-sm text-white/55" htmlFor="resume">
                  Resume file
                </label>
                <label
                  htmlFor="resume"
                  className={`flex h-11 cursor-pointer items-center gap-3 rounded-2xl border border-white/15 bg-[#0B0F14] px-2 ${
                    !canUpload || pending ? "pointer-events-none opacity-50" : ""
                  }`}
                >
                  <span className="inline-flex h-8 items-center rounded-full bg-white/10 px-3 text-sm leading-none text-white">
                    Choose File
                  </span>
                  <span className="truncate text-sm text-white/55">
                    {file ? file.name : "No file chosen"}
                  </span>
                  <input
                    id="resume"
                    type="file"
                    accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    disabled={!canUpload || pending}
                    className="sr-only"
                    onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
                  />
                </label>
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
                    className="rounded-full border border-[#FF5C35]/70 bg-[#FF5C35]/15 px-3 text-[#FF5C35] hover:bg-[#FF5C35] hover:text-white"
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

                <Button
                  type="button"
                  className="mt-5 rounded-full bg-[#7CFFB2] px-5 text-[#0B0F14] hover:bg-white"
                  onClick={() => goTo(1)}
                >
                  Continue to job
                </Button>
              </div>
            ) : null}
          </section>

          <section className="min-w-full bg-[#1A1010] p-5 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.2em] text-[#FF5C35] uppercase">
                  Job
                </p>
                <h2 className="mt-3 font-[family-name:var(--font-editorial)] text-3xl sm:text-5xl">
                  Paste the posting
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/60 sm:text-base">
                  No URL import in MVP. Paste the posting text so we can structure
                  title, skills, and requirements.
                </p>
              </div>
              <span className="font-[family-name:var(--font-editorial)] text-5xl italic text-[#FF5C35] sm:text-6xl">
                02
              </span>
            </div>

            {!resume ? (
              <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/60">
                Upload and extract a resume first, then this step unlocks.
              </div>
            ) : (
              <>
                <textarea
                  className="mt-7 min-h-44 w-full rounded-3xl border border-white/15 bg-[#0B0F14] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#00C2FF] focus:ring-2 focus:ring-[#00C2FF]/25"
                  placeholder="Paste the full job description here"
                  value={jobText}
                  disabled={!canUpload || pending}
                  onChange={(e) => {
                    setJobText(e.target.value);
                    setJob(null);
                    setAnalysis(null);
                    setRecommendationSet(null);
                    setStructuredDraft(null);
                  }}
                />

                <div className="mt-4">
                  <Button
                    type="button"
                    className="rounded-full bg-[#7CFFB2] px-5 text-[#0B0F14] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_12px_30px_rgba(124,255,178,0.35)]"
                    disabled={!canUpload || pending || jobText.trim().length < 40}
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
                    <Button
                      type="button"
                      className="mt-5 rounded-full bg-white px-5 text-[#0B0F14] hover:bg-[#7CFFB2]"
                      onClick={() => goTo(2)}
                    >
                      Continue to analyze
                    </Button>
                  </div>
                ) : null}
              </>
            )}
          </section>

          <section className="min-w-full bg-[#0F1A16] p-5 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.2em] text-[#7CFFB2] uppercase">
                  Analyze
                </p>
                <h2 className="mt-3 font-[family-name:var(--font-editorial)] text-3xl sm:text-5xl">
                  Read the fit
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/60 sm:text-base">
                  Compare your resume to the job with evidence. One use is deducted
                  only after a successful analysis. Uses left: {usesLeft}.
                </p>
              </div>
              <span className="font-[family-name:var(--font-editorial)] text-5xl italic text-[#7CFFB2] sm:text-6xl">
                03
              </span>
            </div>

            {!job ? (
              <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/60">
                Save a structured job first, then this step unlocks.
              </div>
            ) : analyzing ? (
              <div className="mt-8 rounded-3xl border border-[#7CFFB2]/25 bg-[#0B0F14]/50 p-6">
                <div className="flex items-center gap-3">
                  <span className="size-3 animate-pulse rounded-full bg-[#7CFFB2]" />
                  <p className="font-[family-name:var(--font-editorial)] text-xl italic text-white">
                    Reading your fit...
                  </p>
                </div>
                <p className="mt-3 text-sm text-white/60">
                  Comparing your experience to the posting and gathering evidence.
                  This can take a moment.
                </p>
              </div>
            ) : analysis ? (
              <div className="mt-8 space-y-4">
                <div
                  className={`rounded-3xl border p-5 ${verdictStyles[analysis.verdict].className}`}
                >
                  <p className="text-xs font-semibold tracking-[0.16em] uppercase">
                    {verdictStyles[analysis.verdict].label}
                    {analysis.cached ? " · Saved result" : ""}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-white/85 sm:text-base">
                    {analysis.summary}
                  </p>
                </div>

                {[
                  { title: "Matches", items: analysis.matches, tone: "text-[#7CFFB2]" },
                  {
                    title: "Partial matches",
                    items: analysis.partialMatches,
                    tone: "text-[#00C2FF]",
                  },
                  { title: "Gaps", items: analysis.gaps, tone: "text-[#FF5C35]" },
                ].map((group) =>
                  group.items.length ? (
                    <div
                      key={group.title}
                      className="rounded-3xl border border-white/10 bg-[#0B0F14]/50 p-5"
                    >
                      <p className={`text-xs font-semibold tracking-[0.16em] uppercase ${group.tone}`}>
                        {group.title}
                      </p>
                      <ul className="mt-3 space-y-3">
                        {group.items.map((item, index) => (
                          <li key={`${group.title}-${index}`} className="text-sm text-white/70">
                            <p className="font-medium text-white">{item.label}</p>
                            <p className="mt-1">{item.detail}</p>
                            {item.resumeEvidence ? (
                              <p className="mt-1 text-xs text-white/45">
                                Resume: {item.resumeEvidence}
                              </p>
                            ) : null}
                            {item.jobEvidence ? (
                              <p className="mt-1 text-xs text-white/45">
                                Job: {item.jobEvidence}
                              </p>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null
                )}

                {analysis.guidance ? (
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/70">
                    <p className="text-xs font-semibold tracking-[0.16em] text-white/50 uppercase">
                      Guidance
                    </p>
                    <p className="mt-2">{analysis.guidance}</p>
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    className="rounded-full bg-[#7CFFB2] px-5 text-[#0B0F14] hover:bg-white"
                    disabled={pending || analyzing || usesLeft <= 0}
                    onClick={() => runAnalysis(true)}
                  >
                    Run analysis again
                  </Button>
                  <Button
                    type="button"
                    className="rounded-full border border-white/20 bg-white/5 px-5 text-white hover:bg-white hover:text-[#0B0F14]"
                    onClick={() => goTo(3)}
                  >
                    Continue to improve
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-8 rounded-3xl border border-[#7CFFB2]/25 bg-[#0B0F14]/50 p-5">
                <p className="text-sm text-white/70">
                  Resume and job are ready. Run the fit read when you are.
                </p>
                <Button
                  type="button"
                  className="mt-5 rounded-full bg-[#7CFFB2] px-5 text-[#0B0F14] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_12px_30px_rgba(124,255,178,0.35)]"
                  disabled={pending || analyzing || usesLeft <= 0}
                  onClick={() => runAnalysis(false)}
                >
                  Analyze fit
                </Button>
              </div>
            )}
          </section>

          <section className="min-w-full bg-[#1A1010] p-5 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.2em] text-[#FF5C35] uppercase">
                  Improve
                </p>
                <h2 className="mt-3 font-[family-name:var(--font-editorial)] text-3xl sm:text-5xl">
                  Recommend changes
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/60 sm:text-base">
                  For Strong or Possible fits only. Suggestions never invent
                  experience. Accept or reject each one, then apply.
                </p>
              </div>
              <span className="font-[family-name:var(--font-editorial)] text-5xl italic text-[#FF5C35] sm:text-6xl">
                04
              </span>
            </div>

            {!analysis ? (
              <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/60">
                Run a fit analysis first, then this step unlocks.
              </div>
            ) : analysis.verdict === "poor" ? (
              <div className="mt-8 rounded-3xl border border-[#FF5C35]/30 bg-[#0B0F14]/50 p-5 text-sm text-white/70">
                <p className="font-[family-name:var(--font-editorial)] text-xl italic text-[#FF5C35]">
                  No rewrite suggestions for Poor fit
                </p>
                <p className="mt-2">
                  Review the gaps and guidance from the Analyze step. RezIQ will not
                  invent experience to force a closer match.
                </p>
              </div>
            ) : loadingRecs ? (
              <div className="mt-8 rounded-3xl border border-[#FF5C35]/25 bg-[#0B0F14]/50 p-6">
                <div className="flex items-center gap-3">
                  <span className="size-3 animate-pulse rounded-full bg-[#FF5C35]" />
                  <p className="font-[family-name:var(--font-editorial)] text-xl italic text-white">
                    Finding honest improvements...
                  </p>
                </div>
                <p className="mt-3 text-sm text-white/60">
                  Looking for wording changes supported by your existing experience.
                </p>
              </div>
            ) : !recommendationSet ? (
              <div className="mt-8 rounded-3xl border border-[#FF5C35]/25 bg-[#0B0F14]/50 p-5">
                <p className="text-sm text-white/70">
                  Ready when you are. This does not use another daily credit.
                </p>
                <Button
                  type="button"
                  className="mt-5 rounded-full bg-[#FF5C35] px-5 text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#ff7a57] hover:shadow-[0_12px_30px_rgba(255,92,53,0.35)]"
                  disabled={pending || loadingRecs}
                  onClick={loadRecommendations}
                >
                  Get recommendations
                </Button>
              </div>
            ) : (
              <div className="mt-8 space-y-4">
                {(recommendationSet.statusNote ||
                  recommendationSet.alreadyStrong ||
                  recommendationSet.items.length === 0) && (
                  <div className="rounded-3xl border border-[#7CFFB2]/25 bg-[#0F1A16] p-5">
                    <p className="text-xs font-semibold tracking-[0.16em] text-[#7CFFB2] uppercase">
                      {recommendationSet.alreadyStrong ||
                      recommendationSet.items.length === 0
                        ? "Looking solid"
                        : "Notes"}
                    </p>
                    <p className="mt-2 text-sm text-white/75">
                      {recommendationSet.statusNote ||
                        "Your resume already looks strong for this role. No forced rewrites."}
                    </p>
                    {recommendationSet.diyAdvice ? (
                      <p className="mt-3 text-sm text-white/60">
                        Optional DIY: {recommendationSet.diyAdvice}
                      </p>
                    ) : null}
                  </div>
                )}

                {recommendationSet.items.map((item) => (
                  <article
                    key={item.itemId}
                    className="rounded-3xl border border-white/10 bg-[#0B0F14]/60 p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs tracking-[0.14em] text-white/40 uppercase">
                          {item.section}
                        </p>
                        <h3 className="mt-1 text-lg font-medium text-white">
                          {item.title}
                        </h3>
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[0.7rem] text-white/60 uppercase">
                        {item.decision}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-white/65">{item.rationale}</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <p className="text-[0.65rem] tracking-[0.14em] text-white/40 uppercase">
                          Current
                        </p>
                        <p className="mt-2 text-sm text-white/70">
                          {item.currentText || "Empty"}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-[#FF5C35]/25 bg-[#FF5C35]/10 p-3">
                        <p className="text-[0.65rem] tracking-[0.14em] text-[#FF5C35] uppercase">
                          Proposed
                        </p>
                        <p className="mt-2 text-sm text-white/85">{item.proposedText}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-white/45">
                      Evidence: {item.resumeEvidence}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        className="rounded-full bg-[#7CFFB2] text-[#0B0F14] hover:bg-white"
                        disabled={pending}
                        onClick={() => setDecision(item.itemId, "accepted")}
                      >
                        Accept
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="rounded-full border border-white/20 bg-white/5 text-white hover:bg-white/10"
                        disabled={pending}
                        onClick={() => setDecision(item.itemId, "rejected")}
                      >
                        Reject
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="rounded-full text-white/60 hover:bg-white/10 hover:text-white"
                        disabled={pending}
                        onClick={() => setDecision(item.itemId, "pending")}
                      >
                        Clear
                      </Button>
                    </div>
                  </article>
                ))}

                {recommendationSet.items.some((item) => item.decision === "accepted") ? (
                  <Button
                    type="button"
                    className="rounded-full bg-white px-5 text-[#0B0F14] hover:bg-[#7CFFB2]"
                    disabled={pending}
                    onClick={applyAccepted}
                  >
                    Apply accepted changes
                  </Button>
                ) : null}

                {structuredDraft ? (
                  <div className="rounded-3xl border border-[#00C2FF]/25 bg-[#0D1820] p-5 text-sm text-white/75">
                    <p className="text-xs font-semibold tracking-[0.16em] text-[#00C2FF] uppercase">
                      Updated draft preview
                    </p>
                    <p className="mt-3">
                      <span className="text-white">Summary:</span>{" "}
                      {structuredDraft.summary || "Not set"}
                    </p>
                    <p className="mt-2">
                      <span className="text-white">Skills:</span>{" "}
                      {structuredDraft.skills?.length
                        ? structuredDraft.skills.slice(0, 12).join(", ")
                        : "Not set"}
                    </p>
                    <p className="mt-2">
                      <span className="text-white">Experience roles:</span>{" "}
                      {structuredDraft.experience?.length ?? 0}
                    </p>
                    <p className="mt-3 text-xs text-white/45">
                      Export of this draft comes in the next batch.
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </section>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2">
        {STEP_META.map((meta, index) => (
          <button
            key={meta.n}
            type="button"
            aria-label={`Go to step ${meta.n}`}
            onClick={() => goTo(index)}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              step === index
                ? `w-8 ${meta.dot}`
                : index <= maxStep
                  ? "w-2.5 bg-white/35 hover:w-4 hover:bg-white/60"
                  : "w-2.5 bg-white/10"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
