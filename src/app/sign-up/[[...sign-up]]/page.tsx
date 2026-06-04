import { SignUp } from "@clerk/nextjs";
import type { ReactElement } from "react";

export default function SignUpPage(): ReactElement {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp />
    </div>
  );
}
