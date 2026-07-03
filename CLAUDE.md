# CLAUDE.md — Family Asset Deal Calculator
Owner: Amar. Purpose: decision-support tool (GO/MARGINAL/NO-GO) for family LLC investments (Turo cars, land flips, BRRRR rentals, multifamily) in Atlanta, GA. Used by 4–6 family members, mobile-first.

## SESSION PROTOCOL (non-negotiable, every session)
### On session start — drift check
1. Read docs/GROUND_TRUTH_v2.md. Diff its formulas/thresholds against js/app.js.
2. Verify ENGINE_VERSION in js/app.js matches the version in GROUND_TRUTH (currently 2.1.0).
3. On ANY mismatch: HALT and report to Amar. Do not build on an unverified baseline.

### Definition of Done — a change is incomplete until ALL are true
Any commit touching formulas, thresholds, verdict logic, or input elements must:
1. Update the matching section of docs/GROUND_TRUTH_v2.md in the same commit
2. Bump ENGINE_VERSION in js/app.js (fix = patch, new input/threshold = minor, new tab/engine = major)
3. Bump CACHE_NAME in service-worker.js
4. Append a CHANGELOG.md entry tagged [ADDED]/[CHANGED]/[FIXED] with the GROUND_TRUTH 6.x ID where applicable

## ARCHITECTURE (hard constraints)
- Multi-file static PWA: index.html, css/style.css, js/app.js, js/pwa.js, service-worker.js, manifest.json
- No build step, no framework, no bundler, no paid services (Firebase Spark tier only when persistence lands)
- Input element ids are the de facto API — never rename
- Preserve the dark terminal visual system (CSS variables in style.css) exactly
- Service worker caches the app shell: CACHE_NAME bump required on every deploy that changes cached files

## APPROVED DISCREPANCY DECISIONS (Amar, 2026-07-03)
Per docs/GROUND_TRUTH_v2.md §6 — implemented in engine 2.1.0:
- FIXED: 6.1/6.8 (DSCR = NOI/debt service app-wide), 6.2 (T&I input in BRRRR), 6.6 (netMo≤0 guards), 6.10 (verdict wording)
- CAPTION ONLY (no formula change): 6.3 (HM points/refi costs), 6.5/A-M2 (denominator exclusions)
- DEFERRED: 6.4 (Turo deductible), 6.9 (seasonal stress grid)
Any 6.x item not listed must not be touched without new approval from Amar.

## ROADMAP
- Phase 4 (spec'd, not built): asset ledger, tax export grouped by asset type, Turo CSV import, receipt photos via IndexedDB queue, JSON backup/import, threshold change log
- Phase 5 (spec: docs/PHASE5_PIPELINE.md): deal pipeline ("cart"), paste-to-parse capture, deferred AI extraction. P0 prerequisites in that doc are now satisfied by engine 2.1.0 except committing this repo state.
- Anti-goals: URL scraping, paid APIs, frameworks, auto-verdicts without human confirmation of assumptions

## PROCESS RULES
- Phased delivery with explicit Amar approval gates between phases
- Spec changes tagged [ADDED]/[CHANGED]/[FIXED] for independent review
- Phase 5 deal snapshots must record ENGINE_VERSION
