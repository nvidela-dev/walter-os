import { getProviders } from "./actions";
import { ProvidersPageClient } from "./providers-page-client";

export default async function ProvidersPage() {
  const providers = await getProviders();

  return <ProvidersPageClient providers={providers} />;
}
