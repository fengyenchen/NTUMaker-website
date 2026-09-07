import { NextRequest, NextResponse } from "next/server";

const apiUrl = process.env.API_URL ?? "http://localhost:8000";

function taipeiDate(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export async function middleware(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("returnTo", request.nextUrl.pathname);

  try {
    const response = await fetch(`${apiUrl}/api/v1/auth/me`, {
      headers: { cookie: request.headers.get("cookie") ?? "" },
      cache: "no-store",
    });
    if (!response.ok) return NextResponse.redirect(loginUrl);

    const user = await response.json() as { roles: string[]; membership_expires_at: string | null };
    if (request.nextUrl.pathname.startsWith("/admin") && !user.roles.includes("admin")) {
      return NextResponse.redirect(new URL("/learn", request.url));
    }
    if (request.nextUrl.pathname.startsWith("/learn")) {
      const activeMember = user.roles.includes("admin") || (user.membership_expires_at && user.membership_expires_at >= taipeiDate());
      if (!activeMember) return NextResponse.redirect(new URL("/resources", request.url));
    }
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(loginUrl);
  }
}

export const config = { matcher: ["/learn/:path*", "/admin/:path*"] };
