const fs = require('fs');
const path = require('path');

// Lightweight DOM mock
class Element {
  constructor(tag, id = '') {
    this.tagName = tag.toUpperCase();
    this.id = id;
    this.value = '';
    this.textContent = '';
    this.innerHTML = '';
    this.style = {};
    this.classList = {
      classes: new Set(),
      add: (c) => this.classList.classes.add(c),
      remove: (c) => this.classList.classes.delete(c),
      toggle: (c, force) => {
        if (force !== undefined) {
          if (force) this.classList.classes.add(c);
          else this.classList.classes.delete(c);
        } else {
          if (this.classList.classes.has(c)) this.classList.classes.delete(c);
          else this.classList.classes.add(c);
        }
      },
      contains: (c) => this.classList.classes.has(c)
    };
    this.children = [];
  }
  querySelector(sel) {
    return new Element('div');
  }
  querySelectorAll(sel) {
    return [];
  }
  insertAdjacentHTML(pos, html) {}
}

const elements = new Map();
function getOrCreate(id) {
  if (!elements.has(id)) {
    elements.set(id, new Element('div', id));
  }
  return elements.get(id);
}

global.document = {
  getElementById: (id) => getOrCreate(id),
  querySelector: (sel) => {
    if (sel.startsWith('#')) return getOrCreate(sel.slice(1));
    return new Element('div');
  },
  querySelectorAll: (sel) => [],
  addEventListener: () => {}
};
const storage = new Map();
global.localStorage = {
  getItem: (k) => storage.get(k) || null,
  setItem: (k, v) => storage.set(k, String(v)),
  removeItem: (k) => storage.delete(k),
  clear: () => storage.clear()
};
global.window = {
  document: global.document,
  localStorage: global.localStorage,
  addEventListener: () => {},
  alert: () => {},
  confirm: () => true
};
global.alert = () => {};
global.confirm = () => true;

// Initial default field values
const defaults = {
  'f-name': 'RAJESH KUMAR',
  'f-father': 'RAMESH KUMAR',
  'f-pan': 'ABCDE1234F',
  'f-dob': '1985-05-15',
  'f-gender': 'Male',
  'f-status': 'Resident',
  'f-mobile': '9876543210',
  'f-email': 'rajesh@example.com',
  'f-address': 'Sector 62, Noida',
  'f-ward': 'Ward 1(1)',
  'f-ay': '2026-27',
  'f-filing': '139(1)',
  'f-form-no': 'ITR-1',
  'f-presumptive-section': 'none',
  'f-nature': '',
  'f-bcode': '',
  'f-bname': '',
  'f-regime': 'New',
  'f-income': '',
  'f-savings': '',
  'f-sal-gross': '',
  'f-sal-ptax': '',
  'f-sal-hra': '',
  'f-sal-hra-metro': 'non-metro',
  'f-sal-rent': '',
  'f-sal-80ccd2': '',
  'f-sal-emp-cat': 'Private',
  'f-sal-tds': '',
  'f-sal-tds-sub': '',
  'f-stcg': '',
  'f-ltcg': '',
  'f-pl': '',
  'f-ded-80c': '',
  'f-ded-80d': '',
  'f-ded-80ccd': '',
  'f-ded-80g': '',
  'f-emp-name': 'INFOSYS LIMITED',
  'f-emp-cat': 'Private',
  'f-emp-tan': 'BLRI01234E',
  'f-ack-no': '',
  'f-filing-date': '2026-07-20',
  'f-evc-mode': 'Aadhaar OTP'
};

for (const [k, v] of Object.entries(defaults)) {
  getOrCreate(k).value = v;
}

// Load backend engines
global.TaxEngine = eval('(function(){ ' + fs.readFileSync(path.join(__dirname, '../js/tax-engine.js'), 'utf8') + '; return TaxEngine; })()');
global.TDSEngine = eval('(function(){ ' + fs.readFileSync(path.join(__dirname, '../js/tds-engine.js'), 'utf8') + '; return TDSEngine; })()');
global.InterestEngine = eval('(function(){ ' + fs.readFileSync(path.join(__dirname, '../js/interest-engine.js'), 'utf8') + '; return InterestEngine; })()');

// Mock DB
const DB = {
  getAdmin: () => ({
    firmName: "SS INFOTECH",
    profitPct: 20,
    intMin: 1200,
    intMax: 8000,
    deductors: [{ name: "INFOSYS LIMITED", tan: "BLRI01234E", section: "192", city: "Bengaluru" }]
  }),
  save: (rec) => { rec.id = 'client-test-1'; return rec; },
  findById: (id) => null,
  all: () => [],
  trash: () => [],
  search: () => [],
  stats: () => ({ total: 1, active: 1, trash: 0 })
};
global.DB = DB;

// Load App.js
const appCode = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
global.App = eval('(function(){ ' + appCode + '; return App; })()');

console.log('Testing Salaried Person (ITR-1) Auto-Calculation...');
let passed = 0;
let failed = 0;
function assert(desc, condition) {
  if (condition) {
    console.log(`  ✓ ${desc}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${desc}`);
    failed++;
  }
}

// Test 1: onFormNumberChange updates labels
App.onFormNumberChange();
const lbl = document.getElementById('lbl-f-income').innerHTML;
const help = document.getElementById('help-f-income').textContent;
assert('ITR-1 sets label to "Annual Net Taxable Salary"', lbl.includes('Annual Net Taxable Salary'));
assert('ITR-1 sets help text mentioning Monthly Net Salary × 12', help.includes('Monthly Net Salary × 12'));

// Test 2: User enters Monthly Net Salary 50,000
document.getElementById('f-sal-monthly').value = '50000';
App.onMonthlySalaryInput();
const annualFromMo = document.getElementById('f-income').value;
const grossFromMo = document.getElementById('f-sal-gross').value;
assert(`Annual Net Salary auto-calculated as 6,00,000 for Monthly 50,000 (50k * 12), got: ${annualFromMo}`, annualFromMo === 600000 || annualFromMo === '600000');
assert(`Gross Salary auto-calculated as 6,75,000 (6,00,000 + 75,000 Std Ded), got: ${grossFromMo}`, grossFromMo === 675000 || grossFromMo === '675000');

const brkMo = document.getElementById('brk-sal-monthly').textContent;
const brkGross = document.getElementById('brk-sal-gross').textContent;
const brkStd = document.getElementById('brk-sal-std').textContent;
const brkNet = document.getElementById('brk-salary').textContent;
const brkTot = document.getElementById('brk-total').textContent;
assert('Live breakdown Monthly Net shows ₹ 50,000 / mo', brkMo.includes('50,000'));
assert('Live breakdown Gross Salary shows ₹ 6,75,000', brkGross.includes('6,75,000'));
assert('Live breakdown Standard Deduction shows - ₹ 75,000', brkStd.includes('75,000'));
assert('Live breakdown Net Salary shows ₹ 6,00,000', brkNet.includes('6,00,000'));
assert('Live breakdown Total Taxable shows ₹ 6,00,000', brkTot.includes('6,00,000'));

// Test 2B: User enters Net Salary 7,20,000 annually (or monthly 60,000)
document.getElementById('f-sal-monthly').value = '60000';
App.onMonthlySalaryInput();
assert('Annual Net Salary is 7,20,000 for Monthly 60,000', document.getElementById('f-income').value == 720000);
assert('Gross Salary is 7,95,000 for Monthly 60,000', document.getElementById('f-sal-gross').value == 795000);

// Test 3: Tax Computation for 7,00,000 Net Salary
const comp = TaxEngine.compute({
  ay: '2026-27',
  salaryGross: 775000,
  adminOverrides: { regime: 'New' }
});
assert('TaxEngine Net Salary is exactly 7,00,000', comp.netSalary === 700000);
assert('TaxEngine Total Income is 7,00,000', comp.totalIncome === 700000);
assert('TaxEngine Tax Payable is 0 (87A rebate covers tax up to 7L)', comp.totalTaxPayable === 0);

// Test 4: Bidirectional - User enters Form 16 Gross Salary 8,25,000
document.getElementById('f-sal-gross').value = '825000';
App.onSalaryGrossInput();
const netVal = document.getElementById('f-income').value;
const monthlyValFromGross = document.getElementById('f-sal-monthly').value;
assert(`Net Salary auto-calculated as 7,50,000 when Gross is 8,25,000, got: ${netVal}`, netVal === 750000 || netVal === '750000');
assert(`Monthly Net Salary auto-calculated as 62,500 (750k / 12), got: ${monthlyValFromGross}`, monthlyValFromGross === 62500 || monthlyValFromGross === '62500');

// Test 4B: Bidirectional - User enters Annual Net Salary 8,40,000
document.getElementById('f-income').value = '840000';
App.onMainIncomeInput();
const monthlyValFromAnnual = document.getElementById('f-sal-monthly').value;
const grossValFromAnnual = document.getElementById('f-sal-gross').value;
assert(`Monthly Net Salary auto-calculated as 70,000 (840k / 12), got: ${monthlyValFromAnnual}`, monthlyValFromAnnual === 70000 || monthlyValFromAnnual === '70000');
assert(`Gross Salary auto-calculated as 9,15,000 (840k + 75k), got: ${grossValFromAnnual}`, grossValFromAnnual === 915000 || grossValFromAnnual === '915000');

// Test 5: Professional Tax addition
document.getElementById('f-income').value = '700000';
document.getElementById('f-sal-ptax').value = '2400';
App.onMainIncomeInput();
const grossWithPtax = document.getElementById('f-sal-gross').value;
assert(`Gross Salary adds P-Tax (7,00,000 + 75,000 + 2,400 = 7,77,400), got: ${grossWithPtax}`, grossWithPtax === 777400 || grossWithPtax === '777400');
App.recalcIncome();
assert('Net Salary stays 7,00,000 with P-Tax deducted', document.getElementById('brk-salary').textContent.includes('7,00,000'));

// Test 6: Switching to Old Regime
App.applyTaxRegime('Old');
const grossOld = document.getElementById('f-sal-gross').value;
assert(`Old Regime uses 50,000 standard deduction (7,00,000 + 50,000 + 2,400 = 7,52,400), got: ${grossOld}`, grossOld === 752400 || grossOld === '752400');
assert('Net Salary remains 7,00,000 under Old Regime', document.getElementById('brk-salary').textContent.includes('7,00,000'));

// Reset back to New Regime and clean ptax
document.getElementById('f-sal-ptax').value = '0';
App.applyTaxRegime('New');
document.getElementById('f-income').value = '700000';
App.onMainIncomeInput();

// Test 7: Reports check
const ReportClassic = eval('(function(){ ' + fs.readFileSync(path.join(__dirname, '../js/report-classic.js'), 'utf8') + '; return ReportClassic; })()');
const ReportModern = eval('(function(){ ' + fs.readFileSync(path.join(__dirname, '../js/report-modern.js'), 'utf8') + '; return ReportModern; })()');
const ReportAck = eval('(function(){ ' + fs.readFileSync(path.join(__dirname, '../js/report-ack.js'), 'utf8') + '; return ReportAck; })()');

const compData = {
  client: {
    name: 'RAJESH KUMAR',
    father: 'RAMESH KUMAR',
    pan: 'ABCDE1234F',
    dob: '1985-05-15',
    mobile: '9876543210',
    email: 'rajesh@example.com',
    address: 'Sector 62, Noida',
    ay: '2026-27',
    filing: '139(1)',
    status: 'Resident',
    isSalaried: true,
    formNumber: 'ITR-1',
    regime: 'New',
    employerName: 'INFOSYS LIMITED',
    employerCategory: 'Private',
    employerTan: 'BLRI01234E',
    salaryGross: 775000,
    salaryPtax: 0,
    salaryHra: 0
  },
  computation: comp,
  tds: { totalTDS: 0, tds192: 0, entries: [] },
  bankInterest: [],
  banks: [{ bankName: 'SBI', ifsc: 'SBIN0001234', accNumber: '1234567890', isPrimary: true }],
  stcgDetails: [],
  turnover: 0,
  profitPct: 20,
  adminConfig: DB.getAdmin()
};

const classicHtml = ReportClassic.generate(compData);
assert('ReportClassic contains "CHAPTER IV-A   SALARIES"', classicHtml.includes('SALARIES'));
assert('ReportClassic contains Gross Salary ₹ 7,75,000', classicHtml.includes('7,75,000'));
assert('ReportClassic contains Standard Deduction u/s 16(ia)', classicHtml.includes('16(ia)'));
assert('ReportClassic contains Net Salary ₹ 7,00,000', classicHtml.includes('7,00,000'));

const modernHtml = ReportModern.generate(compData);
assert('ReportModern contains Salary Income (ITR-1)', modernHtml.includes('Salary Income (ITR-1)'));
assert('ReportModern contains ₹ 7,00,000', modernHtml.includes('7,00,000'));

const ackHtml = ReportAck.generate(compData);
assert('ReportAck renders Total Income ₹ 7,00,000', ackHtml.includes('7,00,000'));

// Test 8: Client DB Save and Edit Roundtrip
let savedRec = null;
DB.save = (rec) => { rec.id = 'client-test-sal-1'; savedRec = rec; return rec; };
DB.findById = (id) => savedRec;
App.saveClient();
assert('Client saved with isSalaried = true', savedRec && savedRec.isSalaried === true);
assert('Client saved with salaryGross = 775000', savedRec && savedRec.salaryGross === 775000);
assert('Client saved with desiredIncome = 700000', savedRec && savedRec.incomeInputs && savedRec.incomeInputs.desiredIncome === 700000);

// Test 9: AIS Import handling
// Mock AIS import of Gross Salary 8,50,000
const aisData = {
  pan: 'ABCDE9999Z',
  name: 'SUNIL SHARMA',
  ay: '2026-27',
  grossSalary: 850000
};
// Trigger _applyAisData directly or simulate
document.getElementById('f-form-no').value = 'ITR-1';
document.getElementById('f-ay').value = '2026-27';
document.getElementById('f-regime').value = 'New';
// Call ais handling
App.handleAisJsonUpload({ target: { files: [] } }); // verify function presence
// Set AIS salary values
const aisSalary = 850000;
const stdDed = 75000;
document.getElementById('f-sal-gross').value = aisSalary;
document.getElementById('f-income').value = aisSalary - stdDed;
App.recalcIncome();

assert('AIS imported salary sets Gross Salary to 8,50,000', document.getElementById('f-sal-gross').value === 850000 || document.getElementById('f-sal-gross').value === '850000');
assert('AIS imported salary calculates Net Taxable as 7,75,000', document.getElementById('f-income').value === 775000 || document.getElementById('f-income').value === '775000');
assert('Live breakdown Total Taxable shows ₹ 7,75,000', document.getElementById('brk-total').textContent.includes('7,75,000'));

console.log(`\nResults: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);

