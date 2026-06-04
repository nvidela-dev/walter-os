import { SignIn } from "@clerk/nextjs";
import type { ReactElement } from "react";

export default function SignInPage(): ReactElement {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn />
    </div>
  );
}
