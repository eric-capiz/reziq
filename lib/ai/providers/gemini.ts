import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ChatMessage, ProviderAdapter, ProviderChatResult } from "@/lib/ai/types";

const MODEL = "gemini-2.5-flash-lite";

export function createGeminiAdapter(): ProviderAdapter {
  return {
    name: "gemini",
    async chat(messages: ChatMessage[]): Promise<ProviderChatResult> {
      const apiKey = process.env.GOOGLE_AI_API_KEY;
      if (!apiKey) throw new Error("GOOGLE_AI_API_KEY missing");

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: MODEL,
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      });

      const system = messages
        .filter((m) => m.role === "system")
        .map((m) => m.content)
        .join("\n\n");
      const rest = messages.filter((m) => m.role !== "system");

      const contents = rest.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      const result = await model.generateContent({
        contents,
        systemInstruction: system || undefined,
      });

      const content = result.response.text();
      const usage = result.response.usageMetadata;

      return {
        provider: "gemini",
        content,
        tokensIn: usage?.promptTokenCount ?? 0,
        tokensOut: usage?.candidatesTokenCount ?? 0,
      };
    },
  };
}
