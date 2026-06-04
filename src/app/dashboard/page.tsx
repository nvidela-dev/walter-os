import type { ReactElement } from "react";

import { getUnits } from "@/app/providers/actions";

import { ProviderTree } from "./provider-tree";
import { getProviderTree } from "./queries";

export const dynamic = "force-dynamic";

export default async function DashboardPage(): Promise<ReactElement> {
  const [providers, units] = await Promise.all([getProviderTree(), getUnits()]);
  return <ProviderTree providers={providers} units={units} />;
}
