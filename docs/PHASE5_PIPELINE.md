# PHASE5_PIPELINE.md — Deal Pipeline & Capture Spec (Addendum to CLAUDE.md)
Status: DRAFT — blocked on prerequisites P0.1–P0.3 below. Tag protocol: all items here are `[ADDED]`.

---

## P0 — Prerequisites (must complete before any Phase 5 code)

| # | Item | Why it blocks |
|---|---|---|
| P0.1 | Regenerate GROUND_TRUTH.md from the live repo (`index.html`, `js/app.js`, `css/style.css`) — the 2026-07-02 upload is stale; production has 4 tabs, multi-file architecture, PWA | All "preserve exactly" constraints currently point at the wrong baseline |
| P0.2 | Resolve DSCR inconsistency: BRRRR `rent/piti` (app.js:277) vs Multifamily `NOI/debtService` (app.js:386). One definition app-wide (standard: NOI ÷ debt service) | Compare view ranks deals on this number across tabs |
| P0.3 | Amar verdict on remaining 6.x items (PITI label, HM points/refi costs, Turo deductible, land ROI denominator, negative-netMo guards) | Deal snapshots store `engineVersion`; freeze the engine before snapshotting begins |
| P0.4 | Update CLAUDE.md: replace "single-file HTML" constraint with "multi-file static PWA (index.html / css / js), no build step, no framework" | Builder will otherwise 'restore' single-file and destroy the PWA |

## P1 — Deal Pipeline (the cart)

**Concept:** every calculator state can be saved as a Deal. Deals live in a shared Firestore collection; pipeline board + compare view render them.

### Data model (Firestore `deals` collection)
```json
{
  "id": "auto",
  "type": "turo | land | brrrr | multi",
  "title": "2019 Camry — FB Marketplace",
  "status": "inbox | analyzing | offer | owned | passed",
  "source": {
    "url": "https://... (nullable)",
    "domain": "auto-derived",
    "pastedText": "raw capture, max 20k chars",
    "capturedAt": "ISO"
  },
  "inputs": { "<every calculator input id>": "value" },
  "fieldProvenance": { "<input id>": "fact | est | assume" },
  "snapshot": {
    "engineVersion": "semver of calc engine at save time",
    "verdict": "go | marginal | nogo",
    "keyMetrics": { "roi": 0, "netMo": 0, "cashDeployed": 0, "dscr": 0 }
  },
  "notes": "",
  "createdBy": "family member id",
  "createdAt": "ISO", "updatedAt": "ISO"
}
```

### Rules
1. **Inputs are authoritative; metrics are derived.** Display always recomputes from `inputs` with the current engine. `snapshot` is the audit record of what the verdict was at capture (feeds the existing Phase 4 threshold change log).
2. `engineVersion` bumps on any formula/threshold change. Compare view badges deals whose snapshot verdict ≠ current-engine verdict ("verdict changed since capture").
3. `status: owned` deals ARE the Phase 4 asset ledger entries — one collection, no parallel system. Ledger transactions reference `dealId`.
4. Offline: reuse the Phase 4 IndexedDB queue for deal writes.
5. Firestore Spark budget: a deal doc ≈ 3–8 KB; free tier (1 GiB, 50k reads/day) supports thousands of deals for 6 users. Non-issue; note in docs.

### Views
- **Pipeline board:** columns by status, cards show title, type icon, verdict chip, ROI/$ deployed, age.
- **Compare view:** table of selected deals — ROI, cash deployed, net monthly, payback, DSCR (single definition per P0.2), verdict. Sortable. Cross-type comparison uses ROI per $ deployed + payback as the common axes.
- **Capital allocator (P1.5, optional):** input available cash → greedy rank of deal combinations by blended annualized ROI, respecting one-deal-per-listing. Label output "ranking, not advice."

## P2 — Capture ("dropbox for data")

**Flow:** ➕ Capture → paste text or URL → parser prefills → user confirms highlighted gaps → deal saved to Inbox.

### Parser (client-side, zero dependencies)
- Domain → type routing: turo.com/cars.com/autotrader/craigslist-cars → turo; landwatch/land.com/landsearch → land; zillow/redfin/realtor → brrrr or multi (units>1 or "multifamily" → multi).
- Field regexes (per type): `$[\d,]+` price candidates (largest plausible = list price), `(\d+(\.\d+)?)\s*acres`, `(\d+)\s*bed`, `(\d+(\.\d+)?)\s*bath`, `([\d,]+)\s*sq\s*\.?ft`, `(19|20)\d{2}` year, `([\d,]+)\s*miles`, `rent\D{0,10}\$([\d,]+)`.
- Extracted → `fieldProvenance: fact`. Untouched defaults → `assume`. UI: fact fields green-tagged; assume fields amber-tagged; verdict card shows "N unconfirmed assumptions" until each amber field is tapped/edited or explicitly confirmed.
- **Never auto-save.** Parse → review → save. The confirmation screen is the guard against false-precision GO verdicts.
- URLs are stored, never fetched. (CORS + bot-blocking + ToS make client scraping non-viable; do not attempt, do not add a proxy for this.)

### Share sheet
- `manifest.json` gains `share_target` (GET, text/url params) → opens Capture prefilled. Android/Chrome only; document iOS limitation (paste flow instead).

## P3 — AI extraction (DEFERRED — build only if P2 regex proves insufficient in real use)
- Path A (preferred): Cloudflare Worker free tier holds Anthropic API key; family passcode header; Worker rate-limits. Consistent with free-tier-only constraint.
- Path B: per-user API key in localStorage. Zero infra; each member manages own key.
- Input: pasted text or screenshot → Claude vision → JSON matching `inputs` schema → same review screen as P2. Provenance tag: `est` (AI-extracted ≠ fact).
- Decision gate: adopt only after ≥2 weeks of P2 usage shows regex failure rate the family actually feels.

## Anti-goals (explicitly out of scope)
- Automatic scraping of listing URLs (technically blocked, ToS-hostile, fragile)
- Live market data feeds / comps APIs (paid, violates constraint)
- Auto-verdict without human confirmation of assumption fields
- Any framework, bundler, or build step

## Success criteria
1. A family member goes from Zillow listing → saved, verdict-ed deal in < 60 seconds on mobile.
2. Two deals of different types can be compared on ROI/$ and payback in one view.
3. Zero deals in Firestore with unconfirmed assumptions marked as facts.
4. Owned deals appear in the asset ledger with no duplicate entry.
