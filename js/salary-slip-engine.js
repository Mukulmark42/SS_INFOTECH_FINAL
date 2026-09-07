/**
 * ═══════════════════════════════════════════════════════════
 * SALARY SLIP ENGINE – Standard Professional Payslip
 * Exact format matching corporate payslip specification
 * Supports single & multi-month batch payslip generation
 * ═══════════════════════════════════════════════════════════
 */
const SalarySlipEngine = (() => {

  function fmt(n) {
    const v = parseFloat(n) || 0;
    return v.toFixed(2);
  }

  function _numToWords(n) {
    if (n === 0) return 'Zero';
    const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
    const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
    let result = '';
    if (n >= 10000000) { result += _numToWords(Math.floor(n / 10000000)) + ' Crore '; n %= 10000000; }
    if (n >= 100000) { result += _numToWords(Math.floor(n / 100000)) + ' Lakh '; n %= 100000; }
    if (n >= 1000) { result += _numToWords(Math.floor(n / 1000)) + ' Thousand '; n %= 1000; }
    if (n >= 100) { result += ones[Math.floor(n / 100)] + ' Hundred '; n %= 100; }
    if (n >= 20) { result += tens[Math.floor(n / 10)]; n %= 10; if (n > 0) result += '-' + ones[n]; return result.trim(); }
    if (n > 0) result += ones[n];
    return result.trim();
  }

  function _esc(str) {
    if (!str && str !== 0) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function _shortMonth(m) {
    if (!m) return 'Jan';
    const map = {
      January: 'Jan', February: 'Feb', March: 'Mar', April: 'Apr',
      May: 'May', June: 'Jun', July: 'Jul', August: 'Aug',
      September: 'Sep', October: 'Oct', November: 'Nov', December: 'Dec'
    };
    return map[m] || (m.length > 3 ? m.slice(0, 3) : m);
  }

  function _formatMonthYear(month, year) {
    const sm = _shortMonth(month || 'Jan');
    const yr = year || new Date().getFullYear();
    return `${sm}-${yr}`;
  }

  function _formatDoj(d) {
    if (!d) return '--';
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      const parts = d.split('-');
      const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const mIdx = parseInt(parts[1], 10) - 1;
      return `${parts[2]}-${monthNames[mIdx] || parts[1]}-${parts[0]}`;
    }
    return d;
  }

  function _fmtDays(val, fallback) {
    if (val === undefined || val === null || val === '') {
      val = fallback;
    }
    const num = parseFloat(val);
    if (isNaN(num)) return String(val);
    return num.toFixed(1);
  }

  /**
   * Renders the HTML markup for a single payslip page
   */
  function renderSingleSlipPage(data) {
    const c = data.company || {};
    const e = data.employee || {};
    const att = data.attendance || {};
    const earnings = data.earnings || [];
    const deductions = data.deductions || { items: [], total: 0 };

    const totalEarn = earnings.reduce((s, r) => s + (parseFloat(r.salary) || 0), 0);
    const totalDed = deductions.total || (deductions.items ? deductions.items.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0) : 0);
    const netPay = totalEarn - totalDed;
    const monthYearStr = _formatMonthYear(data.month, data.year);

    const U = s => (s ? String(s).trim().toUpperCase() : '');

    const logoData = c.logoData || null;
    const compName = U(c.name) || 'COMPANY NAME';
    const compAddr = U(c.address) || '';
    const compPhone = c.phone || '';
    const compEmail = c.email || '';

    // Logo HTML
    let logoHtml;
    if (logoData) {
      logoHtml = `<div class="slip-header-logo"><img src="${logoData}" alt="${_esc(compName)}" /></div>`;
    } else {
      logoHtml = `
        <div class="slip-header-brand">
          <div class="brand-badge-icon">
            <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 2L32 10V26L18 34L4 26V10L18 2Z" fill="#0070c0" fill-opacity="0.15" stroke="#0070c0" stroke-width="2"/>
              <path d="M18 7L27 12V24L18 29L9 24V12L18 7Z" fill="#0070c0"/>
            </svg>
          </div>
          <div class="brand-text-name">${_esc(compName)}</div>
          <div class="brand-text-tagline">SERVICES &bull; RECRUITMENT &bull; SOLUTIONS</div>
        </div>`;
    }

    // Address & Phone
    const addrHtml = compAddr ? _esc(compAddr).replace(/\n/g, '<br>') : '';
    const contactParts = [];
    if (compPhone) contactParts.push(_esc(compPhone));
    if (compEmail) contactParts.push(_esc(compEmail));
    const phoneHtml = contactParts.join(' &nbsp;|&nbsp; ');

    // Employee Key-Values
    const empId = U(e.id) || '--';
    const empName = U(e.name) || '--';
    const empLocation = U(e.location) || '--';
    const empDivision = U(e.division) || '--';
    const empDoj = _formatDoj(e.doj);
    const empDesignation = U(e.designation) || '--';
    const empUan = U(e.uan) || '--';
    const empBankName = U(e.bankName) || '--';
    const empEsic = U(e.esic) || '--';
    const empAcNo = U(e.acNo) || '--';
    const empPan = U(e.pan) || '--';
    const empIfsc = U(e.ifsc) || '--';

    // Attendance numbers formatted as 31.0, 00.0, etc.
    const totalDaysStr = _fmtDays(att.totalDays, 31);
    const daysPaidStr = _fmtDays(att.daysPaid, totalDaysStr);
    const lopVal = parseFloat(att.lop) || 0;
    const lopStr = lopVal === 0 ? '00.0' : lopVal.toFixed(1);

    // Build earnings/deductions table rows
    const dedItems = deductions.items || [];
    const maxRows = Math.max(earnings.length, dedItems.length, 3);
    let tableRows = '';

    for (let i = 0; i < maxRows; i++) {
      const er = earnings[i];
      const dr = dedItems[i];

      const erName = er && er.name ? _esc(er.name) : '';
      const erActual = er && er.actual !== undefined && er.actual !== '' ? fmt(er.actual) : '';
      const erSalary = er && er.salary !== undefined && er.salary !== '' ? fmt(er.salary) : '';

      const drName = dr && dr.name ? _esc(dr.name) : '';
      const drAmt = dr && dr.amount !== undefined && dr.amount !== '' ? fmt(dr.amount) : '';

      tableRows += `
      <tr class="slip-data-row">
        <td class="col-head-earn">${erName}</td>
        <td class="col-act-earn">${erActual}</td>
        <td class="col-sal-earn">${erSalary}</td>
        <td class="col-head-ded">${drName}</td>
        <td class="col-amt-ded">${drAmt}</td>
      </tr>`;
    }

    // Bank Credit Text
    let bankCreditText = `Your salary for the month ${monthYearStr} of Rs. ${fmt(netPay)} credited to your bank account no: ${empAcNo}`;
    if (empBankName && empBankName !== '--') {
      bankCreditText += ` of bank ${empBankName}`;
    }
    if (empIfsc && empIfsc !== '--') {
      bankCreditText += ` (${empIfsc})`;
    }
    bankCreditText += '.';

    return `
    <div class="slip-card-wrapper">
      <div class="payslip-outer-box">

        <!-- ── HEADER ── -->
        <div class="slip-header-section">
          <div class="slip-company-info">
            <div class="slip-company-title">${_esc(compName)}</div>
            ${addrHtml ? `<div class="slip-company-address">${addrHtml}</div>` : ''}
            ${phoneHtml ? `<div class="slip-company-phone">${phoneHtml}</div>` : ''}
          </div>
          <div class="slip-logo-wrapper">
            ${logoHtml}
          </div>
        </div>

        <!-- ── TITLE BAR ── -->
        <div class="slip-month-title">
          Payslip for the month of ${monthYearStr}
        </div>

        <!-- ── EMPLOYEE DETAILS ── -->
        <div class="slip-employee-details">
          <table class="slip-emp-table">
            <tbody>
              <tr>
                <td class="lbl">Employee ID</td>
                <td class="val">${_esc(empId)}</td>
                <td class="lbl">Employee Name :</td>
                <td class="val">${_esc(empName)}</td>
              </tr>
              <tr>
                <td class="lbl">Location :</td>
                <td class="val">${_esc(empLocation)}</td>
                <td class="lbl">Division :</td>
                <td class="val">${_esc(empDivision)}</td>
              </tr>
              <tr>
                <td class="lbl">Date of Joining:</td>
                <td class="val">${_esc(empDoj)}</td>
                <td class="lbl">Designation :</td>
                <td class="val">${_esc(empDesignation)}</td>
              </tr>
              <tr>
                <td class="lbl">UAN :</td>
                <td class="val">${_esc(empUan)}</td>
                <td class="lbl">Bank Name :</td>
                <td class="val">${_esc(empBankName)}</td>
              </tr>
              <tr>
                <td class="lbl">ESIC No :</td>
                <td class="val">${_esc(empEsic)}</td>
                <td class="lbl">Bank A/c :</td>
                <td class="val">${_esc(empAcNo)}</td>
              </tr>
              <tr>
                <td class="lbl">PAN No :</td>
                <td class="val">${_esc(empPan)}</td>
                <td class="lbl">IFSC Code:</td>
                <td class="val">${_esc(empIfsc)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ── ATTENDANCE ── -->
        <div class="slip-attendance-bar">
          <div class="att-item-left">Total Days in Month: ${totalDaysStr}</div>
          <div class="att-item-mid">Days Paid:${daysPaidStr}</div>
          <div class="att-item-right">Loss of Pay: ${lopStr}</div>
        </div>

        <!-- ── EARNINGS & DEDUCTIONS TABLE ── -->
        <div class="slip-financial-table-container">
          <table class="slip-grid-table">
            <thead>
              <tr class="th-group-row">
                <th colspan="3" class="th-earnings-grp">Earnings</th>
                <th colspan="2" class="th-deductions-grp">Deductions</th>
              </tr>
              <tr class="th-cols-row">
                <th class="col-head-earn">Header</th>
                <th class="col-act-earn">Actual</th>
                <th class="col-sal-earn">Salary</th>
                <th class="col-head-ded">Header</th>
                <th class="col-amt-ded">Deducted</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
              <tr class="row-totals">
                <td colspan="3" class="cell-tot-earn">Total Earning :${fmt(totalEarn)}</td>
                <td colspan="2" class="cell-tot-ded">Total Deduction : ${fmt(totalDed)}</td>
              </tr>
              <tr class="row-netpay">
                <td colspan="3" class="cell-blank"></td>
                <td colspan="2" class="cell-netpay">Net Pay : ${fmt(netPay)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ── SALARY CREDIT NOTE ── -->
        <div class="slip-credit-note">
          ${_esc(bankCreditText)}
        </div>

        <!-- ── FOOTER NOTE ── -->
        <div class="slip-footer-note">
          This is computer generated document and signature doesn’t require.
        </div>

      </div>
    </div>`;
  }

  /**
   * Generates full printable HTML for multiple payslips or single payslip
   */
  function generateMulti(dataList) {
    const list = Array.isArray(dataList) ? dataList : [dataList];
    if (!list.length) return '';

    const first = list[0];
    const c = first.company || {};
    const compName = c.name || 'Company';
    const isMulti = list.length > 1;
    const title = isMulti
      ? `${compName}_Payslips_${list[0].month}_to_${list[list.length - 1].month}_${list[0].year || ''}`
      : `${compName}_${first.month || ''}_${first.year || ''}_Slip`;

    const slipsHtml = list.map(d => renderSingleSlipPage(d)).join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${_esc(title)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Segoe+UI:wght@400;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap');

  /* ── RESET ── */
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: 'Segoe UI', 'Inter', -apple-system, BlinkMacSystemFont, Arial, sans-serif;
    background: #e5e7eb;
    color: #000;
    padding: 30px 15px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* ── PRINT RULES ── */
  @media print {
    body {
      background: #fff !important;
      padding: 0 !important;
      margin: 0 !important;
    }
    .slip-multi-wrap {
      gap: 0 !important;
      margin: 0 !important;
      max-width: 100% !important;
    }
    .slip-card-wrapper {
      box-shadow: none !important;
      margin: 0 !important;
      padding: 0 !important;
      max-width: 100% !important;
      page-break-after: always !important;
      break-after: page !important;
    }
    .slip-card-wrapper:last-child {
      page-break-after: auto !important;
      break-after: auto !important;
    }
    .payslip-outer-box {
      border: 2px solid #000 !important;
      box-shadow: none !important;
      margin: 0 auto !important;
    }
    .no-print {
      display: none !important;
    }
    @page {
      margin: 12mm 15mm;
      size: A4 portrait;
    }
  }

  /* ── SCREEN WRAPPER ── */
  @media screen {
    .slip-multi-wrap {
      display: flex;
      flex-direction: column;
      gap: 35px;
      max-width: 820px;
      margin: 0 auto 70px auto;
    }
    .slip-card-wrapper {
      background: #fff;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
      padding: 2px;
    }
  }

  /* ── PAYSLIP OUTER BOX (2px Black Border) ── */
  .payslip-outer-box {
    border: 2px solid #000;
    background: #fff;
    padding: 24px 28px 30px 28px;
    color: #000;
    min-height: 840px;
    box-sizing: border-box;
  }

  /* ══════════════════════════════════════════
     1. HEADER SECTION
     ══════════════════════════════════════════ */
  .slip-header-section {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
    margin-bottom: 12px;
  }

  .slip-company-info {
    flex: 1;
  }

  .slip-company-title {
    font-size: 15pt;
    font-weight: 700;
    color: #000;
    line-height: 1.25;
    margin-bottom: 4px;
    font-family: 'Segoe UI', Arial, sans-serif;
  }

  .slip-company-address {
    font-size: 9.5pt;
    color: #000;
    line-height: 1.35;
    max-width: 480px;
  }

  .slip-company-phone {
    font-size: 9.5pt;
    color: #000;
    margin-top: 3px;
  }

  .slip-logo-wrapper {
    flex-shrink: 0;
    text-align: right;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: flex-start;
  }

  .slip-header-logo img {
    max-height: 65px;
    max-width: 190px;
    object-fit: contain;
  }

  .slip-header-brand {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .brand-badge-icon svg {
    width: 38px;
    height: 38px;
  }

  .brand-text-name {
    font-size: 17pt;
    font-weight: 800;
    color: #0070c0;
    letter-spacing: 0.5px;
    line-height: 1.1;
    margin-top: 2px;
  }

  .brand-text-tagline {
    font-size: 6.5pt;
    font-weight: 700;
    color: #555;
    letter-spacing: 1px;
    margin-top: 2px;
  }

  /* ══════════════════════════════════════════
     2. TITLE BAR (Payslip for the month of ...)
     ══════════════════════════════════════════ */
  .slip-month-title {
    text-align: center;
    color: #0070c0;
    font-size: 10pt;
    font-weight: 700;
    margin: 10px 0 14px 0;
    letter-spacing: 0.2px;
  }

  /* ══════════════════════════════════════════
     3. EMPLOYEE DETAILS TABLE
     ══════════════════════════════════════════ */
  .slip-employee-details {
    margin-bottom: 12px;
  }

  .slip-emp-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9.5pt;
  }

  .slip-emp-table td {
    padding: 2.5px 4px;
    vertical-align: top;
    line-height: 1.35;
    border: none;
  }

  .slip-emp-table .lbl {
    font-weight: 700;
    color: #000;
    width: 17%;
    white-space: nowrap;
  }

  .slip-emp-table .val {
    font-weight: 400;
    color: #000;
    width: 33%;
  }

  /* ══════════════════════════════════════════
     4. ATTENDANCE BAR
     ══════════════════════════════════════════ */
  .slip-attendance-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #000;
    border-bottom: 1px solid #000;
    padding: 5px 12px;
    font-size: 9.5pt;
    font-weight: 700;
    color: #000;
    margin-top: 6px;
    margin-bottom: 0;
  }

  .att-item-left {
    text-align: left;
    flex: 1;
  }

  .att-item-mid {
    text-align: center;
    flex: 1;
  }

  .att-item-right {
    text-align: right;
    flex: 1;
  }

  /* ══════════════════════════════════════════
     5. FINANCIAL TABLE (EARNINGS & DEDUCTIONS)
     ══════════════════════════════════════════ */
  .slip-financial-table-container {
    width: 100%;
    margin-top: 0;
  }

  .slip-grid-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9.5pt;
    border: 1px solid #000;
  }

  .slip-grid-table th,
  .slip-grid-table td {
    padding: 3px 6px;
    line-height: 1.35;
    color: #000;
  }

  /* Header Group Row (Earnings | Deductions) */
  .th-group-row th {
    font-weight: 700;
    text-align: center;
    border-bottom: 1px solid #000;
  }

  .th-earnings-grp {
    border-right: 1px solid #000;
  }

  .th-deductions-grp {
  }

  /* Header Columns Row (Header | Actual | Salary | Header | Deducted) */
  .th-cols-row th {
    font-weight: 400;
    border-bottom: 1px solid #000;
    font-size: 9.5pt;
  }

  .col-head-earn {
    width: 32%;
    text-align: left;
    border-right: 1px solid #000;
  }

  .col-act-earn {
    width: 15%;
    text-align: right;
    border-right: 1px solid #000;
  }

  .col-sal-earn {
    width: 15%;
    text-align: right;
    border-right: 1px solid #000;
  }

  .col-head-ded {
    width: 23%;
    text-align: left;
    border-right: 1px solid #000;
  }

  .col-amt-ded {
    width: 15%;
    text-align: right;
  }

  /* Data Rows */
  .slip-data-row td {
    height: 20px;
  }

  .cell-head-earn {
    text-align: left;
    border-right: 1px solid #000;
  }

  .cell-act-earn {
    text-align: right;
    border-right: 1px solid #000;
  }

  .cell-sal-earn {
    text-align: right;
    border-right: 1px solid #000;
  }

  .cell-head-ded {
    text-align: left;
    border-right: 1px solid #000;
  }

  .cell-amt-ded {
    text-align: right;
  }

  /* Total Row */
  .row-totals td {
    border-top: 1px solid #000;
    border-bottom: 1px solid #000;
    font-weight: 400;
    padding: 3.5px 6px;
  }

  .cell-tot-earn {
    text-align: right;
    border-right: 1px solid #000;
  }

  .cell-tot-ded {
    text-align: right;
  }

  /* Net Pay Row */
  .row-netpay td {
    padding: 0;
  }

  .cell-blank {
    border: none;
  }

  .cell-netpay {
    border: 1px solid #000;
    border-top: none;
    text-align: right;
    font-weight: 700;
    padding: 4px 6px;
    background: #fff;
  }

  /* ══════════════════════════════════════════
     6. SALARY CREDIT NOTE
     ══════════════════════════════════════════ */
  .slip-credit-note {
    font-size: 9.5pt;
    color: #000;
    line-height: 1.45;
    margin-top: 16px;
  }

  /* ══════════════════════════════════════════
     7. FOOTER NOTE
     ══════════════════════════════════════════ */
  .slip-footer-note {
    font-size: 9.5pt;
    color: #000;
    margin-top: 22px;
  }

  /* ══════════════════════════════════════════
     PRINT TOOLBAR (ON-SCREEN ONLY)
     ══════════════════════════════════════════ */
  .slip-print-bar {
    position: fixed;
    bottom: 20px;
    right: 20px;
    display: flex;
    gap: 10px;
    background: #111827;
    padding: 10px 16px;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    z-index: 9999;
  }

  .btn-print {
    background: #0070c0;
    color: #fff;
    border: none;
    padding: 9px 18px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .btn-print:hover {
    background: #005a9e;
  }

  .btn-close-slip {
    background: #374151;
    color: #fff;
    border: none;
    padding: 9px 15px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }

  .btn-close-slip:hover {
    background: #4b5563;
  }
</style>
</head>
<body>

<div class="slip-multi-wrap">
  ${slipsHtml}
</div>

<div class="slip-print-bar no-print">
  <button class="btn-print" onclick="window.print()">${isMulti ? `Print All (${list.length}) Payslips` : 'Print Payslip'}</button>
  <button class="btn-close-slip" onclick="window.close()">Close</button>
</div>

</body>
</html>`;
  }

  function generate(data) {
    return generateMulti([data]);
  }

  const engine = {
    generate,
    generateMulti,
    renderSingleSlipPage
  };

  if (typeof window !== 'undefined') {
    window.SalarySlipEngine = engine;
  }

  return engine;
})();

