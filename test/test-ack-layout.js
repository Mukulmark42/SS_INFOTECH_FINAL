/**
 * Test Suite: ITR Acknowledgement Generator Layout & Margins
 * Verifies all 11 requirements from the ITR Acknowledgement improvement specification.
 */

const assert = require('assert');
const ReportAck = require('../js/report-ack.js');

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║   TEST SUITE: ITR ACKNOWLEDGEMENT LAYOUT & MARGINS       ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

// ── TEST 1: Page Layout & CSS Print Rules ───────────────────
console.log('--- Test 1: Page Layout & Print CSS Rules ---');
const baseData = {
  client: {
    name: 'RAJESH KUMAR SHARMA',
    pan: 'ABCDE1234F',
    address: 'FLAT NO 402, GREEN ACRES, SECTOR 15, NOIDA, UTTAR PRADESH 201301',
    status: 'Individual',
    ay: '2026-27',
    filing: '139(1)-On or before due date',
    formNumber: 'ITR-1',
    filingDate: '2026-07-29',
    filingTime: '20:11:36',
    ipAddress: '103.111.121.134',
    evcCode: '8U9XM3KD9I',
    evcMode: 'Aadhaar OTP'
  },
  computation: {
    totalIncome: 750000,
    totalTaxPayable: 25000,
    interestFee: 1000,
    tdsCredit: 30000,
    refund: 4000
  },
  compNo: '101'
};

const htmlBase = ReportAck.generate(baseData);

// 1. Page margin: Top 10mm, Bottom 10mm, Left 9mm, Right 9mm
assert(htmlBase.includes('margin: 10mm 9mm;'), 'CSS must define @page margin: 10mm 9mm');
assert(htmlBase.includes('size: A4 portrait;'), 'CSS must define A4 portrait size');

// 2. Print & Natural Flow rules
assert(htmlBase.includes('width: 210mm;'), 'Print CSS must set body width: 210mm');
assert(htmlBase.includes('width: 192mm'), 'Acknowledgement width must be 192mm (210 - 9 - 9)');
assert(htmlBase.includes('display: block'), 'Container must use natural flow display: block');
assert(!htmlBase.includes('margin-top: auto'), 'Must NOT use flexbox margin-top: auto');
assert(htmlBase.includes('padding: 6mm 0 0 0'), 'Container must have top padding (6mm) to prevent header touching top edge');
assert(htmlBase.includes('margin-top: 0'), 'Verification section must attach directly to tax table without vertical gap (margin-top: 0)');
assert(htmlBase.includes('table-layout: fixed'), 'Tables must use table-layout: fixed');
assert(htmlBase.includes('class="itr-ack-container acknowledgement"'), 'Container must include acknowledgement class');
assert(htmlBase.includes('class="itr-ack-verification-box verification-section"'), 'Verification box must include verification-section class');
assert(htmlBase.includes('class="itr-ack-barcode-table barcode-section"'), 'Barcode table must include barcode-section class');
assert(htmlBase.includes('class="itr-ack-footer-banner footer-section"'), 'Footer banner must include footer-section class');

// Verify exact continuous natural flow sequence in DOM
const bodyStart = htmlBase.lastIndexOf('itr-ack-container');
const posH = htmlBase.indexOf('itr-ack-header-bar', bodyStart);
const posT = htmlBase.indexOf('itr-ack-title-table', posH);
const posA = htmlBase.indexOf('itr-ack-table', posT);
const posTax = htmlBase.indexOf('itr-ack-data-table', posA);
const posV = htmlBase.indexOf('verification-section', posTax);
const posB = htmlBase.indexOf('barcode-section', posV);
const posF = htmlBase.indexOf('footer-section', posB);

assert(posH > bodyStart, 'Header bar must follow container start');
assert(posT > posH, 'Title box must follow header bar');
assert(posA > posT, 'Assessee table must follow title box');
assert(posTax > posA, 'Tax table must follow assessee table');
assert(posV > posTax, 'Verification section must follow tax table');
assert(posB > posV, 'Barcode section must follow verification section');
assert(posF > posB, 'Footer banner must follow barcode section');
console.log('✓ Page Layout & Natural Flow CSS: PASSED\n');

// ── TEST 2: Header Improvement ──────────────────────────────
console.log('--- Test 2: Header Improvement ---');
assert(htmlBase.includes('Acknowledgement Number :'), 'Header must contain "Acknowledgement Number :"');
assert(htmlBase.includes('Date of filing :'), 'Header must contain "Date of filing :"');
assert(htmlBase.includes('border-bottom: 0.75pt solid #000;') || htmlBase.includes('border-bottom: 0.75pt solid'), 'Header must have thin horizontal separator');
assert(htmlBase.includes('INDIAN INCOME TAX RETURN ACKNOWLEDGEMENT'), 'Title must be centered INDIAN INCOME TAX RETURN ACKNOWLEDGEMENT');
assert(htmlBase.includes('Assessment<br>Year'), 'Assessment Year must be in separate right box');
assert(htmlBase.includes('2026-27'), 'Assessment Year value must match client AY');
console.log('✓ Header Improvement: PASSED\n');

// ── TEST 3: Personal Information Table ───────────────────────
console.log('--- Test 3: Personal Information Table ---');
assert(htmlBase.includes('>PAN<'), 'Table must contain PAN label');
assert(htmlBase.includes('>ABCDE1234F<'), 'Table must contain PAN value');
assert(htmlBase.includes('>Name<'), 'Table must contain Name label');
assert(htmlBase.includes('>RAJESH KUMAR SHARMA<'), 'Table must contain Name value');
assert(htmlBase.includes('>Address<'), 'Table must contain Address label');
assert(htmlBase.includes('FLAT NO 402, GREEN ACRES'), 'Table must contain Address value');
assert(htmlBase.includes('>Status<'), 'Table must contain Status label');
assert(htmlBase.includes('>Individual<'), 'Table must contain Status value');
assert(htmlBase.includes('>Form Number<'), 'Table must contain Form Number label');
assert(htmlBase.includes('>ITR-1<'), 'Table must contain Form Number value');
assert(htmlBase.includes('>Filed u/s<'), 'Table must contain Filed u/s label');
assert(htmlBase.includes('139(1)-On or before due date'), 'Table must contain Filed u/s value');
assert(htmlBase.includes('e-Filing Acknowledgement') && htmlBase.includes('Number'), 'Table must contain e-Filing Acknowledgement Number label');
console.log('✓ Personal Information Table: PASSED\n');

// ── TEST 4: Watermark ───────────────────────────────────────
console.log('--- Test 4: Watermark ---');
assert(htmlBase.includes('assets/it-dept-watermark.jpg'), 'Watermark image path must be assets/it-dept-watermark.jpg');
assert(htmlBase.includes('opacity: 0.08;'), 'Watermark opacity must be calibrated to ~6-10% (0.08)');
assert(htmlBase.includes('position: absolute;'), 'Watermark must be positioned absolutely behind table');
assert(htmlBase.includes('pointer-events: none;'), 'Watermark must have pointer-events: none');
console.log('✓ Watermark: PASSED\n');

// ── TEST 5: Verification Section ────────────────────────────
console.log('--- Test 5: Verification Section ---');
assert(htmlBase.includes('Income Tax Return electronically transmitted on'), 'Verification text must state transmission line');
assert(htmlBase.includes('103.111.121.134'), 'Verification must include IP address');
assert(htmlBase.includes('RAJESH KUMAR SHARMA'), 'Verification must include verified by name');
assert(htmlBase.includes('ABCDE1234F'), 'Verification must include verified by PAN');
assert(htmlBase.includes('8U9XM3KD9I'), 'Verification must include EVC code');
assert(htmlBase.includes('Aadhaar OTP'), 'Verification must include verification mode');
assert(htmlBase.includes('class="itr-ack-u"'), 'Values in verification must use inline underline class');
console.log('✓ Verification Section: PASSED\n');

// ── TEST 6: Barcode & QR Section ────────────────────────────
console.log('--- Test 6: Barcode & QR Section ---');
assert(htmlBase.includes('System Generated<br>Barcode/QR Code'), 'Barcode table must contain System Generated label');
assert(htmlBase.includes('<svg width="250" height="44" viewBox="0 0 250 44"') && htmlBase.includes('shape-rendering="crispEdges"'), 'Barcode SVG must preserve aspect ratio with crispEdges rendering');
assert(htmlBase.includes('class="itr-ack-hash"'), 'Barcode must render hash below barcode');
assert(htmlBase.includes('ABCDE1234F01'), 'Barcode text must encode PAN + FormCode 01');
console.log('✓ Barcode & QR Section: PASSED\n');

// ── TEST 7: Footer Warning Banner ───────────────────────────
console.log('--- Test 7: Footer Warning Banner ---');
assert(htmlBase.includes('DO NOT SEND THIS ACKNOWLEDGEMENT TO CPC, BENGALURU'), 'Footer must contain warning');
assert(htmlBase.includes('color: #ff0000;'), 'Footer must use red text color');
assert(htmlBase.includes('font-weight: 700;'), 'Footer must use bold font weight');
assert(htmlBase.includes('<u>DO NOT SEND THIS ACKNOWLEDGEMENT TO CPC, BENGALURU</u>'), 'Footer must be underlined');
console.log('✓ Footer Warning Banner: PASSED\n');

// ── TEST 8: Requirement 11.1 - Short Acknowledgement with fewer tax detail rows ──
console.log('--- Test 8: Short Acknowledgement (Fewer Tax Detail Rows) ---');
const shortData = {
  client: {
    name: 'SHORT ROW USER',
    pan: 'SHORT1234A',
    ay: '2026-27',
    formNumber: 'ITR-1',
    omitAccretedIncome: true
  },
  computation: {
    totalIncome: 450000,
    totalTaxPayable: 0
  }
};
const htmlShort = ReportAck.generate(shortData);
assert(!htmlShort.includes('Accreted Income as per section 115TD'), 'Short acknowledgement must omit accreted income section');
assert(htmlShort.includes('Taxable Income and Tax details'), 'Short acknowledgement must still render Section 1');
assert(htmlShort.includes('rowspan="9"'), 'Section 1 header must dynamically have rowspan 9');
assert(htmlShort.includes('DO NOT SEND THIS ACKNOWLEDGEMENT TO CPC, BENGALURU'), 'Short acknowledgement must retain footer warning');
console.log('✓ Short Acknowledgement: PASSED\n');

// ── TEST 9: Requirement 11.2 - All Available Tax Detail Rows ─
console.log('--- Test 9: Full Acknowledgement (All Available Tax Detail Rows) ---');
const fullData = {
  client: {
    name: 'FULL ROW USER',
    pan: 'FULLX1234F',
    ay: '2026-27',
    formNumber: 'ITR-2'
  },
  computation: {
    totalIncome: 1200000,
    totalTaxPayable: 110000,
    interestFee: 5000,
    tdsCredit: 100000,
    taxDue: 15000,
    accretedIncome: 50000,
    additionalTax115TD: 15000,
    interest115TE: 2000,
    additionalTaxInterest: 17000,
    accretedTaxPaid: 17000,
    accretedNetPayable: 0
  }
};
const htmlFull = ReportAck.generate(fullData);
assert(htmlFull.includes('Taxable Income and Tax details'), 'Full acknowledgement must have Section 1');
assert(htmlFull.includes('Accreted Income & Tax Detail'), 'Full acknowledgement must have Section 2');
assert(htmlFull.includes('Accreted Income as per section 115TD'), 'Full acknowledgement must include 115TD row');
assert(htmlFull.includes('rowspan="6"'), 'Section 2 header must dynamically have rowspan 6');
assert(htmlFull.includes('15,000'), 'Tax due ₹ 15,000 must be rendered');
console.log('✓ Full Acknowledgement: PASSED\n');

// ── TEST 10: Requirement 11.3 - Long Taxpayer Name and Address ─
console.log('--- Test 10: Long Taxpayer Name and Address ---');
const longData = {
  client: {
    name: 'MOHAMMED SHAMSUDDIN SHEIKH ABDUL RAHMAN AL-QURAISHI JUNIOR',
    pan: 'LONGP1234L',
    address: 'BUILDING NO. 14, FLAT NO. 802, WING-C, HIGH-RISE RESIDENTIAL COMPLEX, NEAR MAHARASHTRA STATE ELECTRICITY BOARD SUB-STATION, OPPOSITE OLD RAILWAY CROSSING ROAD, ANDHERI WEST, GREATER MUMBAI, MAHARASHTRA 400058',
    ay: '2026-27',
    formNumber: 'ITR-1'
  },
  computation: {
    totalIncome: 850000
  }
};
const htmlLong = ReportAck.generate(longData);
assert(htmlLong.includes('MOHAMMED SHAMSUDDIN SHEIKH ABDUL RAHMAN AL-QURAISHI JUNIOR'), 'Long name must be present in HTML');
assert(htmlLong.includes('ANDHERI WEST, GREATER MUMBAI'), 'Long address must be present in HTML');
assert(htmlLong.includes('word-wrap: break-word'), 'CSS must include word-wrap: break-word to prevent overflow');
assert(htmlLong.includes('overflow-wrap: break-word'), 'CSS must include overflow-wrap: break-word');
console.log('✓ Long Taxpayer Name and Address: PASSED\n');

// ── TEST 11: Requirement 11.4 - Different AYs and ITR Forms ─
console.log('--- Test 11: Different AYs and ITR Forms ---');
// AY 2021-22 (Legacy format: Gross Total Income 1, Deductions 2, Total Income 3)
const ay21Data = {
  client: {
    name: 'LEGACY AY CLIENT',
    pan: 'LEGAC1234L',
    ay: '2021-22',
    formNumber: 'ITR-1'
  },
  computation: {
    grossTotalIncome: 650000,
    totalDeductions: 150000,
    totalIncome: 500000,
    totalTaxPayable: 12500
  }
};
const html21 = ReportAck.generate(ay21Data);
assert(html21.includes('Gross Total Income'), 'AY 2021-22 must have Gross Total Income');
assert(html21.includes('Deductions under Chapter VI-A'), 'AY 2021-22 must have Deductions under Chapter VI-A');
assert(html21.includes('2021-22'), 'Assessment year must be 2021-22');

// AY 2025-26 & 2026-27 (Newer format: Current Year business loss 1, Total Income 1A, MAT 2, AMT 3)
const ay25Data = {
  client: {
    name: 'NEW AY CLIENT',
    pan: 'NEWAY1234N',
    ay: '2025-26',
    formNumber: 'ITR-4'
  },
  computation: {
    totalIncome: 900000,
    totalTaxPayable: 40000
  }
};
const html25 = ReportAck.generate(ay25Data);
assert(html25.includes('Current Year business loss, if any'), 'AY 2025-26 must have Current Year business loss row 1');
assert(html25.includes('Total Income'), 'AY 2025-26 must have Total Income row 1A');
assert(html25.includes('>ITR-4<'), 'Must render ITR-4 form number');
assert(html25.includes('NEWAY1234N04'), 'Barcode must encode Form Code 04 for ITR-4');
assert(html25.includes('2025-26'), 'Assessment year must be 2025-26');
console.log('✓ Different AYs and ITR Forms: PASSED\n');

console.log('═══════════════════════════════════════════════════════════');
console.log('  ALL 11 ITR ACKNOWLEDGEMENT LAYOUT & MARGIN TESTS PASSED! ');
console.log('═══════════════════════════════════════════════════════════');

