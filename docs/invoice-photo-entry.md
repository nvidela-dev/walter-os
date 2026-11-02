# Invoice photos

`/invoices/new` now accepts a camera photo or JPG/PNG/WebP upload, extracts a draft, and requires explicit human review before saving. Existing manual entry remains available without an OpenAI key.

## Setup and release

1. Create a project API key in the OpenAI Platform account with access to Responses. API usage needs its own billing; a ChatGPT subscription is not assumed to cover it. Put `OPENAI_API_KEY` in the hosting project's server environment settings (or ignored `.env.local` for local use). Never paste it into chat, a client variable, or source control.
2. Optional: set `OPENAI_INVOICE_MODEL`. The default is the documented vision/structured-output snapshot `gpt-4.1-mini-2025-04-14`. A replacement must support image inputs and strict JSON-schema Responses output.
3. Review migration `0028_clammy_tigra.sql`, which adds only persistent quota counters. The existing inventory bootstrap includes this migration and checks its columns/constraints. Test on an isolated database before release; take the normal production backup before applying. No production migration was run during implementation.
4. Merge/deploy only through the normal reviewed release process. This feature branch disables its automatic Vercel deployments because this project's configured build command also runs database preparation. `npm run build` alone does not run that preparation.
5. Verify one known, non-sensitive invoice on a phone with the configured API account. Confirm the extracted text, units, final total, and saved price history. A real model call cannot be verified without the configured key/account.

## Review and accounting boundaries

- Names match only when exactly equal after case/accent/space normalization, and only when unique. These are suggestions, never proof of identity. All supplier/product selectors remain editable.
- Unknown values remain blank. Selecting a product preserves the scanned unit price instead of substituting the catalog price. Original descriptions, quantities, units, prices and line amounts remain alongside each editable line. The full original is available above the form and can be opened for closer inspection.
- The operator must verify units and pack sizes; no automatic conversions happen. Only supplier-linked active products pass the existing save use case.
- The application uses UYU amounts and has no separate invoice tax, discount or currency columns. Extracted taxes, discounts, adjustment explanations and warnings are shown. The operator enters/verifies the final UYU total; the sum of individually rounded line totals must equal it exactly, on both client and server. Do not distribute taxes/discounts into catalog prices merely to force a match. If the existing representation cannot faithfully express the invoice, do not save it.
- Changes to reviewed fields invalidate the review checkbox. Unknown totals require manual completion. Foreign-currency invoices require a separate future accounting design; this flow does not convert currencies.
- One photo per draft. Multi-page invoices require manual completion and confirmation that no lines/pages are missing. HEIC/PDF are not accepted; export a JPG first.
- Save uses the existing validation, provider/product checks, atomic product-invoice batch and append-only price history. Provider debt remains manual.

## Retries and duplicate detection

The form generates one submission UUID on its first save attempt and reuses it until navigation. The server derives an actor-scoped invoice ID from it. Retries return the already-created invoice; competing inserts conflict on the existing invoice primary key, rolling back the entire losing batch, including price history. A synchronous client lock also blocks double clicks.

A new submission with the same supplier, date and normalized invoice number is rejected with a duplicate warning. This is a likely-duplicate check, not a new global unique constraint: simultaneous independent drafts can race, missing numbers cannot identify duplicates, and reloading the page starts a new draft. It does not use image hashes or deduplicate unrelated documents automatically.

## Limits and retention

- Extraction authenticates and requires main-app access before reading the image. It rejects cross-origin requests and validates actual JPEG/PNG/WebP signatures, type and byte size, including streamed bodies with no length header.
- Browser-native image resizing limits the long edge to 2200 pixels and converts to JPEG without metadata. Originals are capped at 20 MB/40 megapixels; server uploads at 3 MB. No OCR/AI SDK is bundled on the phone.
- OpenAI requests use a 45-second timeout, no automatic retries, an 8000-output-token cap and `store: false`. The browser request times out after 60 seconds. Errors do not expose API responses or log images/keys.
- Database counters enforce a 15-second actor cooldown, 30 attempts per actor/day, and 200 global attempts/day, in America/Montevideo. Counters are atomic across instances. Failed attempts consume quota; a rejected user attempt can also consume a global slot. One rolling row per actor and one global row are retained, with actor ID, day, count and timestamp only. Missing quota infrastructure fails closed.
- Original photos stay in browser memory/object URLs; the resized image transits the application server and OpenAI. Walter does not write either image to disk or database. Extracted drafts are discarded on navigation/reload; only confirmed invoice fields and manually entered notes persist. `store: false` is not a promise of zero provider retention: OpenAI's applicable abuse-monitoring/data policies still apply.

## Official references

- [Image inputs](https://developers.openai.com/api/docs/guides/images-vision)
- [Structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [Default model capabilities](https://developers.openai.com/api/docs/models/gpt-4.1-mini)
- [Vercel branch deployment controls](https://vercel.com/docs/project-configuration/git-configuration#git.deploymentenabled)
