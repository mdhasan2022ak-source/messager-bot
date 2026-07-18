import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getSettings } from "@/lib/kv";
import { chatCompletion } from "@/lib/openrouter";
import type { Message } from "@/lib/kv";

export async function POST(req: NextRequest) {
  if (!isAuthenticated()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { messages }: { messages: Message[] } = await req.json();

  const settings = await getSettings();

  if (!settings.openrouterApiKey) {
    return NextResponse.json(
      { error: "No OpenRouter API key saved. Please add it in Bot Settings first." },
      { status: 400 }
    );
  }

  // Build system prompt — include discounts/events if any
  let systemPrompt = settings.systemPrompt;
  if (settings.discounts?.trim()) {
    systemPrompt += `\n\n=== CURRENT PROMOTIONS / EVENTS ===\n${settings.discounts}`;
  }

  try {
    const reply = await chatCompletion(
      settings.openrouterApiKey,
      settings.model,
      systemPrompt,
      messages
    );
    return NextResponse.json({ reply });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
