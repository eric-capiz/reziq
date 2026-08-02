import { NEW_USER_ALLOWANCE_NOTE } from "@/lib/usage-defaults";

const notes = [
  {
    label: "Format",
    title: "DOCX uploads only",
    body: "PDF upload later. Export can still be DOCX or PDF.",
    accent: "bg-[#00C2FF]",
  },
  {
    label: "Access",
    title: "Limited daily uses",
    body: NEW_USER_ALLOWANCE_NOTE,
    accent: "bg-[#FF5C35]",
  },
  {
    label: "History",
    title: "Track postings on Profile",
    body: "Optionally save one job title, company, and posting link with each resume. Edit them anytime. RezIQ does not open or scrape the link.",
    accent: "bg-[#0B0F14]",
  },
  {
    label: "Trust",
    title: "Privacy minded",
    body: "No selling data. No RezIQ training on resumes. Delete when you want.",
    accent: "bg-[#7CFFB2]",
  },
];

export function WelcomeCallouts() {
  return (
    <section className="bg-[#F3F6FA] px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto w-full max-w-6xl">
        <h2 className="font-[family-name:var(--font-editorial)] text-3xl tracking-tight text-[#0B0F14] sm:text-4xl">
          Ground rules
        </h2>
        <div className="mt-8 space-y-4">
          {notes.map((note) => (
            <article
              key={note.title}
              className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-5 sm:grid-cols-[8rem_1fr] sm:items-center sm:gap-6 sm:p-6"
            >
              <div className="flex items-center gap-3">
                <span className={`size-3 rounded-full ${note.accent}`} />
                <span className="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">
                  {note.label}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#0B0F14]">
                  {note.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600 sm:text-base">
                  {note.body}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
