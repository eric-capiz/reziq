export function WelcomePurpose() {
  return (
    <section id="pulse" className="bg-[#F3F6FA] px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[auto_1fr] lg:gap-14">
        <div className="font-[family-name:var(--font-editorial)] text-7xl leading-none text-[#FF5C35] italic sm:text-8xl">
          “
        </div>
        <div>
          <h2 className="max-w-3xl font-[family-name:var(--font-editorial)] text-3xl leading-tight font-medium tracking-tight text-[#0B0F14] sm:text-5xl">
            An AI career assistant that argues from your resume, not from
            imagination.
          </h2>
          <div className="mt-8 grid gap-6 text-base leading-relaxed text-slate-600 sm:grid-cols-2 sm:text-lg">
            <p>
              Paste a job description, upload a DOCX, and get a Strong, Possible,
              or Poor fit verdict with receipts from your own experience.
            </p>
            <p>
              If you are far off, we stop at the gaps. If you are close, you
              approve every wording change before a new resume is generated.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
