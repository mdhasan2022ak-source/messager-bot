import { cookies } from "next/headers";

const SESSION_COOKIE = "bot_admin_session";
const SESSION_VALUE = "authenticated";

export function isAuthenticated(): boolean {
  try {
    const cookieStore = cookies();
    const session = cookieStore.get(SESSION_COOKIE);
    return session?.value === SESSION_VALUE;
  } catch {
    return false;
  }
}

export function checkPassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    console.error("ADMIN_PASSWORD env var not set!");
    return false;
  }
  return password === adminPassword;
}

export { SESSION_COOKIE, SESSION_VALUE };
