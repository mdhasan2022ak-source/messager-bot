export async function sendMessengerMessage(
  recipientId: string,
  text: string,
  pageAccessToken: string
): Promise<void> {
  const res = await fetch(
    `https://graph.facebook.com/v19.0/me/messages?access_token=${pageAccessToken}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text },
        messaging_type: "RESPONSE",
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error("Facebook send failed:", err);
    throw new Error(`Facebook API error ${res.status}: ${err}`);
  }
}
