// ─── UTILITIES ───────────────────────────────────────────────────────────────
const fmt = (n, dec=0) => n < 0
  ? '−$' + Math.abs(n).toLocaleString('en-US', {minimumFractionDigits:dec, maximumFractionDigits:dec})
    : '$' + n.toLocaleString('en-US', {minimumFractionDigits:dec, maximumFractionDigits:dec});

const pct = (n, dec=0) => n.toFixed(dec) + '%';

function setVerdict(cardId, textId, reasonId, value, reason) {
    const card = document.getElementById(cardId);
    const text = document.getElementById(textId);
    const reasonEl = document.getElementById(reasonId);
    card.className = 'verdict-card ' + value;
    text.textContent = value === 'go' ? 'GO' : value === 'marginal' ? 'MARGINAL' : 'NO-GO';
    reasonEl.textContent = reason;
}

function colorClass(val, pos, neg) {
    return val >= pos ? 'pos' : val <= neg ? 'neg' : 'calc';
}

// ─── TAB SWITCHING ───────────────────────────────────────────────────────────
function switchTab(tab) {
    ['turo','land','brrrr','multi'].forEach(t => {
          document.getElementById(t+'-inputs').style.display = t === tab ? 'block' : 'none';
          document.getElementById(t+'-outputs').style.display = t === tab ? 'contents' : 'none';
    });
    document.querySelectorAll('.tab').forEach((el, i) => {
          el.classList.toggle('active', ['turo','land','brrrr','multi'][i] === tab);
    });
}

// ─── TURO CALCULATOR ─────────────────────────────────────────────────────────
function calcTuro() {
    const price   = +document.getElementById('t-price').value;
    const recon   = +document.getElementById('t-recon').value;
    const rate    = +document.getElementById('t-rate').value;
    const occ     = +document.getElementById('t-occ').value / 100;
    const plan    = +document.getElementById('t-plan').value;
    const ins     = +document.getElementById('t-ins').value;
    const maint   = +document.getElementById('t-maint').value;
    const clean   = +document.getElementById('t-clean').value;

  // Update display values
  document.getElementById('t-price-v').textContent = fmt(price);
    document.getElementById('t-recon-v').textContent = fmt(recon);
    document.getElementById('t-rate-v').textContent  = fmt(rate);
    document.getElementById('t-occ-v').textContent   = pct(occ*100);
    document.getElementById('t-plan-v').textContent  = pct(plan*100);
    document.getElementById('t-ins-v').textContent   = fmt(ins);
    document.getElementById('t-maint-v').textContent = fmt(maint);
    document.getElementById('t-clean-v').textContent = fmt(clean);

  const totalCash   = price + recon;
    const totalExp    = ins + maint + clean;

  const seasonal = document.getElementById('t-seasonal').checked;
    document.getElementById('t-occ-field').style.display      = seasonal ? 'none' : 'block';
    document.getElementById('t-seasonal-fields').style.display = seasonal ? 'block' : 'none';

  let bookedDays, grossMo, turoCut, turoNet, netMo, netYr;

  if (seasonal) {
        const occSummer = +document.getElementById('t-occ-summer').value / 100;
        const occWinter = +document.getElementById('t-occ-winter').value / 100;
        document.getElementById('t-occ-summer-v').textContent = pct(occSummer*100);
        document.getElementById('t-occ-winter-v').textContent = pct(occWinter*100);

      const daysSummer  = Math.round(occSummer * 30.4);
        const daysWinter  = Math.round(occWinter * 30.4);
        const grossSummer = rate * daysSummer;
        const grossWinter = rate * daysWinter;
        const netSummerMo = grossSummer * plan - totalExp;
        const netWinterMo = grossWinter * plan - totalExp;

      bookedDays = Math.round((daysSummer + daysWinter) / 2);
        grossMo    = (grossSummer + grossWinter) / 2;
        turoCut    = grossMo * (1 - plan);
        turoNet    = grossMo * plan;
        netYr      = (netSummerMo * 6) + (netWinterMo * 6);
        netMo      = netYr / 12;
  } else {
        bookedDays = Math.round(occ * 30.4);
        grossMo    = rate * bookedDays;
        turoCut    = grossMo * (1 - plan);
        turoNet    = grossMo * plan;
        netMo      = turoNet - totalExp;
        netYr      = netMo * 12;
  }

  const roi         = (netYr / totalCash) * 100;
    const bedays      = totalExp / (rate * plan);
    const payback     = totalCash / netMo;

  document.getElementById('t-formula').textContent = seasonal
      ? '= Blended (Summer 6mo + Winter 6mo) Revenue × Host Share − Expenses'
        : '= Daily Rate × Booked Days × Host Share − Expenses';

  // Main metrics
  document.getElementById('t-net-mo').textContent  = fmt(netMo);
    document.getElementById('t-net-yr').textContent  = fmt(netYr);
    document.getElementById('t-roi').textContent     = pct(roi, 0);
    document.getElementById('t-be').textContent      = bedays.toFixed(1) + ' days';
    document.getElementById('t-cash').textContent    = fmt(totalCash);
    document.getElementById('t-payback').textContent = payback.toFixed(1) + ' mo';

  // Color coding
  document.getElementById('t-net-mo').className = 'metric-value ' + (netMo > 400 ? 'green' : netMo > 0 ? 'amber' : 'red');
    document.getElementById('t-net-yr').className = 'metric-value ' + (netYr > 4800 ? 'green' : netYr > 0 ? 'amber' : 'red');
    document.getElementById('t-roi').className    = 'metric-value ' + (roi > 60 ? 'blue' : roi > 20 ? 'amber' : 'red');

  // Breakdown
  document.getElementById('t-gross').textContent    = fmt(grossMo);
    document.getElementById('t-turo-cut').textContent = '−' + fmt(turoCut);
    document.getElementById('t-turo-net').textContent = fmt(turoNet);
    document.getElementById('t-ins-out').textContent  = '−' + fmt(ins);
    document.getElementById('t-maint-out').textContent= '−' + fmt(maint);
    document.getElementById('t-clean-out').textContent= '−' + fmt(clean);
    const netOutEl = document.getElementById('t-net-out');
    netOutEl.textContent  = fmt(netMo);
    netOutEl.className    = 'br-val ' + (netMo > 0 ? 'pos' : 'neg');

  // Verdict
  if (roi >= 80 && netMo >= 400) setVerdict('t-verdict','t-verdict-text','t-verdict-reason','go', `${pct(roi,0)} annual ROI — strong cash-on-cash return`);
    else if (roi >= 30 && netMo >= 150) setVerdict('t-verdict','t-verdict-text','t-verdict-reason','marginal', `${pct(roi,0)} ROI — acceptable but watch occupancy`);
    else setVerdict('t-verdict','t-verdict-text','t-verdict-reason','nogo', `ROI too low at ${pct(roi,0)} — adjust price, occupancy, or purchase cost`);

  // Stress test
  const scenarios = [
    { label: 'Slow (35% occ)', occ: 0.35, rateAdj: 0.85 },
    { label: 'Realistic (50%)', occ: 0.50, rateAdj: 1.00 },
    { label: 'Strong (65%)', occ: 0.65, rateAdj: 1.10 },
      ];
    const stressGrid = document.getElementById('t-stress-grid');
    stressGrid.innerHTML = scenarios.map(s => {
          const g = rate * s.rateAdj * Math.round(s.occ * 30.4);
          const n = g * plan - totalExp;
          const r = (n * 12 / totalCash) * 100;
          const c = n > 300 ? 'var(--accent)' : n > 0 ? 'var(--amber)' : 'var(--danger)';
          return `<div class="stress-cell">
                <div class="stress-scenario">${s.label}</div>
                      <div class="stress-net" style="color:${c}">${fmt(n)}/mo</div>
                            <div class="stress-roi">${pct(r,0)} ROI</div>
                                </div>`;
    }).join('');

  // Buffer build
  const bufferRows = document.getElementById('t-buffer-rows');
    let buf = 0;
    bufferRows.innerHTML = [1,2,3,4,5,6].map(mo => {
          const contribution = netMo * 0.40;
          buf += contribution;
          const hit = buf >= 1500;
          return `<div class="breakdown-row">
                <div class="br-label">Month ${mo}</div>
                      <div class="br-val neu">${fmt(contribution)}/mo → Buffer: <span style="color:${hit?'var(--accent)':'var(--amber)'}">${fmt(buf)}</span>${hit && mo===Math.ceil(1500/contribution) ? ' ✓ TARGET HIT' : ''}</div>
                          </div>`;
    }).join('');
}

// ─── LAND CALCULATOR ─────────────────────────────────────────────────────────
function calcLand() {
    const price   = +document.getElementById('l-price').value;
    const dp      = +document.getElementById('l-dp').value / 100;
    const rate    = +document.getElementById('l-rate').value / 100;
    const resale  = +document.getElementById('l-resale').value;
    const hold    = +document.getElementById('l-hold').value;
    const close   = +document.getElementById('l-close').value;
    const taxAnn  = +document.getElementById('l-tax').value;
    const rehab   = +document.getElementById('l-rehab').value;

  document.getElementById('l-price-v').textContent  = fmt(price);
    document.getElementById('l-dp-v').textContent     = pct(dp*100);
    document.getElementById('l-rate-v').textContent   = pct(rate*100, 1);
    document.getElementById('l-resale-v').textContent = fmt(resale);
    document.getElementById('l-hold-v').textContent   = hold + ' mo';
    document.getElementById('l-close-v').textContent  = fmt(close);
    document.getElementById('l-tax-v').textContent    = fmt(taxAnn);
    document.getElementById('l-rehab-v').textContent  = fmt(rehab);

  const downPayment = price * dp;
    const cashDeployed = downPayment + rehab;
    const loanAmt     = price * (1 - dp);
    const monthlyInt  = loanAmt * (rate / 12);
    const totalInt    = monthlyInt * hold;
    const taxProrated = (taxAnn / 12) * hold;
    const totalHold   = totalInt + taxProrated;
    const grossMargin = resale - price;
    const netMargin   = resale - price - totalInt - taxProrated - close - rehab;
    const annROI      = (netMargin / cashDeployed) * (12 / hold) * 100;
    const burn        = monthlyInt + taxAnn/12;

  document.getElementById('l-margin').textContent    = fmt(netMargin);
    document.getElementById('l-roi').textContent       = pct(annROI, 0);
    document.getElementById('l-cash').textContent      = fmt(cashDeployed);
    document.getElementById('l-gross-m').textContent   = fmt(grossMargin);
    document.getElementById('l-hold-cost').textContent = fmt(totalHold);
    document.getElementById('l-burn').textContent      = fmt(burn);

  document.getElementById('l-margin').className = 'metric-value ' + (netMargin > 5000 ? 'green' : netMargin > 0 ? 'amber' : 'red');
    document.getElementById('l-roi').className    = 'metric-value ' + (annROI > 80 ? 'blue' : annROI > 20 ? 'amber' : 'red');

  document.getElementById('l-resale-out').textContent   = fmt(resale);
    document.getElementById('l-purchase-out').textContent = '−' + fmt(price);
    document.getElementById('l-interest-out').textContent = '−' + fmt(totalInt);
    document.getElementById('l-tax-out').textContent      = '−' + fmt(taxProrated);
    document.getElementById('l-close-out').textContent    = '−' + fmt(close);
    document.getElementById('l-rehab-out').textContent    = '−' + fmt(rehab);
    const netEl = document.getElementById('l-net-out');
    netEl.textContent = fmt(Math.abs(netMargin));
    netEl.className   = 'br-val ' + (netMargin >= 0 ? 'pos' : 'neg');

  if (netMargin < 0) setVerdict('l-verdict','l-verdict-text','l-verdict-reason','nogo', `Deal loses ${fmt(Math.abs(netMargin))} — raise resale target or lower purchase price`);
    else if (annROI >= 80 && netMargin >= 5000) setVerdict('l-verdict','l-verdict-text','l-verdict-reason','go', `${fmt(netMargin)} net margin · ${pct(annROI,0)} annualized ROI`);
    else if (annROI >= 25 && netMargin > 0) setVerdict('l-verdict','l-verdict-text','l-verdict-reason','marginal', `Acceptable at ${pct(annROI,0)} — but slow hold erodes returns`);
    else setVerdict('l-verdict','l-verdict-text','l-verdict-reason','nogo', `ROI too low at ${pct(annROI,0)} for raw land risk`);

  // Stress — different hold times
  const holdScenarios = [
    { label: 'Fast (4 mo)', h: 4, adj: 1.0 },
    { label: 'Base (' + hold + ' mo)', h: hold, adj: 1.0 },
    { label: 'Slow (18 mo)', h: 18, adj: 1.0 },
    { label: 'Price miss −20%', h: hold, adj: 0.80 },
    { label: 'Worst: no gain', h: 24, adj: price/resale },
    { label: 'Best: +50%', h: 4, adj: 1.50 },
      ];
    document.getElementById('l-stress-grid').innerHTML = holdScenarios.map(s => {
          const tInt = monthlyInt * s.h;
          const tTax = (taxAnn/12) * s.h;
          const nm   = resale * s.adj - price - tInt - tTax - close - rehab;
          const ar   = (nm / cashDeployed) * (12 / s.h) * 100;
          const col  = nm > 5000 ? 'var(--accent)' : nm > 0 ? 'var(--amber)' : 'var(--danger)';
          return `<div class="stress-cell">
                <div class="stress-scenario">${s.label}</div>
                      <div class="stress-net" style="color:${col}">${fmt(nm)}</div>
                            <div class="stress-roi">${ar.toFixed(0)}% ann. ROI</div>
                                </div>`;
    }).join('');
}

// ─── BRRRR CALCULATOR ────────────────────────────────────────────────────────
function calcBRRRR() {
    const price   = +document.getElementById('b-price').value;
    const rehab   = +document.getElementById('b-rehab').value;
    const arv     = +document.getElementById('b-arv').value;
    const hold    = +document.getElementById('b-hold').value;
    const hmRate  = +document.getElementById('b-hm').value / 100;
    const ltv     = +document.getElementById('b-ltv').value / 100;
    const refiR   = +document.getElementById('b-refi').value / 100;
    const rent    = +document.getElementById('b-rent').value;
    const opexPct = +document.getElementById('b-opex').value / 100;

  document.getElementById('b-price-v').textContent  = fmt(price);
    document.getElementById('b-rehab-v').textContent  = fmt(rehab);
    document.getElementById('b-arv-v').textContent    = fmt(arv);
    document.getElementById('b-hold-v').textContent   = hold + ' mo';
    document.getElementById('b-hm-v').textContent     = pct(hmRate*100, 1);
    document.getElementById('b-ltv-v').textContent    = pct(ltv*100);
    document.getElementById('b-refi-v').textContent   = pct(refiR*100, 1);
    document.getElementById('b-rent-v').textContent   = fmt(rent);
    document.getElementById('b-opex-v').textContent   = pct(opexPct*100);

  const rehabAdj    = rehab * 1.15;
    const mao         = (arv * 0.75) - rehabAdj;
    const holdCost    = (price * hmRate / 12) * hold + (price * 0.01 / 12 * hold); // interest + carry
  const totalIn     = price + rehabAdj + holdCost;
    const refiCashOut = arv * ltv;
    const cashLeft    = totalIn - refiCashOut;
    const equity      = arv - totalIn;

  // Monthly cash flow after refi
  const loanBalance = refiCashOut;
    const moRate      = refiR / 12;
    const n           = 360; // 30-yr
  const piti        = loanBalance * (moRate * Math.pow(1+moRate,n)) / (Math.pow(1+moRate,n)-1);
    const opex        = rent * opexPct;
    const cf          = rent - piti - opex;
    const dscr        = rent / piti;

  document.getElementById('b-cash-left').textContent  = fmt(Math.abs(cashLeft));
    document.getElementById('b-cash-left').className    = 'metric-value ' + (cashLeft <= 0 ? 'green' : cashLeft < 10000 ? 'amber' : 'red');
    document.getElementById('b-cf').textContent         = fmt(cf);
    document.getElementById('b-cf').className           = 'metric-value ' + (cf > 200 ? 'green' : cf > 0 ? 'amber' : 'red');
    document.getElementById('b-dscr').textContent       = dscr.toFixed(2);
    document.getElementById('b-dscr').className         = 'metric-value ' + (dscr >= 1.25 ? 'blue' : dscr >= 1.0 ? 'amber' : 'red');
    document.getElementById('b-mao').textContent        = fmt(mao);
    document.getElementById('b-refi-out').textContent   = fmt(refiCashOut);
    document.getElementById('b-equity').textContent     = fmt(equity);
    document.getElementById('b-equity').className       = 'metric-value ' + (equity > 20000 ? 'green' : equity > 0 ? 'amber' : 'red');

  document.getElementById('b-price-out').textContent  = fmt(price);
    document.getElementById('b-rehab-raw').textContent  = fmt(rehab);
    document.getElementById('b-rehab-adj').textContent  = fmt(rehabAdj);
    document.getElementById('b-holding').textContent    = fmt(holdCost);
    document.getElementById('b-total-in').textContent   = fmt(totalIn);
    document.getElementById('b-refi-cash').textContent  = fmt(refiCashOut);
    const leftEl = document.getElementById('b-left-out');
    leftEl.textContent = cashLeft <= 0 ? fmt(0) + ' (FULL PULL-OUT)' : fmt(cashLeft) + ' stuck';
    leftEl.className   = 'br-val ' + (cashLeft <= 0 ? 'pos' : cashLeft < 10000 ? 'amber' : 'neg');

  document.getElementById('b-rent-out').textContent = fmt(rent);
    document.getElementById('b-piti').textContent     = '−' + fmt(piti);
    document.getElementById('b-opex-out').textContent = '−' + fmt(opex);
    const cfEl = document.getElementById('b-cf-out');
    cfEl.textContent = fmt(cf);
    cfEl.className   = 'br-val ' + (cf > 0 ? 'pos' : 'neg');

  if (price > mao + 5000) setVerdict('b-verdict','b-verdict-text','b-verdict-reason','nogo', `You're paying ${fmt(price - mao)} OVER MAO — deal breaks at refinance`);
    else if (cashLeft > 20000) setVerdict('b-verdict','b-verdict-text','b-verdict-reason','nogo', `${fmt(cashLeft)} stuck in deal after refi — ARV may be optimistic`);
    else if (cf < 0) setVerdict('b-verdict','b-verdict-text','b-verdict-reason','nogo', `Negative cash flow (${fmt(cf)}/mo) — rent doesn't cover PITI`);
    else if (cashLeft <= 0 && cf >= 150) setVerdict('b-verdict','b-verdict-text','b-verdict-reason','go', `Full cash pull-out + ${fmt(cf)}/mo cash flow — textbook BRRRR`);
    else if (cashLeft <= 10000 && cf >= 0) setVerdict('b-verdict','b-verdict-text','b-verdict-reason','marginal', `${fmt(cashLeft)} left in deal — acceptable if ARV comps are solid`);
    else setVerdict('b-verdict','b-verdict-text','b-verdict-reason','marginal', `Tight margins — stress-test ARV before committing`);

  // ARV sensitivity — optionally stressed with a +6mo rehab delay
  const delayOn      = document.getElementById('b-delay-toggle').checked;
    const stressHold    = delayOn ? hold + 6 : hold;
    const stressHoldCost = (price * hmRate / 12) * stressHold + (price * 0.01 / 12 * stressHold);
    const stressTotalIn  = price + rehabAdj + stressHoldCost;

  document.getElementById('b-stress-header').textContent = delayOn
      ? '⚡ ARV Sensitivity — What If Comps Are Wrong? (+6mo Rehab Delay)'
        : '⚡ ARV Sensitivity — What If Comps Are Wrong?';

  const arvScenarios = [
    { label: 'ARV +10%', mult: 1.10 },
    { label: 'ARV actual', mult: 1.00 },
    { label: 'ARV −5%',  mult: 0.95 },
    { label: 'ARV −10%', mult: 0.90 },
    { label: 'ARV −15%', mult: 0.85 },
    { label: 'ARV −20%', mult: 0.80 },
      ];
    document.getElementById('b-stress-grid').innerHTML = arvScenarios.map(s => {
          const adjArv = arv * s.mult;
          const adjOut = adjArv * ltv;
          const stuck  = stressTotalIn - adjOut;
          const col    = stuck <= 0 ? 'var(--accent)' : stuck < 15000 ? 'var(--amber)' : 'var(--danger)';
          return `<div class="stress-cell">
                <div class="stress-scenario">${s.label} (${fmt(adjArv)})</div>
                      <div class="stress-net" style="color:${col}">${stuck <= 0 ? 'Full pull-out' : fmt(stuck) + ' stuck'}</div>
                            <div class="stress-roi">Refi out: ${fmt(adjOut)}</div>
                                </div>`;
    }).join('');
}

// ─── MULTIFAMILY CALCULATOR ──────────────────────────────────────────────────
function amortPayment(principal, annualRate, years) {
    const moRate = annualRate / 12;
    const n = years * 12;
    if (moRate === 0) return principal / n;
    return principal * (moRate * Math.pow(1+moRate, n)) / (Math.pow(1+moRate, n) - 1);
}

function calcMulti() {
    const units   = +document.getElementById('m-units').value;
    const price   = +document.getElementById('m-price').value;
    const dp      = +document.getElementById('m-dp').value / 100;
    const rate    = +document.getElementById('m-rate').value / 100;
    const term    = +document.getElementById('m-term').value;
    const rent    = +document.getElementById('m-rent').value;
    const other   = +document.getElementById('m-other').value;
    const vacancy = +document.getElementById('m-vac').value / 100;
    const opexPct = +document.getElementById('m-opex').value / 100;

  document.getElementById('m-units-v').textContent = units;
    document.getElementById('m-price-v').textContent = fmt(price);
    document.getElementById('m-dp-v').textContent     = pct(dp*100);
    document.getElementById('m-rate-v').textContent   = pct(rate*100, 2);
    document.getElementById('m-term-v').textContent   = term + ' yr';
    document.getElementById('m-rent-v').textContent   = fmt(rent);
    document.getElementById('m-other-v').textContent  = fmt(other);
    document.getElementById('m-vac-v').textContent    = pct(vacancy*100);
    document.getElementById('m-opex-v').textContent   = pct(opexPct*100);

  const gpr        = rent * units;
    const grossIncome = gpr + other;
    const vacancyLoss = grossIncome * vacancy;
    const egi         = grossIncome - vacancyLoss;
    const opex        = egi * opexPct;
    const noiMo        = egi - opex;
    const noiYr        = noiMo * 12;
    const capRate      = (noiYr / price) * 100;

  const downPayment = price * dp;
    const loanAmt     = price * (1 - dp);
    const debtService = amortPayment(loanAmt, rate, term);
    const dscr        = noiMo / debtService;
    const cf          = noiMo - debtService;
    const coc         = (cf * 12 / downPayment) * 100;

  document.getElementById('m-noi-mo').textContent = fmt(noiMo);
    document.getElementById('m-noi-yr').textContent = fmt(noiYr);
    document.getElementById('m-cap').textContent    = pct(capRate, 1);
    document.getElementById('m-dscr').textContent   = dscr.toFixed(2);
    document.getElementById('m-coc').textContent    = pct(coc, 1);
    document.getElementById('m-cf').textContent     = fmt(cf);

  document.getElementById('m-dscr').className = 'metric-value ' + (dscr >= 1.25 ? 'blue' : dscr >= 1.1 ? 'amber' : 'red');
    document.getElementById('m-coc').className  = 'metric-value ' + (coc >= 8 ? 'blue' : coc >= 0 ? 'amber' : 'red');
    document.getElementById('m-cf').className   = 'metric-value ' + (cf > 0 ? 'green' : 'red');
    document.getElementById('m-noi-mo').className = 'metric-value ' + (noiMo > 0 ? 'green' : 'red');
    document.getElementById('m-noi-yr').className = 'metric-value ' + (noiYr > 0 ? 'green' : 'red');

  document.getElementById('m-gpr').textContent      = fmt(gpr);
    document.getElementById('m-other-out').textContent = fmt(other);
    document.getElementById('m-vac-out').textContent  = '−' + fmt(vacancyLoss);
    document.getElementById('m-egi').textContent      = fmt(egi);
    document.getElementById('m-opex-out').textContent = '−' + fmt(opex);
    document.getElementById('m-noi-out').textContent  = fmt(noiMo);

  document.getElementById('m-noi-out2').textContent = fmt(noiMo);
    document.getElementById('m-debt-out').textContent  = '−' + fmt(debtService);
    const cfEl = document.getElementById('m-cf-out');
    cfEl.textContent = fmt(cf);
    cfEl.className   = 'br-val ' + (cf > 0 ? 'pos' : 'neg');

  // Verdict — GO: DSCR >= 1.25 AND CoC >= 8%; MARGINAL: DSCR >= 1.1; else NO-GO
  if (dscr >= 1.25 && coc >= 8) setVerdict('m-verdict','m-verdict-text','m-verdict-reason','go', `DSCR ${dscr.toFixed(2)} · ${pct(coc,1)} cash-on-cash — clears both bars`);
    else if (dscr >= 1.1) setVerdict('m-verdict','m-verdict-text','m-verdict-reason','marginal', `DSCR ${dscr.toFixed(2)} acceptable — cash-on-cash at ${pct(coc,1)}`);
    else setVerdict('m-verdict','m-verdict-text','m-verdict-reason','nogo', `DSCR ${dscr.toFixed(2)} too thin — rent doesn't clear debt service`);

  // Stress test — vacancy, rate, and opex shocks
  const scenarios = [
    { label: 'Vacancy +5pts', vacAdj: 0.05,  rateAdj: 0,     opexAdj: 0 },
    { label: 'Base',          vacAdj: 0,     rateAdj: 0,     opexAdj: 0 },
    { label: 'Vacancy −3pts', vacAdj: -0.03, rateAdj: 0,     opexAdj: 0 },
    { label: 'Rate +1%',      vacAdj: 0,     rateAdj: 0.01,  opexAdj: 0 },
    { label: 'Rate +2%',      vacAdj: 0,     rateAdj: 0.02,  opexAdj: 0 },
    { label: 'OpEx +10pts',   vacAdj: 0,     rateAdj: 0,     opexAdj: 0.10 },
      ];
    document.getElementById('m-stress-grid').innerHTML = scenarios.map(s => {
          const adjVac  = Math.min(1, Math.max(0, vacancy + s.vacAdj));
          const adjOpex = Math.min(1, Math.max(0, opexPct + s.opexAdj));
          const adjRate = Math.max(0, rate + s.rateAdj);
          const adjEgi  = grossIncome * (1 - adjVac);
          const adjNoiMo = adjEgi - (adjEgi * adjOpex);
          const adjDebt  = amortPayment(loanAmt, adjRate, term);
          const adjCf    = adjNoiMo - adjDebt;
          const adjDscr  = adjNoiMo / adjDebt;
          const col = adjCf > 0 ? 'var(--accent)' : 'var(--danger)';
          return `<div class="stress-cell">
                <div class="stress-scenario">${s.label}</div>
                      <div class="stress-net" style="color:${col}">${fmt(adjCf)}/mo</div>
                            <div class="stress-roi">DSCR ${adjDscr.toFixed(2)}</div>
                                </div>`;
    }).join('');
}

// ─── INIT ────────────────────────────────────────────────────────────────────
calcTuro();
calcLand();
calcBRRRR();
calcMulti();
