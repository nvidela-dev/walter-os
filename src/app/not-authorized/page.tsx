import { SignOutButton } from "@clerk/nextjs";
import type { ReactElement } from "react";

import { t } from "@/i18n";

/**
 * Landing page for signed-in users whose email is not on the allowlist
 * (see `src/lib/auth/allowlist.ts`). Public route — the middleware redirects
 * disallowed users here, so it must not itself require authorization.
 */
export default function NotAuthorizedPage(): ReactElement {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#faf8f5] px-6 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-[#3d3530]">{t.auth.deniedTitle}</h1>
        <p className="text-sm text-[#8b7355]">{t.auth.deniedBody}</p>
      </div>
      <SignOutButton>
        <button
          type="button"
          className="rounded-2xl bg-[#c4a77d] px-6 py-3 text-sm font-medium text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          {t.auth.signOut}
        </button>
      </SignOutButton>
    </div>
  );
}
