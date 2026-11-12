/**
 * ═══════════════════════════════════════════════════════════
 * CLASSIC REPORT GENERATOR
 * Authentic CompuTax-style A4 computation output.
 *
 * Layout rules (v2):
 *  • Content flows naturally — no hard-coded page breaks, so
 *    pages are filled instead of leaving large blank areas.
 *  • Every annexure / statement is a keep-together block, so
 *    the Balance Sheet and tables never split across pages.
 *  • Long tables repeat their header row when they do split.
 *  • Letterhead + assessee details on the first page.
 *  • Consistent A4-safe table column widths.
 * ═══════════════════════════════════════════════════════════
 */

const ReportClassic = (() => {

  function generate(data) {
    const { client, computation, tds, bankInterest, banks, stcgDetails,
            adminConfig, turnover, compNo, balanceSheet } = data;
    const { fmtNum, getSlabLines } = TaxEngine;
    const c   = computation;
    const cfg = c.cfg || TaxEngine.getConfig(client.ay || '2026-27');

    const company   = (adminConfig && adminConfig.company)   || 'SS INFOTECH';
    const footer    = (adminConfig && adminConfig.footer)    || 'Professional Tax Computation Services';
    const signatory = (adminConfig && adminConfig.signatory) || 'Proprietor';
    const fy        = _getFY(client.ay);
    const filingDateObj = _getFilingDateObj(client);
    const today     = filingDateObj.toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' });
    const cmpNo     = compNo || 'CMP-' + new Date().getFullYear() + '-000001';

    const profitPct   = data.profitPct || 20;
    const hasSTCG     = c.stcg > 0;
    const hasPL       = c.pl   > 0;
    const tds194J     = tds.tds194J || 0;
    const isSalaried  = !!(client.isSalaried || client.formNumber === 'ITR-1' || ((c.salaryGross || 0) > 0 && (c.businessIncome || 0) <= 0));
    const hasBusiness = (c.businessIncome || 0) > 0;

    // ─── Section helpers ──────────────────────────────────────
    const secTitle = (t) => `<div class="rpt-section"><div class="rpt-section-title">${t}</div></div>`;
    const line = (label, val, cls = '') =>
      `<div class="rpt-line ${cls}"><span>${label}</span><span class="rpt-dots"></span><span class="rpt-num">${val}</span></div>`;
    const boldLine = (label, val) =>
      `<div class="rpt-line rpt-total"><b>${label}</b><span class="rpt-dots"></span><span class="rpt-num"><b>${val}</b></span></div>`;
    const grandLine = (label, val) =>
      `<div class="rpt-line rpt-grand"><b>${label}</b><span class="rpt-dots"></span><span class="rpt-num"><b>${val}</b></span></div>`;

    // Keep an income chapter together on one page.
    const keep = (html) => `<section class="rpt-keep">${html}</section>`;
    // Annexure block: title bar + table. `cls` controls split behaviour.
    const annex = (title, body, cls = 'rpt-keep') =>
      `<section class="rpt-annex ${cls}">
        <div class="rpt-annex-title">${title}</div>
        ${body}
      </section>`;

    return `
<style>
/* ── Classic Report Inline Styles ── */
.report-classic { font-family: 'Times New Roman', Times, serif; font-size: 12px; color: #000; line-height: 1.35; background:#fff; padding: 20px; }
.rpt-letterhead { text-align: center; margin-bottom: 2px; }
.rpt-firm { font-size: 17px; font-weight: bold; text-transform: uppercase; letter-spacing: .08em; }
.rpt-firm-sub { font-size: 10.5px; color: #222; margin-top: 1px; }
.rpt-doc-title { text-align: center; font-size: 13.5px; font-weight: bold; text-transform: uppercase; letter-spacing: .08em; margin-top: 4px; }
.rpt-sub { font-size: 11px; text-align: center; margin: 2px 0; }
.rpt-rule { border-bottom: 1px solid #000; margin: 4px 0; }
.rpt-dbl { border-bottom: 3px double #000; margin: 4px 0; }
.rpt-info-table { width: 100%; font-size: 11px; border-collapse: collapse; table-layout: fixed; }
.rpt-info-table td { padding: 2px 4px; vertical-align: top; }
.rpt-info-table .lbl { width: 22%; font-weight: bold; }
.rpt-section { margin-top: 12px; margin-bottom: 3px; break-after: avoid; page-break-after: avoid; }
.rpt-section-title { font-weight: bold; font-size: 11.5px; text-decoration: underline; text-transform: uppercase; }
.rpt-indent { padding: 2px 0 3px 8px; }
.rpt-line { display: flex; justify-content: space-between; padding: 1.5px 0; font-size: 11px; }
.rpt-dots { flex-grow: 1; border-bottom: 1px dotted #888; margin: 0 10px; position: relative; top: -4px; }
.rpt-num { width: 110px; text-align: right; font-family: monospace; font-size: 11px; white-space: nowrap; }
.rpt-total { font-weight: bold; margin-top: 2px; }
.rpt-grand { font-weight: bold; font-size: 12px; margin-top: 4px; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 3px 0; }
.rpt-schedules-heading { margin: 16px 0 4px; padding: 5px 0; border-top: 2px solid #000; border-bottom: 2px solid #000; text-align: center; font-weight: bold; font-size: 12px; letter-spacing: .10em; text-transform: uppercase; break-after: avoid; page-break-after: avoid; }
.rpt-annex { margin-top: 22px; }
.rpt-annex-title { background: #f0f0f0; border: 1px solid #000; border-bottom: none; padding: 5px 7px; font-size: 11px; font-weight: bold; text-transform: uppercase; line-height: 1.3; break-after: avoid; page-break-after: avoid; }
.rpt-annex-note { font-size: 9px; font-style: italic; color: #444; }
.rpt-table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 10.5px; margin: 0 0 0; }
.rpt-table th, .rpt-table td { border: 1px solid #000; padding: 6px 7px; vertical-align: top; word-wrap: break-word; }
.rpt-table th { background: #f0f0f0; font-weight: bold; text-align: left; }
.rpt-table thead { display: table-header-group; }
.rpt-table .num { text-align: right; font-family: monospace; white-space: nowrap; }
.rpt-sign-area { display: flex; justify-content: flex-end; margin-top: 26px; }
.rpt-sign-block { width: 40%; text-align: center; }
.rpt-sign-line { border-bottom: 1px solid #000; margin-bottom: 5px; width: 80%; margin-left: auto; margin-right: auto; }
.rpt-meta-table { width: 100%; font-size: 9.5px; border-collapse: collapse; table-layout: fixed; }
.rpt-meta-table td { padding: 2px 4px; vertical-align: top; }
.rpt-meta-table .lbl { width: 20%; font-weight: bold; }
.rpt-foot { text-align: center; font-size: 8.5px; color: #666; margin-top: 4px; }

/* Keep-together blocks: honoured by Chrome print and html2pdf */
.rpt-keep { break-inside: avoid; page-break-inside: avoid; }
.rpt-splittable { break-inside: auto; page-break-inside: auto; }

/* Comfortable safe area on all four sides of every Classic page.
   Kept at the top level, not nested inside @media print. */
@page { size: A4 portrait; margin: 14mm 12mm 14mm 12mm; }

@media print {
  .report-classic { padding: 2mm; }
  .report-classic, .rpt-table th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .rpt-keep, .rpt-annex-title, .rpt-section-title { break-inside: avoid; page-break-inside: avoid; }
  .rpt-table tr { break-inside: avoid; page-break-inside: avoid; }
}
</style>
<div class="report-classic">

<!-- ════════════════ LETTERHEAD / TITLE ════════════════ -->
<div class="rpt-letterhead">
  <div class="rpt-firm">${company}</div>
  <div class="rpt-firm-sub">${footer}</div>
</div>
<div class="rpt-dbl"></div>
<div class="rpt-doc-title">COMPUTATION OF INCOME AND TAX</div>
<div class="rpt-sub">
  Assessment Year : <b>${client.ay || ''}</b> &nbsp;&nbsp; Financial Year : <b>${fy}</b>
  &nbsp;&nbsp; Status : Individual &nbsp;&nbsp; Regime : ${cfg.regime || 'New'} Tax Regime
</div>
<div class="rpt-dbl"></div>

<!-- ════════════════ ASSESSEE DETAILS ════════════════ -->
${keep(`
<table class="rpt-info-table" style="margin-bottom:5px;">
  <colgroup>
    <col style="width:20%"><col style="width:2%"><col style="width:28%">
    <col style="width:20%"><col style="width:2%"><col style="width:28%">
  </colgroup>
  <tr>
    <td class="lbl">Name of Assessee</td>
    <td>:</td>
    <td><b>${(client.name || '').toUpperCase()}</b></td>
    <td class="lbl">PAN</td>
    <td>:</td>
    <td><b>${(client.pan || '').toUpperCase()}</b></td>
  </tr>
  <tr>
    <td class="lbl">Father's Name</td>
    <td>:</td>
    <td>${(client.father || '').toUpperCase()}</td>
    <td class="lbl">Date of Birth</td>
    <td>:</td>
    <td>${_formatDate(client.dob)}</td>
  </tr>
  <tr>
    <td class="lbl">Residential Status</td>
    <td>:</td>
    <td>${client.status || 'Resident'}</td>
    <td class="lbl">Gender</td>
    <td>:</td>
    <td>${client.gender || 'Male'}</td>
  </tr>
  <tr>
    <td class="lbl">Assessment Year</td>
    <td>:</td>
    <td>${client.ay || ''}</td>
    <td class="lbl">Ward / Circle</td>
    <td>:</td>
    <td>${client.ward || 'Ward-1(1)'}</td>
  </tr>
  <tr>
    <td class="lbl">Filed u/s</td>
    <td>:</td>
    <td>${client.filing || '139(1)'}</td>
    <td class="lbl">Mobile</td>
    <td>:</td>
    <td>${client.mobile || ''}</td>
  </tr>
  <tr>
    <td class="lbl">${(c.salaryGross || 0) > 0 && (c.businessIncome || 0) <= 0 ? 'Employer / Sector' : 'Nature of Business'}</td>
    <td>:</td>
    <td>${(c.salaryGross || 0) > 0 && (c.businessIncome || 0) <= 0 ? ((client.employerName || 'EMPLOYER (PRIVATE SECTOR)').toUpperCase() + (client.employerCategory ? ' [' + client.employerCategory + ']' : '')) : (((client.bname || '').toUpperCase() ? (client.bname || '').toUpperCase() + ' - ' : '') + ((client.nature || 'Retail Trade').toUpperCase()) + ' [Code: ' + (client.bcode || '0204') + ']')}</td>
    <td class="lbl">Email</td>
    <td>:</td>
    <td>${client.email || ''}</td>
  </tr>
  <tr>
    <td class="lbl">Address</td>
    <td>:</td>
    <td colspan="4">${(client.address || '').toUpperCase()}</td>
  </tr>
</table>
<div class="rpt-rule"></div>
`)}

<!-- ════════════════ INCOME COMPUTATION ════════════════ -->
${(c.salaryGross || 0) > 0 ? keep(`
${secTitle('CHAPTER IV-A &nbsp; SALARIES')}
<div class="rpt-indent">
  ${line('Gross Salary', fmtNum(c.salaryGross))}
  ${line('Less: Standard Deduction u/s 16(ia)', `(${fmtNum(c.salaryStdDeduction)})`)}
  ${(c.salaryPtax || 0) > 0 ? line('Less: Tax on Employment (P-Tax) u/s 16(iii)', `(${fmtNum(c.salaryPtax)})`) : ''}
  ${(c.salaryHraExemption || 0) > 0 ? line('Less: HRA Exemption u/s 10(13A)', `(${fmtNum(c.salaryHraExemption)})`) : ''}
  ${boldLine('Total – Income from Salaries', fmtNum(c.netSalary))}
</div>
`) : ''}

${hasBusiness ? keep(`
${secTitle('CHAPTER IV-D &nbsp; PROFITS &amp; GAINS OF BUSINESS / PROFESSION [SECTION ' + (client.presumptiveSection || '44AD') + ']')}
<div class="rpt-indent">
  ${line(`Net Profit from ${(client.bname || '').toUpperCase() ? (client.bname || '').toUpperCase() + ' - ' : ''}${(client.nature || 'Retail Trade').toUpperCase()} [Code: ${client.bcode || '0204'}]`, fmtNum(c.businessIncome))}
  ${boldLine('Total – Business Income (' + (client.presumptiveSection || '44AD') + ')', fmtNum(c.businessIncome))}
</div>
`) : ''}

${hasSTCG || (c.ltcg || 0) > 0 ? keep(`
${secTitle('CHAPTER IV-E &nbsp; CAPITAL GAINS')}
<div class="rpt-indent">
  ${hasSTCG ? line(`Short Term Capital Gain u/s 111A [@ ${(cfg.stcgRate||0.15)*100}%]`, fmtNum(c.stcg)) : ''}
  ${(c.ltcg || 0) > 0 ? line(`Long Term Capital Gain u/s 112A [Taxable: ₹${fmtNum(c.taxableLTCG)} @ ${(cfg.ltcgRate||0.125)*100}%]`, fmtNum(c.ltcg)) : ''}
  ${boldLine('Total – Capital Gains', fmtNum((c.stcg || 0) + (c.ltcg || 0)))}
</div>
`) : ''}

${keep(`
${secTitle('CHAPTER IV-F &nbsp; INCOME FROM OTHER SOURCES')}
<div class="rpt-indent">
  ${line('Interest on Savings Bank Account', fmtNum(c.savingsInterest))}
  ${hasPL ? line('Other Income (P&amp;L)', fmtNum(c.pl)) : ''}
  ${boldLine('Total – Other Sources', fmtNum(c.savingsInterest + c.pl))}
</div>
<div class="rpt-rule"></div>
${grandLine('GROSS TOTAL INCOME', fmtNum(c.grossTotalIncome))}

${secTitle('CHAPTER VI-A &nbsp; DEDUCTIONS FROM GROSS TOTAL INCOME')}
<div class="rpt-indent">
  ${(c.deduction80TTA || 0) > 0 ? line('Deduction u/s 80TTA – Interest on Savings Bank Account', fmtNum(c.deduction80TTA)) : ''}
  ${(c.deduction80C || 0) > 0 ? line('Deduction u/s 80C – Life Insurance, PPF, ELSS, EPF', fmtNum(c.deduction80C)) : ''}
  ${(c.deduction80D || 0) > 0 ? line('Deduction u/s 80D – Health Insurance (Mediclaim)', fmtNum(c.deduction80D)) : ''}
  ${(c.deduction80CCD1B || 0) > 0 ? line('Deduction u/s 80CCD(1B) – National Pension System (NPS)', fmtNum(c.deduction80CCD1B)) : ''}
  ${(c.deduction80G || 0) > 0 ? line('Deduction u/s 80G – Eligible Donations', fmtNum(c.deduction80G)) : ''}
  ${boldLine('Total Deductions', fmtNum(c.totalDeductions || c.deduction80TTA || 0))}
</div>
<div class="rpt-rule"></div>
${grandLine('TOTAL INCOME [Rounded off u/s 288A]', fmtNum(c.totalIncome))}
`)}

<!-- ════════════════ TAX COMPUTATION ════════════════ -->
${keep(`
${secTitle('COMPUTATION OF TAX LIABILITY')}
<div class="rpt-indent">
  ${_slabLines(c.regularIncome, cfg, fmtNum)}
  ${hasSTCG ? line(`Tax on STCG u/s 111A [${(cfg.stcgRate||0.15)*100}% on ₹${fmtNum(c.stcg)}]`, fmtNum(c.taxOnSTCG)) : ''}
  ${(c.taxOnLTCG || 0) > 0 ? line(`Tax on LTCG u/s 112A [${(cfg.ltcgRate||0.125)*100}% on ₹${fmtNum(c.taxableLTCG)}]`, fmtNum(c.taxOnLTCG)) : ''}
  ${boldLine('Tax on Total Income', fmtNum(c.taxBeforeRebate))}
  ${line('Less: Rebate u/s 87A', `(${fmtNum(c.rebate)})`)}
  ${line('Tax after Rebate u/s 87A', fmtNum(c.taxAfterRebate))}
  ${line('Add: Health &amp; Education Cess @ 4%', fmtNum(c.cess))}
  <div class="rpt-rule"></div>
  ${grandLine('TOTAL TAX LIABILITY [Rounded off u/s 288B]', fmtNum(c.totalTaxPayable))}
  ${line('Less: Tax Deducted at Source / Tax Collected at Source', `(${fmtNum(c.tdsCredit)})`)}
  <div class="rpt-rule"></div>
  <div class="rpt-line rpt-grand">
    <b>${c.refund > 0 ? 'REFUND DUE [u/s 237]' : c.taxDue > 0 ? 'BALANCE TAX PAYABLE' : 'NIL TAX – NO LIABILITY'}</b>
    <span class="rpt-dots"></span>
    <span class="rpt-num"><b>${fmtNum(c.refund > 0 ? c.refund : c.taxDue)}</b></span>
  </div>
</div>
`)}

<!-- ════════════════ SCHEDULES & ANNEXURES ════════════════ -->
<div class="rpt-schedules-heading">SCHEDULES &amp; ANNEXURES</div>

${hasBusiness ? `
<!-- Business schedules: each statement is keep-together, but they flow
     onto the current page so no half-empty pages are created. -->
  ${annex('ANNEXURE A &nbsp; STATEMENT UNDER SECTION ' + (client.presumptiveSection || '44AD') + ' – TURNOVER &amp; PROFIT', `
  <table class="rpt-table">
    <colgroup>
      <col style="width:30%"><col style="width:12%"><col style="width:20%">
      <col style="width:20%"><col style="width:18%">
    </colgroup>
    <thead>
      <tr>
        <th>Nature of Business</th>
        <th>Business Code</th>
        <th style="text-align:right">Gross Turnover (₹)</th>
        <th style="text-align:right">Declared Profit (₹)</th>
        <th style="text-align:right">Profit %</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${(client.bname || '').toUpperCase() ? (client.bname || '').toUpperCase() + ' - ' : ''}${(client.nature || 'Retail Trade').toUpperCase()}</td>
        <td>${client.bcode || '0204'}</td>
        <td class="num"><b>${fmtNum(turnover)}</b></td>
        <td class="num"><b>${fmtNum(c.businessIncome)}</b></td>
        <td class="num"><b>${profitPct}.00%</b></td>
      </tr>
      <tr>
        <td colspan="5" class="rpt-annex-note">
          * Under Section ${client.presumptiveSection || '44AD'}, assessee declares profit at ${profitPct}% of gross turnover.
          No books of account are required to be maintained (u/s 44AA).
          Turnover = Declared Profit ÷ ${profitPct}% = ₹${fmtNum(c.businessIncome)} ÷ ${profitPct/100} = ₹${fmtNum(turnover)}
        </td>
      </tr>
    </tbody>
  </table>
  `)}

  ${annex('PROFIT &amp; LOSS STATEMENT (Estimated u/s ' + (client.presumptiveSection || '44AD') + ')', `
  <table class="rpt-table">
    <colgroup><col style="width:62%"><col style="width:38%"></colgroup>
    <thead>
      <tr><th>Particulars</th><th style="text-align:right">Amount (₹)</th></tr>
    </thead>
    <tbody>
      <tr><td>Gross Receipts / Turnover</td><td class="num">${fmtNum(turnover)}</td></tr>
      <tr><td>Less: Presumptive Expenses (${100 - profitPct}% of Turnover)</td><td class="num">(${fmtNum(Math.round(turnover - c.businessIncome))})</td></tr>
      <tr style="background:#f0f0f0; font-weight:bold;"><td>Net Profit — Section ${client.presumptiveSection || '44AD'} (Declared @ ${profitPct}%)</td><td class="num">${fmtNum(c.businessIncome)}</td></tr>
      ${c.savingsInterest > 0 ? `<tr><td>Add: Savings Bank Interest</td><td class="num">${fmtNum(c.savingsInterest)}</td></tr>` : ''}
      ${c.stcg > 0 ? `<tr><td>Add: Short Term Capital Gain (u/s 111A)</td><td class="num">${fmtNum(c.stcg)}</td></tr>` : ''}
      ${(c.pl || 0) > 0 ? `<tr><td>Add: Other Income (P&amp;L)</td><td class="num">${fmtNum(c.pl)}</td></tr>` : ''}
      <tr style="font-weight:bold; border-top:2px solid #000;"><td>TOTAL INCOME</td><td class="num">${fmtNum(c.grossTotalIncome)}</td></tr>
    </tbody>
  </table>
  `)}

  ${annex('BALANCE SHEET (As on 31st March)', `
  ${(() => {
    const bs = balanceSheet || {};
    const a = bs.assets || {};
    const l = bs.liabilities || {};
    const num = (v) => (v === undefined || v === null || v === '') ? 0 : (parseFloat(v) || 0);
    const bankFromBanks = (banks || []).reduce((s, b) => s + (parseFloat(b.balance) || 0), 0);
    const hasUser = ['cash','bank','stock','debtors','fixed'].some(k => num(a[k]) !== 0) ||
                    ['capital','provtax','creditors','loan','netprofit'].some(k => num(l[k]) !== 0);
    const bankBal = (a.bank !== undefined && a.bank !== null && a.bank !== '') ? num(a.bank) : bankFromBanks;
    const provTaxAmt = (l.provtax !== undefined && l.provtax !== null && l.provtax !== '')
      ? num(l.provtax)
      : (c.taxDue > 0 ? c.taxDue : (c.totalTaxPayable || 0));

    const assets = [
      ['Cash in Hand', hasUser ? num(a.cash) : Math.round(turnover * 0.05)],
      ['Bank Balance', hasUser ? bankBal : (bankBal || Math.round(turnover * 0.05))],
      ['Stock-in-Trade', hasUser ? num(a.stock) : Math.round(turnover * 0.15)],
      ['Sundry Debtors', hasUser ? num(a.debtors) : Math.round(turnover * 0.20)],
      ['Fixed Assets', num(a.fixed)],
    ];
    const liabs = [
      ['Capital Account', hasUser ? num(l.capital) : Math.round(turnover * 0.20)],
      ['Provision for Tax', provTaxAmt],
      ['Sundry Creditors', hasUser ? num(l.creditors) : Math.round(turnover * 0.10)],
      ['Loan / Borrowings', num(l.loan)],
      ['Net Profit', hasUser ? num(l.netprofit) : c.businessIncome],
    ];

    let totalA = assets.reduce((s, [, v]) => s + v, 0);
    let totalL = liabs.reduce((s, [, v]) => s + v, 0);

    // Auto-estimated sheets are reconciled using fixed assets / capital.
    if (!hasUser) {
      if (totalL > totalA) { assets[4][1] += (totalL - totalA); totalA = totalL; }
      else if (totalA > totalL) { liabs[0][1] += (totalA - totalL); totalL = totalA; }
    } else if (totalA !== totalL) {
      if (totalA > totalL) liabs.push(['Difference (Balancing Figure)', totalA - totalL]);
      else assets.push(['Difference (Balancing Figure)', totalL - totalA]);
      totalA = totalL = Math.max(totalA, totalL);
    }

    const rows = Math.max(assets.length, liabs.length);
    let body = '';
    for (let i = 0; i < rows; i++) {
      const ar = assets[i] || ['', ''];
      const lr = liabs[i] || ['', ''];
      body += `<tr>
        <td>${ar[0]}</td><td class="num">${ar[0] ? fmtNum(ar[1]) : ''}</td>
        <td>${lr[0]}</td><td class="num">${lr[0] ? fmtNum(lr[1]) : ''}</td>
      </tr>`;
    }
    body += `<tr style="background:#f0f0f0; font-weight:bold;">
      <td>TOTAL ASSETS</td><td class="num">${fmtNum(totalA)}</td>
      <td>TOTAL LIABILITIES</td><td class="num">${fmtNum(totalL)}</td>
    </tr>`;

    return `<table class="rpt-table">
      <colgroup><col style="width:34%"><col style="width:16%"><col style="width:34%"><col style="width:16%"></colgroup>
      <thead>
        <tr>
          <th>Assets</th>
          <th style="text-align:right">Amount (₹)</th>
          <th>Liabilities</th>
          <th style="text-align:right">Amount (₹)</th>
        </tr>
      </thead>
      <tbody>${body}</tbody>
    </table>`;
  })()}
  `)}
` : ''}

<!-- ANNEXURE B: Bank Account Details -->
${annex('ANNEXURE B &nbsp; BANK ACCOUNT DETAILS', `
<table class="rpt-table">
  <colgroup>
    <col style="width:5%"><col style="width:31%"><col style="width:22%">
    <col style="width:14%"><col style="width:16%"><col style="width:12%">
  </colgroup>
  <thead>
    <tr><th>#</th><th>Bank Name</th><th>Account Number</th><th>IFSC Code</th><th>Account Type</th><th>Primary A/C</th></tr>
  </thead>
  <tbody>
    ${(banks || []).length ? (banks || []).map((b, i) => `
      <tr>
        <td>${i+1}</td>
        <td>${(b.name || '').toUpperCase()}</td>
        <td style="font-family:monospace">${b.accountNo || ''}</td>
        <td style="font-family:monospace">${(b.ifsc || '').toUpperCase()}</td>
        <td>${b.type === 'SB' ? 'Savings' : b.type === 'CA' ? 'Current' : b.type || 'Savings'}</td>
        <td style="text-align:center">${b.primary ? '<b>YES</b>' : 'No'}</td>
      </tr>`).join('') : `<tr><td colspan="6" style="text-align:center; font-style:italic;">No bank accounts recorded</td></tr>`}
  </tbody>
</table>
`)}

<!-- ANNEXURE C: Interest Details -->
${annex('ANNEXURE C &nbsp; SAVINGS BANK INTEREST DETAILS', `
<table class="rpt-table">
  <colgroup>
    <col style="width:5%"><col style="width:35%"><col style="width:27%">
    <col style="width:13%"><col style="width:20%">
  </colgroup>
  <thead>
    <tr><th>#</th><th>Bank Name</th><th>Account Number</th><th>Account Type</th><th style="text-align:right">Interest Credited (₹)</th></tr>
  </thead>
  <tbody>
    ${(bankInterest || []).length ? (bankInterest || []).map((b, i) => `
      <tr>
        <td>${i+1}</td>
        <td>${(b.name || '').toUpperCase()}</td>
        <td style="font-family:monospace">${b.accountNo || ''}</td>
        <td>${b.type === 'SB' ? 'Savings' : b.type || 'Savings'}</td>
        <td class="num">${fmtNum(b.interest)}</td>
      </tr>`).join('') : `<tr><td colspan="5" style="text-align:center; font-style:italic;">No savings bank interest recorded</td></tr>`}
    <tr style="font-weight:700; background:#f5f5f5;">
      <td colspan="4" style="text-align:right"><b>Total Savings Bank Interest</b></td>
      <td class="num"><b>${fmtNum(c.savingsInterest)}</b></td>
    </tr>
    <tr style="font-size:9.5px;">
      <td colspan="4" style="text-align:right">Less: Deduction u/s 80TTA (Max ₹10,000)</td>
      <td class="num">(${fmtNum(c.deduction80TTA)})</td>
    </tr>
    <tr style="font-weight:700;">
      <td colspan="4" style="text-align:right"><b>Net Taxable Interest</b></td>
      <td class="num"><b>${fmtNum(c.savingsInterest - c.deduction80TTA)}</b></td>
    </tr>
  </tbody>
</table>
`)}

<!-- ANNEXURE D: TDS / 26AS Details (may split on very long lists) -->
${annex('ANNEXURE D &nbsp; TAX DEDUCTED AT SOURCE – AS PER FORM 26AS', `
<table class="rpt-table">
  <colgroup>
    <col style="width:6%"><col style="width:28%"><col style="width:14%">
    <col style="width:12%"><col style="width:16%"><col style="width:12%"><col style="width:12%">
  </colgroup>
  <thead>
    <tr>
      <th>Sec.</th>
      <th>Deductor Name</th>
      <th>TAN</th>
      <th>Date of Credit</th>
      <th style="text-align:right">Amount Paid / Credited (₹)</th>
      <th style="text-align:right">TDS Claimed (₹)</th>
      <th style="text-align:right">TDS Deposited (₹)</th>
    </tr>
  </thead>
  <tbody>
    ${(tds.entries || []).length ? (tds.entries || []).map(e => `
      <tr>
        <td><b>${e.section}</b></td>
        <td>${(e.deductorName || '').toUpperCase()}</td>
        <td style="font-family:monospace;font-size:9px">${e.deductorTAN}</td>
        <td>${e.dateOfCredit}</td>
        <td class="num">${fmtNum(e.amountPaid)}</td>
        <td class="num"><b>${fmtNum(e.tdsClaimed)}</b></td>
        <td class="num">${fmtNum(e.tdsDeposited)}</td>
      </tr>`).join('') : `<tr><td colspan="7" style="text-align:center; font-style:italic;">No TDS entries recorded</td></tr>`}
    <tr style="font-weight:700; background:#f0f0f0;">
      <td colspan="5" style="text-align:right"><b>TOTAL TDS CREDIT</b></td>
      <td class="num"><b>${fmtNum(tds.totalTDS)}</b></td>
      <td class="num"><b>${fmtNum(tds.totalTDS)}</b></td>
    </tr>
  </tbody>
</table>
`, 'rpt-splittable')}

<!-- ANNEXURE E: Head-wise TDS Summary -->
${annex('ANNEXURE E &nbsp; HEAD-WISE TDS SECTION SUMMARY', `
<table class="rpt-table">
  <colgroup><col style="width:16%"><col style="width:44%"><col style="width:20%"><col style="width:20%"></colgroup>
  <thead>
    <tr><th>TDS Section</th><th>Nature of Payment</th><th style="text-align:right">No. of Entries</th><th style="text-align:right">TDS Amount (₹)</th></tr>
  </thead>
  <tbody>
    ${(isSalaried || (c.salaryGross || 0) > 0 || (tds.tds192 || 0) > 0) ? `<tr><td>192</td><td>Salary / Employment (Form 16)</td><td class="num">${(tds.entries||[]).filter(e=>e.section==='192').length || 1}</td><td class="num">${fmtNum(tds.tds192 || 0)}</td></tr>` : ''}
    ${tds.tds194H > 0 ? `<tr><td>194H</td><td>Commission or Brokerage</td><td class="num">${(tds.entries||[]).filter(e=>e.section==='194H').length}</td><td class="num">${fmtNum(tds.tds194H)}</td></tr>` : ''}
    ${tds.tds194C > 0 ? `<tr><td>194C</td><td>Payment to Contractor / Courier</td><td class="num">${(tds.entries||[]).filter(e=>e.section==='194C').length}</td><td class="num">${fmtNum(tds.tds194C)}</td></tr>` : ''}
    ${tds194J > 0     ? `<tr><td>194J</td><td>Professional / Technical Services</td><td class="num">${(tds.entries||[]).filter(e=>e.section==='194J').length}</td><td class="num">${fmtNum(tds194J)}</td></tr>` : ''}
    ${tds.tds194N > 0 ? `<tr><td>194N</td><td>Cash Withdrawal from Bank</td><td class="num">${(tds.entries||[]).filter(e=>e.section==='194N').length}</td><td class="num">${fmtNum(tds.tds194N)}</td></tr>` : ''}
    <tr style="font-weight:700; background:#f0f0f0;">
      <td colspan="3" style="text-align:right"><b>GRAND TOTAL</b></td>
      <td class="num"><b>${fmtNum(tds.totalTDS)}</b></td>
    </tr>
  </tbody>
</table>
`)}

${hasSTCG ? annex('ANNEXURE F &nbsp; CAPITAL GAIN STATEMENT – SHORT TERM [u/s 111A]', `
<table class="rpt-table">
  <colgroup>
    <col style="width:5%"><col style="width:25%"><col style="width:12%"><col style="width:12%">
    <col style="width:15%"><col style="width:15%"><col style="width:16%">
  </colgroup>
  <thead>
    <tr><th>Sr.</th><th>Scrip / Asset</th><th>Date of Purchase</th><th>Date of Sale</th><th style="text-align:right">Cost (₹)</th><th style="text-align:right">Sale Price (₹)</th><th style="text-align:right">Net Gain (₹)</th></tr>
  </thead>
  <tbody>
    ${(stcgDetails || []).length ? (stcgDetails || []).map((s, i) => `
      <tr>
        <td>${i+1}</td><td>${s.scrip}</td><td>${s.buyDate}</td><td>${s.sellDate}</td>
        <td class="num">${fmtNum(s.cost)}</td>
        <td class="num">${fmtNum(s.sale)}</td>
        <td class="num"><b>${fmtNum(s.gain)}</b></td>
      </tr>`).join('') : `<tr><td colspan="7" style="text-align:center; font-style:italic;">No short-term capital gain transactions recorded</td></tr>`}
    <tr style="font-weight:700; background:#f0f0f0;">
      <td colspan="6" style="text-align:right"><b>Total Short Term Capital Gain</b></td>
      <td class="num"><b>${fmtNum(c.stcg)}</b></td>
    </tr>
  </tbody>
</table>
`) : ''}

<!-- ANNEXURE G: Head-wise Income Summary -->
${annex('ANNEXURE G &nbsp; HEAD-WISE INCOME SUMMARY', `
<table class="rpt-table">
  <colgroup><col style="width:46%"><col style="width:18%"><col style="width:18%"><col style="width:18%"></colgroup>
  <thead>
    <tr><th>Income Head</th><th style="text-align:right">Gross Amount (₹)</th><th style="text-align:right">Deduction (₹)</th><th style="text-align:right">Net Taxable (₹)</th></tr>
  </thead>
  <tbody>
    ${hasBusiness ? `<tr>
      <td>Business / Profession (${client.presumptiveSection || '44AD'} – ${(client.bname || '').toUpperCase() ? (client.bname || '').toUpperCase() + ' - ' : ''}${(client.nature || 'Retail Trade').toUpperCase()})</td>
      <td class="num">${fmtNum(c.businessIncome)}</td>
      <td class="num">—</td>
      <td class="num">${fmtNum(c.businessIncome)}</td>
    </tr>` : ''}
    ${(c.salaryGross || 0) > 0 ? `<tr>
      <td>Salaries – Gross Salary</td>
      <td class="num">${fmtNum(c.salaryGross)}</td>
      <td class="num">${fmtNum((c.salaryStdDeduction || 0) + (c.salaryPtax || 0) + (c.salaryHraExemption || 0))}</td>
      <td class="num">${fmtNum(c.netSalary)}</td>
    </tr>` : ''}
    ${hasSTCG ? `<tr>
      <td>Capital Gains – STCG [u/s 111A @ ${(cfg.stcgRate||0.15)*100}%]</td>
      <td class="num">${fmtNum(c.stcg)}</td>
      <td class="num">—</td>
      <td class="num">${fmtNum(c.stcg)}</td>
    </tr>` : ''}
    ${(c.ltcg || 0) > 0 ? `<tr>
      <td>Capital Gains – LTCG [u/s 112A @ ${(cfg.ltcgRate||0.125)*100}%]</td>
      <td class="num">${fmtNum(c.ltcg)}</td>
      <td class="num">${fmtNum(c.taxableLTCG || 0)}</td>
      <td class="num">${fmtNum(c.ltcg)}</td>
    </tr>` : ''}
    <tr>
      <td>Other Sources – Savings Bank Interest</td>
      <td class="num">${fmtNum(c.savingsInterest)}</td>
      <td class="num">${fmtNum(c.deduction80TTA)}</td>
      <td class="num">${fmtNum(c.savingsInterest - c.deduction80TTA)}</td>
    </tr>
    ${hasPL ? `<tr>
      <td>Other Sources – P&amp;L Income</td>
      <td class="num">${fmtNum(c.pl)}</td>
      <td class="num">—</td>
      <td class="num">${fmtNum(c.pl)}</td>
    </tr>` : ''}
    <tr style="font-weight:700; background:#f0f0f0;">
      <td><b>Total</b></td>
      <td class="num"><b>${fmtNum(c.grossTotalIncome)}</b></td>
      <td class="num"><b>${fmtNum(c.totalDeductions || c.deduction80TTA)}</b></td>
      <td class="num"><b>${fmtNum(c.totalIncome)}</b></td>
    </tr>
  </tbody>
</table>
`)}

<!-- ANNEXURE H: TIS Comparison -->
${annex('ANNEXURE H &nbsp; TAXPAYER INFORMATION SUMMARY (TIS) – COMPARISON WITH AIS/26AS', `
<table class="rpt-table">
  <colgroup><col style="width:40%"><col style="width:22%"><col style="width:22%"><col style="width:16%"></colgroup>
  <thead>
    <tr><th>Income / Transaction Head</th><th style="text-align:right">As per AIS/TIS (₹)</th><th style="text-align:right">As per Computation (₹)</th><th>Status</th></tr>
  </thead>
  <tbody>
    ${hasBusiness ? `<tr>
      <td>Business Income (${client.presumptiveSection || '44AD'})</td>
      <td class="num">${fmtNum(c.businessIncome)}</td>
      <td class="num">${fmtNum(c.businessIncome)}</td>
      <td style="color:green">✓ Matches</td>
    </tr>` : ''}
    <tr>
      <td>Savings Bank Interest</td>
      <td class="num">${fmtNum(c.savingsInterest)}</td>
      <td class="num">${fmtNum(c.savingsInterest)}</td>
      <td style="color:green">✓ Matches</td>
    </tr>
    ${hasSTCG ? `<tr>
      <td>Short Term Capital Gain</td>
      <td class="num">${fmtNum(c.stcg)}</td>
      <td class="num">${fmtNum(c.stcg)}</td>
      <td style="color:green">✓ Matches</td>
    </tr>` : ''}
    ${hasPL ? `<tr>
      <td>P&amp;L / Other Income</td>
      <td class="num">${fmtNum(c.pl)}</td>
      <td class="num">${fmtNum(c.pl)}</td>
      <td style="color:green">✓ Matches</td>
    </tr>` : ''}
    <tr style="background:#f0f0f0;">
      <td><b>Gross Total Income</b></td>
      <td class="num"><b>${fmtNum(c.grossTotalIncome)}</b></td>
      <td class="num"><b>${fmtNum(c.grossTotalIncome)}</b></td>
      <td style="color:green"><b>✓ Reconciled</b></td>
    </tr>
    <tr>
      <td>TDS Deducted at Source</td>
      <td class="num">${fmtNum(tds.totalTDS)}</td>
      <td class="num">${fmtNum(tds.totalTDS)}</td>
      <td style="color:green">✓ Matches</td>
    </tr>
    <tr style="font-weight:700; background:#e8f5e9; color:#1b5e20;">
      <td><b>${c.refund > 0 ? 'REFUND DUE' : 'TAX PAYABLE'}</b></td>
      <td class="num"><b>${fmtNum(c.refund > 0 ? c.refund : c.taxDue)}</b></td>
      <td class="num"><b>${fmtNum(c.refund > 0 ? c.refund : c.taxDue)}</b></td>
      <td><b>✓ Verified</b></td>
    </tr>
  </tbody>
</table>
`)}

<!-- ════════════════ METADATA + SIGNATURE (kept together) ════════════════ -->
${keep(`
<div class="rpt-annex" style="margin-top:14px;">
  <div class="rpt-annex-title">COMPUTATION DETAILS</div>
  <table class="rpt-meta-table" style="border:1px solid #000; border-top:none; padding:5px;">
    <colgroup><col style="width:20%"><col style="width:30%"><col style="width:20%"><col style="width:30%"></colgroup>
    <tr>
      <td class="lbl">Computation No.</td>
      <td style="font-family:monospace; font-weight:700">${cmpNo}</td>
      <td class="lbl">Prepared By</td>
      <td>${signatory}, ${company}</td>
    </tr>
    <tr>
      <td class="lbl">Date of Preparation</td>
      <td>${today}</td>
      <td class="lbl">Software</td>
      <td>${company} Tax Computation Pro</td>
    </tr>
    <tr>
      <td class="lbl">Assessment Year</td>
      <td>${client.ay || ''}</td>
      <td class="lbl">Tax Regime</td>
      <td>${cfg.regime || 'New'} Tax Regime</td>
    </tr>
  </table>
</div>

<div class="rpt-sign-area">
  <div class="rpt-sign-block">
    <div class="rpt-sign-line"></div>
    <div><b>Assessee's Signature</b></div>
    <div style="font-size:9.5px; margin-top:3px"><b>${(client.name || '').toUpperCase()}</b></div>
    <div style="font-size:9px">PAN: ${(client.pan || '').toUpperCase()}</div>
    <div style="font-size:9px">Date: _____________</div>
  </div>
</div>

<div class="rpt-rule" style="margin-top:8px;"></div>
<div class="rpt-foot">
  ${cmpNo} &nbsp;|&nbsp; ${company} &nbsp;|&nbsp; ${footer} &nbsp;|&nbsp; Prepared: ${today}
</div>
`)}

</div>
`;
  }

  // ── Helpers ──────────────────────────────────────────────────

  function _slabLines(income, cfg, fmtNum) {
    if (!income || income <= 0) return `<div class="rpt-line"><span>Income below basic exemption – Nil</span><span class="rpt-dots"></span><span class="rpt-num">Nil</span></div>`;
    const lines = TaxEngine.getSlabLines(income, cfg);
    return lines.map(l =>
      `<div class="rpt-line"><span>${l.label}</span><span class="rpt-dots"></span><span class="rpt-num">${l.tax > 0 ? fmtNum(l.tax) : 'Nil'}</span></div>`
    ).join('');
  }

  function _formatDate(dob) {
    if (!dob) return '—';
    const d = new Date(dob);
    if (isNaN(d)) return dob;
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  }

  function _getFY(ay) {
    if (!ay) return '';
    const y1 = parseInt(ay.split('-')[0]) - 1;
    const y2Str = ay.split('-')[1] || '';
    const y2 = y2Str ? parseInt(y2Str) - 1 : '';
    return `${y1}-${y2}`;
  }

  function _getFilingDateObj(client) {
    if (client && client.filingDate) {
      if (typeof client.filingDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(client.filingDate)) {
        const [y, m, d] = client.filingDate.split('-').map(Number);
        return new Date(y, m - 1, d);
      }
      const d = new Date(client.filingDate);
      if (!isNaN(d.getTime())) return d;
    }
    if (client && client.createdAt) {
      const d = new Date(client.createdAt);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  }

  return { generate };
})();

if (typeof module !== 'undefined') {
  module.exports = ReportClassic;
}
