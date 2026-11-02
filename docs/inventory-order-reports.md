# Inventory records and provider orders

Food inventory has a **Crear pedidos** tab. Drinks has the same tab within Alcoholes, Cervezas and Refrescos. Each report starts independently from a selected weekly food run or dated drinks document.

The report uses saved counts and current stock targets and catalogue provider links. Food counts sum active fridge placements against the product-wide target. Drink counts and per-location targets sum by canonical product identity, within the selected category only. Missing locations/counts, missing targets and mismatched units stay unresolved; zero is a valid count. No packaging conversions, purchase rounding, cost estimates or supplier provenance are inferred.

Choose one provider when a product has several. Review quantities, date, units and excluded rows, then explicitly confirm generation. Each provider gets a plain-text message and copy button. Unresolved rows remain listed outside the messages. Going back or changing provider selection requires confirmation again. Reports are temporary browser views, not saved orders or proof of transmission.

Deletion is available inside a saved inventory. Drinks: creator or Admin. Shared food weeks: Admin. Both require explicit confirmation, and server-side revision checks reject stale deletion. Whole food deletion removes the run, snapshots and observations for that week and recalculates remaining snapshot differences. Whole drinks deletion removes the document and its actor/time edit events. Catalogue products, provider links, targets and other inventory records remain.

Migration 0029 adds scoped deletion functions and transaction-local guards; normal count/edit-log immutability remains enabled. Deployment bootstrap installs both functions together and refuses a partial installation. No inventory is deleted by the migration itself.
