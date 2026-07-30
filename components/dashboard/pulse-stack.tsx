"use client";

import { useEffect, useState } from "react";

type FrontCard = "pulse" | "flow";

export function PulseStack({
  remainingUses,
  usesUsedToday,
  dailyAllowance,
}: {
  remainingUses: number;
  usesUsedToday: number;
  dailyAllowance: number;
}) {
  const [front, setFront] = useState<FrontCard>("pulse");

  useEffect(() => {
    const id = window.setInterval(() => {
      setFront((prev) => (prev === "pulse" ? "flow" : "pulse"));
    }, 5000);
    return () => window.clearInterval(id);
  }, [front]);

  function bringToFront(card: FrontCard) {
    setFront(card);
  }

  const pulseFront = front === "pulse";

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 relative h-48 duration-700 sm:h-52">
      <button
        type="button"
        onClick={() => bringToFront("pulse")}
        aria-pressed={pulseFront}
        className={`absolute w-[86%] rounded-2xl border p-4 text-left shadow-2xl transition-all duration-500 ease-out hover:-translate-y-1 sm:w-[82%] ${
          pulseFront
            ? "top-0 left-2 z-20 rotate-[-5deg] scale-100 border-[#00C2FF]/40 bg-[#151B24] shadow-[0_18px_40px_rgba(0,194,255,0.18)] hover:shadow-[0_22px_48px_rgba(0,194,255,0.28)] sm:left-4"
            : "top-16 right-0 left-auto z-10 rotate-[5deg] scale-[0.96] border-[#00C2FF]/25 bg-[#101820] opacity-85 hover:opacity-100 hover:shadow-[0_12px_28px_rgba(0,194,255,0.16)] sm:right-2"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs tracking-wide text-[#00C2FF] uppercase">
            Daily pulse
          </span>
          <span className="rounded-full bg-[#7CFFB2]/15 px-2 py-0.5 text-xs text-[#7CFFB2]">
            {remainingUses} left
          </span>
        </div>
        <p className="mt-3 text-sm text-white/70">
          {usesUsedToday} used · {dailyAllowance} daily allowance
        </p>
      </button>

      <button
        type="button"
        onClick={() => bringToFront("flow")}
        aria-pressed={!pulseFront}
        className={`absolute w-[86%] rounded-2xl border p-4 text-left shadow-2xl transition-all duration-500 ease-out hover:-translate-y-1 sm:w-[82%] ${
          !pulseFront
            ? "top-0 left-2 z-20 rotate-[-5deg] scale-100 border-[#FF5C35]/55 bg-[#1A1010] shadow-[0_18px_40px_rgba(255,92,53,0.2)] hover:shadow-[0_22px_48px_rgba(255,92,53,0.3)] sm:left-4"
            : "top-16 right-0 left-auto z-10 rotate-[5deg] scale-[0.96] border-[#FF5C35]/30 bg-[#1A1010] opacity-85 hover:opacity-100 hover:shadow-[0_12px_28px_rgba(255,92,53,0.16)] sm:right-2"
        }`}
      >
        <p className="text-xs tracking-wide text-[#FF5C35] uppercase">Flow</p>
        <p className="mt-2 text-sm text-white/70">
          Upload → structure → paste job → analyze next
        </p>
      </button>
    </div>
  );
}
