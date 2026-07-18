import { Message } from "./kv";

export interface OpenRouterModel {
  id: string;
  name: string;
  pricing?: {
    prompt: string;
    completion: string;
  };
  context_length?: number;
}

export async function fetchModels(apiKey: string): Promise<OpenRouterModel[]> {
  const res = await fetch("https://openrouter.ai/api/v1/models", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`OpenRouter models fetch failed: ${res.status}`);
  }

  const data = await res.json();
  return data.data as OpenRouterModel[];
}

export async function chatCompletion(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: Message[]
): Promise<string> {
  const payload = {
    model,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages,
    ],
    max_tokens: 1024,
  };

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "https://localhost:3000",
      "X-Title": "FB Messenger Bot",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "Sorry, I could not generate a reply.";
}
