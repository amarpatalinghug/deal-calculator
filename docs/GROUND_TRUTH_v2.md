# GROUND_TRUTH.md — v2.1 (SUPERSEDES v1)
Expected ENGINE_VERSION in js/app.js: **2.1.0**
Source: live deployment at amarpatalinghug.github.io/deal-calculator, fetched from the GitHub repo main branch on 2026-07-03. v1 (built from the 2026-07-02 uploaded file) is OBSOLETE — production had already diverged. This document is the authoritative baseline for all "preserve exactly" constraints.

---

## 1. Architecture (confirmed — replaces v1 §1)

- **Multi-file static PWA, no build step, no framework:**
  - `index.html` (626 lines) — markup for 4 tabs
  - `css/style.css` (255) — full visual system (v1 §2 palette unchanged, verified)
  - `js/app.js` (452) — entire calc engine
  - `js/pwa.js` — registers `service-worker.js`
  - `service-worker.js` — app-shell cache, `CACHE_NAME = 'deal-calculator-v6'`
  - `manifest.json` — installable PWA, standalone display, dark theme
- **Four tabs:** `turo`, `land`, `brrrr`, `multi`
- Still zero persistence (no localStorage/Firebase). Phase 4/5 storage remains greenfield.
- **⚠ DEPLOY RULE:** service worker caches the app shell. Every deploy that changes any cached file MUST bump `CACHE_NAME` (v5 → v6 …) or family members' installed apps serve stale code indefinitely. This is the #1 operational footgun for a shared PWA.
- CLAUDE.md's "single-file HTML architecture" constraint is obsolete → replace with the above.

## 2. Turo calculator (changed since v1)

**Inputs:** unchanged from v1 §3, PLUS:
- `t-seasonal` checkbox (default off)
- `t-occ-summer` 10–90/5 (default 65), `t-occ-winter` 10–90/5 (default 35) — shown only when seasonal is on; flat `t-occ` hidden when on

**Formulas — flat mode:** identical to v1 §3 (verified line-for-line).

**Formulas — seasonal mode (NEW):**
```
daysS/daysW = round(occS|occW × 30.4)
netSmo = rate×daysS×plan − totalExp ;  netWmo = rate×daysW×plan − totalExp
netYr  = netSmo×6 + netWmo×6
netMo  = netYr / 12                       // blended
bookedDays (display) = round((daysS+daysW)/2) ;  grossMo (display) = avg
```
ROI, break-even, payback, verdict thresholds, metric colors, buffer build: same formulas as v1, fed the blended netMo/netYr.

**Known quirks (document, don't silently change):**
- Q-T1: Stress grid always uses flat scenarios (35/50/65% occ) even in seasonal mode — the "Realistic (50%)" cell can disagree with the blended base case.
- Q-T2: Phase 4's "variance flag vs seasonal projection" is NOT implemented (no actuals tracking exists yet). Seasonal projection math above is what that flag must compare against.

## 3. Land calculator (changed since v1)

**Inputs:** v1 §4 unchanged, PLUS `l-rehab` (Site Prep / Rehab Budget) 0–30000/250, default 0.

**Changed formulas:**
```
cashDeployed = downPayment + rehab            // was: downPayment only
netMargin    = resale − price − totalInt − taxProrated − close − rehab
annROI       = netMargin / cashDeployed × (12/hold) × 100
```
Stress grid includes −rehab and uses cashDeployed denominator (consistent). All verdict thresholds and colors unchanged from v1.

**Assumptions:** rehab paid in cash (not financed); buyer-side closing costs still excluded from cashDeployed (v1 issue 6.5 only PARTIALLY addressed — see §6).

## 4. BRRRR calculator (changed since v1)

Formulas, thresholds, verdicts: identical to v1 §5 (verified), PLUS:
- `b-delay-toggle` (+6mo Rehab Delay, default off): when on, ONLY the ARV stress grid recomputes with `stressHold = hold + 6` (extra HM interest + carry in `stressTotalIn`). Main metrics/verdict are unaffected by the toggle — documented behavior, not a bug.

**Engine 2.1.0 changes:** new input `b-ti` (Taxes+Insurance /mo, 0–800/10, default 250). Formulas now:
```
pi   = amortized P&I(refiCashOut, refiR, 360)
opex = rent × opexPct            // excludes T&I (separate input)
noi  = rent − opex − ti
cf   = noi − pi
dscr = noi / pi                  // matches Multifamily definition
```
Default-case verdict is now NO-GO (CF −$88, DSCR 0.88) — the honest result. 6.3 remains caption-documented, not modeled.

## 5. Multifamily calculator (NEW — first audit)

**Inputs:** units 2–50/1 (8) · price 100k–3M/10k (850k) · dp% 15–40/5 (25) · rate 5–10/0.25 (7.00) · term 15–30yr/5 (30) · rent/unit 400–3000/25 (1100) · other income 0–2000/25 (200) · vacancy% 0–20/1 (7) · opex % of EGI 20–60/5 (40)

**Formulas:**
```
gpr         = rent × units
grossIncome = gpr + other
vacancyLoss = grossIncome × vacancy        // vacancy applied to other income too (see A-M1)
egi         = grossIncome − vacancyLoss
opex        = egi × opexPct
noiMo       = egi − opex ;  noiYr = noiMo × 12
capRate     = noiYr / price × 100
downPayment = price × dp ;  loanAmt = price × (1−dp)
debtService = amortized P&I(loanAmt, rate, term)     // shared amortPayment(), handles 0% rate
dscr        = noiMo / debtService          // ✓ CORRECT standard definition
cf          = noiMo − debtService
coc         = cf × 12 / downPayment × 100
```
**Sanity check at defaults:** NOI $5,022/mo · cap 7.1% · debt service $4,241 · DSCR 1.18 · CF $781/mo · CoC 4.4% → verdict MARGINAL. Internally consistent (verified: DSCR ≥ 1.1 mathematically guarantees CoC > 0, so the MARGINAL branch can't mask negative cash flow).

**Verdict:** GO if dscr ≥ 1.25 AND coc ≥ 8 · MARGINAL if dscr ≥ 1.1 · else NO-GO.
**Colors:** dscr ≥1.25 blue / ≥1.1 amber / red · coc ≥8 blue / ≥0 amber / red · cf >0 green/red · cap always blue (no thresholds).
**Stress (hardcoded):** Vacancy +5pts · Base · Vacancy −3pts · Rate +1% · Rate +2% · OpEx +10pts. Rate shocks re-amortize the full loan at the new rate (models underwriting a new loan, not payment shock on an existing one). Vacancy/opex clamped to [0,1], rate to ≥0.

**Assumptions (document):**
- A-M1: vacancy is applied to other income, not just GPR — slightly conservative vs. convention; acceptable.
- A-M2: CoC denominator = down payment only; acquisition closing costs (~2–3% ≈ $17–25k at default price) excluded → CoC overstated (same class as land 6.5).
- A-M3: no explicit capex reserve — assumed inside the 40% opex; must be stated in UI or docs.
- A-M4: NO-GO reason text ("rent doesn't clear debt service") is wrong for DSCR 1.00–1.09, where rent does clear it. Wording only.

## 6. Discrepancy log v2 — Amar decision required per row

| # | Status | Issue | Materiality |
|---|---|---|---|
| 6.1 | **FIXED 2.1.0** | BRRRR DSCR = rent/piti; shows 1.87 at defaults vs 1.22 standard | HIGH |
| 6.8 | **FIXED 2.1.0** | Cross-tab inconsistency: Multifamily uses correct NOI/DS (app.js:386), BRRRR doesn't. Same metric name + same "≥1.25" hint, two definitions. Blocks any cross-type compare view (Phase 5 P0.2). Fix = 1 line: `dscr = (rent − opex) / piti` | **CRITICAL for Phase 5** |
| 6.2 | **FIXED 2.1.0** | BRRRR "PITI" is P&I only; T+I absent unless implicitly in 35% opex (undocumented) | HIGH |
| 6.3 | CAPTIONED 2.1.0 | BRRRR omits HM points, rehab-draw interest, refi closing costs → cashLeft understated ~$5–10k | MED-HIGH |
| 6.4 | STILL LIVE | Turo damage deductible displayed, unused in math; 90 Plan strictly dominates | MED |
| 6.5 | CAPTIONED 2.1.0 | Land ROI denominator now includes rehab (good) but still excludes closing costs; Multifamily CoC repeats the pattern (A-M2) | MED |
| 6.6 | **FIXED 2.1.0** | No guards for netMo ≤ 0 (payback shows negative months; buffer table breaks) | LOW |
| 6.7 | STILL LIVE | Stale static placeholders (b-dscr "1.22", m-* all "$0"/GO); overwritten at init | LOW |
| 6.9 | NEW | Turo stress grid ignores seasonal mode (Q-T1) | LOW |
| 6.10 | **FIXED 2.1.0** | Multifamily NO-GO wording wrong for DSCR 1.0–1.09 (A-M4) | LOW |

## 7. Changes since v1 baseline (drift record)

| Area | v1 (uploaded file) | v2 (production) |
|---|---|---|
| Architecture | Single file, 995 lines | 4-file static PWA + SW cache |
| Tabs | 3 | 4 (+ Multifamily) |
| Turo | Flat occupancy only | + Seasonal mode (summer/winter, 6+6 mo blend) |
| Land | No rehab | + Rehab input; ROI denominator broadened |
| BRRRR | No delay stress | + optional +6mo delay on ARV stress grid |
| DSCR definitions | 1 (wrong) | 2 (one wrong, one right) |

## 8. Build rules (replaces v1 §7)

1. Formulas in §2–§5 are verbatim law unless a §6 row is approved `[FIXED]`.
2. Input element ids are the de facto API — never rename.
3. Bump `CACHE_NAME` on every deploy touching cached files.
4. New tabs/features must use the shared `amortPayment()`, `fmt()`, `pct()`, `setVerdict()` utilities — no duplicated math helpers (the 6.1/6.8 split is what duplication produces).
5. One DSCR definition app-wide once 6.8 is resolved; the "≥1.25 preferred" hint stays calibrated to NOI/debt-service.
6. Stale placeholders (6.7) may be corrected freely.
7. Phase 5 deal snapshots must record `engineVersion`; bump it whenever any §2–§5 formula or §6 fix lands.
