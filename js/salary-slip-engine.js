/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SALARY SLIP ENGINE – Multi-Format Corporate Payslip Generator
 * 
 * Supports 3 distinctive Corporate Payslip Formats:
 *   1. corporate - "Corporate Standard (Classic Box)"
 *                  Traditional high-contrast 2px border, classic royal blue accent,
 *                  6-row 2-column employee matrix, 5-column financial grid.
 *   2. modern    - "Modern Corporate (Executive Navy & Emerald)"
 *                  MNC executive styling, dark navy header banner with gold accent stripe,
 *                  2-column structured card details, 3 metric attendance tiles,
 *                  balanced twin earn/ded tables, full-width rich emerald Net Pay banner.
 *   3. compact   - "Corporate Compact (Enterprise Slate)" (also aliased as "classic")
 *                  Institutional enterprise layout, dark slate top bar,
 *                  high-efficiency 3-column employee grid, alternating row financial table,
 *                  double-border Net Pay box, digital system certification note.
 * 
 * Includes:
 *   - Client-side interactive format switcher in print preview window
 *   - Clean A4 portrait print stylesheet
 *   - Multi-month batch generation support
 *   - Full backward compatibility (defaults to 'corporate')
 * ═══════════════════════════════════════════════════════════════════════════════
 */
const SalarySlipEngine = (() => {

  /* ─────────────────────────── SHARED UTILITIES ──────────────────────────── */

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
    if (n >= 100000)   { result += _numToWords(Math.floor(n / 100000)) + ' Lakh '; n %= 100000; }
    if (n >= 1000)     { result += _numToWords(Math.floor(n / 1000)) + ' Thousand '; n %= 1000; }
    if (n >= 100)      { result += ones[Math.floor(n / 100)] + ' Hundred '; n %= 100; }
    if (n >= 20)       { result += tens[Math.floor(n / 10)]; n %= 10; if (n > 0) result += '-' + ones[n]; return result.trim(); }
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
    if (val === undefined || val === null || val === '') { val = fallback; }
    const num = parseFloat(val);
    if (isNaN(num)) return String(val);
    return num.toFixed(1);
  }

  /* ─────────────────── SHARED DATA EXTRACTION ────────────────────────────── */

  function _extractSlipData(data) {
    const c   = data.company    || {};
    const e   = data.employee   || {};
    const att = data.attendance || {};
    const earnings   = data.earnings   || [];
    const deductions = data.deductions || { items: [], total: 0 };

    const totalEarn = earnings.reduce((s, r) => s + (parseFloat(r.salary) || 0), 0);
    const totalDed  = deductions.total || (deductions.items ? deductions.items.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0) : 0);
    const netPay    = totalEarn - totalDed;
    const monthYearStr = _formatMonthYear(data.month, data.year);

    const U = s => (s ? String(s).trim().toUpperCase() : '');

    const logoData  = c.logoData || null;
    const compName  = U(c.name)    || 'COMPANY NAME';
    const compAddr  = U(c.address) || '';
    const compPhone = c.phone || '';
    const compEmail = c.email || '';

    const empId          = U(e.id)          || '--';
    const empName        = U(e.name)        || '--';
    const empLocation    = U(e.location)    || '--';
    const empDivision    = U(e.division)    || '--';
    const empDoj         = _formatDoj(e.doj);
    const empDesignation = U(e.designation) || '--';
    const empUan         = U(e.uan)         || '--';
    const empBankName    = U(e.bankName)    || '--';
    const empEsic        = U(e.esic)        || '--';
    const empAcNo        = U(e.acNo)        || '--';
    const empPan         = U(e.pan)         || '--';
    const empIfsc        = U(e.ifsc)        || '--';

    const totalDaysStr = _fmtDays(att.totalDays, 31);
    const daysPaidStr  = _fmtDays(att.daysPaid, totalDaysStr);
    const lopVal       = parseFloat(att.lop) || 0;
    const lopStr       = lopVal === 0 ? '00.0' : lopVal.toFixed(1);

    const dedItems = deductions.items || [];

    let bankCreditText = `Your salary for the month ${monthYearStr} of Rs. ${fmt(netPay)} credited to your bank account no: ${empAcNo}`;
    if (empBankName && empBankName !== '--') bankCreditText += ` of bank ${empBankName}`;
    if (empIfsc && empIfsc !== '--') bankCreditText += ` (${empIfsc})`;
    bankCreditText += '.';

    return {
      c, e, att, earnings, deductions, dedItems,
      totalEarn, totalDed, netPay, monthYearStr,
      logoData, compName, compAddr, compPhone, compEmail,
      empId, empName, empLocation, empDivision, empDoj, empDesignation,
      empUan, empBankName, empEsic, empAcNo, empPan, empIfsc,
      totalDaysStr, daysPaidStr, lopStr, bankCreditText
    };
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     FORMAT 1 – CORPORATE STANDARD (Classic Box)
     Classic 2px border, company info left / logo right, blue title bar,
     employee 6-row detail table, attendance bar, 5-column combined table.
  ═══════════════════════════════════════════════════════════════════════════ */

  function _renderCorporate(data) {
    const d = _extractSlipData(data);

    let logoHtml;
    if (d.logoData) {
      logoHtml = `<div class="slip-header-logo"><img src="${d.logoData}" alt="${_esc(d.compName)}" /></div>`;
    } else {
      logoHtml = `
        <div class="slip-header-brand">
          <div class="brand-badge-icon">
            <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 2L32 10V26L18 34L4 26V10L18 2Z" fill="#0070c0" fill-opacity="0.15" stroke="#0070c0" stroke-width="2"/>
              <path d="M18 7L27 12V24L18 29L9 24V12L18 7Z" fill="#0070c0"/>
            </svg>
          </div>
          <div class="brand-text-name">${_esc(d.compName)}</div>
          <div class="brand-text-tagline">SERVICES &bull; RECRUITMENT &bull; SOLUTIONS</div>
        </div>`;
    }

    const addrHtml = d.compAddr ? _esc(d.compAddr).replace(/\n/g, '<br>') : '';
    const contactParts = [];
    if (d.compPhone) contactParts.push(_esc(d.compPhone));
    if (d.compEmail) contactParts.push(_esc(d.compEmail));
    const phoneHtml = contactParts.join(' &nbsp;|&nbsp; ');

    const maxRows = Math.max(d.earnings.length, d.dedItems.length, 3);
    let tableRows = '';
    for (let i = 0; i < maxRows; i++) {
      const er = d.earnings[i];
      const dr = d.dedItems[i];
      const erName   = er && er.name   ? _esc(er.name)   : '';
      const erActual = er && er.actual !== undefined && er.actual !== '' ? fmt(er.actual) : '';
      const erSalary = er && er.salary !== undefined && er.salary !== '' ? fmt(er.salary) : '';
      const drName   = dr && dr.name   ? _esc(dr.name)   : '';
      const drAmt    = dr && dr.amount !== undefined && dr.amount !== '' ? fmt(dr.amount) : '';
      tableRows += `
      <tr class="slip-data-row">
        <td class="col-head-earn">${erName}</td>
        <td class="col-act-earn">${erActual}</td>
        <td class="col-sal-earn">${erSalary}</td>
        <td class="col-head-ded">${drName}</td>
        <td class="col-amt-ded">${drAmt}</td>
      </tr>`;
    }

    return `
    <div class="slip-card-wrapper fmt-corporate">
      <div class="payslip-outer-box">

        <!-- ── HEADER ── -->
        <div class="slip-header-section">
          <div class="slip-company-info">
            <div class="slip-company-title">${_esc(d.compName)}</div>
            ${addrHtml ? `<div class="slip-company-address">${addrHtml}</div>` : ''}
            ${phoneHtml ? `<div class="slip-company-phone">${phoneHtml}</div>` : ''}
          </div>
          <div class="slip-logo-wrapper">${logoHtml}</div>
        </div>

        <!-- ── TITLE BAR ── -->
        <div class="slip-month-title">
          Payslip for the month of ${d.monthYearStr}
        </div>

        <!-- ── EMPLOYEE DETAILS ── -->
        <div class="slip-employee-details">
          <table class="slip-emp-table">
            <tbody>
              <tr>
                <td class="lbl">Employee ID</td><td class="val">${_esc(d.empId)}</td>
                <td class="lbl">Employee Name :</td><td class="val">${_esc(d.empName)}</td>
              </tr>
              <tr>
                <td class="lbl">Location :</td><td class="val">${_esc(d.empLocation)}</td>
                <td class="lbl">Division :</td><td class="val">${_esc(d.empDivision)}</td>
              </tr>
              <tr>
                <td class="lbl">Date of Joining:</td><td class="val">${_esc(d.empDoj)}</td>
                <td class="lbl">Designation :</td><td class="val">${_esc(d.empDesignation)}</td>
              </tr>
              <tr>
                <td class="lbl">UAN :</td><td class="val">${_esc(d.empUan)}</td>
                <td class="lbl">Bank Name :</td><td class="val">${_esc(d.empBankName)}</td>
              </tr>
              <tr>
                <td class="lbl">ESIC No :</td><td class="val">${_esc(d.empEsic)}</td>
                <td class="lbl">Bank A/c :</td><td class="val">${_esc(d.empAcNo)}</td>
              </tr>
              <tr>
                <td class="lbl">PAN No :</td><td class="val">${_esc(d.empPan)}</td>
                <td class="lbl">IFSC Code:</td><td class="val">${_esc(d.empIfsc)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ── ATTENDANCE ── -->
        <div class="slip-attendance-bar">
          <div class="att-item-left">Total Days in Month: ${d.totalDaysStr}</div>
          <div class="att-item-mid">Days Paid:${d.daysPaidStr}</div>
          <div class="att-item-right">Loss of Pay: ${d.lopStr}</div>
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
                <td colspan="3" class="cell-tot-earn">Total Earning :${fmt(d.totalEarn)}</td>
                <td colspan="2" class="cell-tot-ded">Total Deduction : ${fmt(d.totalDed)}</td>
              </tr>
              <tr class="row-netpay">
                <td colspan="3" class="cell-blank"></td>
                <td colspan="2" class="cell-netpay">Net Pay : ${fmt(d.netPay)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ── SALARY CREDIT NOTE ── -->
        <div class="slip-credit-note">${_esc(d.bankCreditText)}</div>

        <!-- ── FOOTER NOTE ── -->
        <div class="slip-footer-note">
          This is computer generated document and signature doesn't require.
        </div>

      </div>
    </div>`;
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     FORMAT 2 – MODERN CORPORATE (Executive Navy & Emerald)
     Full-width dark navy header banner with company name, gold accent stripe,
     two-column executive employee cards, 3 attendance tiles,
     side-by-side balanced tables, rich emerald Net Pay banner with words,
     confidentiality watermark and digital signature waiver.
  ═══════════════════════════════════════════════════════════════════════════ */

  function _renderModern(data) {
    const d = _extractSlipData(data);

    const addrHtml = d.compAddr ? _esc(d.compAddr).replace(/\n/g, ' &bull; ') : '';
    const contactLine = [d.compPhone, d.compEmail].filter(Boolean).map(_esc).join(' &nbsp;|&nbsp; ');

    let logoImgHtml = '';
    if (d.logoData) {
      logoImgHtml = `<img src="${d.logoData}" alt="${_esc(d.compName)}" class="mod-logo-img" />`;
    } else {
      const initials = d.compName.replace(/[^A-Za-z0-9]/g, '').slice(0, 2) || 'CO';
      logoImgHtml = `<div class="mod-logo-placeholder">${_esc(initials)}</div>`;
    }

    const leftFields = [
      ['Employee ID',    d.empId],
      ['Employee Name',  d.empName],
      ['Designation',    d.empDesignation],
      ['Department',     d.empDivision],
      ['Work Location',  d.empLocation],
      ['Date of Joining', d.empDoj],
    ];
    const rightFields = [
      ['UAN Number',     d.empUan],
      ['ESIC Number',    d.empEsic],
      ['Income Tax PAN', d.empPan],
      ['Bank Name',      d.empBankName],
      ['Bank A/c No',    d.empAcNo],
      ['Bank IFSC',      d.empIfsc],
    ];

    const makeFieldRow = ([lbl, val]) =>
      `<div class="mod-field"><span class="mod-field-lbl">${_esc(lbl)}</span><span class="mod-field-val">${_esc(val)}</span></div>`;

    const maxRows = Math.max(d.earnings.length, d.dedItems.length, 3);
    let earnRows = '';
    let dedRows  = '';

    for (let i = 0; i < maxRows; i++) {
      const er = d.earnings[i];
      const dr = d.dedItems[i];
      const erName = er && er.name ? _esc(er.name) : '&nbsp;';
      const erActual = er && er.actual !== undefined && er.actual !== '' ? fmt(er.actual) : '&nbsp;';
      const erSalary = er && er.salary !== undefined && er.salary !== '' ? fmt(er.salary) : '&nbsp;';
      const drName = dr && dr.name ? _esc(dr.name) : '&nbsp;';
      const drAmt  = dr && dr.amount !== undefined && dr.amount !== '' ? fmt(dr.amount) : '&nbsp;';

      earnRows += `<tr><td class="mod-td-name">${erName}</td><td class="mod-td-num">${erActual}</td><td class="mod-td-num">${erSalary}</td></tr>`;
      dedRows  += `<tr><td class="mod-td-name">${drName}</td><td class="mod-td-num">${drAmt}</td></tr>`;
    }

    const netWords = _numToWords(Math.round(d.netPay));

    return `
    <div class="slip-card-wrapper fmt-modern">
      <div class="mod-outer">

        <!-- ── EXECUTIVE NAVY HEADER BANNER ── -->
        <div class="mod-header">
          <div class="mod-header-left">
            <div class="mod-company-name">${_esc(d.compName)}</div>
            ${addrHtml ? `<div class="mod-company-addr">${addrHtml}</div>` : ''}
            ${contactLine ? `<div class="mod-company-contact">${contactLine}</div>` : ''}
          </div>
          <div class="mod-header-right">${logoImgHtml}</div>
        </div>

        <!-- ── GOLD ACCENT STRIPE ── -->
        <div class="mod-accent-stripe"></div>

        <!-- ── PAYSLIP PERIOD TITLE ── -->
        <div class="mod-title-row">
          <span class="mod-title-badge"><i class="mod-title-icon">&#9632;</i> SALARY SLIP FOR THE MONTH OF ${d.monthYearStr.toUpperCase()}</span>
        </div>

        <!-- ── EMPLOYEE DETAILS: 2-COLUMN STRUCTURED GRID ── -->
        <div class="mod-emp-grid">
          <div class="mod-emp-col">
            <div class="mod-col-heading">Employee Information</div>
            ${leftFields.map(makeFieldRow).join('')}
          </div>
          <div class="mod-emp-col">
            <div class="mod-col-heading">Statutory &amp; Banking Details</div>
            ${rightFields.map(makeFieldRow).join('')}
          </div>
        </div>

        <!-- ── ATTENDANCE METRICS STRIP ── -->
        <div class="mod-att-row">
          <div class="mod-att-tile">
            <div class="mod-att-label">Calendar Days</div>
            <div class="mod-att-value">${d.totalDaysStr}</div>
          </div>
          <div class="mod-att-tile">
            <div class="mod-att-label">Payable Days</div>
            <div class="mod-att-value">${d.daysPaidStr}</div>
          </div>
          <div class="mod-att-tile mod-att-lop">
            <div class="mod-att-label">Loss of Pay (LOP)</div>
            <div class="mod-att-value">${d.lopStr}</div>
          </div>
        </div>

        <!-- ── BALANCED TWIN FINANCIAL TABLES ── -->
        <div class="mod-fin-row">
          <div class="mod-fin-panel mod-earn-panel">
            <table class="mod-fin-table">
              <thead>
                <tr><th class="mod-th-title" colspan="3">Earnings Particulars</th></tr>
                <tr>
                  <th class="mod-th-hdr mod-td-name">Description</th>
                  <th class="mod-th-hdr mod-td-num">Actual (&#8377;)</th>
                  <th class="mod-th-hdr mod-td-num">Earned (&#8377;)</th>
                </tr>
              </thead>
              <tbody>${earnRows}</tbody>
              <tfoot>
                <tr class="mod-tfoot-row">
                  <td class="mod-td-name mod-tfoot-lbl">Total Gross Earnings</td>
                  <td class="mod-td-num mod-tfoot-amt" colspan="2">&#8377; ${fmt(d.totalEarn)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div class="mod-fin-panel mod-ded-panel">
            <table class="mod-fin-table">
              <thead>
                <tr><th class="mod-th-title" colspan="2">Deductions Particulars</th></tr>
                <tr>
                  <th class="mod-th-hdr mod-td-name">Description</th>
                  <th class="mod-th-hdr mod-td-num">Deducted (&#8377;)</th>
                </tr>
              </thead>
              <tbody>${dedRows}</tbody>
              <tfoot>
                <tr class="mod-tfoot-row">
                  <td class="mod-td-name mod-tfoot-lbl">Total Deductions</td>
                  <td class="mod-td-num mod-tfoot-amt">&#8377; ${fmt(d.totalDed)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- ── RICH EMERALD NET PAY BANNER ── -->
        <div class="mod-netpay-banner">
          <div class="mod-netpay-left">
            <span class="mod-netpay-label">Net Take-Home Pay (In Words)</span>
            <span class="mod-netpay-words">Rupees ${netWords} Only</span>
          </div>
          <div class="mod-netpay-right">
            <span class="mod-netpay-label">Net Salary Payable</span>
            <span class="mod-netpay-amount">&#8377;&nbsp;${fmt(d.netPay)}</span>
          </div>
        </div>

        <!-- ── BANK CREDIT STATEMENT ── -->
        <div class="mod-credit-note">${_esc(d.bankCreditText)}</div>

        <!-- ── COMPLIANCE & PRIVACY FOOTER ── -->
        <div class="mod-footer">
          <span class="mod-footer-confidential">&#128274; CONFIDENTIAL &bull; STRICTLY PRIVATE</span>
          <span class="mod-footer-note">This is a computer-generated payslip and does not require a physical signature.</span>
        </div>

      </div>
    </div>`;
  }

  /* ═══════════════════════════════════════════════════════════════════════════
     FORMAT 3 – CORPORATE COMPACT (Enterprise Slate)
     High-efficiency 3-column employee grid, dark slate header with gold rule,
     clean alternating ledger rows, double-border Net Pay summary box,
     100% digital verification certification (no manual signatory).
  ═══════════════════════════════════════════════════════════════════════════ */

  function _renderCompact(data) {
    const d = _extractSlipData(data);

    const addrHtml = d.compAddr ? _esc(d.compAddr).replace(/\n/g, ' &bull; ') : '';
    const contactLine = [d.compPhone, d.compEmail].filter(Boolean).map(_esc).join('  |  ');

    let logoHtml = '';
    if (d.logoData) {
      logoHtml = `<img src="${d.logoData}" alt="${_esc(d.compName)}" class="cls-logo-img" />`;
    } else {
      const initials = d.compName.replace(/[^A-Za-z0-9]/g, '').slice(0, 2) || 'CO';
      logoHtml = `<div class="cls-logo-initials">${_esc(initials)}</div>`;
    }

    const empFields = [
      ['Employee ID',     d.empId],
      ['Employee Name',   d.empName],
      ['Designation',     d.empDesignation],
      ['Department',      d.empDivision],
      ['Location / Hub',  d.empLocation],
      ['Date of Joining', d.empDoj],
      ['UAN Number',      d.empUan],
      ['ESIC Number',     d.empEsic],
      ['Permanent A/c (PAN)', d.empPan],
      ['Bank Name',       d.empBankName],
      ['Bank Account No', d.empAcNo],
      ['Bank IFSC Code',  d.empIfsc],
    ];

    const empFieldHtml = empFields.map(([lbl, val]) =>
      `<div class="cls-field"><span class="cls-field-lbl">${_esc(lbl)}</span><span class="cls-field-val">${_esc(val)}</span></div>`
    ).join('');

    const maxRows = Math.max(d.earnings.length, d.dedItems.length, 3);
    let tableRows = '';
    for (let i = 0; i < maxRows; i++) {
      const er = d.earnings[i];
      const dr = d.dedItems[i];
      const erName   = er && er.name ? _esc(er.name) : '&nbsp;';
      const erActual = er && er.actual !== undefined && er.actual !== '' ? fmt(er.actual) : '&nbsp;';
      const erSalary = er && er.salary !== undefined && er.salary !== '' ? fmt(er.salary) : '&nbsp;';
      const drName   = dr && dr.name ? _esc(dr.name) : '&nbsp;';
      const drAmt    = dr && dr.amount !== undefined && dr.amount !== '' ? fmt(dr.amount) : '&nbsp;';
      const rowBg    = i % 2 === 0 ? '' : ' cls-row-alt';
      tableRows += `
      <tr class="cls-data-row${rowBg}">
        <td class="cls-col-earn-name">${erName}</td>
        <td class="cls-col-earn-num">${erActual}</td>
        <td class="cls-col-earn-num">${erSalary}</td>
        <td class="cls-col-ded-name">${drName}</td>
        <td class="cls-col-ded-num">${drAmt}</td>
      </tr>`;
    }

    const netWords = _numToWords(Math.round(d.netPay));

    return `
    <div class="slip-card-wrapper fmt-compact">
      <div class="cls-outer">

        <!-- ── INSTITUTIONAL SLATE TOP BAR ── -->
        <div class="cls-topbar">
          <div class="cls-topbar-left">
            <div class="cls-co-name">${_esc(d.compName)}</div>
            ${addrHtml ? `<div class="cls-co-addr">${addrHtml}</div>` : ''}
            ${contactLine ? `<div class="cls-co-contact">${contactLine}</div>` : ''}
          </div>
          <div class="cls-topbar-right">${logoHtml}</div>
        </div>

        <!-- ── HAIRLINE RULE ── -->
        <div class="cls-rule"></div>

        <!-- ── PAYSLIP PERIOD TITLE BAND ── -->
        <div class="cls-title-band">
          <span>PAYSLIP FOR THE MONTH OF ${d.monthYearStr.toUpperCase()}</span>
        </div>

        <!-- ── 3-COLUMN COMPACT DATA MATRIX ── -->
        <div class="cls-emp-grid">${empFieldHtml}</div>

        <!-- ── RULE ── -->
        <div class="cls-rule"></div>

        <!-- ── ATTENDANCE INDICATOR ROW ── -->
        <div class="cls-att-row">
          <div class="cls-att-item"><span class="cls-att-lbl">Total Days in Month:</span> <span class="cls-att-val">${d.totalDaysStr}</span></div>
          <div class="cls-att-sep">&bull;</div>
          <div class="cls-att-item"><span class="cls-att-lbl">Days Worked / Paid:</span> <span class="cls-att-val">${d.daysPaidStr}</span></div>
          <div class="cls-att-sep">&bull;</div>
          <div class="cls-att-item"><span class="cls-att-lbl">Loss of Pay (LOP):</span> <span class="cls-att-val">${d.lopStr}</span></div>
        </div>

        <!-- ── RULE ── -->
        <div class="cls-rule"></div>

        <!-- ── COMBINED FINANCIAL SCHEDULE (DUAL-TONE HEADERS) ── -->
        <table class="cls-fin-table">
          <thead>
            <tr>
              <th class="cls-th-grp cls-th-earn" colspan="3">Gross Earnings</th>
              <th class="cls-th-grp cls-th-ded"  colspan="2">Deductions</th>
            </tr>
            <tr class="cls-subhead-row">
              <th class="cls-col-earn-name">Particulars</th>
              <th class="cls-col-earn-num">Actual (&#8377;)</th>
              <th class="cls-col-earn-num">Salary (&#8377;)</th>
              <th class="cls-col-ded-name">Particulars</th>
              <th class="cls-col-ded-num">Amount (&#8377;)</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
          <tfoot>
            <tr class="cls-tot-row">
              <td class="cls-col-earn-name cls-tot-lbl" colspan="2">Total Gross Earnings</td>
              <td class="cls-col-earn-num cls-tot-amt">&#8377; ${fmt(d.totalEarn)}</td>
              <td class="cls-col-ded-name cls-tot-lbl">Total Deductions</td>
              <td class="cls-col-ded-num cls-tot-amt">&#8377; ${fmt(d.totalDed)}</td>
            </tr>
          </tfoot>
        </table>

        <!-- ── NET PAY & WORDS CONTAINER ── -->
        <div class="cls-bottom-row">
          <div class="cls-net-words">
            <span class="cls-net-words-lbl">Net Take-Home Pay (In Words):</span>
            <span class="cls-net-words-val">Rupees ${netWords} Only</span>
            <div class="cls-credit-note">${_esc(d.bankCreditText)}</div>
          </div>
          <div class="cls-net-box">
            <div class="cls-net-label">NET SALARY PAYABLE</div>
            <div class="cls-net-amount">&#8377; ${fmt(d.netPay)}</div>
          </div>
        </div>

        <!-- ── RULE ── -->
        <div class="cls-rule cls-rule-bottom"></div>

        <!-- ── DIGITAL CERTIFICATION FOOTER (SIGNATURE-FREE) ── -->
        <div class="cls-footer-row">
          <div class="cls-footer-left">
            <span class="cls-footer-badge">&#10003; DIGITALLY VERIFIED</span>
            <span class="cls-footer-note">This is a computer-generated document and does not require a physical signature.</span>
          </div>
        </div>

      </div>
    </div>`;
  }

  /* ─────────────────────── FORMAT ROUTER ─────────────────────────────────── */

  function renderSingleSlipPage(data, format) {
    const f = (format || data.format || 'corporate').toLowerCase();
    if (f === 'modern') return _renderModern(data);
    if (f === 'compact' || f === 'classic') return _renderCompact(data);
    return _renderCorporate(data);
  }

  /* ─────────────────────── COMPLETE CSS STYLESHEET ────────────────────────── */

  const _CSS_GLOBAL = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Segoe+UI:wght@400;600;700&display=swap');

  /* ── RESET ── */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif;
    background: #e2e8f0;
    color: #0f172a;
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
    .mod-outer {
      border: 1px solid #94a3b8 !important;
      box-shadow: none !important;
    }
    .cls-outer {
      border: 1px solid #94a3b8 !important;
      box-shadow: none !important;
    }
    .no-print {
      display: none !important;
    }
    @page {
      margin: 10mm 12mm;
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
      margin: 0 auto 80px auto;
    }
    .slip-card-wrapper {
      background: #fff;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
      padding: 2px;
      border-radius: 4px;
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     1. FORMAT 1: CORPORATE STANDARD
     ═══════════════════════════════════════════════════════════════ */
  .payslip-outer-box {
    border: 2px solid #000;
    background: #fff;
    padding: 24px 28px 30px 28px;
    color: #000;
    min-height: 840px;
    box-sizing: border-box;
  }
  .slip-header-section {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
    margin-bottom: 12px;
  }
  .slip-company-info { flex: 1; }
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
  .brand-badge-icon svg { width: 38px; height: 38px; }
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
  .slip-month-title {
    text-align: center;
    color: #0070c0;
    font-size: 10pt;
    font-weight: 700;
    margin: 10px 0 14px 0;
    letter-spacing: 0.2px;
  }
  .slip-employee-details { margin-bottom: 12px; }
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
  .att-item-left { text-align: left; flex: 1; }
  .att-item-mid  { text-align: center; flex: 1; }
  .att-item-right{ text-align: right; flex: 1; }
  .slip-financial-table-container { width: 100%; margin-top: 0; }
  .slip-grid-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9.5pt;
    border: 1px solid #000;
  }
  .slip-grid-table th, .slip-grid-table td {
    padding: 3px 6px;
    line-height: 1.35;
    color: #000;
  }
  .th-group-row th {
    font-weight: 700;
    text-align: center;
    border-bottom: 1px solid #000;
  }
  .th-earnings-grp { border-right: 1px solid #000; }
  .th-cols-row th {
    font-weight: 400;
    border-bottom: 1px solid #000;
    font-size: 9.5pt;
  }
  .col-head-earn { width: 32%; text-align: left; border-right: 1px solid #000; }
  .col-act-earn  { width: 15%; text-align: right; border-right: 1px solid #000; }
  .col-sal-earn  { width: 15%; text-align: right; border-right: 1px solid #000; }
  .col-head-ded  { width: 23%; text-align: left; border-right: 1px solid #000; }
  .col-amt-ded   { width: 15%; text-align: right; }
  .slip-data-row td { height: 20px; }
  .row-totals td {
    border-top: 1px solid #000;
    border-bottom: 1px solid #000;
    font-weight: 400;
    padding: 3.5px 6px;
  }
  .cell-tot-earn { text-align: right; border-right: 1px solid #000; }
  .cell-tot-ded  { text-align: right; }
  .row-netpay td { padding: 0; }
  .cell-blank    { border: none; }
  .cell-netpay {
    border: 1px solid #000;
    border-top: none;
    text-align: right;
    font-weight: 700;
    padding: 4px 6px;
    background: #fff;
  }
  .slip-credit-note {
    font-size: 9.5pt;
    color: #000;
    line-height: 1.45;
    margin-top: 16px;
  }
  .slip-footer-note {
    font-size: 9.5pt;
    color: #000;
    margin-top: 22px;
  }

  /* ═══════════════════════════════════════════════════════════════
     2. FORMAT 2: MODERN CORPORATE (Executive Navy & Emerald)
     ═══════════════════════════════════════════════════════════════ */
  .mod-outer {
    background: #fff;
    border: 1px solid #cbd5e1;
    min-height: 840px;
    box-sizing: border-box;
  }
  .mod-header {
    background: #1e3a8a;
    color: #fff;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px 16px 24px;
    gap: 16px;
  }
  .mod-company-name {
    font-size: 16pt;
    font-weight: 800;
    letter-spacing: 0.5px;
    color: #ffffff;
    line-height: 1.2;
  }
  .mod-company-addr {
    font-size: 8.5pt;
    color: #bfdbfe;
    margin-top: 3px;
    line-height: 1.35;
  }
  .mod-company-contact {
    font-size: 8.5pt;
    color: #93c5fd;
    margin-top: 2px;
  }
  .mod-logo-img {
    max-height: 56px;
    max-width: 170px;
    object-fit: contain;
    background: #ffffff;
    border-radius: 4px;
    padding: 4px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.2);
  }
  .mod-logo-placeholder {
    width: 52px;
    height: 52px;
    background: #2563eb;
    border: 2px solid #60a5fa;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18pt;
    font-weight: 800;
    color: #fff;
    letter-spacing: 0.5px;
  }
  .mod-accent-stripe {
    height: 4px;
    background: linear-gradient(90deg, #d97706 0%, #fbbf24 50%, #f59e0b 100%);
  }
  .mod-title-row {
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    padding: 8px 24px;
    text-align: center;
  }
  .mod-title-badge {
    font-size: 9.5pt;
    font-weight: 700;
    color: #1e3a8a;
    letter-spacing: 1px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .mod-title-icon { color: #d97706; font-size: 8pt; }
  .mod-emp-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    border-bottom: 1px solid #e2e8f0;
  }
  .mod-emp-col { padding: 14px 22px; }
  .mod-emp-col:first-child { border-right: 1px solid #e2e8f0; }
  .mod-col-heading {
    font-size: 8pt;
    font-weight: 700;
    color: #1e3a8a;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    margin-bottom: 8px;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 4px;
  }
  .mod-field {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: 2.5px 0;
    font-size: 9pt;
    border-bottom: 1px dotted #e2e8f0;
  }
  .mod-field:last-child { border-bottom: none; }
  .mod-field-lbl { color: #64748b; font-weight: 500; min-width: 120px; }
  .mod-field-val { color: #0f172a; font-weight: 600; text-align: right; }
  .mod-att-row {
    display: flex;
    gap: 0;
    border-bottom: 1px solid #e2e8f0;
    background: #f8fafc;
  }
  .mod-att-tile {
    flex: 1;
    padding: 9px 16px;
    text-align: center;
    border-right: 1px solid #e2e8f0;
  }
  .mod-att-tile:last-child { border-right: none; }
  .mod-att-lop { background: #fff1f2; }
  .mod-att-label {
    font-size: 7.5pt;
    color: #64748b;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .mod-att-value {
    font-size: 13pt;
    font-weight: 700;
    color: #1e3a8a;
    margin-top: 1px;
  }
  .mod-att-lop .mod-att-value { color: #be123c; }
  .mod-fin-row {
    display: flex;
    border-bottom: 1px solid #e2e8f0;
  }
  .mod-fin-panel { flex: 1; }
  .mod-earn-panel { border-right: 1px solid #e2e8f0; }
  .mod-fin-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9pt;
  }
  .mod-th-title {
    background: #1e3a8a;
    color: #ffffff;
    font-size: 8.5pt;
    font-weight: 700;
    text-align: center;
    padding: 5px 10px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  .mod-th-hdr {
    background: #f1f5f9;
    color: #1e3a8a;
    font-weight: 700;
    padding: 4.5px 10px;
    font-size: 8.5pt;
    border-bottom: 1px solid #cbd5e1;
  }
  .mod-td-name {
    text-align: left;
    padding: 3.5px 10px;
    border-bottom: 1px solid #f1f5f9;
    color: #1e293b;
  }
  .mod-td-num {
    text-align: right;
    padding: 3.5px 10px;
    border-bottom: 1px solid #f1f5f9;
    white-space: nowrap;
    color: #0f172a;
    font-weight: 500;
  }
  .mod-tfoot-row { background: #f8fafc; }
  .mod-tfoot-lbl {
    font-weight: 700;
    color: #1e3a8a;
    border-top: 1px solid #cbd5e1;
    padding: 5px 10px;
  }
  .mod-tfoot-amt {
    font-weight: 700;
    color: #1e3a8a;
    border-top: 1px solid #cbd5e1;
    padding: 5px 10px;
    font-size: 9.5pt;
  }
  .mod-netpay-banner {
    background: linear-gradient(135deg, #065f46 0%, #047857 100%);
    color: #ffffff;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 24px;
    gap: 16px;
  }
  .mod-netpay-left { display: flex; flex-direction: column; gap: 2px; }
  .mod-netpay-right { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
  .mod-netpay-label {
    font-size: 7.5pt;
    font-weight: 600;
    color: #a7f3d0;
    text-transform: uppercase;
    letter-spacing: 0.6px;
  }
  .mod-netpay-words {
    font-size: 9pt;
    font-weight: 700;
    color: #ffffff;
    line-height: 1.3;
  }
  .mod-netpay-amount {
    font-size: 17pt;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: 0.3px;
  }
  .mod-credit-note {
    font-size: 8.5pt;
    color: #475569;
    line-height: 1.45;
    padding: 10px 24px 0 24px;
  }
  .mod-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #e2e8f0;
    padding: 8px 24px;
    margin-top: 14px;
    background: #f8fafc;
  }
  .mod-footer-confidential {
    font-size: 7.5pt;
    font-weight: 700;
    color: #dc2626;
    letter-spacing: 0.5px;
  }
  .mod-footer-note {
    font-size: 7.5pt;
    color: #94a3b8;
    font-style: italic;
  }

  /* ═══════════════════════════════════════════════════════════════
     3. FORMAT 3: CORPORATE COMPACT (Enterprise Slate)
     ═══════════════════════════════════════════════════════════════ */
  .cls-outer {
    background: #fff;
    border: 1px solid #94a3b8;
    min-height: 840px;
    box-sizing: border-box;
  }
  .cls-topbar {
    background: #1e293b;
    color: #fff;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 22px 13px 22px;
    gap: 16px;
  }
  .cls-co-name {
    font-size: 15pt;
    font-weight: 800;
    letter-spacing: 0.3px;
    color: #ffffff;
  }
  .cls-co-addr {
    font-size: 8pt;
    color: #cbd5e1;
    margin-top: 3px;
  }
  .cls-co-contact {
    font-size: 8pt;
    color: #94a3b8;
    margin-top: 2px;
  }
  .cls-logo-img {
    max-height: 50px;
    max-width: 150px;
    object-fit: contain;
    background: #ffffff;
    border-radius: 3px;
    padding: 3px;
  }
  .cls-logo-initials {
    width: 48px;
    height: 48px;
    background: #334155;
    border: 1px solid #475569;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16pt;
    font-weight: 800;
    color: #fff;
  }
  .cls-rule {
    height: 1px;
    background: #cbd5e1;
  }
  .cls-rule-bottom { margin-top: 12px; }
  .cls-title-band {
    text-align: center;
    background: #f1f5f9;
    padding: 6px 22px;
    font-size: 9.5pt;
    font-weight: 700;
    color: #1e293b;
    letter-spacing: 1px;
    border-bottom: 1px solid #cbd5e1;
  }
  .cls-emp-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 0;
    padding: 10px 18px 8px;
  }
  .cls-field {
    padding: 3px 8px 3px 0;
    border-bottom: 1px dotted #e2e8f0;
  }
  .cls-field-lbl {
    display: block;
    font-size: 7.5pt;
    color: #64748b;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }
  .cls-field-val {
    display: block;
    font-size: 9pt;
    font-weight: 700;
    color: #0f172a;
    line-height: 1.25;
    margin-top: 1px;
  }
  .cls-att-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 14px;
    padding: 7px 22px;
    background: #f8fafc;
    border-bottom: 1px solid #cbd5e1;
    font-size: 9pt;
    font-weight: 600;
    color: #1e293b;
  }
  .cls-att-sep { color: #94a3b8; }
  .cls-att-lbl { color: #64748b; font-weight: 500; }
  .cls-att-val { color: #0f172a; font-weight: 700; }
  .cls-fin-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9pt;
    border: 1px solid #cbd5e1;
  }
  .cls-fin-table th, .cls-fin-table td {
    padding: 3.5px 8px;
    line-height: 1.35;
  }
  .cls-th-grp {
    font-weight: 700;
    text-align: center;
    padding: 5px 8px;
    border-bottom: 1px solid #cbd5e1;
    text-transform: uppercase;
    font-size: 8.5pt;
    letter-spacing: 0.5px;
  }
  .cls-th-earn {
    background: #334155;
    color: #ffffff;
    border-right: 2px solid #cbd5e1;
  }
  .cls-th-ded {
    background: #475569;
    color: #ffffff;
  }
  .cls-subhead-row th {
    background: #f1f5f9;
    color: #1e293b;
    font-weight: 700;
    font-size: 8.5pt;
    border-bottom: 1px solid #cbd5e1;
  }
  .cls-col-earn-name { width: 30%; text-align: left; border-right: 1px solid #e2e8f0; }
  .cls-col-earn-num  { width: 13%; text-align: right; border-right: 1px solid #e2e8f0; }
  .cls-col-ded-name  { width: 30%; text-align: left; border-left: 2px solid #cbd5e1; padding-left: 10px; }
  .cls-col-ded-num   { width: 14%; text-align: right; }
  .cls-data-row td { height: 19px; color: #1e293b; }
  .cls-row-alt td { background: #f8fafc; }
  .cls-tot-row td {
    background: #1e293b;
    color: #ffffff;
    font-weight: 700;
    border-top: 2px solid #cbd5e1;
    padding: 4px 8px;
  }
  .cls-tot-amt { font-size: 9.5pt; }
  .cls-bottom-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 12px 18px 6px;
    gap: 20px;
  }
  .cls-net-words { flex: 1; font-size: 8.5pt; color: #1e293b; }
  .cls-net-words-lbl {
    font-weight: 600;
    color: #64748b;
    display: block;
    margin-bottom: 2px;
  }
  .cls-net-words-val {
    font-weight: 700;
    font-style: italic;
    color: #0f172a;
    line-height: 1.35;
  }
  .cls-net-box {
    border: 2px solid #1e293b;
    outline: 1px solid #1e293b;
    outline-offset: 2px;
    padding: 8px 18px;
    text-align: center;
    min-width: 170px;
    background: #f8fafc;
  }
  .cls-net-label {
    font-size: 7.5pt;
    font-weight: 700;
    color: #1e293b;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }
  .cls-net-amount {
    font-size: 15pt;
    font-weight: 800;
    color: #0f172a;
    margin-top: 2px;
  }
  .cls-credit-note {
    font-size: 8pt;
    color: #475569;
    line-height: 1.4;
    margin-top: 6px;
  }
  .cls-footer-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 18px;
    background: #f8fafc;
  }
  .cls-footer-left {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .cls-footer-badge {
    background: #e2e8f0;
    color: #334155;
    padding: 2px 7px;
    border-radius: 3px;
    font-size: 7.5pt;
    font-weight: 700;
    letter-spacing: 0.5px;
  }
  .cls-footer-note {
    font-size: 7.5pt;
    color: #64748b;
    font-style: italic;
  }

  /* ═══════════════════════════════════════════════════════════════
     4. PRINT WINDOW TOOLBAR & INTERACTIVE SWITCHER
     ═══════════════════════════════════════════════════════════════ */
  .slip-print-bar {
    position: fixed;
    bottom: 20px;
    right: 20px;
    display: flex;
    gap: 10px;
    align-items: center;
    background: #0f172a;
    padding: 8px 16px;
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
    z-index: 9999;
    border: 1px solid #334155;
  }
  .btn-print {
    background: #0070c0;
    color: #fff;
    border: none;
    padding: 8px 18px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.15s ease;
  }
  .btn-print:hover { background: #005a9e; }
  .btn-close-slip {
    background: #334155;
    color: #fff;
    border: none;
    padding: 8px 14px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }
  .btn-close-slip:hover { background: #475569; }
  .fmt-select-label {
    color: #94a3b8;
    font-size: 12px;
    font-weight: 600;
  }
  .fmt-switcher {
    background: #1e293b;
    color: #f8fafc;
    border: 1px solid #475569;
    padding: 7px 10px;
    border-radius: 6px;
    font-size: 12.5px;
    font-weight: 600;
    cursor: pointer;
    outline: none;
  }
  .fmt-switcher:focus { border-color: #38bdf8; }
  `;

  /* ─────────────────────── GENERATE MULTI ────────────────────────────────── */

  function generateMulti(dataList, defaultFormat) {
    const list = Array.isArray(dataList) ? dataList : [dataList];
    if (!list.length) return '';

    const first = list[0];
    const c = first.company || {};
    const compName = c.name || 'Company';
    const isMulti = list.length > 1;
    const resolvedFormat = (defaultFormat || first.format || 'corporate').toLowerCase();

    const title = isMulti
      ? `${compName}_Payslips_${list[0].month}_to_${list[list.length - 1].month}_${list[0].year || ''}`
      : `${compName}_${first.month || ''}_${first.year || ''}_Slip`;

    // Serialize slips data cleanly for interactive client-side switching
    const slipsJson = JSON.stringify(list.map(d => ({
      company: {
        name: d.company?.name || '',
        address: d.company?.address || '',
        phone: d.company?.phone || '',
        email: d.company?.email || '',
        logoData: d.company?.logoData || null,
        logoText: d.company?.logoText || ''
      },
      month: d.month || 'April',
      year: d.year || new Date().getFullYear(),
      employee: {
        id: d.employee?.id || '',
        name: d.employee?.name || '',
        location: d.employee?.location || '',
        division: d.employee?.division || '',
        designation: d.employee?.designation || '',
        doj: d.employee?.doj || '',
        uan: d.employee?.uan || '',
        esic: d.employee?.esic || '',
        pan: d.employee?.pan || '',
        bankName: d.employee?.bankName || '',
        acNo: d.employee?.acNo || '',
        ifsc: d.employee?.ifsc || ''
      },
      attendance: {
        totalDays: d.attendance?.totalDays ?? '30',
        daysPaid: d.attendance?.daysPaid ?? '30',
        lop: d.attendance?.lop ?? '0'
      },
      earnings: d.earnings || [],
      deductions: d.deductions || { items: [], total: 0 },
      format: resolvedFormat
    })));

    const slipsHtml = list.map(d => renderSingleSlipPage(d, resolvedFormat)).join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${_esc(title)}</title>
<style>
${_CSS_GLOBAL}
</style>
</head>
<body>

<div class="slip-multi-wrap" id="slipWrap">
  ${slipsHtml}
</div>

<div class="slip-print-bar no-print">
  <span class="fmt-select-label">Format:</span>
  <select class="fmt-switcher" id="slipFormatSelector" onchange="window.__switchSlipFormat(this.value)" title="Change Salary Slip Corporate Format">
    <option value="corporate" ${resolvedFormat === 'corporate' ? 'selected' : ''}>Corporate Standard (Classic Box)</option>
    <option value="modern"    ${resolvedFormat === 'modern'    ? 'selected' : ''}>Modern Corporate (Executive Navy &amp; Emerald)</option>
    <option value="compact"   ${resolvedFormat === 'compact' || resolvedFormat === 'classic' ? 'selected' : ''}>Corporate Compact (Enterprise Slate)</option>
  </select>
  <button class="btn-print" onclick="window.print()">${isMulti ? `Print All (${list.length}) Payslips` : 'Print Payslip'}</button>
  <button class="btn-close-slip" onclick="window.close()">Close</button>
</div>

<script>
(function() {
  var _slipsData = ${slipsJson};

  var _fmt = function(n){ return (parseFloat(n)||0).toFixed(2); };
  var _esc = function(s){ return s==null?'':String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); };
  var _fmtDays = function(v,fb){ if(v===undefined||v===null||v==='')v=fb; var n=parseFloat(v); return isNaN(n)?String(v):n.toFixed(1); };
  var _shortMonth = function(m){ if(!m)return'Jan'; var map={January:'Jan',February:'Feb',March:'Mar',April:'Apr',May:'May',June:'Jun',July:'Jul',August:'Aug',September:'Sep',October:'Oct',November:'Nov',December:'Dec'}; return map[m]||(m.length>3?m.slice(0,3):m); };
  var _myr = function(mo,yr){ return _shortMonth(mo||'Jan')+'-'+(yr||new Date().getFullYear()); };
  var _ones=['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  var _tens=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  function _n2w(n){if(n===0)return'Zero';var r='';if(n>=10000000){r+=_n2w(Math.floor(n/10000000))+' Crore ';n%=10000000;}if(n>=100000){r+=_n2w(Math.floor(n/100000))+' Lakh ';n%=100000;}if(n>=1000){r+=_n2w(Math.floor(n/1000))+' Thousand ';n%=1000;}if(n>=100){r+=_ones[Math.floor(n/100)]+' Hundred ';n%=100;}if(n>=20){r+=_tens[Math.floor(n/10)];n%=10;if(n>0)r+='-'+_ones[n];return r.trim();}if(n>0)r+=_ones[n];return r.trim();}
  function _doj(d){if(!d)return'--';if(/^\\d{4}-\\d{2}-\\d{2}$/.test(d)){var p=d.split('-'),mn=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],m=parseInt(p[1],10)-1;return p[2]+'-'+(mn[m]||p[1])+'-'+p[0];}return d;}

  function _renderCorp(data){
    var c=data.company||{},e=data.employee||{},att=data.attendance||{},earn=data.earnings||[],ded=data.deductions||{items:[],total:0};
    var U=function(s){return s?String(s).trim().toUpperCase():'';};
    var totalEarn=earn.reduce(function(s,r){return s+(parseFloat(r.salary)||0);},0);
    var dedItems=ded.items||[];var totalDed=ded.total||(dedItems.reduce(function(s,r){return s+(parseFloat(r.amount)||0);},0));
    var net=totalEarn-totalDed; var myr=_myr(data.month,data.year);
    var compName=U(c.name)||'COMPANY NAME';
    var logoHtml=c.logoData?'<div class="slip-header-logo"><img src="'+c.logoData+'" alt="'+_esc(compName)+'" /></div>':'<div class="slip-header-brand"><div class="brand-text-name">'+_esc(compName)+'</div><div class="brand-text-tagline">SERVICES &bull; RECRUITMENT &bull; SOLUTIONS</div></div>';
    var maxR=Math.max(earn.length,dedItems.length,3); var rows='';
    for(var i=0;i<maxR;i++){var er=earn[i],dr=dedItems[i];rows+='<tr class="slip-data-row"><td class="col-head-earn">'+(er&&er.name?_esc(er.name):'')+
    '</td><td class="col-act-earn">'+(er&&er.actual!==undefined&&er.actual!==''?_fmt(er.actual):'')+
    '</td><td class="col-sal-earn">'+(er&&er.salary!==undefined&&er.salary!==''?_fmt(er.salary):'')+
    '</td><td class="col-head-ded">'+(dr&&dr.name?_esc(dr.name):'')+
    '</td><td class="col-amt-ded">'+(dr&&dr.amount!==undefined&&dr.amount!==''?_fmt(dr.amount):'')+
    '</td></tr>';}
    var td=_fmtDays(att.totalDays,31),dp=_fmtDays(att.daysPaid,td),lop=(parseFloat(att.lop)||0)===0?'00.0':(parseFloat(att.lop)||0).toFixed(1);
    var empId=U(e.id)||'--',empName=U(e.name)||'--',empLoc=U(e.location)||'--',empDiv=U(e.division)||'--',empDoj=_doj(e.doj),empDesg=U(e.designation)||'--';
    var empUan=U(e.uan)||'--',empBank=U(e.bankName)||'--',empEsic=U(e.esic)||'--',empAc=U(e.acNo)||'--',empPan=U(e.pan)||'--',empIfsc=U(e.ifsc)||'--';
    var addr=U(c.address)?(function(s){return _esc(s).replace(/\\n/g,'<br>');})(c.address):'';
    var cp=[c.phone,c.email].filter(Boolean).map(_esc).join(' &nbsp;|&nbsp; ');
    return '<div class="slip-card-wrapper fmt-corporate"><div class="payslip-outer-box">'+
      '<div class="slip-header-section"><div class="slip-company-info"><div class="slip-company-title">'+_esc(compName)+'</div>'+(addr?'<div class="slip-company-address">'+addr+'</div>':'')+(cp?'<div class="slip-company-phone">'+cp+'</div>':'')+
      '</div><div class="slip-logo-wrapper">'+logoHtml+'</div></div>'+
      '<div class="slip-month-title">Payslip for the month of '+myr+'</div>'+
      '<div class="slip-employee-details"><table class="slip-emp-table"><tbody>'+
      '<tr><td class="lbl">Employee ID</td><td class="val">'+_esc(empId)+'</td><td class="lbl">Employee Name :</td><td class="val">'+_esc(empName)+'</td></tr>'+
      '<tr><td class="lbl">Location :</td><td class="val">'+_esc(empLoc)+'</td><td class="lbl">Division :</td><td class="val">'+_esc(empDiv)+'</td></tr>'+
      '<tr><td class="lbl">Date of Joining:</td><td class="val">'+_esc(empDoj)+'</td><td class="lbl">Designation :</td><td class="val">'+_esc(empDesg)+'</td></tr>'+
      '<tr><td class="lbl">UAN :</td><td class="val">'+_esc(empUan)+'</td><td class="lbl">Bank Name :</td><td class="val">'+_esc(empBank)+'</td></tr>'+
      '<tr><td class="lbl">ESIC No :</td><td class="val">'+_esc(empEsic)+'</td><td class="lbl">Bank A/c :</td><td class="val">'+_esc(empAc)+'</td></tr>'+
      '<tr><td class="lbl">PAN No :</td><td class="val">'+_esc(empPan)+'</td><td class="lbl">IFSC Code:</td><td class="val">'+_esc(empIfsc)+'</td></tr>'+
      '</tbody></table></div>'+
      '<div class="slip-attendance-bar"><div class="att-item-left">Total Days in Month: '+td+'</div><div class="att-item-mid">Days Paid:'+dp+'</div><div class="att-item-right">Loss of Pay: '+lop+'</div></div>'+
      '<div class="slip-financial-table-container"><table class="slip-grid-table"><thead>'+
      '<tr class="th-group-row"><th colspan="3" class="th-earnings-grp">Earnings</th><th colspan="2" class="th-deductions-grp">Deductions</th></tr>'+
      '<tr class="th-cols-row"><th class="col-head-earn">Header</th><th class="col-act-earn">Actual</th><th class="col-sal-earn">Salary</th><th class="col-head-ded">Header</th><th class="col-amt-ded">Deducted</th></tr>'+
      '</thead><tbody>'+rows+
      '<tr class="row-totals"><td colspan="3" class="cell-tot-earn">Total Earning :'+_fmt(totalEarn)+'</td><td colspan="2" class="cell-tot-ded">Total Deduction : '+_fmt(totalDed)+'</td></tr>'+
      '<tr class="row-netpay"><td colspan="3" class="cell-blank"></td><td colspan="2" class="cell-netpay">Net Pay : '+_fmt(net)+'</td></tr>'+
      '</tbody></table></div>'+
      '<div class="slip-credit-note">Your salary for the month '+myr+' of Rs. '+_fmt(net)+' credited to your bank account no: '+_esc(empAc)+(empBank!=='--'?' of bank '+_esc(empBank):'')+(empIfsc!=='--'?' ('+_esc(empIfsc)+')':'')+'.</div>'+
      '<div class="slip-footer-note">This is computer generated document and signature doesn\'t require.</div>'+
      '</div></div>';
  }

  function _renderMod(data){
    var c=data.company||{},e=data.employee||{},att=data.attendance||{},earn=data.earnings||[],ded=data.deductions||{items:[],total:0};
    var U=function(s){return s?String(s).trim().toUpperCase():'';};
    var totalEarn=earn.reduce(function(s,r){return s+(parseFloat(r.salary)||0);},0);
    var dedItems=ded.items||[];var totalDed=ded.total||(dedItems.reduce(function(s,r){return s+(parseFloat(r.amount)||0);},0));
    var net=totalEarn-totalDed; var myr=_myr(data.month,data.year);
    var compName=U(c.name)||'COMPANY NAME';
    var empId=U(e.id)||'--',empName=U(e.name)||'--',empLoc=U(e.location)||'--',empDiv=U(e.division)||'--',empDoj=_doj(e.doj),empDesg=U(e.designation)||'--';
    var empUan=U(e.uan)||'--',empBank=U(e.bankName)||'--',empEsic=U(e.esic)||'--',empAc=U(e.acNo)||'--',empPan=U(e.pan)||'--',empIfsc=U(e.ifsc)||'--';
    var addr=U(c.address)?_esc(c.address).replace(/\\n/g,' &bull; '):''; var cp=[c.phone,c.email].filter(Boolean).map(_esc).join(' &nbsp;|&nbsp; ');
    var initials=compName.replace(/[^A-Za-z0-9]/g,'').slice(0,2)||'CO';
    var logoHtml=c.logoData?'<img src="'+c.logoData+'" alt="'+_esc(compName)+'" class="mod-logo-img" />':'<div class="mod-logo-placeholder">'+_esc(initials)+'</div>';
    var lf=[['Employee ID',empId],['Employee Name',empName],['Designation',empDesg],['Department',empDiv],['Work Location',empLoc],['Date of Joining',empDoj]];
    var rf=[['UAN Number',empUan],['ESIC Number',empEsic],['Income Tax PAN',empPan],['Bank Name',empBank],['Bank A/c No',empAc],['Bank IFSC',empIfsc]];
    var mf=function(a){return a.map(function(x){return'<div class="mod-field"><span class="mod-field-lbl">'+_esc(x[0])+'</span><span class="mod-field-val">'+_esc(x[1])+'</span></div>';}).join('');};
    var maxR=Math.max(earn.length,dedItems.length,3); var er='',dr='';
    for(var i=0;i<maxR;i++){
      var eItem=earn[i],dItem=dedItems[i];
      er+='<tr><td class="mod-td-name">'+(eItem&&eItem.name?_esc(eItem.name):'&nbsp;')+'</td><td class="mod-td-num">'+(eItem&&eItem.actual!==undefined&&eItem.actual!==''?_fmt(eItem.actual):'&nbsp;')+'</td><td class="mod-td-num">'+(eItem&&eItem.salary!==undefined&&eItem.salary!==''?_fmt(eItem.salary):'&nbsp;')+'</td></tr>';
      dr+='<tr><td class="mod-td-name">'+(dItem&&dItem.name?_esc(dItem.name):'&nbsp;')+'</td><td class="mod-td-num">'+(dItem&&dItem.amount!==undefined&&dItem.amount!==''?_fmt(dItem.amount):'&nbsp;')+'</td></tr>';
    }
    var td=_fmtDays(att.totalDays,31),dp=_fmtDays(att.daysPaid,td),lop=(parseFloat(att.lop)||0)===0?'00.0':(parseFloat(att.lop)||0).toFixed(1);
    var netWords='Rupees '+_n2w(Math.round(net))+' Only';
    return '<div class="slip-card-wrapper fmt-modern"><div class="mod-outer">'+
      '<div class="mod-header"><div class="mod-header-left"><div class="mod-company-name">'+_esc(compName)+'</div>'+(addr?'<div class="mod-company-addr">'+addr+'</div>':'')+(cp?'<div class="mod-company-contact">'+cp+'</div>':'')+
      '</div><div class="mod-header-right">'+logoHtml+'</div></div>'+
      '<div class="mod-accent-stripe"></div>'+
      '<div class="mod-title-row"><span class="mod-title-badge"><i class="mod-title-icon">&#9632;</i> SALARY SLIP FOR THE MONTH OF '+myr.toUpperCase()+'</span></div>'+
      '<div class="mod-emp-grid"><div class="mod-emp-col"><div class="mod-col-heading">Employee Information</div>'+mf(lf)+'</div>'+
      '<div class="mod-emp-col"><div class="mod-col-heading">Statutory &amp; Banking Details</div>'+mf(rf)+'</div></div>'+
      '<div class="mod-att-row"><div class="mod-att-tile"><div class="mod-att-label">Calendar Days</div><div class="mod-att-value">'+td+'</div></div>'+
      '<div class="mod-att-tile"><div class="mod-att-label">Payable Days</div><div class="mod-att-value">'+dp+'</div></div>'+
      '<div class="mod-att-tile mod-att-lop"><div class="mod-att-label">Loss of Pay (LOP)</div><div class="mod-att-value">'+lop+'</div></div></div>'+
      '<div class="mod-fin-row"><div class="mod-fin-panel mod-earn-panel"><table class="mod-fin-table">'+
      '<thead><tr><th class="mod-th-title" colspan="3">Earnings Particulars</th></tr><tr><th class="mod-th-hdr mod-td-name">Description</th><th class="mod-th-hdr mod-td-num">Actual (&#8377;)</th><th class="mod-th-hdr mod-td-num">Earned (&#8377;)</th></tr></thead>'+
      '<tbody>'+er+'</tbody><tfoot><tr class="mod-tfoot-row"><td class="mod-td-name mod-tfoot-lbl">Total Gross Earnings</td><td class="mod-td-num mod-tfoot-amt" colspan="2">&#8377; '+_fmt(totalEarn)+'</td></tr></tfoot></table></div>'+
      '<div class="mod-fin-panel mod-ded-panel"><table class="mod-fin-table">'+
      '<thead><tr><th class="mod-th-title" colspan="2">Deductions Particulars</th></tr><tr><th class="mod-th-hdr mod-td-name">Description</th><th class="mod-th-hdr mod-td-num">Deducted (&#8377;)</th></tr></thead>'+
      '<tbody>'+dr+'</tbody><tfoot><tr class="mod-tfoot-row"><td class="mod-td-name mod-tfoot-lbl">Total Deductions</td><td class="mod-td-num mod-tfoot-amt">&#8377; '+_fmt(totalDed)+'</td></tr></tfoot></table></div></div>'+
      '<div class="mod-netpay-banner"><div class="mod-netpay-left"><span class="mod-netpay-label">Net Take-Home Pay (In Words)</span><span class="mod-netpay-words">'+netWords+'</span></div>'+
      '<div class="mod-netpay-right"><span class="mod-netpay-label">Net Salary Payable</span><span class="mod-netpay-amount">&#8377;&nbsp;'+_fmt(net)+'</span></div></div>'+
      '<div class="mod-credit-note">Your salary for the month '+myr+' of Rs. '+_fmt(net)+' credited to your bank account no: '+_esc(empAc)+(empBank!=='--'?' of bank '+_esc(empBank):'')+(empIfsc!=='--'?' ('+_esc(empIfsc)+')':'')+'.</div>'+
      '<div class="mod-footer"><span class="mod-footer-confidential">&#128274; CONFIDENTIAL &bull; STRICTLY PRIVATE</span><span class="mod-footer-note">This is a computer-generated payslip and does not require a physical signature.</span></div>'+
      '</div></div>';
  }

  function _renderCls(data){
    var c=data.company||{},e=data.employee||{},att=data.attendance||{},earn=data.earnings||[],ded=data.deductions||{items:[],total:0};
    var U=function(s){return s?String(s).trim().toUpperCase():'';};
    var totalEarn=earn.reduce(function(s,r){return s+(parseFloat(r.salary)||0);},0);
    var dedItems=ded.items||[];var totalDed=ded.total||(dedItems.reduce(function(s,r){return s+(parseFloat(r.amount)||0);},0));
    var net=totalEarn-totalDed; var myr=_myr(data.month,data.year);
    var compName=U(c.name)||'COMPANY NAME';
    var empId=U(e.id)||'--',empName=U(e.name)||'--',empLoc=U(e.location)||'--',empDiv=U(e.division)||'--',empDoj=_doj(e.doj),empDesg=U(e.designation)||'--';
    var empUan=U(e.uan)||'--',empBank=U(e.bankName)||'--',empEsic=U(e.esic)||'--',empAc=U(e.acNo)||'--',empPan=U(e.pan)||'--',empIfsc=U(e.ifsc)||'--';
    var addr=U(c.address)?_esc(c.address).replace(/\\n/g,' &bull; '):''; var cp=[c.phone,c.email].filter(Boolean).map(_esc).join('  |  ');
    var initials=compName.replace(/[^A-Za-z0-9]/g,'').slice(0,2)||'CO';
    var logoHtml=c.logoData?'<img src="'+c.logoData+'" alt="'+_esc(compName)+'" class="cls-logo-img" />':'<div class="cls-logo-initials">'+_esc(initials)+'</div>';
    var empFlds=[['Employee ID',empId],['Employee Name',empName],['Designation',empDesg],['Department',empDiv],['Location / Hub',empLoc],['Date of Joining',empDoj],['UAN Number',empUan],['ESIC Number',empEsic],['Permanent A/c (PAN)',empPan],['Bank Name',empBank],['Bank Account No',empAc],['Bank IFSC Code',empIfsc]];
    var empFH=empFlds.map(function(x){return'<div class="cls-field"><span class="cls-field-lbl">'+_esc(x[0])+'</span><span class="cls-field-val">'+_esc(x[1])+'</span></div>';}).join('');
    var maxR=Math.max(earn.length,dedItems.length,3); var rows='';
    for(var i=0;i<maxR;i++){
      var er=earn[i],dr=dedItems[i],rb=i%2===0?'':' cls-row-alt';
      rows+='<tr class="cls-data-row'+rb+'">'+
      '<td class="cls-col-earn-name">'+(er&&er.name?_esc(er.name):'&nbsp;')+
      '</td><td class="cls-col-earn-num">'+(er&&er.actual!==undefined&&er.actual!==''?_fmt(er.actual):'&nbsp;')+
      '</td><td class="cls-col-earn-num">'+(er&&er.salary!==undefined&&er.salary!==''?_fmt(er.salary):'&nbsp;')+
      '</td><td class="cls-col-ded-name">'+(dr&&dr.name?_esc(dr.name):'&nbsp;')+
      '</td><td class="cls-col-ded-num">'+(dr&&dr.amount!==undefined&&dr.amount!==''?_fmt(dr.amount):'&nbsp;')+
      '</td></tr>';
    }
    var td=_fmtDays(att.totalDays,31),dp=_fmtDays(att.daysPaid,td),lop=(parseFloat(att.lop)||0)===0?'00.0':(parseFloat(att.lop)||0).toFixed(1);
    var netWords='Rupees '+_n2w(Math.round(net))+' Only';
    return '<div class="slip-card-wrapper fmt-compact"><div class="cls-outer">'+
      '<div class="cls-topbar"><div class="cls-topbar-left"><div class="cls-co-name">'+_esc(compName)+'</div>'+(addr?'<div class="cls-co-addr">'+addr+'</div>':'')+(cp?'<div class="cls-co-contact">'+cp+'</div>':'')+
      '</div><div class="cls-topbar-right">'+logoHtml+'</div></div>'+
      '<div class="cls-rule"></div>'+
      '<div class="cls-title-band"><span>PAYSLIP FOR THE MONTH OF '+myr.toUpperCase()+'</span></div>'+
      '<div class="cls-emp-grid">'+empFH+'</div>'+
      '<div class="cls-rule"></div>'+
      '<div class="cls-att-row"><div class="cls-att-item"><span class="cls-att-lbl">Total Days in Month:</span> <span class="cls-att-val">'+td+'</span></div>'+
      '<div class="cls-att-sep">&bull;</div><div class="cls-att-item"><span class="cls-att-lbl">Days Worked / Paid:</span> <span class="cls-att-val">'+dp+'</span></div>'+
      '<div class="cls-att-sep">&bull;</div><div class="cls-att-item"><span class="cls-att-lbl">Loss of Pay (LOP):</span> <span class="cls-att-val">'+lop+'</span></div></div>'+
      '<div class="cls-rule"></div>'+
      '<table class="cls-fin-table"><thead>'+
      '<tr><th class="cls-th-grp cls-th-earn" colspan="3">Gross Earnings</th><th class="cls-th-grp cls-th-ded" colspan="2">Deductions</th></tr>'+
      '<tr class="cls-subhead-row"><th class="cls-col-earn-name">Particulars</th><th class="cls-col-earn-num">Actual (&#8377;)</th><th class="cls-col-earn-num">Salary (&#8377;)</th><th class="cls-col-ded-name">Particulars</th><th class="cls-col-ded-num">Amount (&#8377;)</th></tr>'+
      '</thead><tbody>'+rows+'</tbody><tfoot>'+
      '<tr class="cls-tot-row"><td class="cls-col-earn-name cls-tot-lbl" colspan="2">Total Gross Earnings</td><td class="cls-col-earn-num cls-tot-amt">&#8377; '+_fmt(totalEarn)+'</td>'+
      '<td class="cls-col-ded-name cls-tot-lbl">Total Deductions</td><td class="cls-col-ded-num cls-tot-amt">&#8377; '+_fmt(totalDed)+'</td></tr></tfoot></table>'+
      '<div class="cls-bottom-row"><div class="cls-net-words"><span class="cls-net-words-lbl">Net Take-Home Pay (In Words):</span><span class="cls-net-words-val">'+netWords+'</span>'+
      '<div class="cls-credit-note">Your salary for the month '+myr+' of Rs. '+_fmt(net)+' credited to your bank account no: '+_esc(empAc)+(empBank!=='--'?' of bank '+_esc(empBank):'')+(empIfsc!=='--'?' ('+_esc(empIfsc)+')':'')+'.</div></div>'+
      '<div class="cls-net-box"><div class="cls-net-label">NET SALARY PAYABLE</div><div class="cls-net-amount">&#8377; '+_fmt(net)+'</div></div></div>'+
      '<div class="cls-rule cls-rule-bottom"></div>'+
      '<div class="cls-footer-row"><div class="cls-footer-left"><span class="cls-footer-badge">&#10003; DIGITALLY VERIFIED</span><span class="cls-footer-note">This is a computer-generated document and does not require a physical signature.</span></div></div>'+
      '</div></div>';
  }

  window.__switchSlipFormat = function(fmt) {
    var wrap = document.getElementById('slipWrap');
    if (!wrap) return;
    wrap.innerHTML = _slipsData.map(function(d){
      var f = (fmt || 'corporate').toLowerCase();
      if (f === 'modern') return _renderMod(d);
      if (f === 'compact' || f === 'classic') return _renderCls(d);
      return _renderCorp(d);
    }).join('\n');
  };
})();
</script>

</body>
</html>`;
  }

  function generate(data, format) {
    return generateMulti([data], format || data.format || 'corporate');
  }

  /* ─────────────────────── PUBLIC API ────────────────────────────────────── */

  const engine = {
    generate,
    generateMulti,
    renderSingleSlipPage
  };

  if (typeof window !== 'undefined') {
    window.SalarySlipEngine = engine;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = engine;
  }

  return engine;
})();
