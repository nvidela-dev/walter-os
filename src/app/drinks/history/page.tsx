import { redirect } from "next/navigation";

import { requireAccess } from "@/lib/auth/access";
import { drinkCategory, drinkHref } from "@/lib/drinks/categories";
export default async function DrinksHistoryPage({searchParams}:{searchParams:Promise<{category?:string}>}):Promise<never>{
 await requireAccess("drinks");redirect(drinkHref("/drinks",drinkCategory((await searchParams).category)));
}
