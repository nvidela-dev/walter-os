# Menu drafts and price history

Admin opens `/menu`, chooses **Nuevo menú**, selects Don Juan or Genüsse,
and creates a copy of that family's latest submitted menu. Each family has its
own current version, drafts, and history. Menu data stays separate from inventory,
recipes, supplier purchase prices, and stock targets.

A draft supports editing names, descriptions, sections and ordering, sale prices,
size/option prices, and review notes. New items receive new identities; copied
items retain their identities through renames and section moves. Unknown prices
remain null. Each item must have a section before saving.

**Guardar y comparar** saves the complete draft and opens a comparison against
its base version of the same family. It shows new items with their sections,
removed items, renames, section moves, base-price changes, size/option changes,
and unchanged totals. Section names/order are compared separately. **Presentar
nuevo menú** freezes that complete version and makes it the current menu.
Submitted versions remain available in history with their original contents.

Draft saves use revision checks. Submission locks the menu family in Postgres
and checks the exact reviewed draft revision and latest submitted version in one
transaction. If either changed, submission fails and the admin must compare
again. Updating the comparison keeps the draft's complete contents; it does not
silently merge another admin's edits. Removed items therefore require review too.

Migration `0025_menu_versions.sql` adds `menu_versiones` and copies the existing
catalogue into one initial submitted snapshot per family. Original menu and
section rows remain unchanged. Database triggers reject modifications/deletions
of submitted snapshots. Legacy item/section actions refuse writes once versioning
is active; old item URLs return to `/menu`. New menu screens read versioned
contents. The legacy catalogue tables are retained for source/reference data;
legacy photo imports and direct legacy writes are blocked by database triggers once versioning is active.

Vercel's inventory bootstrap installs the migration once and verifies required
columns, the immutable trigger, and the atomic submission function. A partial
installation fails the deployment instead of recreating or replacing histories.
