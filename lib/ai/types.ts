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

export const recommendationItemSchema = z.object({
  section: z.enum(["summary", "experience", "skills", "education", "other"]),
  targetPath: z.string().min(1),
  title: z.string().min(1),
  rationale: z.string().min(1),
  currentText: z.string().default(""),
  proposedText: z.string().min(1),
  resumeEvidence: z.string().min(1),
});

export const adviceItemSchema = z.object({
  topic: z.string().min(1),
  detail: z.string().min(1),
});

export const recommendationResultSchema = z.object({
  alreadyStrong: z.boolean().default(false),
  statusNote: z.string().default(""),
  diyAdvice: z.string().default(""),
  advice: z.array(adviceItemSchema).max(10).default([]),
  recommendations: z.array(recommendationItemSchema).max(6).default([]),
});

export type RecommendationResult = z.infer<typeof recommendationResultSchema>;

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
