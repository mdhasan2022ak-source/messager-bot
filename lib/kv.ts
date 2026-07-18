import { Redis } from "@upstash/redis";

// Upstash Redis client - uses KV_REST_API_URL and KV_REST_API_TOKEN env vars
const redis = Redis.fromEnv();

// ── Keys ─────────────────────────────────────────────────────────────────────
export const KEYS = {
  settings: "bot:settings",
  conversation: (senderId: string) => `conv:${senderId}`,
};

// ── Types ─────────────────────────────────────────────────────────────────────
export interface BotSettings {
  systemPrompt: string;
  discounts: string;
  openrouterApiKey: string;
  model: string;
}

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

// ── Default settings ──────────────────────────────────────────────────────────
export const DEFAULT_SETTINGS: BotSettings = {
  systemPrompt: `You are a helpful customer service assistant for a business. 
Always be polite, professional, and helpful. 
Detect the customer's language and always reply in the same language they write in.
If you don't know something specific about the business, politely say you'll find out.`,
  discounts: "",
  openrouterApiKey: "",
  model: "openai/gpt-3.5-turbo",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
export async function getSettings(): Promise<BotSettings> {
  try {
    const data = await redis.get<BotSettings>(KEYS.settings);
    return data ?? DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: BotSettings): Promise<void> {
  await redis.set(KEYS.settings, settings);
}

export async function getConversation(senderId: string): Promise<Message[]> {
  try {
    const data = await redis.get<Message[]>(KEYS.conversation(senderId));
    return data ?? [];
  } catch {
    return [];
  }
}

export async function saveConversation(
  senderId: string,
  messages: Message[]
): Promise<void> {
  const trimmed = messages.slice(-40);
  await redis.set(KEYS.conversation(senderId), trimmed, { ex: 60 * 60 * 24 * 30 });
}
