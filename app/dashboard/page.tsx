import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { getSettings } from "@/lib/kv";
import DashboardClient from "@/components/DashboardClient";

export default async function DashboardPage() {
  if (!isAuthenticated()) redirect("/login");

  const settings = await getSettings();

  // Mask API key for client
  const clientSettings = {
    ...settings,
    openrouterApiKey: settings.openrouterApiKey
      ? "sk-or-••••••••" + settings.openrouterApiKey.slice(-4)
      : "",
  };

  return <DashboardClient initialSettings={clientSettings} />;
}
