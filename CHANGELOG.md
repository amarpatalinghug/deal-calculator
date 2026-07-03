# CHANGELOG

## 2.1.0 — 2026-07-03 (engine fixes per GROUND_TRUTH v2 §6; approved by Amar)
- [FIXED 6.1/6.8] BRRRR DSCR now NOI ÷ debt service, matching Multifamily. One definition app-wide.
- [FIXED 6.2] BRRRR adds "Taxes + Insurance /mo" input (default $250); cash flow = rent − opex − T&I − P&I. "PITI" label corrected to "P&I"; opex now explicitly excludes T&I.
- [FIXED 6.6] Turo payback shows "—" when net monthly ≤ 0; buffer table shows "nothing to set aside" instead of nonsense negatives.
- [FIXED 6.10] Multifamily NO-GO reason reworded (was wrong for DSCR 1.00–1.09).
- [CHANGED 6.3 — caption only] Cash Left metric notes it excludes HM points & refi closing costs.
- [CHANGED 6.5/A-M2 — caption only] Land ROI and Multifamily CoC captions state denominator exclusions.
- [CHANGED] ENGINE_VERSION constant added (2.1.0). CACHE_NAME bumped v5 → v6.
- ⚠ VERDICT CHANGE AT DEFAULTS: BRRRR default example is now NO-GO (CF −$88/mo, DSCR 0.88) vs old MARGINAL (CF +$162, DSCR 1.87). The old engine overstated cash flow by omitting taxes+insurance and inflated DSCR by using gross rent. The new numbers are the honest ones.
- Deferred (unchanged, per approval): 6.4 Turo deductible unused in math · 6.9 seasonal stress grid mismatch.
