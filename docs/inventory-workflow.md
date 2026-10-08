# Inventory: kitchen counts, target stock, and purchases

This document records the requested workflow and distinguishes it from the
current implementation. Repository inspection: **2026-10-07**, based on commit
`e7fe957`. This document now includes the implementation decisions in the three inventory
PRs: counting progress, target-stock history, and supplier-grouped purchase
planning. It describes repository behavior rather than confirming live data.

Kitchen staff inspect each fridge, report how much stock exists, and add missing
products in their actual fridge locations. One shared inventory covers Tuesday
through Monday. After counting, the purchase screen compares stock with the active target
quantity and groups the resulting purchase needs by supplier.

## Workflow and current coverage

| Step | Required behavior | Current implementation |
| --- | --- | --- |
| Inspect fridges | Kitchen staff inspect each fridge and report its inventory status. | Fridge pages, quantity edits, notes, and a wizard with one step per fridge exist. Counted/unreviewed progress is derived from saved quantities for active placements; no approval status is persisted. |
| Add products | Every inventory product has a fridge placement. | Kitchen users can associate an existing product or create a product and placement together. A product can occupy multiple fridges. |
| Count stock | Record the actual quantity and unit for each product in each fridge. | Implemented. Blank means unreviewed; explicit zero means none remains. |
| Maintain the weekly inventory | Tuesday–Monday edits belong to one shared weekly instance. | Implemented through weekly date normalization, a unique date, and a constraint requiring that date to be Tuesday. |
| Maintain target stock | Each product has a target quantity, its own history, and only one active target at a time. | Implemented with immutable revisions and one active target pointer per product. Admin can edit; Kitchen can read. Targets are global per product across all active fridge placements. |
| Calculate purchases | Compare observed stock with the applicable target. | Implemented separately as a nonnegative target shortage. The existing stock-change display still compares inventories with each other. |
| Group by supplier | Use existing product–supplier links to organize purchase quantities. | Implemented. A sole supplier is selected automatically; multiple suppliers require a manual choice for the current view. |

## Products and fridge placement

`productos` is the shared product catalogue. `heladera_productos` associates a
product with a fridge; quantities are recorded against that pair. This allows
one product, such as rice, to exist in two fridges without creating two product
identities.

The inventory product creation action requires an active fridge and creates the
product and placement atomically. Counting validates that the product belongs to
that fridge and its membership is active. Database foreign keys also require a
placement for every observation. These safeguards implement the placement rule
for inventory counts; they do **not** require every product in the wider
catalogue to have a fridge.

Removing an inventory entry currently hides its fridge membership, preserving
the product and past observations. A product can therefore have no remaining
active placements. Products without active fridge placements are outside the active inventory.
Their catalogue identity and historical records remain intact.

Sources: [inventory schema](../src/db/schema/inventory.ts),
[product schema](../src/db/schema/products.ts),
[inventory actions](../src/lib/actions/inventory.ts),
[input validation](../src/lib/validators/inventory.ts).

## One inventory per week

The week uses **America/Montevideo**, beginning Tuesday and ending Monday.
Its identifier is the Tuesday date. All kitchen users share the same instance.
For example:

- Tuesday October 6 creates **Martes 6 de octubre** (Tuesday October 6).
- Friday October 9 corrections update that same inventory.
- Monday October 12 still belongs to that inventory.
- Tuesday October 13 begins **Martes 13 de octubre** (Tuesday October 13).

The Spanish labels above are the actual inventory labels shown by the application.
The database stores the latest count for each weekly inventory/fridge/product
in `inventario_items`. Starting the same week again reuses its header; saving
counts updates that week's summary. The wizard detects an existing inventory
for the current week, prompts the user to edit it, and preloads its counts.
A new week's uncounted products stay unknown rather than inheriting old counts.

The rule means **at most one instance per week**, with an instance created when
started or first counted. There is no scheduled process that creates an inventory
for every calendar week. Whether staff must finish an inventory each week is a
separate operational requirement, without completion enforcement today.

Sources: [weekly migration and count trigger](../drizzle/0017_weekly_inventory.sql),
[start/edit actions](../src/lib/actions/inventory.ts),
[week and label formatting](../src/lib/inventory/run-display.ts),
[wizard page](../src/app/inventory/new/page.tsx),
[wizard interaction](../src/app/inventory/new/wizard.tsx).

## Inventory history versus target-stock history

These answer different questions and must remain separate:

| History | Question answered | Status |
| --- | --- | --- |
| Weekly inventory history | How much was recorded for each fridge/product in each inventory week? | Implemented through `inventarios` and `inventario_items`; the history list links each week to its own detail page containing that week's saved summary. |
| Count audit history | Who recorded which quantity, and when, including corrections within a week? | Immutable `observaciones_inventario` rows retain the quantity, unit, user, and timestamp. The weekly history screen does not expose every audit correction. |
| Target-stock history | What quantity did we intend to maintain, and how did that target change? | Implemented separately in `historial_objetivos_inventario`, with one active revision referenced by `objetivos_inventario_activos`. |

A Friday correction replaces the displayed weekly quantity but appends a count
observation, preserving the earlier measurement in the audit history. This does
not create a second weekly inventory. Notes edited without a quantity update do
not create an observation or a new historical weekly snapshot; shared notes and
fridge commentary are not a complete audit of all edits.

Current `cambio` is observed stock minus the comparable stock in the previous
inventory. It can be positive, negative, or zero. A missing previous item or a
changed unit prevents comparison. The initial inventory has no prior comparison.
This difference neither measures consumption nor calculates what to purchase.

Sources: [append-only observations](../drizzle/0012_inventory.sql),
[weekly snapshots](../drizzle/0017_weekly_inventory.sql),
[run queries](../src/lib/queries/inventory-runs.ts),
[history UI](../src/app/inventory/history/page.tsx).

## Target quantities and purchase needs

Each inventory product can now have a target stock quantity and unit. Changing
that plan preserves the prior target in its own history, while leaving
only one target active at a time. This history must not be inferred from observed
counts, supplier package quantities, or previous purchases.

For a known observed quantity and applicable target in compatible units:

```text
purchase shortage = max(target stock - observed stock, 0)
```

For example, a target of 12 kg and observed stock of 8 kg gives a 4 kg shortage.
Observed stock of 15 kg gives a zero shortage. That shortage is distinct from the
signed change since the preceding inventory.

Implementation uses a **global product target**. The alternatives below explain the chosen scope and what a future per-fridge model would change:

- **Global product target:** compare against the complete sum across its fridge
  placements. A partial sum cannot stand for a complete count.
- **Product/fridge target:** compare each location with its own active target.
  Decide whether excess in one fridge can offset a shortage in another before
  aggregating purchases; moving stock may be different from buying it.

There is one active target per product. Inserting an immutable revision atomically
advances its active pointer. The product key prevents multiple active pointers;
a composite foreign key prevents referring to another product's target. The
quantity and unit are preserved in every revision. Target edits require Admin
access on the server; Kitchen has read access. No default targets are seeded.

Sources: [target schema](../src/db/schema/inventory-targets.ts),
[target migration](../drizzle/0018_inventory_stock_targets.sql),
[target actions](../src/lib/actions/inventory-targets.ts),
[target history screen](../src/app/inventory/items/[id]/targets/page.tsx).

## From shortages to supplier groups

Existing `proveedor_productos` links associate products with suppliers and carry
price and package quantity. Products may have no supplier or several suppliers.
The purchase screen automatically uses the sole linked supplier. When several
are linked, the user chooses one. The selection applies only to the current view;
there is no saved preferred supplier, purchase order, or automatic sending.

The screen assigns each valid shortage to its selected supplier and groups
the purchase lines by supplier. Retain product identities and units in
each group; quantities in different units cannot be combined into a single
supplier total. A supplier link identifies a purchasing option, not proof of who
supplied the observed stock.

| Situation | What is known | Implemented rule or remaining decision |
| --- | --- | --- |
| Missing count | Stock is unknown; blank is not zero. | The product stays unresolved and is excluded from purchase groups until every active placement is counted. |
| Missing target | Observed stock may be known, but no desired level is defined. | The product stays unresolved with a link to its detail. Admin can define a target; no zero is assumed. |
| Incompatible units | Stock and target cannot yet be compared. | The product stays unresolved. No automatic conversion is performed; compatible targets and counts are required. |
| No supplier | A shortage can exist without a supplier link. | The shortage is shown separately until an Admin associates a supplier through the existing catalogue workflow. |
| Multiple suppliers | Several links are valid. | Manual selection assigns the entire shortage to one linked supplier. Changing or clearing the selection moves that line; it is never duplicated across suppliers. Preferred suppliers and split purchases are not implemented. |
| Package quantities | Supplier links have a package quantity. | The display uses stock units and does not round to packages. Package conversion and whole-package rounding still need an explicit rule. |
| Target changes during/after a week | A target history is required. | The screen uses the currently active target and the latest saved weekly inventory. It is a live planning view; purchase calculations are not persisted as historical orders. Reproducing past purchase plans remains outside this implementation. |

Sources: [supplier/product relationship](../src/db/schema/provider-products.ts),
[item detail queries](../src/lib/queries/inventory-items.ts),
[item stock and supplier display](../src/app/inventory/items/[id]/page.tsx).

## Polishing gaps verified in the repository

1. Global targets, immutable target history, and a single active target are
   implemented. `/inventory/purchases` calculates shortages and groups them by
   supplier, keeping incomplete or ambiguous lines separate.
2. The history screen now describes one inventory per Tuesday–Monday week. Fridge
   home shows current-week progress and offers starting or editing that week.
3. The older [inventory implementation notes](inventory.md) contain superseded
   daily-run and 168-hour comparison descriptions. Their final weekly paragraph
   supersedes the daily rule; current inventory screens use weekly run snapshots.
4. Inventory status reports saved counts versus active product placements, including
   explicit zeros. Empty fridges are not labeled complete. This is counting progress,
   not an approval state; a separate approval workflow remains undefined.
5. Kitchen users can count and add inventory products; supplier link management
   is in the main application, which is restricted to Admin. Target edits require Admin; Kitchen can read them and prepare the purchase
   view, including selecting among existing supplier links.

Access sources: [group policy](../src/lib/auth/policy.ts),
[inventory mutation authorization](../src/lib/actions/inventory.ts).

Implementation tests cover exact decimal shortages across fridges, zero counts,
partial totals, missing targets, unit mismatches, active target changes, new-week
counts, hidden placements, and supplier selection without duplication.

Sources: [purchase calculation and grouping](../src/lib/inventory/purchases.ts),
[purchase queries](../src/lib/queries/inventory-purchases.ts),
[purchase screen](../src/app/inventory/purchases/page.tsx).

The view is available to Kitchen and Admin from fridge home, latest inventory,
and the wizard result. It identifies when the latest inventory is from an older
week. No completion approval, package conversions, purchase-order history, or
external supplier messaging has been added. Local tests and document references
do not establish current production contents or signed-in production behavior.
