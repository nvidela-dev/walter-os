import { asc } from "drizzle-orm";
import type { ReactElement } from "react";

import { db } from "@/db";
import { products } from "@/db/schema";
import { getManualPhotos } from "@/lib/actions/manual-catalogue";
import { requireAccess } from "@/lib/auth/access";
import { getFridges } from "@/lib/queries/inventory";
import { getUnits } from "@/lib/queries/units";

import { ManualReview } from "./review";

export const dynamic = "force-dynamic";
export default async function ReviewPage(): Promise<ReactElement> {
  const userId = await requireAccess("inventory");
  const [photos, fridges, units, catalogue] = await Promise.all([getManualPhotos(), getFridges(), getUnits(), db.select({ id: products.id, name: products.name, unitId: products.unitId }).from(products).orderBy(asc(products.name))]);
  return <ManualReview userId={userId} photos={photos} fridges={fridges.map(({ id, number, name }) => ({ id, number, name }))} units={units} catalogue={catalogue} />;
}
