import { clerkClient, clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getAccessGroup } from "@/lib/auth/access";
import { routeDecision } from "@/lib/auth/policy";

/**
 * Routes reachable without passing the allowlist:
 *  - Clerk's hosted sign-in / sign-up flows.
 *  - The "access denied" page itself (otherwise denied users redirect-loop).
 */
const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)", "/not-authorized"]);

export const proxy = clerkMiddleware(async (auth, request) => {
  if (isPublicRoute(request)) return;

  // 1. Authentication: must be signed in. Clerk redirects to sign-in if not.
  await auth.protect();

  // 2. Authorize the requested area. Actions also enforce their own access
  //    boundary: a main-app action must not trust an inventory POST URL.
  const { userId } = await auth();
  if (userId == null) return;

  const user = await (await clerkClient()).users.getUser(userId);
  const email = user.primaryEmailAddress;
  const group = email?.verification?.status === "verified"
    ? await getAccessGroup(email.emailAddress)
    : null;
  const decision = routeDecision(group, request.nextUrl.pathname, request.method);
  if (decision === "forbidden") return new NextResponse(null, { status: 403 });
  if (decision !== "allow") {
    const destination = decision === "inventory" ? "/inventory" : decision === "drinks" ? "/drinks" : "/not-authorized";
    return NextResponse.redirect(new URL(destination, request.url));
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
