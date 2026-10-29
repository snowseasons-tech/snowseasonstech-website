# Documentation Platform — Plan

Source: the Snow Seasons Tech SaaS Documentation Workflow design (October 2026).
Status is as of 2026-10-29.

## Goal

One product definition → multiple professional documents → automated publishing → customer access.

The documentation becomes a versioned product deliverable, built and released alongside the software.

## Principles

- **Stripe is the price authority.** The registry stores Stripe product and price IDs, never a competing price list.
- **Documents state only verified features.** Templates render what the registry lists and never add features.
- **Legal terms come from counsel-approved templates.** The generator fills approved terms and does not invent obligations.
- **No autonomous publishing.** Generated drafts, including any AI-assisted ones, go through pull-request review.
- **API reference comes from the FastAPI OpenAPI schema,** not from an LLM reproducing it.
- **Private details stay out of customer docs:** internal endpoints, credentials, infrastructure diagrams.
- **Docusaurus publishes; it does not authorize.** Restricted files are served through the authenticated backend.

## Phase 1 — Documentation engine

Status: **built on branch `docs-platform-phase1`, PR #3, awaiting review.**

Done:
- Product registry as YAML (`products/<id>/product.yaml`), validated before every build
- Jinja2 templates: product overview, getting started, pricing sheet
- Markdown and DOCX output; PDF through pandoc when installed
- `manifest.json` per build (source hashes, warnings, skipped files)
- CLI: `python -m generator --product <id> | --all`, `--validate-only`, `--store <snowStore checkout>`
- Store integration: an entry with `catalog_id` takes name, version and blurb from snowStore's `api/_lib/catalog.js`
- Tests (16, one of them against the real catalog when `SNOWSTORE_DIR` is set) and a CI workflow

Not done:
- PDF output not yet verified. Needs pandoc and a LaTeX engine.
- The pilot `cdot-stations` is illustrative and not in the store catalog.
- The workflow runs only from the repo root, so it stays inactive while the folder is nested.

Exit criteria:
- Each pilot product validates with no warnings that block publication
- The product owner confirms its feature list and sets `features_confirmed: true`
- At least one product builds PDF, DOCX and Markdown on the CI or build host

## Phase 2 — Documentation website

Status: **scaffolded on branch `docs-platform-phase1`, not published.**

Done:
- Docusaurus 3.10.2 site in `docs-site/`, builds with `npm run build`
- Publish gate: a product is synced only when its features are confirmed and its status is not draft. Otherwise its docs are removed from the site.
- `python -m generator --all --docs-dir docs-site/docs` syncs approved products and reports the rest
- Tests for the gate and the sync
- `publish-docs.yml` workflow, manual trigger only, with an optional snowStore checkout
- Release notes generated from `products/<id>/changelog.yaml`. The newest release must match `product.version`, and the build refuses a product that lists `release_notes` without a valid changelog. No pilot product has a changelog yet, so none has release notes.

Not done:
- Company branding. The site uses the default theme with only the primary color changed.
- Enabling the push trigger and GitHub Pages. Needs the hosting decision below.
- Confirmed features. No product is published yet.

Decisions:
- Docusaurus over Material for MkDocs, which the design says enters maintenance mode with an end date of May 5, 2027. Verify before relying on that date.
- Hosting: GitHub Pages is the suggested default.
- Public address: `docs.snowseasonstech.net` is proposed only, not confirmed. Pass it to the build as `DOCS_URL`.

Exit criteria: public guides for the pilot product are live and linked from the product page.

## Phase 3 — Customer portal integration

Status: not started.

Scope:
- Documentation Center in the customer portal, with Getting Started, Product Guides, API Documentation, Downloads and Release Notes
- FastAPI authorization that checks entitlements
- Private documents served through short-lived signed URLs from S3 or R2
- Shared sign-in through an OIDC provider (provider not chosen)

Reuse candidate: the snowStore already has entitlement checks (`api/_lib/entitlements.js`) and signed download URLs (`api/_lib/fulfil.js`, `api/download.js`). Check those before writing new ones.

Exit criteria: an entitled customer sees and downloads only the documents their subscription allows.

## Launch gate

Each product release checks these documents, per the design:

| Document | MVP | Beta | Production |
|---|---|---|---|
| Product overview | required | required | required |
| Getting started | required | required | required |
| Feature list | required | required | required |
| Known limitations | required | required | required |
| Pricing terms | required | required | required |
| FAQ | optional | required | required |
| Full user manual | optional | required | required |
| API documentation | if applicable | if applicable | if applicable |
| Troubleshooting | basic | required | required |
| Release notes | required | required | required |
| Support procedures | basic | required | required |
| Security documentation | internal | internal | reviewed |
| Service agreement | if sold | required | required |

The current generator covers the product overview (which includes the feature list and known limitations), getting started, pricing terms, and release notes. The rest need new templates or source material.

## Later — AI-assisted drafting

Status: not started.

Scope: a local llama.cpp model drafts FAQs, onboarding steps and release summaries from README files, configuration, release notes and the OpenAPI schema. Every draft passes factual validation and human review before a pull request merges it.

## Open decisions

1. **Feature lists for each product.** Confirm the features and set `features_confirmed: true`.
2. **Stripe price IDs** for each plan. Plans currently show as unlinked.
3. **Status and support level** for each store product. The catalog holds neither.
4. **Repository location.** Keep the platform nested in the website repo, or move it to a dedicated repo as the design suggests.
5. **Legal templates.** Counsel must approve the terms before the generator uses them.
6. **OIDC provider** for customer sign-in.
7. **PDF toolchain** on the build host or in CI.
8. **Public docs domain.**

## Known issues

- The BookScan catalog blurb says "a live lookup", but its README says prices come from a built-in database, not live marketplace data. The generated overview repeats the blurb, so the conflict reaches customers. Fix the catalog blurb or override it in the docs entry.
- The workflow in `.github/workflows/` only runs from the repo root.
- Phase 1 products outside the store catalog need their own entries before they can be documented.
