import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

/**
 * Get the current session in a Server Component or Server Action.
 * Redirects to /sign-in if no session is found.
 */
export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return session;
}

/**
 * Get the current session without redirecting.
 * Returns null if no session.
 */
export async function getOptionalSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}
