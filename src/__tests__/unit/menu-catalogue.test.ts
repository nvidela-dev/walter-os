import { randomUUID } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";

import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/access", () => ({ requireAccess: vi.fn(() => Promise.resolve("admin")) }));
vi.mock("@/db", async () => {
  const { drizzle } = await import("drizzle-orm/pglite");
  const client = new PGlite();
  return { db: drizzle(client), testClient: client };
});
import { createMenuItem, saveMenuSection, updateMenuItem } from "@/lib/actions/menu";
import { requireAccess } from "@/lib/auth/access";
import { getMenuItem, getMenuItems, getMenuSections } from "@/lib/queries/menu";
import { menuItemInputSchema } from "@/lib/validators/menu";

let client: PGlite;
beforeAll(async () => {
  const moduleData = await import("@/db");
  const value: unknown = Reflect.get(moduleData, "testClient");
  if (!(value instanceof PGlite)) throw new Error("Missing test database");
  client = value;
  for (const file of readdirSync("drizzle").filter((name) => name.endsWith(".sql")).sort()) await client.exec(`BEGIN;${  readFileSync(`drizzle/${  file}`, "utf8")  };COMMIT;`);
}, 30000);
afterAll(async () => { await client.close(); });
it("stores separate menus, sized prices and unknown prices without creating inventory or recipe identities", async () => {
  await saveMenuSection(null, { menuName: "Don Juan", name: "Cervezas", sortOrder: 1 });
  await saveMenuSection(null, { menuName: "Genüsse", name: "Cervezas", sortOrder: 1 });
  const sections = await getMenuSections();
  for (const section of sections) {
    expect((await createMenuItem({ name: "Corona 710 ml", sellPrice: section.menuName === "Don Juan" ? "350" : "300", sectionId: section.id })).ok).toBe(true);
  }
  const created = await createMenuItem({ name: "Pizza", sellPrice: null, sectionId: sections[0]?.id, priceOptions: [{ label: "Picetas", price: "250" }, { label: "Pizzas", price: "400" }], reviewNote: "Revisar" });
  if (!created.ok) throw new Error("Menu creation failed");
  const item = await getMenuItem(created.data.id);
  expect(item).toMatchObject({ sellPrice: null, recipeId: null, priceOptions: [{ label: "Picetas", price: "250.00" }, { label: "Pizzas", price: "400.00" }] });
  expect((await getMenuItems()).filter((row) => row.name === "Corona 710 ml").map((row) => [row.menuName, row.sellPrice])).toEqual([["Don Juan","350.00"],["Genüsse","300.00"]]);
  expect((await updateMenuItem(created.data.id, { name: "Pizza editada", sellPrice: "450", sectionId: sections[1]?.id, description: "Descripción editable", priceOptions: [] })).ok).toBe(true);
  const section = sections[1];
  if (section === undefined) throw new Error("Missing section");
  await saveMenuSection(section.id, { menuName: section.menuName, name: "Bebidas", sortOrder: 2 });
  expect((await getMenuItems()).find((row) => row.id === created.data.id)).toMatchObject({ name: "Pizza editada", sectionName: "Bebidas", sellPrice: "450.00" });
  for (const table of ["productos","recetas","proveedor_productos","inventario_bebidas_productos","observaciones_bebidas"]) expect((await client.query(`SELECT * FROM ${  table}`)).rows).toHaveLength(0);
  expect((await createMenuItem({ name: "Bad", sellPrice: "-1", sectionId: randomUUID() })).ok).toBe(false);
});
it("validates the source transcription and keeps price conflicts and unreadable prices explicit", () => {
  const input: unknown = JSON.parse(readFileSync("scripts/data/menu-photos-2026-10-14.json", "utf8"));
  if (!Array.isArray(input)) throw new Error("Invalid source");
  for (const row of input) expect(menuItemInputSchema.safeParse(row).success).toBe(true);
  expect(input).toHaveLength(175);
  const parsed = input.map((row: unknown) => menuItemInputSchema.parse(row));
  expect(parsed.filter((row) => row.recipeId !== null)).toHaveLength(0);
  expect(parsed.find((row) => row.name === "Premium Smash")).toMatchObject({ sellPrice: null });
});
it("requires Admin for menu reads, item writes and section changes", async () => {
  for (const action of [
    () => getMenuItems(), () => getMenuSections(), () => createMenuItem({}),
    () => updateMenuItem(randomUUID(), {}), () => saveMenuSection(null, {}),
  ]) {
    vi.mocked(requireAccess).mockRejectedValueOnce(new Error("Denied"));
    await expect(action()).rejects.toThrow("Denied");
  }
});
