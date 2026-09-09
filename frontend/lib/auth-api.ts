import "server-only";

import { cookies } from "next/headers";

export type CurrentUser = {
  id: string;
  email: string;
  display_name: string | null;
  roles: string[];
  membership_expires_at: string | null;
};

export type MemberResource = {
  id: string;
  session_id: string | null;
  title: string;
  description: string;
  resource_type: string;
  url: string | null;
  visibility: "public" | "member";
};

const apiUrl = (process.env.API_URL ?? "http://localhost:8000").replace(/\/$/, "");

async function sessionCookie(): Promise<string> {
  return (await cookies()).toString();
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const response = await fetch(`${apiUrl}/api/v1/auth/me`, {
      headers: { cookie: await sessionCookie() },
      cache: "no-store",
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

export async function getMemberResources(): Promise<MemberResource[]> {
  try {
    const response = await fetch(`${apiUrl}/api/v1/content/member-resources`, {
      headers: { cookie: await sessionCookie() },
      cache: "no-store",
    });
    if (!response.ok) return [];
    return response.json();
  } catch {
    return [];
  }
}
