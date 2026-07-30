import { PROVIDER_ORDER, type ProviderName, recordAiCall, markProviderExhausted } from "@/lib/ai-status";
import {
  buildFitAnalysisMessages,
  buildRepairMessage,
  extractJsonObject,
} from "@/lib/ai/prompts";
import { createCerebrasAdapter } from "@/lib/ai/providers/cerebras";
import { createGeminiAdapter } from "@/lib/ai/providers/gemini";
import { createGroqAdapter } from "@/lib/ai/providers/groq";
import {
  fitAnalysisSchema,
  type FitAnalysisResult,
  type ProviderAdapter,
} from "@/lib/ai/types";

function adapters(): ProviderAdapter[] {
  return [createGroqAdapter(), createCerebrasAdapter(), createGeminiAdapter()];
}

function isRateLimitError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return (
    message.includes("429") ||
    message.includes("rate limit") ||
    message.includes("quota") ||
    message.includes("resource_exhausted") ||
    message.includes("too many requests")
  );
}

async function parseFit(content: string) {
  const jsonText = extractJsonObject(content);
  const parsed = JSON.parse(jsonText);
  return fitAnalysisSchema.parse(parsed);
}

async function runWithProvider(
  adapter: ProviderAdapter,
  resumeJson: string,
  jobJson: string
): Promise<{ result: FitAnalysisResult; provider: ProviderName }> {
  const messages = buildFitAnalysisMessages({ resumeJson, jobJson });
  let response = await adapter.chat(messages);
  await recordAiCall({
    provider: adapter.name,
    ok: true,
    tokensIn: response.tokensIn,
    tokensOut: response.tokensOut,
  });

  try {
    const result = await parseFit(response.content);
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
    const result = await parseFit(response.content);
    return { result, provider: adapter.name };
  }
}

export async function runFitAnalysis(input: {
  resumeJson: unknown;
  jobJson: unknown;
}): Promise<{ result: FitAnalysisResult; provider: ProviderName }> {
  const resumeJson = JSON.stringify(input.resumeJson);
  const jobJson = JSON.stringify(input.jobJson);
  const errors: string[] = [];

  for (const name of PROVIDER_ORDER) {
    const adapter = adapters().find((a) => a.name === name);
    if (!adapter) continue;

    try {
      return await runWithProvider(adapter, resumeJson, jobJson);
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
