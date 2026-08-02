"use client";

import { useState, useTransition } from "react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ProfileResume = {
  id: string;
  title: string;
  originalFilename: string;
  status: string;
  hasDraft: boolean;
  latestVerdict: string | null;
  hasDocxExport: boolean;
  hasPdfExport: boolean;
  postingTitle: string;
  postingCompany: string;
  postingUrl: string;
  updatedAt: string;
  createdAt: string;
};

const verdictLabel: Record<string, string> = {
  strong: "Strong fit",
  possible: "Possible fit",
  poor: "Poor fit",
};

function csvCell(value: string) {
  const text = value ?? "";
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function buildJobPostingsCsv(
  rows: Array<{ postingTitle: string; postingCompany: string; postingUrl: string }>
) {
  const lines = ["Job title,Company,Posting link"];
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.postingTitle),
        csvCell(row.postingCompany),
        csvCell(row.postingUrl),
      ].join(",")
    );
  }
  return `${lines.join("\n")}\n`;
}

export function ProfileClient({
  username,
  email,
  initialResumes,
}: {
  username: string;
  email: string;
  initialResumes: ProfileResume[];
}) {
  const [resumes, setResumes] = useState(initialResumes);
  const [draftTitles, setDraftTitles] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialResumes.map((r) => [r.id, r.title]))
  );
  const [postingDrafts, setPostingDrafts] = useState<
    Record<
      string,
      { postingTitle: string; postingCompany: string; postingUrl: string }
    >
  >(() =>
    Object.fromEntries(
      initialResumes.map((resume) => [
        resume.id,
        {
          postingTitle: resume.postingTitle,
          postingCompany: resume.postingCompany,
          postingUrl: resume.postingUrl,
        },
      ])
    )
  );
  const [pending, startTransition] = useTransition();
  const [confirmResumeId, setConfirmResumeId] = useState<string | null>(null);
  const [confirmAccount, setConfirmAccount] = useState(false);
  const [accountPhrase, setAccountPhrase] = useState("");

  async function download(resumeId: string, format: "docx" | "pdf") {
    startTransition(async () => {
      const params = new URLSearchParams({ format, reuse: "1" });
      const res = await fetch(`/api/resumes/${resumeId}/export?${params}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(
          (data as { error?: string }).error ?? "Could not download export"
        );
        return;
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? `resume-reziq.${format}`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast.success(`${format.toUpperCase()} downloaded`);
      setResumes((prev) =>
        prev.map((item) =>
          item.id === resumeId
            ? {
                ...item,
                hasDocxExport: format === "docx" ? true : item.hasDocxExport,
                hasPdfExport: format === "pdf" ? true : item.hasPdfExport,
              }
            : item
        )
      );
    });
  }

  function saveTitle(resumeId: string) {
    const title = (draftTitles[resumeId] ?? "").trim();
    if (!title) {
      toast.error("Title cannot be empty");
      return;
    }
    startTransition(async () => {
      const res = await fetch(`/api/resumes/${resumeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not save title");
        return;
      }
      setResumes((prev) =>
        prev.map((item) =>
          item.id === resumeId ? { ...item, title: data.title } : item
        )
      );
      toast.success("Title saved");
    });
  }

  function savePostingDetails(resumeId: string) {
    const draft = postingDrafts[resumeId] ?? {
      postingTitle: "",
      postingCompany: "",
      postingUrl: "",
    };
    startTransition(async () => {
      const res = await fetch(`/api/resumes/${resumeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postingTitle: draft.postingTitle.trim(),
          postingCompany: draft.postingCompany.trim(),
          postingUrl: draft.postingUrl.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not save job details");
        return;
      }
      setResumes((prev) =>
        prev.map((item) =>
          item.id === resumeId
            ? {
                ...item,
                postingTitle: data.postingTitle,
                postingCompany: data.postingCompany,
                postingUrl: data.postingUrl,
              }
            : item
        )
      );
      setPostingDrafts((prev) => ({
        ...prev,
        [resumeId]: {
          postingTitle: data.postingTitle,
          postingCompany: data.postingCompany,
          postingUrl: data.postingUrl,
        },
      }));
      toast.success("Job details saved");
    });
  }

  function exportJobPostings() {
    const rows = resumes
      .map((resume) => {
        const draft = postingDrafts[resume.id];
        return {
          postingTitle: (draft?.postingTitle ?? resume.postingTitle).trim(),
          postingCompany: (draft?.postingCompany ?? resume.postingCompany).trim(),
          postingUrl: (draft?.postingUrl ?? resume.postingUrl).trim(),
        };
      })
      .filter(
        (row) => row.postingTitle || row.postingCompany || row.postingUrl
      );

    if (rows.length === 0) {
      toast.error("No job posting details to export yet");
      return;
    }

    const csv = buildJobPostingsCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    anchor.href = url;
    anchor.download = `reziq-job-postings-${stamp}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} job posting${rows.length === 1 ? "" : "s"}`);
  }

  function deleteResume(resumeId: string) {
    startTransition(async () => {
      const res = await fetch(`/api/resumes/${resumeId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(
          (data as { error?: string }).error ?? "Could not delete resume"
        );
        return;
      }
      setResumes((prev) => prev.filter((item) => item.id !== resumeId));
      setConfirmResumeId(null);
      toast.success("Resume deleted");
    });
  }

  function deleteAccount() {
    if (accountPhrase.trim().toLowerCase() !== "delete") {
      toast.error('Type "delete" to confirm');
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/account", { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(
          (data as { error?: string }).error ?? "Could not delete account"
        );
        return;
      }
      toast.success("Account deleted");
      await signOut({ callbackUrl: `${window.location.origin}/` });
    });
  }

  function updatePostingDraft(
    resumeId: string,
    field: "postingTitle" | "postingCompany" | "postingUrl",
    value: string
  ) {
    setPostingDrafts((prev) => ({
      ...prev,
      [resumeId]: {
        postingTitle: prev[resumeId]?.postingTitle ?? "",
        postingCompany: prev[resumeId]?.postingCompany ?? "",
        postingUrl: prev[resumeId]?.postingUrl ?? "",
        [field]: value,
      },
    }));
  }

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6">
        <p className="text-xs font-semibold tracking-[0.16em] text-white/45 uppercase">
          Account
        </p>
        <p className="mt-3 text-lg text-white">{username}</p>
        {email ? <p className="mt-1 text-sm text-white/55">{email}</p> : null}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-[family-name:var(--font-editorial)] text-3xl italic">
              Saved resumes
            </h2>
            <p className="mt-2 text-sm text-white/55">
              Each saved resume keeps one job title, company, and posting link.
              Edit them anytime.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            className="rounded-full bg-white/10 text-white hover:bg-[#7CFFB2] hover:text-[#0B0F14]"
            disabled={pending || resumes.length === 0}
            onClick={exportJobPostings}
          >
            Export job postings CSV
          </Button>
        </div>

        {resumes.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-[#0B0F14]/50 p-6 text-sm text-white/60">
            No resumes yet. Upload one from Rez Desk to see it here.
          </div>
        ) : (
          resumes.map((resume) => {
            const posting = postingDrafts[resume.id] ?? {
              postingTitle: resume.postingTitle,
              postingCompany: resume.postingCompany,
              postingUrl: resume.postingUrl,
            };
            return (
              <article
                key={resume.id}
                className="rounded-3xl border border-white/10 bg-[#0B0F14]/55 p-5 sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <label className="text-[0.65rem] tracking-[0.14em] text-white/40 uppercase">
                      Title
                    </label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Input
                        value={draftTitles[resume.id] ?? resume.title}
                        onChange={(e) =>
                          setDraftTitles((prev) => ({
                            ...prev,
                            [resume.id]: e.target.value,
                          }))
                        }
                        className="max-w-md border-white/15 bg-white/5 text-white"
                      />
                      <Button
                        type="button"
                        size="sm"
                        className="rounded-full bg-white/10 text-white hover:bg-[#7CFFB2] hover:text-[#0B0F14]"
                        disabled={pending}
                        onClick={() => saveTitle(resume.id)}
                      >
                        Save title
                      </Button>
                    </div>
                    <p className="mt-2 text-xs text-white/40">
                      Original file: {resume.originalFilename}
                    </p>
                  </div>
                  <div className="text-right text-xs text-white/45">
                    <p>
                      {resume.latestVerdict
                        ? verdictLabel[resume.latestVerdict] ??
                          resume.latestVerdict
                        : "No analysis yet"}
                    </p>
                    <p className="mt-1">
                      Updated {new Date(resume.updatedAt).toLocaleDateString()}
                    </p>
                    {resume.hasDraft ? (
                      <p className="mt-1 text-[#7CFFB2]">Has applied draft</p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[0.65rem] tracking-[0.14em] text-white/40 uppercase">
                    Job posting
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-[0.65rem] tracking-[0.14em] text-white/40 uppercase">
                        Job title
                      </span>
                      <Input
                        value={posting.postingTitle}
                        onChange={(e) =>
                          updatePostingDraft(
                            resume.id,
                            "postingTitle",
                            e.target.value
                          )
                        }
                        placeholder="Optional"
                        className="mt-2 border-white/15 bg-[#0B0F14] text-white"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[0.65rem] tracking-[0.14em] text-white/40 uppercase">
                        Company
                      </span>
                      <Input
                        value={posting.postingCompany}
                        onChange={(e) =>
                          updatePostingDraft(
                            resume.id,
                            "postingCompany",
                            e.target.value
                          )
                        }
                        placeholder="Optional"
                        className="mt-2 border-white/15 bg-[#0B0F14] text-white"
                      />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="text-[0.65rem] tracking-[0.14em] text-white/40 uppercase">
                        Posting link
                      </span>
                      <Input
                        value={posting.postingUrl}
                        onChange={(e) =>
                          updatePostingDraft(
                            resume.id,
                            "postingUrl",
                            e.target.value
                          )
                        }
                        placeholder="Optional https link"
                        className="mt-2 border-white/15 bg-[#0B0F14] text-white"
                      />
                    </label>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-full bg-white/10 text-white hover:bg-[#7CFFB2] hover:text-[#0B0F14]"
                      disabled={pending}
                      onClick={() => savePostingDetails(resume.id)}
                    >
                      Save job details
                    </Button>
                    {resume.postingUrl ? (
                      <a
                        href={resume.postingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#00C2FF] underline-offset-4 hover:underline"
                      >
                        Open saved link
                      </a>
                    ) : null}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="rounded-full bg-white px-4 text-[#0B0F14] hover:bg-[#7CFFB2]"
                    disabled={pending}
                    onClick={() => download(resume.id, "docx")}
                  >
                    {resume.hasDocxExport ? "Redownload DOCX" : "Download DOCX"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="rounded-full border border-white/20 bg-white/5 px-4 text-white hover:bg-white hover:text-[#0B0F14]"
                    disabled={pending}
                    onClick={() => download(resume.id, "pdf")}
                  >
                    {resume.hasPdfExport ? "Redownload PDF" : "Download PDF"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="rounded-full text-[#FF5C35] hover:bg-[#FF5C35]/15 hover:text-[#FF5C35]"
                    disabled={pending}
                    onClick={() =>
                      setConfirmResumeId(
                        confirmResumeId === resume.id ? null : resume.id
                      )
                    }
                  >
                    Delete resume
                  </Button>
                </div>

                {confirmResumeId === resume.id ? (
                  <div className="mt-4 rounded-2xl border border-[#FF5C35]/35 bg-[#1A1010] p-4 text-sm text-white/75">
                    <p>
                      Delete this resume and its jobs, analyses, recommendations,
                      and exports? This cannot be undone.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        className="rounded-full bg-[#FF5C35] text-white hover:bg-[#ff7a57]"
                        disabled={pending}
                        onClick={() => deleteResume(resume.id)}
                      >
                        Yes, delete resume
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="rounded-full text-white/70 hover:bg-white/10 hover:text-white"
                        onClick={() => setConfirmResumeId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })
        )}
      </section>

      <section className="rounded-3xl border border-[#FF5C35]/35 bg-[#1A1010] p-5 sm:p-6">
        <h2 className="font-[family-name:var(--font-editorial)] text-2xl italic text-[#FF5C35]">
          Delete account
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/70">
          This permanently wipes your account, resumes, job inputs, analyses,
          recommendations, and exports. You will need to create a new account to
          use RezIQ again.
        </p>

        {!confirmAccount ? (
          <Button
            type="button"
            className="mt-5 rounded-full border border-[#FF5C35]/50 bg-transparent px-5 text-[#FF5C35] hover:bg-[#FF5C35] hover:text-white"
            onClick={() => setConfirmAccount(true)}
          >
            Delete my account
          </Button>
        ) : (
          <div className="mt-5 space-y-3">
            <p className="text-sm text-white/75">
              Type <span className="font-semibold text-white">delete</span> to
              confirm.
            </p>
            <Input
              value={accountPhrase}
              onChange={(e) => setAccountPhrase(e.target.value)}
              placeholder="delete"
              className="max-w-xs border-[#FF5C35]/40 bg-[#0B0F14] text-white"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                className="rounded-full bg-[#FF5C35] text-white hover:bg-[#ff7a57]"
                disabled={pending}
                onClick={deleteAccount}
              >
                Permanently delete account
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="rounded-full text-white/70 hover:bg-white/10 hover:text-white"
                onClick={() => {
                  setConfirmAccount(false);
                  setAccountPhrase("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
