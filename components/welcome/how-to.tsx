const steps = [
  {
    n: "01",
    title: "Drop in DOCX",
    body: "Single column, plain formatting wins. We keep upload DOCX only for now.",
  },
  {
    n: "02",
    title: "Paste the posting",
    body: "No link scraping. You control the exact job text we analyze.",
  },
  {
    n: "03",
    title: "Read the fit",
    body: "Match, partial, missing with evidence. Recommendations only when close.",
  },
  {
    n: "04",
    title: "Approve and export",
    body: "Accept or reject each suggestion, then download DOCX or PDF.",
  },
];

export function WelcomeHowTo() {
  return (
    <section className="bg-[#0B0F14] px-4 py-16 text-white sm:px-6 sm:py-24">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="font-[family-name:var(--font-editorial)] text-3xl italic sm:text-5xl">
            Four beats
          </h2>
          <p className="max-w-sm text-sm text-white/60 sm:text-base">
            A tight loop from upload to export. No fake scoreboards.
          </p>
        </div>

        <div className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-4 md:overflow-visible md:pb-0">
          {steps.map((step) => (
            <article
              key={step.n}
              className="min-w-[78%] snap-center rounded-3xl border border-white/10 bg-white/5 p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#7CFFB2]/40 hover:bg-white/10 sm:min-w-[60%] md:min-w-0"
            >
              <p className="font-[family-name:var(--font-editorial)] text-4xl text-[#00C2FF]">
                {step.n}
              </p>
              <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/65">
                {step.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
