import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Himoyalangan sahifalar. Bu faqat qulaylik uchun yo'naltirish — haqiqiy himoya har bir API da (requireUser/requireAdmin).
const PROTECTED = ["/dashboard", "/character", "/profile", "/inventory", "/store", "/missions", "/arena", "/leaderboard", "/countries", "/teams", "/friends", "/community", "/world", "/notifications", "/settings", "/admin"];
const GUEST_ONLY = ["/login", "/register"];

async function isLoggedIn(req: NextRequest) {
  const token = req.cookies.get("xeron_session")?.value;
  const secret = process.env.AUTH_SECRET;
  if (!token || !secret) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const needsAuth = PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const guestOnly = GUEST_ONLY.includes(pathname);
  if (!needsAuth && !guestOnly) return NextResponse.next();

  const logged = await isLoggedIn(req);
  if (needsAuth && !logged) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }
  if (guestOnly && logged) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"] };