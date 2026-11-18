/**
 * Test Suite: Classic Format 2 Payslip Generator
 */

const assert = require('assert');
const SalarySlipEngine = require('../js/salary-slip-engine.js');

console.log('═══════════════════════════════════════════════════════════');
console.log('  TEST SUITE: CLASSIC FORMAT 2 (INNOV MINIMAL) PAYSLIP     ');
console.log('═══════════════════════════════════════════════════════════\n');

const sampleData = {
  company: {
    id: 'comp_innov',
    name: 'Innovsource Services Private Limited.',
    address: 'Reg. Off.: 501, Jolly Board Tower 1, I - Think Techno Campus, Kanjurmarg - East, Mumbai – 400042',
    phone: '',
    email: '',
    logoData: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4='
  },
  month: 'July',
  year: '2025',
  employee: {
    id: '202519017',
    name: 'Rajesh Baidya',
    location: 'Basirhat(West Bengal)',
    division: '',
    designation: 'RDO',
    pfNo: 'THTHA15499610000575584',
    uan: '101911983399',
    esic: '',
    pan: 'DVXPB8514H',
    bankName: '',
    acNo: '0970201700024776',
    gender: 'Male'
  },
  attendance: {
    totalDays: '31.00',
    daysPaid: '31.00',
    lop: '0.00'
  },
  earnings: [
    { name: 'Basic', salary: 14000.00 },
    { name: 'House Rent Allowance', salary: 2800.00 },
    { name: 'Bonus Gross', salary: 1041.00 },
    { name: 'Other Allowance', salary: 4089.00 }
  ],
  deductions: {
    items: [
      { name: 'PF - Employee (Ceiling)', amount: 1800.00 },
      { name: 'Profession Tax', amount: 130.00 }
    ],
    total: 1930.00
  },
  format: 'classic2'
};

// 1. Single slip generation
const singleHtml = SalarySlipEngine.renderSingleSlipPage(sampleData, 'classic2');
assert.ok(singleHtml.includes('fmt-classic2'), 'Should contain fmt-classic2 class');
assert.ok(singleHtml.includes('c2-outer'), 'Should contain c2-outer container');
console.log('✓ renderSingleSlipPage generates fmt-classic2 container');

// 2. Header elements
assert.ok(singleHtml.includes('Innovsource Services Private Limited.'), 'Contains company name');
assert.ok(singleHtml.includes('Kanjurmarg - East, Mumbai – 400042'), 'Contains company address');
assert.ok(singleHtml.includes('PAYSLIP FOR THE MONTH OF July-2025'), 'Contains exact payslip title');
console.log('✓ Header & title formatted accurately');

// 3. Employee metadata table
assert.ok(singleHtml.includes('202519017'), 'Contains Employee ID');
assert.ok(singleHtml.includes('Rajesh Baidya'), 'Contains Employee Name');
assert.ok(singleHtml.includes('Basirhat(West Bengal)'), 'Contains Location');
assert.ok(singleHtml.includes('RDO'), 'Contains Designation');
assert.ok(singleHtml.includes('THTHA15499610000575584'), 'Contains PF No.');
assert.ok(singleHtml.includes('101911983399'), 'Contains PF UAN');
assert.ok(singleHtml.includes('Bank A/c'), 'Contains Pay mode Bank A/c');
assert.ok(singleHtml.includes('DVXPB8514H'), 'Contains PAN No.');
assert.ok(singleHtml.includes('0970201700024776'), 'Contains Bank Account');
assert.ok(singleHtml.includes('Male'), 'Contains Sex Male');
console.log('✓ 2-column employee metadata table matches reference');

// 4. Attendance block
assert.ok(singleHtml.includes('Total Days in Month:'), 'Contains Total Days in Month label');
assert.ok(singleHtml.includes('31.0'), 'Contains Total Days value');
assert.ok(singleHtml.includes('Days Paid:'), 'Contains Days Paid label');
assert.ok(singleHtml.includes('Arrears Days Paid:'), 'Contains Arrears Days Paid line');
console.log('✓ Attendance details block present');

// 5. 4-Column Financial Table
assert.ok(singleHtml.includes('Earnings</th>'), 'Contains Earnings column header');
assert.ok(singleHtml.includes('Deductions</th>'), 'Contains Deductions column header');
assert.ok(singleHtml.includes('Basic'), 'Contains Basic earnings line');
assert.ok(singleHtml.includes('14000.00'), 'Contains 14000.00 basic amount');
assert.ok(singleHtml.includes('House Rent Allowance'), 'Contains HRA');
assert.ok(singleHtml.includes('Bonus Gross'), 'Contains Bonus Gross');
assert.ok(singleHtml.includes('PF - Employee (Ceiling)'), 'Contains PF deduction');
assert.ok(singleHtml.includes('Profession Tax'), 'Contains PT deduction');
assert.ok(singleHtml.includes('Gross Earning : 21930.00'), 'Contains Gross Earning summary');
assert.ok(singleHtml.includes('Total Deduction : 1930.00'), 'Contains Total Deduction summary');
assert.ok(singleHtml.includes('Net Pay : 20000'), 'Contains Net Pay summary');
console.log('✓ 4-column financial table & totals match reference');

// 6. User Constraints: Remove Update Details and Help Desk
assert.strictEqual(singleHtml.includes('Update Your Details'), false, 'Should NOT contain "Update Your Details"');
assert.strictEqual(singleHtml.includes('Help Desk'), false, 'Should NOT contain "Help Desk"');
assert.strictEqual(singleHtml.includes('Toll Free'), false, 'Should NOT contain "Toll Free"');
assert.strictEqual(singleHtml.includes('ar@innov.in'), false, 'Should NOT contain help email');
console.log('✓ "Update Your Details" and "contact Help" sections successfully omitted');

// 7. Computer generated note retained
assert.ok(singleHtml.includes('This is a computer generated statement and needs no authentication.'), 'Retains authentication disclaimer');
console.log('✓ Computer generated statement disclaimer retained');

// 8. Multi-slip and standalone HTML generation
const fullHtml = SalarySlipEngine.generate(sampleData, 'classic2');
assert.ok(fullHtml.includes('Classic Format 2'), 'Format switcher contains Classic Format 2 option');
assert.ok(fullHtml.includes('_renderCls2'), 'Embedded script contains _renderCls2');
console.log('✓ Standalone printable page & interactive switcher support Classic Format 2');

// 9. Refined Professional Margins & Alignment Verification
assert.ok(singleHtml.includes('c2-emp-l1'), 'Employee table has aligned left column class');
assert.ok(singleHtml.includes('c2-emp-l2'), 'Employee table has aligned right column class');
assert.ok(singleHtml.includes('c2-att-gap'), 'Attendance block has balanced spacing gap');
assert.ok(fullHtml.includes('max-width: 168mm'), 'Refined professional A4 content width of 168mm present');
assert.ok(fullHtml.includes('.slip-card-wrapper.fmt-classic2'), 'Card wrapper has scoped A4 dimensions');
console.log('✓ Professional 168mm A4 print/screen margins & column alignment verified');

console.log('\n=========================================');
console.log('ALL CLASSIC FORMAT 2 PAYSLIP TESTS PASSED!');
console.log('=========================================\n');
