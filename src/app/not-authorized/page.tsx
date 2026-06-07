import type { ReactElement } from "react";

import { t } from "@/i18n";

import { SignOutActionButton } from "./sign-out-action-button";

/**
 * Landing page for signed-in users whose email is not on the allowlist
 * (see `src/lib/auth/allowlist.ts`). Public route — the middleware redirects
 * disallowed users here, so it must not itself require authorization.
 */
export default function NotAuthorizedPage(): ReactElement {
  return (
    <div className="ios-screen flex items-center justify-center px-5 py-8 text-center">
      <div className="ios-panel-strong w-full max-w-sm space-y-6 p-7">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-[#1f2d35]">{t.auth.deniedTitle}</h1>
          <p className="text-sm text-[#526b74]">{t.auth.deniedBody}</p>
        </div>
        <SignOutActionButton label={t.auth.signOut} />
      </div>
    </div>
  );
}
