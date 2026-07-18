"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { BotSettings, Message } from "@/lib/kv";
import type { OpenRouterModel } from "@/lib/openrouter";

interface Props {
  initialSettings: BotSettings;
}

// ── Icons ──────────────────────────────────────────────────────────────────────
const IconSend = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const IconSave = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
  </svg>
);

const IconRefresh = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const IconTrash = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const IconLogout = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const IconEye = ({ show }: { show: boolean }) => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    {show ? (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </>
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    )}
  </svg>
);

// ── Typing indicator ───────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex gap-1 items-center px-3.5 py-3 bg-slate-800 rounded-2xl
                    rounded-tl-sm border border-slate-700 self-start">
      <span className="typing-dot w-1.5 h-1.5 bg-slate-400 rounded-full inline-block" />
      <span className="typing-dot w-1.5 h-1.5 bg-slate-400 rounded-full inline-block" />
      <span className="typing-dot w-1.5 h-1.5 bg-slate-400 rounded-full inline-block" />
    </div>
  );
}

// ── Main dashboard component ───────────────────────────────────────────────────
export default function DashboardClient({ initialSettings }: Props) {
  const router = useRouter();

  // Settings state
  const [settings, setSettings]   = useState<BotSettings>(initialSettings);
  const [saving, setSaving]       = useState(false);
  const [saveMsg, setSaveMsg]     = useState("");
  const [showApiKey, setShowApiKey] = useState(false);

  // Models state
  const [models, setModels]       = useState<OpenRouterModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError]     = useState("");

  // Chat state
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput]       = useState("");
  const [chatLoading, setChatLoading]   = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  async function handleSaveSettings() {
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaveMsg("✅ Settings saved!");
      } else {
        setSaveMsg("❌ Failed to save. Try again.");
      }
    } catch {
      setSaveMsg("❌ Network error.");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 3000);
    }
  }

  const loadModels = useCallback(async () => {
    setModelsLoading(true);
    setModelsError("");
    try {
      const res = await fetch("/api/models");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load models");
      setModels(data.models);
    } catch (err: unknown) {
      setModelsError(err instanceof Error ? err.message : String(err));
    } finally {
      setModelsLoading(false);
    }
  }, []);

  async function handleSendChat() {
    if (!chatInput.trim() || chatLoading) return;

    const userMsg: Message = { role: "user", content: chatInput.trim() };
    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setChatMessages([
          ...newMessages,
          { role: "assistant", content: `ERROR: ${data.error}` },
        ]);
      } else {
        setChatMessages([
          ...newMessages,
          { role: "assistant", content: data.reply },
        ]);
      }
    } catch {
      setChatMessages([
        ...newMessages,
        { role: "assistant", content: "Network error — could not reach AI." },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  const isFreeModel = (m: OpenRouterModel) =>
    parseFloat(m.pricing?.prompt ?? "1") === 0 &&
    parseFloat(m.pricing?.completion ?? "1") === 0;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur
                         sticky top-0 z-10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center
                          justify-center shadow-lg shadow-brand-600/30">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.19 5.44 3.14 7.17.16.13.25.31.26.52l.05 1.62c.04.51.54.84 1.01.63L8.53 20.7a.96.96 0 0 1 .64-.04c.93.27 1.91.41 2.93.41 5.64 0 10-4.13 10-9.7S17.64 2 12 2z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-none">Messenger AI Bot</h1>
            <p className="text-xs text-slate-500 mt-0.5">Admin Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 bg-emerald-500/10
                          border border-emerald-500/20 text-emerald-400 text-xs
                          font-medium px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            Webhook Active
          </div>
          <button onClick={handleLogout}
                  className="btn-secondary flex items-center gap-1.5 py-1.5 px-3">
            <IconLogout /> <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* ── Two-column layout ─────────────────────────────────────────────── */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0 overflow-hidden"
            style={{ height: "calc(100vh - 57px)" }}>

        {/* ═══════════════════════════════════════════════════════════════════
            LEFT — Bot Settings
            ═══════════════════════════════════════════════════════════════════ */}
        <section className="border-r border-slate-800 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">⚙️ Bot Settings</h2>
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="btn-primary flex items-center gap-1.5 py-1.5 px-3"
            >
              <IconSave />
              {saving ? "Saving…" : "Save All"}
            </button>
          </div>

          {saveMsg && (
            <div className={`text-sm rounded-lg px-3 py-2 border ${
              saveMsg.startsWith("✅")
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-red-500/10 text-red-400 border-red-500/20"
            }`}>
              {saveMsg}
            </div>
          )}

          {/* OpenRouter API Key */}
          <div className="card p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider
                           flex items-center gap-2">
              <span className="text-amber-400">🔑</span> OpenRouter API Key
            </h3>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                className="input pr-10"
                placeholder="sk-or-v1-..."
                value={settings.openrouterApiKey}
                onChange={(e) => setSettings({ ...settings, openrouterApiKey: e.target.value })}
              />
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500
                           hover:text-slate-300 transition-colors"
              >
                <IconEye show={showApiKey} />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Get your key at{" "}
              <a href="https://openrouter.ai/keys" target="_blank" rel="noopener"
                 className="text-brand-400 hover:underline">
                openrouter.ai/keys
              </a>
            </p>
          </div>

          {/* Model selection */}
          <div className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider
                             flex items-center gap-2">
                <span className="text-purple-400">🤖</span> AI Model
              </h3>
              <button
                onClick={loadModels}
                disabled={modelsLoading}
                className="btn-secondary py-1 px-2.5 flex items-center gap-1.5 text-xs"
              >
                <IconRefresh />
                {modelsLoading ? "Loading…" : "Load Models"}
              </button>
            </div>

            {modelsError && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20
                            rounded px-2 py-1.5">
                {modelsError}
              </p>
            )}

            {models.length > 0 ? (
              <select
                className="input"
                value={settings.model}
                onChange={(e) => setSettings({ ...settings, model: e.target.value })}
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {isFreeModel(m) ? "🆓 " : "💰 "}{m.name} ({m.id})
                  </option>
                ))}
              </select>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  className="input font-mono text-xs"
                  placeholder="e.g. openai/gpt-3.5-turbo"
                  value={settings.model}
                  onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                />
                <p className="text-xs text-slate-500">
                  Type a model ID manually, or click "Load Models" to browse all.
                </p>
              </div>
            )}

            {models.length > 0 && (
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1"><span className="badge-free">FREE</span> = $0 cost</span>
                <span className="flex items-center gap-1"><span className="badge-paid">PAID</span> = per token</span>
              </div>
            )}
          </div>

          {/* System Prompt */}
          <div className="card p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider
                           flex items-center gap-2">
              <span className="text-blue-400">📝</span> Bot Personality & Instructions
            </h3>
            <p className="text-xs text-slate-500">
              Describe your business, how the bot should behave, what it should/shouldn't say.
              The bot always detects the customer's language and replies in the same language.
            </p>
            <textarea
              className="textarea h-48"
              placeholder={`Example:\nYou are a customer support agent for Ezuvex Digital Agency.\nWe offer SEO, Google Ads, Meta Ads, and web development services.\nAlways be friendly and professional.\nDetect the customer's language and reply in the same language.\nIf asked about pricing, ask them to describe their project first.`}
              value={settings.systemPrompt}
              onChange={(e) => setSettings({ ...settings, systemPrompt: e.target.value })}
            />
          </div>

          {/* Discounts & Events */}
          <div className="card p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider
                           flex items-center gap-2">
              <span className="text-emerald-400">🏷️</span> Current Discounts & Events
            </h3>
            <p className="text-xs text-slate-500">
              Add any active deals, promotions, or events here. The bot will mention them
              when relevant. Leave empty if none.
            </p>
            <textarea
              className="textarea h-28"
              placeholder={`Example:\n- 20% OFF all SEO packages this month!\n- Free website audit for new clients\n- Eid Special: 30% discount on Google Ads setup`}
              value={settings.discounts}
              onChange={(e) => setSettings({ ...settings, discounts: e.target.value })}
            />
          </div>

          {/* Webhook info */}
          <div className="card p-4 space-y-2 bg-slate-800/50">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              📡 Webhook URL (for Facebook)
            </h3>
            <div className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2
                            font-mono text-xs text-brand-400 break-all">
              {typeof window !== "undefined"
                ? `${window.location.origin}/api/webhook`
                : "https://your-domain.vercel.app/api/webhook"}
            </div>
            <p className="text-xs text-slate-500">
              Copy this URL into your Facebook App → Messenger → Webhooks → Callback URL.
              Set Verify Token to match your <code className="text-brand-400">FACEBOOK_VERIFY_TOKEN</code> env var.
            </p>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════
            RIGHT — Chat Tester
            ═══════════════════════════════════════════════════════════════════ */}
        <section className="flex flex-col overflow-hidden">
          {/* Chat header */}
          <div className="border-b border-slate-800 px-4 py-3 flex items-center
                          justify-between bg-slate-900/50 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-purple-600
                              rounded-full flex items-center justify-center text-sm">
                🤖
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Chat Tester</p>
                <p className="text-xs text-slate-500">Test your bot without touching Facebook</p>
              </div>
            </div>
            <button
              onClick={() => setChatMessages([])}
              className="btn-secondary py-1 px-2.5 flex items-center gap-1.5 text-xs"
              title="Clear chat"
            >
              <IconTrash /> Clear
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {chatMessages.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center
                              text-center text-slate-600 py-12">
                <div className="text-4xl mb-3">💬</div>
                <p className="text-sm font-medium text-slate-500">No messages yet</p>
                <p className="text-xs text-slate-600 mt-1 max-w-xs">
                  Type a message below to test how your bot responds. 
                  Remember to save settings first!
                </p>
              </div>
            )}

            {chatMessages.map((msg, i) => {
              const isError = msg.role === "assistant" && msg.content.startsWith("ERROR:");
              return (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={
                    msg.role === "user"
                      ? "bubble-user"
                      : isError
                        ? "bubble-error"
                        : "bubble-bot"
                  }>
                    {msg.content}
                  </div>
                </div>
              );
            })}

            {chatLoading && (
              <div className="flex justify-start">
                <TypingIndicator />
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-slate-800 p-3 flex-shrink-0 bg-slate-900/50">
            <div className="flex gap-2">
              <input
                type="text"
                className="input flex-1"
                placeholder="Type a test message…"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendChat();
                  }
                }}
                disabled={chatLoading}
              />
              <button
                onClick={handleSendChat}
                disabled={chatLoading || !chatInput.trim()}
                className="btn-primary px-3 py-2"
                title="Send (Enter)"
              >
                <IconSend />
              </button>
            </div>
            <p className="text-xs text-slate-600 mt-1.5 text-center">
              Press Enter to send · This chat is only for testing, not saved to Facebook
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
