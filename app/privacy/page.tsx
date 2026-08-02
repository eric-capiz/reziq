import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How RezIQ stores resume data, what we use it for, and how you can delete your account and files.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <AppShell
      brandHref="/"
      actions={
        <Link
          href="/"
          className="inline-flex h-7 items-center rounded-full bg-white/10 px-3 text-[0.8rem] font-medium transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#7CFFB2] hover:text-[#0B0F14]"
        >
          Home
        </Link>
      }
    >
      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
        <p className="mb-4 inline-flex rounded-full border border-[#7CFFB2]/40 bg-[#7CFFB2]/10 px-3 py-1 text-xs font-medium tracking-[0.2em] text-[#7CFFB2] uppercase">
          Privacy
        </p>
        <h1 className="font-[family-name:var(--font-editorial)] text-5xl leading-[0.92] font-medium tracking-tight sm:text-6xl">
          How RezIQ handles your data
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-white/70">
          RezIQ is built for evidence based resume help. We store only what we
          need to analyze fit, suggest honest improvements, and let you export
          a clean document.
        </p>

        <div className="mt-12 space-y-10 text-sm leading-relaxed text-white/70 sm:text-base">
          <section>
            <h2 className="font-[family-name:var(--font-editorial)] text-2xl italic text-white">
              What we store
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Account details: username, email, and password hash</li>
              <li>Uploaded DOCX resumes and extracted structured content</li>
              <li>Pasted job descriptions and structured job fields</li>
              <li>Fit analyses, recommendation decisions, and export files</li>
              <li>Daily usage counts and AI provider usage totals for capacity</li>
            </ul>
          </section>

          <section>
            <h2 className="font-[family-name:var(--font-editorial)] text-2xl italic text-white">
              AI processing
            </h2>
            <p className="mt-3">
              To generate fit reads and recommendations, RezIQ may send resume
              and job content to free AI providers in this order: Groq, Cerebras,
              then Google Gemini Flash Lite. Provider names are shown here for
              disclosure. The in app analysis experience does not advertise which
              provider handled a single request.
            </p>
            <p className="mt-3">
              We do not sell your resume data. We do not use your content to train
              RezIQ models. Provider terms may still apply to content processed by
              their APIs.
            </p>
          </section>

          <section>
            <h2 className="font-[family-name:var(--font-editorial)] text-2xl italic text-white">
              Retention and deletion
            </h2>
            <p className="mt-3">
              Your data stays while your account exists, or until you delete a
              resume or your account from your profile page. Deleting a resume
              removes its stored file, related jobs, analyses, recommendations,
              and exports. Deleting your account wipes everything tied to that
              account. You would need to register again to use RezIQ later.
            </p>
          </section>

          <section>
            <h2 className="font-[family-name:var(--font-editorial)] text-2xl italic text-white">
              Logging
            </h2>
            <p className="mt-3">
              We avoid writing full resume text into normal application logs.
              Errors may include limited technical details needed to debug
              failures.
            </p>
          </section>

          <section>
            <h2 className="font-[family-name:var(--font-editorial)] text-2xl italic text-white">
              Questions
            </h2>
            <p className="mt-3">
              For privacy questions, contact{" "}
              <a
                href="https://www.ericcapiz.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#7CFFB2] underline-offset-4 hover:underline"
              >
                Eric Capiz
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </AppShell>
  );
}
