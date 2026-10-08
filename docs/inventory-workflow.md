# Inventory: kitchen counts, target stock, and purchases

This document records the requested workflow and distinguishes it from the
current implementation. Repository inspection: **2026-10-07**, based on commit
`e7fe957`. This is a documentation-only review; no production inspection or
application changes were made for this document.

Kitchen staff inspect each fridge, report how much stock exists, and add missing
products in their actual fridge locations. One shared inventory covers Tuesday
through Monday. After counting, the intended next step is to compare stock with
the active target quantity and group the resulting purchase needs by supplier.

## Workflow and current coverage

| Step | Required behavior | Current implementation |
| --- | --- | --- |
| Inspect fridges | Kitchen staff inspect each fridge and report its inventory status. | Fridge pages, quantity edits, notes, and a wizard with one step per fridge exist. No completed or reviewed status is persisted. |
| Add products | Every inventory product has a fridge placement. | Kitchen users can associate an existing product or create a product and placement together. A product can occupy multiple fridges. |
| Count stock | Record the actual quantity and unit for each product in each fridge. | Implemented. Blank means unreviewed; explicit zero means none remains. |
| Maintain the weekly inventory | Tuesday–Monday edits belong to one shared weekly instance. | Implemented through weekly date normalization, a unique date, and a constraint requiring that date to be Tuesday. |
| Maintain target stock | Each product has a target quantity, its own history, and only one active target at a time. | Intended; no target persistence, history, or editing UI was found. Target scope still needs a decision. |
| Calculate purchases | Compare observed stock with the applicable target. | Intended; current differences compare inventories with each other. |
| Group by supplier | Use existing product–supplier links to organize purchase quantities. | Links and supplier display exist. Purchase calculation, supplier selection, and grouped purchase output do not. |

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
active placements. Decide whether the intended rule requires preventing that
state or simply treating such a product as outside the active inventory.

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
| Weekly inventory history | How much was recorded for each fridge/product in each inventory week? | Implemented through `inventarios` and `inventario_items`; the history screen displays the latest summary for each week. |
| Count audit history | Who recorded which quantity, and when, including corrections within a week? | Immutable `observaciones_inventario` rows retain the quantity, unit, user, and timestamp. The weekly history screen does not expose every audit correction. |
| Target-stock history | What quantity did we intend to maintain, and how did that target change? | Required but unimplemented. It needs its own historical records and one active target at a time for the chosen scope. |

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

## Target quantities and purchase needs — intended behavior

Each inventory product should have a target stock quantity and unit. Changing
that plan should preserve the prior target in its own history, while leaving
only one target active at a time. This history must not be inferred from observed
counts, supplier package quantities, or previous purchases.

For a known observed quantity and applicable target in compatible units:

```text
purchase shortage = max(target stock - observed stock, 0)
```

For example, a target of 12 kg and observed stock of 8 kg gives a 4 kg shortage.
Observed stock of 15 kg gives a zero shortage. That shortage is distinct from the
signed change since the preceding inventory.

Before implementing this calculation, settle the target scope:

- **Global product target:** compare against the complete sum across its fridge
  placements. A partial sum cannot stand for a complete count.
- **Product/fridge target:** compare each location with its own active target.
  Decide whether excess in one fridge can offset a shortage in another before
  aggregating purchases; moving stock may be different from buying it.

The user requirement is one active target at a time. The scope above determines
whether that uniqueness applies to a product or to a product/fridge pair. Neither
choice is established by the current schema.

## From shortages to supplier groups — intended behavior

Existing `proveedor_productos` links associate products with suppliers and carry
price and package quantity. Products may have no supplier or several suppliers.
The inventory currently displays those links; it does not select a supplier or
produce purchase groups.

After calculating valid shortages, assign each shortage to the selected supplier
and group the purchase lines by supplier. Retain product identities and units in
each group; quantities in different units cannot be combined into a single
supplier total. A supplier link identifies a purchasing option, not proof of who
supplied the observed stock.

| Situation | What is known | Rule still required |
| --- | --- | --- |
| Missing count | Stock is unknown; blank is not zero. | How to handle incomplete inventory when preparing a purchase list. Do not present a shortage as final from unknown stock. |
| Missing target | Observed stock may be known, but no desired level is defined. | How to surface and resolve the missing target; do not assume a zero target. |
| Incompatible units | Stock and target cannot yet be compared. | Supported conversions and their source; no automatic kg/unit conversion is established. |
| No supplier | A shortage can exist without a supplier link. | How unresolved purchase lines are shown or assigned. |
| Multiple suppliers | Several links are valid. | Manual choice, preferred supplier, split purchase, or another explicit policy. Do not duplicate the shortage across suppliers. |
| Package quantities | Supplier links have a package quantity. | Meaning/unit compatibility, whole-package rounding, and whether the displayed amount is stock units or packages. |
| Target changes during/after a week | A target history is required. | Whether a purchase calculation uses the currently active target or the target effective at inventory time; how past calculations are reproduced. |

Sources: [supplier/product relationship](../src/db/schema/provider-products.ts),
[item detail queries](../src/lib/queries/inventory-items.ts),
[item stock and supplier display](../src/app/inventory/items/[id]/page.tsx).

## Polishing gaps verified in the repository

1. Target quantities, their history and active-target enforcement still need
   implementation. Purchase shortages and supplier grouping also need implementation.
2. The history screen still says “Un inventario por día” (“One inventory per day”)
   even though its date cards and database behavior are weekly. This document
   records the mismatch without changing the screen.
3. The older [inventory implementation notes](inventory.md) contain superseded
   daily-run and 168-hour comparison descriptions. Their final weekly paragraph
   supersedes the daily rule; current inventory screens use weekly run snapshots.
4. The wizard reports unreviewed fields but does not persist a completed, reviewed,
   or approved status. Define what “inventory status” must mean operationally.
5. Kitchen users can count and add inventory products; supplier link management
   is in the main application, which is restricted to Admin. Permissions for
   editing targets and resolving suppliers remain undecided.

Access sources: [group policy](../src/lib/auth/policy.ts),
[inventory mutation authorization](../src/lib/actions/inventory.ts).

Verification for this document consists of reading the schema, migrations,
actions, queries, and screens linked above and checking the Markdown's local
references. It does not establish current production contents or runtime behavior.
