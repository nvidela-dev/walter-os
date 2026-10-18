# Shared interaction patterns

Use white surfaces, near-black text and primary actions, and emerald for selection and successful completion. Reserve red for destructive actions and errors. The launcher follows the same palette as work screens.

- Use `Button` for actions. Pass `busy` and a descriptive pending label when saving; this disables repeat activation and adds a spinner and aria-busy. Keep secondary actions outlined and destructive actions explicit.
- Use `NavigationLink` for navigation that benefits from a pending indicator. It uses Next's link status, so pending feedback follows navigation lifecycle rather than a timer.
- Use `TabLink` for route choices, with `selected` derived from the actual route and query. Use `secondary` for subordinate navigation.
- Use `FilterButton` for local filters and selections; it exposes aria-pressed. These are buttons, not ARIA tabs, so no tab-panel keyboard contract is implied.
- Use `FormMessage` for result feedback. Errors are alerts; success uses status. Never show success before an operation succeeds.
- Shared controls have 44px minimum targets, visible keyboard focus, immediate pressed states, and reduced-motion support. Do not add animation dependencies for these effects.
- Keep uploads progressive: choose/capture, preview/change, process, then review. Cancellation must preserve the previous selection.
- Disabled or future destinations should be labeled rather than linked to '#'.

The current changes do not alter access rules, inventory semantics, invoice extraction, or persistence. Device camera behavior and network latency still require a real-phone check.
