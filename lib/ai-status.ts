import { AiProviderDaily } from "@/models/AiProviderDaily";
import { getNextResetLabel, getUsageDateKey } from "@/lib/usage";

export type ProviderName = "groq" | "cerebras" | "gemini";
export type ProviderLamp = "green" | "purple" | "red";

export const PROVIDER_ORDER: ProviderName[] = ["groq", "cerebras", "gemini"];

export const PROVIDER_LABELS: Record<ProviderName, string> = {
  groq: "Groq",
  cerebras: "Cerebras",
  gemini: "Gemini Flash Lite",
};

const ACTIVE_WINDOW_MS = 2 * 60 * 1000;

/** Daily free tier caps from provider consoles. Null means that axis is not used. */
const PROVIDER_CAPS = {
  groq: {
    requestsPerDay: 1000,
    tokensPerDay: 100000,
    requestsPerAnalysis: 4,
    tokensPerAnalysis: 12000,
  },
  cerebras: {
    requestsPerDay: null,
    tokensPerDay: 1000000,
    requestsPerAnalysis: 4,
    tokensPerAnalysis: 12000,
  },
  gemini: {
    requestsPerDay: 500,
    tokensPerDay: null,
    requestsPerAnalysis: 4,
    tokensPerAnalysis: 12000,
  },
} as const;

type UsageDoc = {
  requests: number;
  tokensIn: number;
  tokensOut: number;
  exhausted: boolean;
  lastActiveAt?: Date | null;
  lastError?: string;
};

export async function recordAiCall(input: {
  provider: ProviderName;
  ok: boolean;
  tokensIn?: number;
  tokensOut?: number;
  exhausted?: boolean;
  errorMessage?: string;
}) {
  const date = getUsageDateKey();
  const update: Record<string, unknown> = {
    $inc: {
      requests: 1,
      tokensIn: input.tokensIn ?? 0,
      tokensOut: input.tokensOut ?? 0,
    },
    $set: {
      lastError: input.errorMessage ?? "",
    },
  };

  if (input.ok) {
    (update.$set as Record<string, unknown>).lastActiveAt = new Date();
  }
  if (input.exhausted) {
    (update.$set as Record<string, unknown>).exhausted = true;
  }

  return AiProviderDaily.findOneAndUpdate(
    { provider: input.provider, date },
    update,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

export async function markProviderExhausted(
  provider: ProviderName,
  errorMessage = "Daily limit reached"
) {
  const date = getUsageDateKey();
  return AiProviderDaily.findOneAndUpdate(
    { provider, date },
    {
      $set: {
        exhausted: true,
        lastError: errorMessage,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

function tokensPerAnalysisFor(provider: ProviderName, doc: UsageDoc) {
  const caps = PROVIDER_CAPS[provider];
  const tokensUsed = doc.tokensIn + doc.tokensOut;
  if (doc.requests >= 4 && tokensUsed > 0) {
    const observedPerRequest = tokensUsed / doc.requests;
    const observedPerAnalysis =
      observedPerRequest * caps.requestsPerAnalysis;
    // Blend default with observed so early noisy samples do not dominate.
    return Math.round(
      caps.tokensPerAnalysis * 0.4 + observedPerAnalysis * 0.6
    );
  }
  return caps.tokensPerAnalysis;
}

function estimateAnalysesLeft(provider: ProviderName, doc: UsageDoc) {
  if (doc.exhausted) return 0;
  const caps = PROVIDER_CAPS[provider];
  const tokensUsed = doc.tokensIn + doc.tokensOut;
  const tokensPerAnalysis = tokensPerAnalysisFor(provider, doc);
  const candidates: number[] = [];

  if (caps.requestsPerDay != null) {
    candidates.push(
      Math.floor(
        (caps.requestsPerDay - doc.requests) / caps.requestsPerAnalysis
      )
    );
  }
  if (caps.tokensPerDay != null) {
    candidates.push(
      Math.floor((caps.tokensPerDay - tokensUsed) / tokensPerAnalysis)
    );
  }

  if (candidates.length === 0) return 0;
  return Math.max(0, Math.min(...candidates));
}

function lampFor(doc: UsageDoc | null): ProviderLamp {
  if (!doc) return "purple";
  if (doc.exhausted) return "red";
  if (
    doc.lastActiveAt &&
    Date.now() - new Date(doc.lastActiveAt).getTime() < ACTIVE_WINDOW_MS
  ) {
    return "green";
  }
  return "purple";
}

function emptyUsage(): UsageDoc {
  return {
    requests: 0,
    tokensIn: 0,
    tokensOut: 0,
    exhausted: false,
    lastActiveAt: null,
    lastError: "",
  };
}

function pickCurrentProvider(
  byProvider: Record<ProviderName, UsageDoc | null>
): ProviderName | null {
  for (const name of PROVIDER_ORDER) {
    if (lampFor(byProvider[name]) === "green") return name;
  }
  for (const name of PROVIDER_ORDER) {
    const doc = byProvider[name];
    if (!doc || !doc.exhausted) return name;
  }
  return null;
}

export async function getAiAdminStats() {
  const date = getUsageDateKey();
  const rows = await AiProviderDaily.find({ date }).lean();
  const byProvider: Record<ProviderName, UsageDoc | null> = {
    groq: null,
    cerebras: null,
    gemini: null,
  };

  for (const row of rows) {
    const name = row.provider as string;
    if (name !== "groq" && name !== "cerebras" && name !== "gemini") continue;
    const provider = name as ProviderName;
    byProvider[provider] = {
      requests: row.requests ?? 0,
      tokensIn: row.tokensIn ?? 0,
      tokensOut: row.tokensOut ?? 0,
      exhausted: row.exhausted ?? false,
      lastActiveAt: row.lastActiveAt ?? null,
      lastError: row.lastError ?? "",
    };
  }

  const left: Record<ProviderName, number> = {
    groq: estimateAnalysesLeft("groq", byProvider.groq ?? emptyUsage()),
    cerebras: estimateAnalysesLeft(
      "cerebras",
      byProvider.cerebras ?? emptyUsage()
    ),
    gemini: estimateAnalysesLeft("gemini", byProvider.gemini ?? emptyUsage()),
  };

  const estimatedAnalysesLeft =
    left.groq + left.cerebras + left.gemini;

  const providers = Object.fromEntries(
    PROVIDER_ORDER.map((name) => {
      const doc = byProvider[name] ?? emptyUsage();
      return [
        name,
        {
          lamp: lampFor(byProvider[name]),
          requests: doc.requests,
          tokensIn: doc.tokensIn,
          tokensOut: doc.tokensOut,
          exhausted: doc.exhausted,
          estimatedAnalysesLeft: left[name],
          lastError: doc.lastError ?? "",
          label: PROVIDER_LABELS[name],
          role:
            name === "groq"
              ? "Primary"
              : name === "cerebras"
                ? "Backup #2"
                : "Last resort",
        },
      ];
    })
  ) as Record<
    ProviderName,
    {
      lamp: ProviderLamp;
      requests: number;
      tokensIn: number;
      tokensOut: number;
      exhausted: boolean;
      estimatedAnalysesLeft: number;
      lastError: string;
      label: string;
      role: string;
    }
  >;

  return {
    date,
    resetLabel: getNextResetLabel(),
    estimatedAnalysesLeft,
    estimateNote:
      "Estimates blend free tier caps with observed token use when enough calls exist today. Reset timing follows America/Denver.",
    breakdown: {
      groq: left.groq,
      cerebras: left.cerebras,
      gemini: left.gemini,
    },
    currentProvider: pickCurrentProvider(byProvider),
    providers,
  };
}
