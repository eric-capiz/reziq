"use client";

import { useEffect, useState } from "react";

type FrontCard = "pulse" | "flow" | "allowance";

const CARD_ORDER: FrontCard[] = ["pulse", "flow", "allowance"];

function stackClasses(
  depth: number,
  accent: "cyan" | "coral" | "mint",
) {
  const borders = {
    cyan: [
      "border-[#00C2FF]/40 shadow-[0_18px_40px_rgba(0,194,255,0.18)] hover:shadow-[0_22px_48px_rgba(0,194,255,0.28)]",
      "border-[#00C2FF]/25 hover:shadow-[0_12px_28px_rgba(0,194,255,0.16)]",
      "border-[#00C2FF]/15",
    ],
    coral: [
      "border-[#FF5C35]/55 shadow-[0_18px_40px_rgba(255,92,53,0.2)] hover:shadow-[0_22px_48px_rgba(255,92,53,0.3)]",
      "border-[#FF5C35]/30 hover:shadow-[0_12px_28px_rgba(255,92,53,0.16)]",
      "border-[#FF5C35]/15",
    ],
    mint: [
      "border-[#7CFFB2]/45 shadow-[0_18px_40px_rgba(124,255,178,0.18)] hover:shadow-[0_22px_48px_rgba(124,255,178,0.28)]",
      "border-[#7CFFB2]/25 hover:shadow-[0_12px_28px_rgba(124,255,178,0.16)]",
      "border-[#7CFFB2]/15",
    ],
  };
  const bg = {
    cyan: ["bg-[#151B24]", "bg-[#101820]", "bg-[#0C1218]"],
    coral: ["bg-[#1A1010]", "bg-[#1A1010]", "bg-[#140C0C]"],
    mint: ["bg-[#0F1A16]", "bg-[#0C1512]", "bg-[#0A1210]"],
  };
  const pose = [
    "top-0 left-2 z-30 rotate-[-5deg] scale-100 opacity-100 sm:left-4",
    "top-10 right-1 z-20 rotate-[4deg] scale-[0.96] opacity-90 sm:right-2",
    "top-20 right-0 z-10 rotate-[8deg] scale-[0.92] opacity-70 sm:right-1",
  ];

  return `absolute w-[86%] rounded-2xl border p-4 text-left shadow-2xl transition-all duration-500 ease-out hover:-translate-y-1 sm:w-[82%] ${pose[depth]} ${borders[accent][depth]} ${bg[accent][depth]}`;
}

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
      setFront((prev) => {
        const index = CARD_ORDER.indexOf(prev);
        return CARD_ORDER[(index + 1) % CARD_ORDER.length];
      });
    }, 5000);
    return () => window.clearInterval(id);
  }, [front]);

  function depthFor(card: FrontCard) {
    const frontIndex = CARD_ORDER.indexOf(front);
    const cardIndex = CARD_ORDER.indexOf(card);
    return (cardIndex - frontIndex + CARD_ORDER.length) % CARD_ORDER.length;
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 relative h-56 duration-700 sm:h-60">
      <button
        type="button"
        onClick={() => setFront("pulse")}
        aria-pressed={front === "pulse"}
        className={stackClasses(depthFor("pulse"), "cyan")}
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
          {dailyAllowance > 0 ? " · resets daily" : ""}
        </p>
      </button>

      <button
        type="button"
        onClick={() => setFront("flow")}
        aria-pressed={front === "flow"}
        className={stackClasses(depthFor("flow"), "coral")}
      >
        <p className="text-xs tracking-wide text-[#FF5C35] uppercase">Flow</p>
        <p className="mt-2 text-sm text-white/70">
          Upload, structure, paste job, then analyze in Rez Desk
        </p>
      </button>

      <button
        type="button"
        onClick={() => setFront("allowance")}
        aria-pressed={front === "allowance"}
        className={stackClasses(depthFor("allowance"), "mint")}
      >
        <p className="text-xs tracking-wide text-[#7CFFB2] uppercase">
          More uses
        </p>
        <p className="mt-2 text-sm text-white/70">
          An admin can issue more uses when capacity allows.
        </p>
      </button>
    </div>
  );
}
