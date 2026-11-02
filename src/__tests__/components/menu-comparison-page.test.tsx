import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

vi.mock("@/lib/queries/menu-versions",()=>({getActiveMenuVersion:vi.fn(),getMenuVersion:vi.fn(),getMenuVersions:vi.fn()}));
vi.mock("next/navigation",()=>({notFound:()=>{throw new Error("Not found");}}));

import CompareMenuPage from "@/app/menu/compare/page";
import type { menuVersions } from "@/db/schema";
import { getActiveMenuVersion, getMenuVersion, getMenuVersions } from "@/lib/queries/menu-versions";

const version=(id:string,name="Don Juan"):typeof menuVersions.$inferSelect=>({id,menuName:name,status:"submitted",baseVersionId:null,revision:0,createdAt:new Date(),createdBy:"admin",submittedAt:new Date(),submittedBy:"admin",document:{sections:[],items:[]}});
it("compares within the historical menu family and excludes other families from choices",async()=>{
 const old=version("old");
 vi.mocked(getMenuVersion).mockResolvedValue(old);
 vi.mocked(getActiveMenuVersion).mockResolvedValue(version("active"));
 vi.mocked(getMenuVersions).mockResolvedValue([old,version("active"),version("other","Genüsse")]);
 render(await CompareMenuPage({searchParams:Promise.resolve({version:"old",family:"Genüsse"})}));
 expect(getActiveMenuVersion).toHaveBeenCalledWith("Don Juan");
 expect(screen.getAllByRole("option")).toHaveLength(1);
 expect(screen.getByRole("heading",{name:"Comparar menús · Don Juan"})).toBeInTheDocument();
});
it("rejects draft versions as historical comparison sources",async()=>{
 vi.mocked(getMenuVersion).mockResolvedValue({...version("draft"),status:"draft"});
 await expect(CompareMenuPage({searchParams:Promise.resolve({version:"draft"})})).rejects.toThrow("Not found");
});
