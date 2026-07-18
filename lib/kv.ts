import { kv } from "@vercel/kv";

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
    const data = await kv.get<BotSettings>(KEYS.settings);
    return data ?? DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: BotSettings): Promise<void> {
  await kv.set(KEYS.settings, settings);
}

export async function getConversation(senderId: string): Promise<Message[]> {
  try {
    const data = await kv.get<Message[]>(KEYS.conversation(senderId));
    return data ?? [];
  } catch {
    return [];
  }
}

export async function saveConversation(
  senderId: string,
  messages: Message[]
): Promise<void> {
  // Keep last 40 messages max (20 turns) to stay within KV limits
  const trimmed = messages.slice(-40);
  await kv.set(KEYS.conversation(senderId), trimmed, { ex: 60 * 60 * 24 * 30 }); // 30 days TTL
}
