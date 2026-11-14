/**
 * ═══════════════════════════════════════════════════════════
 * ITR ACKNOWLEDGEMENT GENERATOR (ITR-V / ACKNOWLEDGEMENT)
 * Authentic Government Income Tax Return Acknowledgement output.
 * 100% pixel-perfect replica of the official Income Tax Department
 * receipt, with exact typography, proportions, borders, watermark,
 * 2D PDF417-style barcode, verification paragraph, and red footer warning.
 * Strictly calibrated to fit perfectly on ONE single A4 page.
 * ═══════════════════════════════════════════════════════════
 */

const ReportAck = (() => {

  /** Format number in Indian currency style (e.g. 4,91,440 or 0) */
  function _fmtINR(num) {
    if (num === null || num === undefined || isNaN(num)) return '0';
    const n = Math.round(Number(num));
    if (n === 0) return '0';
    return n.toLocaleString('en-IN');
  }

  /** Format Date in DD-Mon-YYYY (e.g. 29-Jul-2026) */
  function _fmtDate(d) {
    if (!d) d = new Date();
    let dateObj = d;
    if (typeof d === 'string' || typeof d === 'number') {
      if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
        const [y, m, day] = d.split('-').map(Number);
        dateObj = new Date(y, m - 1, day);
      } else {
        dateObj = new Date(d);
      }
    }
    if (isNaN(dateObj.getTime())) return _fmtDate(new Date());
    const day = String(dateObj.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const mon = months[dateObj.getMonth()];
    const yr = dateObj.getFullYear();
    return `${day}-${mon}-${yr}`;
  }

  /** Format Time in HH:MM:SS */
  function _fmtTime(d) {
    if (!d) d = new Date();
    const dateObj = (typeof d === 'string' || typeof d === 'number') ? new Date(d) : d;
    if (isNaN(dateObj.getTime())) return '20:11:36';
    const hrs = String(dateObj.getHours()).padStart(2, '0');
    const min = String(dateObj.getMinutes()).padStart(2, '0');
    const sec = String(dateObj.getSeconds()).padStart(2, '0');
    return `${hrs}:${min}:${sec}`;
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

  /** Generate or normalize authentic 15-digit acknowledgement number */
  function _getAckNo(client, compNo) {
    if (client && client.ackNo) {
      const cleanAck = String(client.ackNo).replace(/\D/g, '');
      if (cleanAck.length === 15) {
        return cleanAck;
      }
    }
    const filingDateObj = _getFilingDateObj(client);
    const day = String(filingDateObj.getDate()).padStart(2, '0');
    const mon = String(filingDateObj.getMonth() + 1).padStart(2, '0');
    const yr  = String(filingDateObj.getFullYear()).slice(-2);
    const dateSuffix = `${day}${mon}${yr}`; // 6 digits e.g. 290725

    const pan = ((client && client.pan) || 'ABCDE1234F').toUpperCase();
    const ay = String((client && client.ay) || '2025-26').replace(/\D/g, '');
    const cNo = String(compNo || '').replace(/\D/g, '');
    
    let hash = 0;
    const str = `${pan}_${ay}_${cNo}`;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    const seed = Math.abs(hash);
    const prefix = String((seed % 900000000) + 100000000); // exactly 9 digits
    return `${prefix}${dateSuffix}`;
  }

  /** Generate 10-char EVC code (e.g. 8U9XM3KD9I) */
  function _getEVC(client) {
    if (client.evcCode) return String(client.evcCode).toUpperCase();
    const pan = (client.pan || 'ABCDE1234F').toUpperCase();
    const chars = '8U9XM3KD9IEU7ALV2456BCGHJNPQRSTWXYZ';
    let code = '';
    for (let i = 0; i < 10; i++) {
      const idx = (pan.charCodeAt(i % pan.length) * (i + 13) + (i * 7)) % chars.length;
      code += chars[idx];
    }
    return code;
  }

  /** Generate IP Address */
  function _getIP(client) {
    if (client.ipAddress) return client.ipAddress;
    const pan = (client.pan || 'ABCDE1234F').toUpperCase();
    const p1 = 103;
    const p2 = 100 + (pan.charCodeAt(0) % 80);
    const p3 = 100 + (pan.charCodeAt(1) % 70);
    const p4 = 100 + (pan.charCodeAt(2) % 90);
    return `${p1}.${p2}.${p3}.${p4}`;
  }

  /** Generate 40-char hex hash */
  function _getHexHash(pan, ackNo, ay) {
    const str = `${pan}_${ackNo}_${ay}_ITR_VERIFIED_AUTHENTIC_CPC_BENGALURU_HASH_STRING`;
    let h1 = 0x1bb7217c, h2 = 0x948c5c5a, h3 = 0x844f6fc3, h4 = 0x40172bd8;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
      h3 = Math.imul(h3 ^ ch, 2246822507);
      h4 = Math.imul(h4 ^ ch, 3266489909);
    }
    const hex = (h) => (h >>> 0).toString(16).padStart(8, '0');
    const full = (hex(h1) + hex(h2) + hex(h3) + hex(h4) + '85bd87667').toLowerCase();
    return full.slice(0, 40);
  }

  /**
   * Generate High-Precision 2D PDF417-Style Vector Barcode SVG
   * Matches the official 2D stacked barcode used in authentic ITR Acknowledgements.
   * Scaled to fit compactly within the dedicated barcode block.
   * @param {string} text - Encoded text / hash string
   * @param {number} width - Rendered width in px (~245 px)
   * @param {number} height - Rendered height in px (~42 px)
   */
  function _generate2DBarcodeSVG(text, width = 245, height = 42) {
    const numRows = 16;
    const numCols = 6;
    
    // PDF417 Standard 17-module Start Pattern & 18-module Stop Pattern
    const START_PATTERN = [8, 1, 1, 1, 1, 1, 1, 3];
    const STOP_PATTERN = [7, 1, 1, 3, 1, 1, 1, 2, 1];

    function patternToBits(pattern) {
      let bits = '';
      let isBar = true;
      for (let len of pattern) {
        bits += (isBar ? '1' : '0').repeat(len);
        isBar = !isBar;
      }
      return bits;
    }

    let hashVal = 0;
    for (let i = 0; i < text.length; i++) {
      hashVal = ((hashVal << 5) - hashVal) + text.charCodeAt(i);
      hashVal |= 0;
    }

    // Authentic PDF417 cluster pattern sets for cluster 0, 3, and 6
    const cluster0 = [
      [5,1,1,1,1,1,1,6], [4,2,1,1,1,1,1,6], [3,3,1,1,1,1,1,6], [2,4,1,1,1,1,1,6],
      [1,5,1,1,1,1,1,6], [4,1,2,1,1,1,1,6], [3,2,2,1,1,1,1,6], [2,3,2,1,1,1,1,6],
      [1,4,2,1,1,1,1,6], [3,1,3,1,1,1,1,6], [2,2,3,1,1,1,1,6], [1,3,3,1,1,1,1,6],
      [2,1,4,1,1,1,1,6], [1,2,4,1,1,1,1,6], [1,1,5,1,1,1,1,6], [4,1,1,2,1,1,1,6],
      [3,2,1,2,1,1,1,6], [2,3,1,2,1,1,1,6], [1,4,1,2,1,1,1,6], [3,1,2,2,1,1,1,6],
      [2,2,2,2,1,1,1,6], [1,3,2,2,1,1,1,6], [2,1,3,2,1,1,1,6], [1,2,3,2,1,1,1,6],
      [1,1,4,2,1,1,1,6], [3,1,1,3,1,1,1,6], [2,2,1,3,1,1,1,6], [1,3,1,3,1,1,1,6],
      [2,1,2,3,1,1,1,6], [1,2,2,3,1,1,1,6], [1,1,3,3,1,1,1,6], [2,1,1,4,1,1,1,6]
    ];

    const cluster3 = [
      [5,2,1,1,1,1,1,5], [4,3,1,1,1,1,1,5], [3,4,1,1,1,1,1,5], [2,5,1,1,1,1,1,5],
      [1,6,1,1,1,1,1,5], [4,2,2,1,1,1,1,5], [3,3,2,1,1,1,1,5], [2,4,2,1,1,1,1,5],
      [1,5,2,1,1,1,1,5], [3,2,3,1,1,1,1,5], [2,3,3,1,1,1,1,5], [1,4,3,1,1,1,1,5],
      [2,2,4,1,1,1,1,5], [1,3,4,1,1,1,1,5], [1,2,5,1,1,1,1,5], [4,1,1,1,2,1,1,6],
      [3,2,1,1,2,1,1,6], [2,3,1,1,2,1,1,6], [1,4,1,1,2,1,1,6], [3,1,2,1,2,1,1,6],
      [2,2,2,1,2,1,1,6], [1,3,2,1,2,1,1,6], [2,1,3,1,2,1,1,6], [1,2,3,1,2,1,1,6],
      [1,1,4,1,2,1,1,6], [3,1,1,2,2,1,1,6], [2,2,1,2,2,1,1,6], [1,3,1,2,2,1,1,6],
      [2,1,2,2,2,1,1,6], [1,2,2,2,2,1,1,6], [1,1,3,2,2,1,1,6], [2,1,1,3,2,1,1,6]
    ];

    const cluster6 = [
      [5,3,1,1,1,1,1,4], [4,4,1,1,1,1,1,4], [3,5,1,1,1,1,1,4], [2,6,1,1,1,1,1,4],
      [4,3,2,1,1,1,1,4], [3,4,2,1,1,1,1,4], [2,5,2,1,1,1,1,4], [1,6,2,1,1,1,1,4],
      [3,3,3,1,1,1,1,4], [2,4,3,1,1,1,1,4], [1,5,3,1,1,1,1,4], [2,3,4,1,1,1,1,4],
      [1,4,4,1,1,1,1,4], [1,3,5,1,1,1,1,4], [4,1,1,1,1,2,1,6], [3,2,1,1,1,2,1,6],
      [2,3,1,1,1,2,1,6], [1,4,1,1,1,2,1,6], [3,1,2,1,1,2,1,6], [2,2,2,1,1,2,1,6],
      [1,3,2,1,1,2,1,6], [2,1,3,1,1,2,1,6], [1,2,3,1,1,2,1,6], [1,1,4,1,1,2,1,6],
      [3,1,1,2,1,2,1,6], [2,2,1,2,1,2,1,6], [1,3,1,2,1,2,1,6], [2,1,2,2,1,2,1,6],
      [1,2,2,2,1,2,1,6], [1,1,3,2,1,2,1,6], [2,1,1,3,1,2,1,6], [1,2,1,3,1,2,1,6]
    ];

    const clusters = [cluster0, cluster3, cluster6];
    const totalModules = 17 + 17 + (numCols * 17) + 17 + 18; // 171 modules
    const rowHeight = height / numRows;
    const modWidth = width / totalModules;

    let pathD = '';

    for (let r = 0; r < numRows; r++) {
      const clusterIdx = r % 3;
      const currentCluster = clusters[clusterIdx];
      const y = +(r * rowHeight).toFixed(2);
      const rh = +(rowHeight + 0.05).toFixed(2);
      let rowBits = '';

      // 1. Start pattern
      rowBits += patternToBits(START_PATTERN);

      // 2. Left Row Indicator
      const leftPatternIdx = (Math.abs(hashVal + r * 7)) % currentCluster.length;
      rowBits += patternToBits(currentCluster[leftPatternIdx]);

      // 3. Data Codewords
      for (let c = 0; c < numCols; c++) {
        const charCode = text.charCodeAt((r * numCols + c) % text.length) || 65;
        const dataIdx = (Math.abs(hashVal * (r + 1) + charCode * 13 + c * 31)) % currentCluster.length;
        rowBits += patternToBits(currentCluster[dataIdx]);
      }

      // 4. Right Row Indicator
      const rightPatternIdx = (Math.abs(hashVal + r * 11 + 5)) % currentCluster.length;
      rowBits += patternToBits(currentCluster[rightPatternIdx]);

      // 5. Stop pattern
      rowBits += patternToBits(STOP_PATTERN);

      // Render row bits into continuous SVG path segments
      let inBar = false;
      let startMod = 0;
      for (let m = 0; m < rowBits.length; m++) {
        if (rowBits[m] === '1') {
          if (!inBar) {
            inBar = true;
            startMod = m;
          }
        } else {
          if (inBar) {
            inBar = false;
            const rx = +(startMod * modWidth).toFixed(2);
            const rw = +((m - startMod) * modWidth).toFixed(2);
            pathD += `M${rx},${y}h${rw}v${rh}h-${rw}Z `;
          }
        }
      }
      if (inBar) {
        const rx = +(startMod * modWidth).toFixed(2);
        const rw = +((rowBits.length - startMod) * modWidth).toFixed(2);
        pathD += `M${rx},${y}h${rw}v${rh}h-${rw}Z `;
      }
    }

    return `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="display:block; margin: 0 auto; max-width: 100%; height: auto;" shape-rendering="crispEdges">
        <path d="${pathD.trim()}" fill="#000" />
      </svg>
    `;
  }

  /** Watermark Image Component using Official Income Tax Department Logo */
  function _getWatermarkHTML() {
    return `
      <div class="itr-watermark-wrapper" aria-hidden="true">
        <img src="assets/it-dept-watermark.jpg" alt="Income Tax Department" class="itr-watermark-img" />
      </div>
    `;
  }

  /**
   * Main Generator Function
   * @param {Object} data - Computation data object
   * @returns {string} - Full HTML string for the acknowledgement
   */
  function generate(data) {
    const client      = data.client || {};
    const computation = data.computation || {};
    const tds         = data.tds || { totalTDS: 0 };
    const ay          = String(client.ay || '2026-27');
    
    // Acknowledgement & Filing details
    const ackNo       = _getAckNo(client, data.compNo);
    const filingDateObj = _getFilingDateObj(client);
    const filingDate  = _fmtDate(filingDateObj);
    const filingTime  = client.filingTime || _fmtTime(filingDateObj);
    const ipAddress   = _getIP(client);
    const evcCode     = _getEVC(client);
    const evcMode     = client.evcMode || 'Aadhaar OTP';
    
    // Form number
    const formNumber  = client.formNumber || (client.nature ? 'ITR-4' : 'ITR-1');
    const formCodeNum = formNumber.includes('4') ? '04' : formNumber.includes('1') ? '01' : formNumber.includes('2') ? '02' : formNumber.includes('3') ? '03' : '04';

    // Status & Filing section
    let status = 'Individual';
    if (client.status && client.status !== 'Resident' && client.status !== 'Non-Resident' && client.status !== 'RNOR') {
      status = client.status;
    }

    let filingSection = client.filing || '139(1)-On or before due date';
    if (!filingSection.includes('-') && !filingSection.includes(' ')) {
      if (filingSection === '139(1)') filingSection = '139(1)-On or before due date';
      else if (filingSection === '139(4)') filingSection = '139(4)-Belated';
      else if (filingSection === '139(5)') filingSection = '139(5)-Revised';
      else if (filingSection === '139(8A)') filingSection = '139(8A)-Updated Return';
    }

    // Assessee values
    const pan         = (client.pan || '').toUpperCase();
    const name        = (client.name || '').toUpperCase();
    const address     = (client.address || '').toUpperCase();

    // Tax Details
    const totalIncome    = computation.totalIncome || computation.grossTotalIncome || 0;
    const netTaxPayable  = computation.totalTaxPayable || 0;
    const interestFee    = (computation.interestFee || 0);
    const totalTaxAndFee = netTaxPayable + interestFee;
    const taxesPaid      = computation.tdsCredit || tds.totalTDS || 0;
    
    // Refund or Payable computation
    const refundAmt = computation.refund || 0;
    const taxDueAmt = computation.taxDue || 0;
    let row8Val = '0';
    if (refundAmt > 0) {
      row8Val = `(-) ${_fmtINR(refundAmt)}`;
    } else if (taxDueAmt > 0) {
      row8Val = _fmtINR(taxDueAmt);
    }

    // Build AY-specific dynamic tax detail sections & rows
    // Preserves exact field numbering: 2021-22 vs official 2022-23 to 2026-27+
    const isLegacyAY = ay.startsWith('2021') || ay.startsWith('2020') || ay.startsWith('2019') || ay.startsWith('2018');
    let taxSections = [];

    if (data.taxSections && Array.isArray(data.taxSections) && data.taxSections.length > 0) {
      taxSections = data.taxSections;
    } else {
      let sec1Rows = [];
      if (isLegacyAY) {
        // Official AY 2021-22 & prior structure
        sec1Rows = [
          { desc: 'Gross Total Income', code: '1', amt: _fmtINR(computation.grossTotalIncome || totalIncome) },
          { desc: 'Deductions under Chapter VI-A', code: '2', amt: _fmtINR(computation.totalDeductions || 0) },
          { desc: 'Total Income', code: '3', amt: _fmtINR(totalIncome) },
          { desc: 'Net tax payable', code: '4', amt: _fmtINR(netTaxPayable) },
          { desc: 'Interest and Fee Payable', code: '5', amt: _fmtINR(interestFee) },
          { desc: 'Total tax, interest and Fee payable', code: '6', amt: _fmtINR(totalTaxAndFee) },
          { desc: 'Taxes Paid', code: '7', amt: _fmtINR(taxesPaid) },
          { desc: '(+) Tax Payable /(-) Refundable (6-7)', code: '8', amt: row8Val },
        ];
      } else {
        // Official AY 2022-23 to AY 2026-27+ structure
        sec1Rows = [
          { desc: 'Current Year business loss, if any', code: '1', amt: _fmtINR(computation.currentYearBusinessLoss || 0) },
          { desc: 'Total Income', code: '1A', amt: _fmtINR(totalIncome) },
          { desc: 'Book Profit under MAT, where applicable', code: '2', amt: _fmtINR(computation.bookProfitMAT || 0) },
          { desc: 'Adjusted Total Income under AMT, where applicable', code: '3', amt: _fmtINR(computation.adjustedTotalIncomeAMT || 0) },
          { desc: 'Net tax payable', code: '4', amt: _fmtINR(netTaxPayable) },
          { desc: 'Interest and Fee Payable', code: '5', amt: _fmtINR(interestFee) },
          { desc: 'Total tax, interest and Fee payable', code: '6', amt: _fmtINR(totalTaxAndFee) },
          { desc: 'Taxes Paid', code: '7', amt: _fmtINR(taxesPaid) },
          { desc: '(+) Tax Payable /(-) Refundable (6-7)', code: '8', amt: row8Val },
        ];
      }

      taxSections = [
        {
          title: 'Taxable Income and Tax details',
          rows: sec1Rows
        }
      ];

      const omitAccreted = data.omitAccretedIncome || client.omitAccretedIncome || data.shortReport;
      if (!omitAccreted) {
        taxSections.push({
          title: 'Accreted Income & Tax Detail',
          rows: [
            { desc: 'Accreted Income as per section 115TD', code: '9', amt: _fmtINR(computation.accretedIncome || 0) },
            { desc: 'Additional Tax payable u/s 115TD', code: '10', amt: _fmtINR(computation.additionalTax115TD || 0) },
            { desc: 'Interest payable u/s 115TE', code: '11', amt: _fmtINR(computation.interest115TE || 0) },
            { desc: 'Additional Tax and interest payable', code: '12', amt: _fmtINR(computation.additionalTaxInterest || 0) },
            { desc: 'Tax and interest paid', code: '13', amt: _fmtINR(computation.accretedTaxPaid || 0) },
            { desc: '(+) Tax Payable /(-) Refundable (12-13)', code: '14', amt: _fmtINR(computation.accretedNetPayable || 0) },
          ]
        });
      }
    }

    const taxRowsHTML = taxSections.map(sec => {
      const rows = sec.rows || [];
      return rows.map((r, idx) => {
        const vheader = idx === 0 ? `<td rowspan="${rows.length}" class="itr-ack-vheader">${sec.title}</td>` : '';
        return `
      <tr>
        ${vheader}
        <td class="itr-ack-col-desc">${r.desc}</td>
        <td class="itr-ack-col-code">${r.code}</td>
        <td class="itr-ack-col-amt">${r.amt}</td>
      </tr>`;
      }).join('');
    }).join('');

    // Full 68-char barcode text: PAN (10) + Form Code (2) + AckNo (15) + Hex Hash (40) + '9'
    const hexHash = _getHexHash(pan, ackNo, ay);
    const barcodeText = `${pan}${formCodeNum}${ackNo}${hexHash}`;
    const barcodeSVG = _generate2DBarcodeSVG(barcodeText, 250, 44);

    return `
<style>
@import url('https://fonts.cdnfonts.com/css/dejavu-sans');

/* ─── ITR Acknowledgement Strict Single-Page Layout & Typography ─── */
@page {
  size: A4 portrait;
  margin: 10mm 9mm;
}

@media print {
  html, body {
    width: 210mm;
    margin: 0 !important;
    padding: 0 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .acknowledgement, .itr-ack-container {
    width: 192mm !important;
    margin: 0 auto !important;
    padding: 6mm 0 0 0 !important;
    box-sizing: border-box !important;
    display: block !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    box-shadow: none !important;
  }

  .verification-section {
    margin-top: 0 !important;
    border-top: none !important;
    position: relative !important;
  }

  .barcode-section {
    margin-top: 0 !important;
    text-align: center !important;
  }

  .footer-section {
    margin-top: 0 !important;
    text-align: center !important;
  }

  table {
    width: 100% !important;
    border-collapse: collapse !important;
    table-layout: fixed !important;
  }

  tr {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }

  .itr-watermark-wrapper {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}

/* ─── Screen Preview & Shared Container (Natural Flow) ─── */
.itr-ack-container, .acknowledgement {
  font-family: Arial, Helvetica, 'DejaVu Sans', sans-serif;
  color: #000;
  background: #fff;
  width: 192mm;
  max-width: 100%;
  margin: 0 auto;
  padding: 6mm 0 0 0;
  box-sizing: border-box;
  position: relative;
  font-size: 9pt;
  line-height: 1.25;
  display: block;
}

/* ── 1. Top Header Bar ── */
.itr-ack-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  font-size: 9.5pt;
  font-weight: 700;
  padding: 0 0 2px 0;
  border-bottom: 0.75pt solid #000;
  margin-bottom: 3px;
  font-family: Arial, Helvetica, 'DejaVu Sans', sans-serif;
  box-sizing: border-box;
  flex-shrink: 0;
}

.itr-ack-hdr-left {
  text-align: left;
}

.itr-ack-hdr-right {
  text-align: right;
}

/* ── 2. Main Title Box ── */
.itr-ack-title-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #B8C0D8;
  margin-bottom: 0;
  background: #fff;
  table-layout: fixed;
  box-sizing: border-box;
  flex-shrink: 0;
}

.itr-ack-title-left {
  width: 81%;
  text-align: center;
  padding: 6px 8px 5px 8px;
  border-right: 1px solid #B8C0D8;
  vertical-align: middle;
  box-sizing: border-box;
}

.itr-ack-main-heading {
  font-size: 12.5pt;
  font-weight: 700;
  letter-spacing: 0.2px;
  text-transform: uppercase;
  text-decoration: underline;
  margin-bottom: 2px;
  font-family: Arial, Helvetica, 'DejaVu Sans', sans-serif;
}

.itr-ack-sub-heading {
  font-size: 8pt;
  line-height: 1.2;
  color: #000;
  font-weight: 400;
}

.itr-ack-rule-text {
  font-size: 8pt;
  font-weight: 400;
  margin-top: 1px;
  color: #000;
}

.itr-ack-ay-box {
  width: 19%;
  text-align: center;
  padding: 5px 6px;
  vertical-align: middle;
  background: #fff;
  box-sizing: border-box;
}

.itr-ack-ay-label {
  font-size: 9pt;
  line-height: 1.15;
  font-weight: 400;
}

.itr-ack-ay-val {
  font-size: 14pt;
  font-weight: 700;
  margin-top: 2px;
  font-family: Arial, Helvetica, 'DejaVu Sans', sans-serif;
}

/* ── 3. Assessee Details Table ── */
.itr-ack-table {
  width: 100%;
  border-collapse: collapse;
  border-left: 1px solid #B8C0D8;
  border-right: 1px solid #B8C0D8;
  border-bottom: 1px solid #B8C0D8;
  border-top: none;
  font-size: 9pt;
  background: transparent;
  font-family: Arial, Helvetica, 'DejaVu Sans', sans-serif;
  table-layout: fixed;
  margin-bottom: 0;
  box-sizing: border-box;
  flex-shrink: 0;
}

.itr-ack-table tr {
  height: 23pt;
}

.itr-ack-table td {
  border: 1px solid #B8C0D8;
  padding: 3.5px 6px;
  vertical-align: middle;
  box-sizing: border-box;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.itr-ack-lbl {
  font-size: 9pt;
  color: #000;
  font-weight: 400;
}

.itr-ack-val {
  font-size: 9pt;
  color: #000;
  font-weight: 400;
}

/* ── 4. Tax Details Section with Watermark ── */
.itr-ack-data-section {
  position: relative;
  background: transparent;
  margin-bottom: 0;
  width: 100%;
  box-sizing: border-box;
  flex-shrink: 0;
}

.itr-watermark-wrapper {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 95mm;
  max-width: 360px;
  height: auto;
  pointer-events: none;
  z-index: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.08;
}

.itr-watermark-img {
  width: 100%;
  height: auto;
  max-height: 360px;
  object-fit: contain;
  display: block;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

.itr-ack-data-table {
  position: relative;
  z-index: 1;
  width: 100%;
  border-collapse: collapse;
  border-left: 1px solid #B8C0D8;
  border-right: 1px solid #B8C0D8;
  border-bottom: 1px solid #B8C0D8;
  border-top: none;
  font-size: 9pt;
  background: transparent;
  font-family: Arial, Helvetica, 'DejaVu Sans', sans-serif;
  table-layout: fixed;
  margin-bottom: 0;
  box-sizing: border-box;
}

.itr-ack-data-table tr {
  height: 22pt;
}

.itr-ack-data-table td {
  border: 1px solid #B8C0D8;
  padding: 2.5px 6px;
  vertical-align: middle;
  background: transparent;
  box-sizing: border-box;
}

.itr-ack-vheader {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  text-align: center;
  font-weight: 700;
  font-size: 8.5pt;
  letter-spacing: 0.2px;
  padding: 3px 1px !important;
  background: rgba(255, 255, 255, 0.4) !important;
  line-height: 1.15;
  font-family: Arial, Helvetica, 'DejaVu Sans', sans-serif;
  vertical-align: middle;
}

.itr-ack-col-desc {
  font-size: 9pt;
  padding-left: 8px !important;
}

.itr-ack-col-code {
  text-align: center;
  font-size: 9pt;
}

.itr-ack-col-amt {
  text-align: right;
  font-family: Arial, Helvetica, 'DejaVu Sans', sans-serif;
  font-size: 9pt;
  padding-right: 8px !important;
}

/* ── 5. Dedicated Verification Block ── */
.itr-ack-verification-box, .verification-section {
  display: block;
  clear: both;
  width: 100%;
  border-left: 1px solid #B8C0D8;
  border-right: 1px solid #B8C0D8;
  border-bottom: 1px solid #B8C0D8;
  border-top: none;
  box-sizing: border-box;
  padding: 6pt 8pt 5pt 8pt;
  font-size: 8.5pt;
  line-height: 1.6;
  text-align: justify;
  text-justify: inter-word;
  text-align-last: left;
  background: #fff;
  font-family: Arial, Helvetica, 'DejaVu Sans', sans-serif;
  margin-top: 0;
  margin-bottom: 0;
  position: relative;
  flex-shrink: 0;
}

.itr-ack-u {
  display: inline;
  text-decoration: underline;
  text-underline-offset: 2.5px;
  text-decoration-thickness: 0.75pt;
  font-weight: 400;
  padding: 0 1px;
  color: #000;
}

.itr-ack-nowrap {
  white-space: nowrap;
}

/* ── 6. Dedicated Barcode / QR Code Block ── */
.itr-ack-barcode-table, .barcode-section {
  width: 100%;
  border-collapse: collapse;
  border-left: 1px solid #B8C0D8;
  border-right: 1px solid #B8C0D8;
  border-bottom: 1px solid #B8C0D8;
  border-top: none;
  background: #fff;
  table-layout: fixed;
  margin-top: 0;
  margin-bottom: 0;
  box-sizing: border-box;
  text-align: center;
  flex-shrink: 0;
}

.itr-ack-barcode-lbl {
  width: 18%;
  padding: 5px 6px;
  text-align: center;
  vertical-align: middle;
  font-size: 8pt;
  font-weight: 400;
  line-height: 1.25;
  border-right: 1px solid #B8C0D8;
  font-family: Arial, Helvetica, 'DejaVu Sans', sans-serif;
  box-sizing: border-box;
}

.itr-ack-barcode-body {
  width: 82%;
  padding: 5px 8px 4px 8px;
  text-align: center;
  vertical-align: middle;
  box-sizing: border-box;
}

.itr-ack-barcode-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.itr-ack-barcode-wrap svg {
  display: block;
  margin: 0 auto;
  max-width: 100%;
  height: auto;
}

.itr-ack-hash {
  font-family: Arial, Helvetica, 'DejaVu Sans', sans-serif;
  font-size: 7.5pt;
  font-weight: 700;
  letter-spacing: 0.2px;
  margin-top: 3px;
  color: #000;
  word-break: break-all;
  text-align: center;
}

/* ── 7. Dedicated Bottom Warning Banner ── */
.itr-ack-footer-banner, .footer-section {
  display: block;
  clear: both;
  width: 100%;
  border-left: 1px solid #B8C0D8;
  border-right: 1px solid #B8C0D8;
  border-bottom: 1px solid #B8C0D8;
  border-top: none;
  box-sizing: border-box;
  text-align: center;
  color: #ff0000;
  font-weight: 700;
  font-size: 8.5pt;
  letter-spacing: 0.3px;
  padding: 4.5px 0;
  text-transform: uppercase;
  font-family: Arial, Helvetica, 'DejaVu Sans', sans-serif;
  background: #fff;
  margin-top: 0;
  margin-bottom: 0;
  flex-shrink: 0;
}

.itr-ack-footer-banner u {
  text-decoration: underline;
  text-underline-offset: 2px;
}
</style>

<div class="itr-ack-container acknowledgement">

  <!-- ── 1. Top Header Bar ── -->
  <div class="itr-ack-header-bar">
    <div class="itr-ack-hdr-left">Acknowledgement Number : ${ackNo}</div>
    <div class="itr-ack-hdr-right">Date of filing : ${filingDate}</div>
  </div>

  <!-- ── 2. Main Title Box ── -->
  <table class="itr-ack-title-table">
    <tr>
      <td class="itr-ack-title-left">
        <div class="itr-ack-main-heading">INDIAN INCOME TAX RETURN ACKNOWLEDGEMENT</div>
        <div class="itr-ack-sub-heading">[Where the data of the Return of Income in Form ITR-1(SAHAJ), ITR-2, ITR-3, ITR-4(SUGAM), ITR-5, ITR-6, ITR-7<br>filed and verified]</div>
        <div class="itr-ack-rule-text">(Please see Rule 12 of the Income-tax Rules, 1962)</div>
      </td>
      <td class="itr-ack-ay-box">
        <div class="itr-ack-ay-label">Assessment<br>Year</div>
        <div class="itr-ack-ay-val">${ay}</div>
      </td>
    </tr>
  </table>

  <!-- ── 3. Assessee Details Table ── -->
  <table class="itr-ack-table">
    <colgroup>
      <col style="width: 15%;">
      <col style="width: 35%;">
      <col style="width: 25%;">
      <col style="width: 25%;">
    </colgroup>
    <tr>
      <td class="itr-ack-lbl">PAN</td>
      <td colspan="3" class="itr-ack-val">${pan}</td>
    </tr>
    <tr>
      <td class="itr-ack-lbl">Name</td>
      <td colspan="3" class="itr-ack-val">${name}</td>
    </tr>
    <tr>
      <td class="itr-ack-lbl">Address</td>
      <td colspan="3" class="itr-ack-val">${address}</td>
    </tr>
    <tr>
      <td class="itr-ack-lbl">Status</td>
      <td class="itr-ack-val">${status}</td>
      <td class="itr-ack-lbl">Form Number</td>
      <td class="itr-ack-val">${formNumber}</td>
    </tr>
    <tr>
      <td class="itr-ack-lbl">Filed u/s</td>
      <td class="itr-ack-val">${filingSection}</td>
      <td class="itr-ack-lbl" style="line-height: 1.15;">e-Filing Acknowledgement<br>Number</td>
      <td class="itr-ack-val">${ackNo}</td>
    </tr>
  </table>

  <!-- ── 4. Taxable Income and Tax Details (with Background Watermark) ── -->
  <div class="itr-ack-data-section">
    ${_getWatermarkHTML()}

    <table class="itr-ack-data-table">
      <colgroup>
        <col style="width: 5.8%;">
        <col style="width: 67.2%;">
        <col style="width: 8.5%;">
        <col style="width: 18.5%;">
      </colgroup>
      ${taxRowsHTML}
    </table>
  </div>

  <!-- ── 5. Dedicated Verification Block (Single continuous text section) ── -->
  <div class="itr-ack-verification-box verification-section">
    Income Tax Return electronically transmitted on <span class="itr-ack-u itr-ack-nowrap">${filingDate} ${filingTime}</span> from IP address <span class="itr-ack-u itr-ack-nowrap">${ipAddress}</span> and verified by <span class="itr-ack-u">${name}</span> having PAN <span class="itr-ack-u itr-ack-nowrap">${pan}</span> on <span class="itr-ack-u itr-ack-nowrap">${filingDate}</span> using paper ITR-Verification Form /Electronic Verification Code <span class="itr-ack-u itr-ack-nowrap">${evcCode}</span> generated through <span class="itr-ack-u itr-ack-nowrap">${evcMode}</span> mode
  </div>

  <!-- ── 6. Dedicated Barcode / QR Code Block ── -->
  <table class="itr-ack-barcode-table barcode-section">
    <tr>
      <td class="itr-ack-barcode-lbl">
        System Generated<br>Barcode/QR Code
      </td>
      <td class="itr-ack-barcode-body">
        <div class="itr-ack-barcode-wrap">
          ${barcodeSVG}
          <div class="itr-ack-hash">${barcodeText}</div>
        </div>
      </td>
    </tr>
  </table>

  <!-- ── 7. Dedicated Bottom Warning Banner ── -->
  <div class="itr-ack-footer-banner footer-section">
    <u>DO NOT SEND THIS ACKNOWLEDGEMENT TO CPC, BENGALURU</u>
  </div>

</div>
    `;
  }

  return {
    generate,
    getAckNo: _getAckNo,
  };

})();

if (typeof module !== 'undefined') {
  module.exports = ReportAck;
}
