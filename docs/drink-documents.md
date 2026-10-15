# Drinks inventory documents

`/drinks` lists saved documents within Alcoholes, Cervezas, or Refrescos. Choose
a date to create or open its document. A unique `(fecha, categoria)` constraint
prevents duplicate files, including simultaneous creation by different users.
Dates are actual calendar dates in America/Montevideo, not normalized weeks.

A document opens read-only at `/drinks/documents/[id]`. It shows the current saved
quantities compactly, with **Editar** available only to Admin or its creator.
Other drinks members may view it. Kitchen and unassigned users have no access.
The three category tabs return to the corresponding category's document list;
they never relabel a document or save counts across categories.

Editing prefills saved values. Empty is unknown; explicit zero is real zero.
Saving replaces the same document's current values and returns to its read-only
view. Search does not exclude hidden rows from the complete save. Failures leave
inputs intact. A revision check under a document row lock rejects stale saves;
users must reopen the latest document rather than silently overwrite another
person's work. Date, category, creator, and creation time are immutable.

Existing document rows retain their names, locations, and counting units. Newly
added active drinks in that category are offered during editing and become part
of the document when saved. Staff can still add drinks globally, but cannot edit
another person's document through that path. Admin alone manages targets,
visibility, and provider assignments.

The supplier view belongs to the selected saved document, not an inferred weekly
inventory. Each placement appears once. Several linked suppliers share one
clearly marked group; unknown suppliers remain unassigned. Links are current
catalogue information, not proof of who delivered the counted stock.

`documentos_bebidas.items` stores only the latest document state.
`ediciones_documentos_bebidas` stores document ID, event ID, actor ID/display name,
and timestamp. It contains no quantities, before/after values, or snapshots.
There is no rollback flow. New documents record their creator/time in metadata;
only subsequent saves add edit events. Unexpected save errors do not log payloads.

Migration `0027_drink_documents.sql` locks legacy observations and converts each
category/actual save date into a document. The earliest recorded author becomes
its creator. Latest per-item values, recorded names, units, and locations are
verified inside the migration before old observations are cleared. Legacy batch
save actor/timestamps become edit events, without counts. Existing categories
must be explicit; unknown categories stop migration. The old snapshot save path
is closed by a database trigger and its Server Action refuses writes. No prior
count values remain in app storage; private recovery backups are separate.

Bootstrap installs only a complete new schema, verifies guards, uniqueness, the
save function and an empty legacy count store, and fails on partial installations.
Menus, kitchen inventory, providers, targets, and drink catalogue rows are not
changed by the migration.
