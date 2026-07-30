import { z } from "zod";
import type { ProviderName } from "@/lib/ai-status";

export const evidenceItemSchema = z.object({
  label: z.string().min(1),
  detail: z.string().min(1),
  resumeEvidence: z.string().default(""),
  jobEvidence: z.string().default(""),
});

export const fitAnalysisSchema = z.object({
  verdict: z.enum(["strong", "possible", "poor"]),
  summary: z.string().min(1),
  matches: z.array(evidenceItemSchema).default([]),
  partialMatches: z.array(evidenceItemSchema).default([]),
  gaps: z.array(evidenceItemSchema).default([]),
  guidance: z.string().default(""),
});

export type FitAnalysisResult = z.infer<typeof fitAnalysisSchema>;

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ProviderChatResult = {
  provider: ProviderName;
  content: string;
  tokensIn: number;
  tokensOut: number;
};

export type ProviderAdapter = {
  name: ProviderName;
  chat: (messages: ChatMessage[]) => Promise<ProviderChatResult>;
};
