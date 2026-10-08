# Clear mobile design

The launcher at `/` keeps its wallpaper, glass groups, and colorful app icons.
Every work screen uses a white background and solid surfaces. This includes
inventory, history, target stock, purchases, suppliers, invoices, employees,
recipes, menu, access management, and the dashboard.

## Visual rules

- White canvas; slate text and dividers; blue primary actions. Status colors keep
  their meaning and have readable contrast on white.
- Solid cards with fine borders. Blur and translucent panels are scoped to
  `.home-screen`; modal backdrops only dim the page.
- Consistent page widths, spacing, headers, rounded controls, and visible focus.
- Inputs use 16px text; shared buttons and icon controls have 44px touch targets.
  Browser zoom is enabled, and reduced-motion preferences are respected.
- Fridge colors are restrained header accents; their contents remain white.
- The dashboard has a light palette and larger rows; its detail panes take the
  full phone width while retaining a split view on larger screens.
- No stock, targets, purchasing, authorization, or database rules change.

The semantic styles live in `src/app/globals.css` and the shared UI components.
Work screens use `app-*` surfaces. Legacy global color/blur overrides were removed;
new pages should use the same solid surfaces rather than reintroducing glass.

## Presentation previews

These screenshots use synthetic data, the compiled application stylesheet, and
shared UI components. They demonstrate the design; they are not screenshots of
signed-in production records or proof of every end-to-end workflow.

### Home: retained glass

![Launcher with glass groups](home.jpg)

### Inventory: white work screens

![White inventory overview](inventory.jpg)

### Counting and forms

![Readable stock rows and solid form controls](count.jpg)

### Suppliers

![Clear supplier list](providers.jpg)

### Purchases

![Supplier groups and unresolved items](purchases.jpg)

## Verification

The existing 140 tests, lint, type checking, and production build pass. Visual
previews were inspected at phone widths; DOM checks at 320px and 390px confirmed
no horizontal overflow on the sampled screens, with a 768px inventory check as
well. Computed styles confirmed a white work-screen background, 16px input text,
no blurred work panels, and `blur(28px)` on home glass. Both prefixed and standard
backdrop-filter declarations survive CSS compilation.
