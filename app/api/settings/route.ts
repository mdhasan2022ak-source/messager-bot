import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getSettings, saveSettings } from "@/lib/kv";

export async function GET() {
  if (!isAuthenticated()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await getSettings();
  // Never expose the API key in GET — mask it
  return NextResponse.json({
    ...settings,
    openrouterApiKey: settings.openrouterApiKey ? "••••••••" + settings.openrouterApiKey.slice(-4) : "",
  });
}

export async function POST(req: NextRequest) {
  if (!isAuthenticated()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const current = await getSettings();

  // If API key is masked (user didn't change it), keep existing
  const apiKey =
    body.openrouterApiKey && !body.openrouterApiKey.startsWith("••")
      ? body.openrouterApiKey
      : current.openrouterApiKey;

  await saveSettings({
    systemPrompt: body.systemPrompt ?? current.systemPrompt,
    discounts:    body.discounts    ?? current.discounts,
    model:        body.model        ?? current.model,
    openrouterApiKey: apiKey,
  });

  return NextResponse.json({ ok: true });
}
