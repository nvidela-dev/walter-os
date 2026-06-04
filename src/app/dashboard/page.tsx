import type { ReactElement } from "react";

import { ProviderTree } from "./provider-tree";
import { getProviderTree } from "./queries";

export const dynamic = "force-dynamic";

export default async function DashboardPage(): Promise<ReactElement> {
  const providers = await getProviderTree();
  return <ProviderTree providers={providers} />;
}
