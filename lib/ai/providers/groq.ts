import Groq from "groq-sdk";
import type { ChatMessage, ProviderAdapter, ProviderChatResult } from "@/lib/ai/types";

const MODEL = "llama-3.3-70b-versatile";

export function createGroqAdapter(): ProviderAdapter {
  return {
    name: "groq",
    async chat(messages: ChatMessage[]): Promise<ProviderChatResult> {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) throw new Error("GROQ_API_KEY missing");

      const client = new Groq({ apiKey });
      const completion = await client.chat.completions.create({
        model: MODEL,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages,
      });

      const content = completion.choices[0]?.message?.content ?? "";
      return {
        provider: "groq",
        content,
        tokensIn: completion.usage?.prompt_tokens ?? 0,
        tokensOut: completion.usage?.completion_tokens ?? 0,
      };
    },
  };
}
