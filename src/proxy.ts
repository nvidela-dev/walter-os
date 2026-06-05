import { clerkClient, clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { isAllowedEmail } from "@/lib/auth/allowlist";

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

  // 2. Authorization: the signed-in email must be on the allowlist. This runs
  //    for navigations AND Server Action POSTs (both hit the page route), so a
  //    disallowed user can neither read pages nor invoke mutations.
  const { userId } = await auth();
  if (userId == null) return;

  const user = await (await clerkClient()).users.getUser(userId);
  const email = user.primaryEmailAddress?.emailAddress;

  if (!isAllowedEmail(email)) {
    return NextResponse.redirect(new URL("/not-authorized", request.url));
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
