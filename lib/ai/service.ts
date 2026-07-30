import { PROVIDER_ORDER, type ProviderName, recordAiCall, markProviderExhausted } from "@/lib/ai-status";
import {
  buildFitAnalysisMessages,
  buildRecommendationMessages,
  buildRepairMessage,
  extractJsonObject,
} from "@/lib/ai/prompts";
import { createCerebrasAdapter } from "@/lib/ai/providers/cerebras";
import { createGeminiAdapter } from "@/lib/ai/providers/gemini";
import { createGroqAdapter } from "@/lib/ai/providers/groq";
import {
  fitAnalysisSchema,
  recommendationResultSchema,
  type ChatMessage,
  type FitAnalysisResult,
  type ProviderAdapter,
  type RecommendationResult,
} from "@/lib/ai/types";

function adapters(): ProviderAdapter[] {
  return [createGroqAdapter(), createCerebrasAdapter(), createGeminiAdapter()];
}

function isRateLimitError(error: unknown) {
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return (
    message.includes("429") ||
    message.includes("rate limit") ||
    message.includes("quota") ||
    message.includes("resource_exhausted") ||
    message.includes("too many requests")
  );
}

async function runJsonWithProviders<T>(
  messages: ChatMessage[],
  parse: (content: string) => T
): Promise<{ result: T; provider: ProviderName }> {
  const errors: string[] = [];

  for (const name of PROVIDER_ORDER) {
    const adapter = adapters().find((a) => a.name === name);
    if (!adapter) continue;

    try {
      let response = await adapter.chat(messages);
      await recordAiCall({
        provider: adapter.name,
        ok: true,
        tokensIn: response.tokensIn,
        tokensOut: response.tokensOut,
      });

      try {
        const result = parse(response.content);
        return { result, provider: adapter.name };
      } catch (firstError) {
        const repair = buildRepairMessage(
          response.content,
          firstError instanceof Error ? firstError.message : "Invalid JSON"
        );
        response = await adapter.chat([...messages, repair]);
        await recordAiCall({
          provider: adapter.name,
          ok: true,
          tokensIn: response.tokensIn,
          tokensOut: response.tokensOut,
        });
        const result = parse(response.content);
        return { result, provider: adapter.name };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Provider failed";
      errors.push(`${name}: ${message}`);
      await recordAiCall({
        provider: name,
        ok: false,
        exhausted: isRateLimitError(error),
        errorMessage: message.slice(0, 400),
      });
      if (isRateLimitError(error)) {
        await markProviderExhausted(name, message.slice(0, 400));
      }
    }
  }

  throw new Error(
    `Free AI processing is unavailable right now. ${errors.slice(0, 3).join(" | ")}`
  );
}

function parseWithSchema<T>(content: string, schema: { parse: (value: unknown) => T }) {
  const jsonText = extractJsonObject(content);
  return schema.parse(JSON.parse(jsonText));
}

export async function runFitAnalysis(input: {
  resumeJson: unknown;
  jobJson: unknown;
}): Promise<{ result: FitAnalysisResult; provider: ProviderName }> {
  const messages = buildFitAnalysisMessages({
    resumeJson: JSON.stringify(input.resumeJson),
    jobJson: JSON.stringify(input.jobJson),
  });
  return runJsonWithProviders(messages, (content) =>
    parseWithSchema(content, fitAnalysisSchema)
  );
}

export async function runRecommendations(input: {
  resumeJson: unknown;
  jobJson: unknown;
  analysisJson: unknown;
}): Promise<{ result: RecommendationResult; provider: ProviderName }> {
  const messages = buildRecommendationMessages({
    resumeJson: JSON.stringify(input.resumeJson),
    jobJson: JSON.stringify(input.jobJson),
    analysisJson: JSON.stringify(input.analysisJson),
  });
  return runJsonWithProviders(messages, (content) =>
    parseWithSchema(content, recommendationResultSchema)
  );
}
