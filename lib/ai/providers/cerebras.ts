import OpenAI from "openai";
import type { ChatMessage, ProviderAdapter, ProviderChatResult } from "@/lib/ai/types";

const MODEL = "gpt-oss-120b";

export function createCerebrasAdapter(): ProviderAdapter {
  return {
    name: "cerebras",
    async chat(messages: ChatMessage[]): Promise<ProviderChatResult> {
      const apiKey = process.env.CEREBRAS_API_KEY;
      if (!apiKey) throw new Error("CEREBRAS_API_KEY missing");

      const client = new OpenAI({
        apiKey,
        baseURL: "https://api.cerebras.ai/v1",
      });

      const completion = await client.chat.completions.create({
        model: MODEL,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages,
      });

      const content = completion.choices[0]?.message?.content ?? "";
      return {
        provider: "cerebras",
        content,
        tokensIn: completion.usage?.prompt_tokens ?? 0,
        tokensOut: completion.usage?.completion_tokens ?? 0,
      };
    },
  };
}
