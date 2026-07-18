import { NextRequest, NextResponse } from "next/server";
import { getSettings, getConversation, saveConversation } from "@/lib/kv";
import { chatCompletion } from "@/lib/openrouter";
import { sendMessengerMessage } from "@/lib/facebook";

// ── GET: Facebook webhook verification ───────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const mode      = searchParams.get("hub.mode");
  const token     = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.FACEBOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken) {
    console.log("Webhook verified by Facebook ✅");
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

// ── POST: Receive messages ────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const body = await req.json();

  // Validate it's a page event
  if (body.object !== "page") {
    return NextResponse.json({ error: "Not a page event" }, { status: 404 });
  }

  // Always return 200 immediately to Facebook (they require it within 20s)
  // We process asynchronously
  processMessagingEvents(body).catch((err) =>
    console.error("Error processing webhook event:", err)
  );

  return NextResponse.json({ status: "ok" }, { status: 200 });
}

async function processMessagingEvents(body: Record<string, unknown>) {
  const settings = await getSettings();

  if (!settings.openrouterApiKey) {
    console.error("Bot has no OpenRouter API key configured.");
    return;
  }

  const pageAccessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  if (!pageAccessToken) {
    console.error("FACEBOOK_PAGE_ACCESS_TOKEN not set.");
    return;
  }

  const entries = (body.entry ?? []) as Array<{
    messaging?: Array<{
      sender?: { id: string };
      message?: { text?: string; is_echo?: boolean };
    }>;
  }>;

  for (const entry of entries) {
    const events = entry.messaging ?? [];

    for (const event of events) {
      // Skip echoes (our own messages)
      if (event.message?.is_echo) continue;

      const senderId   = event.sender?.id;
      const userMessage = event.message?.text;

      if (!senderId || !userMessage) continue;

      try {
        // Load conversation history
        const history = await getConversation(senderId);

        // Add user message
        history.push({ role: "user", content: userMessage });

        // Build system prompt
        let systemPrompt = settings.systemPrompt;
        if (settings.discounts?.trim()) {
          systemPrompt += `\n\n=== CURRENT PROMOTIONS / EVENTS ===\n${settings.discounts}`;
        }

        // Get AI reply
        const reply = await chatCompletion(
          settings.openrouterApiKey,
          settings.model,
          systemPrompt,
          history
        );

        // Add bot reply to history
        history.push({ role: "assistant", content: reply });

        // Save updated history & send reply in parallel
        await Promise.all([
          saveConversation(senderId, history),
          sendMessengerMessage(senderId, reply, pageAccessToken),
        ]);

        console.log(`✅ Replied to ${senderId}: "${reply.substring(0, 60)}…"`);
      } catch (err) {
        console.error(`❌ Failed to handle message from ${senderId}:`, err);
        // Try to send an error message to the user
        try {
          await sendMessengerMessage(
            senderId,
            "Sorry, I'm having trouble right now. Please try again in a moment.",
            pageAccessToken
          );
        } catch { /* ignore send errors */ }
      }
    }
  }
}
