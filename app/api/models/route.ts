import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getSettings } from "@/lib/kv";
import { fetchModels } from "@/lib/openrouter";

export async function GET() {
  if (!isAuthenticated()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await getSettings();
  if (!settings.openrouterApiKey) {
    return NextResponse.json({ error: "No API key saved yet." }, { status: 400 });
  }

  try {
    const models = await fetchModels(settings.openrouterApiKey);

    // Sort: free first, then alphabetical
    const sorted = models.sort((a, b) => {
      const aFree = parseFloat(a.pricing?.prompt ?? "1") === 0;
      const bFree = parseFloat(b.pricing?.prompt ?? "1") === 0;
      if (aFree && !bFree) return -1;
      if (!aFree && bFree) return 1;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({ models: sorted });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
