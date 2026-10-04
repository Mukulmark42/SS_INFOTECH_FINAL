// Test script for ITR-1 (Sahaj) Salaried Person Return verification
const fs = require('fs');
const path = require('path');

// Mock browser globals needed by engines
global.window = {};
global.document = {
  getElementById: () => null,
  querySelectorAll: () => [],
};

const vm = require('vm');

// Load dependencies
function loadScript(filePath) {
  const code = fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8');
  vm.runInThisContext(code);
}

loadScript('js/tax-engine.js');
loadScript('js/tds-engine.js');
loadScript('js/interest-engine.js');
loadScript('js/report-classic.js');
loadScript('js/report-modern.js');
loadScript('js/report-ack.js');

console.log('--- TEST 1: TaxEngine for Salaried AY 2026-27 (New Regime) ---');
const taxComp = TaxEngine.compute({
  ay: '2026-27',
  businessIncome: 0,
  savingsInterest: 10000,
  salaryGross: 1500000,
  salaryPtax: 2400,
  salaryHra: 0,
  stcg: 0,
  ltcg: 0,
  pl: 0,
  deduction80C: 0,
  deduction80D: 0,
  deduction80CCD1B: 0,
  deduction80G: 0,
  tds: 0,
  presumptiveSection: 'none',
  adminOverrides: { regime: 'New' }
});

console.log('Gross Salary:', taxComp.salaryGross);
console.log('Standard Deduction:', taxComp.salaryStdDeduction);
console.log('Net Salary:', taxComp.netSalary);
console.log('Gross Total Income:', taxComp.grossTotalIncome);
console.log('Total Income:', taxComp.totalIncome);
console.log('Tax Payable:', taxComp.totalTaxPayable);

if (taxComp.salaryGross !== 1500000) throw new Error('Salary Gross mismatch');
if (taxComp.salaryStdDeduction !== 75000) throw new Error('Standard deduction for AY 26-27 New Regime should be 75,000');
if (taxComp.netSalary !== 1500000 - 75000 - 2400) throw new Error('Net salary mismatch');
if (taxComp.businessIncome !== 0) throw new Error('Business income should be 0');
if (taxComp.totalTaxPayable <= 0) throw new Error('Tax payable for 15L should be positive');
console.log(' TaxEngine Salaried: PASSED\n');

console.log('--- TEST 2: TDSEngine Section 192 Generation ---');
const tdsData = TDSEngine.generate(0, '', {}, [], '2026-27', 'none', {
  isSalaried: true,
  salaryGross: 1500000,
  employerName: 'TATA CONSULTANCY SERVICES LTD',
  employerTan: 'MUMT01234A',
  taxPayable: taxComp.totalTaxPayable
});

console.log('TDS 192 Amount:', tdsData.tds192);
console.log('Total TDS:', tdsData.totalTDS);
console.log('TDS Entries count:', tdsData.entries.length);
console.log('TDS Entry 0:', tdsData.entries[0]);

if (tdsData.tds192 !== taxComp.totalTaxPayable) throw new Error('TDS 192 does not match tax payable');
if (tdsData.entries[0].section !== '192') throw new Error('TDS section should be 192');
if (tdsData.entries[0].deductorName !== 'TATA CONSULTANCY SERVICES LTD') throw new Error('Employer name mismatch in TDS');
if (tdsData.entries[0].deductorTAN !== 'MUMT01234A') throw new Error('Employer TAN mismatch in TDS');
console.log(' TDSEngine Section 192: PASSED\n');

console.log('--- TEST 3: ReportClassic for ITR-1 Salaried ---');
const testClientData = {
  client: {
    name: 'RAJESH KUMAR SHARMA',
    pan: 'ABCPS1234F',
    dob: '1988-06-15',
    mobile: '9876543210',
    email: 'rajesh@example.com',
    address: 'FLAT 402, GALAXY APARTMENTS, SECTOR 62, NOIDA, UP',
    ay: '2026-27',
    ward: 'WARD 2(1), NOIDA',
    filing: '139(1)',
    status: 'Resident',
    isSalaried: true,
    employerName: 'TATA CONSULTANCY SERVICES LTD',
    employerCategory: 'Private',
    employerTan: 'MUMT01234A',
    formNumber: 'ITR-1',
    regime: 'New',
    salaryGross: 1500000,
    salaryPtax: 2400,
  },
  computation: {
    ...taxComp,
    tdsCredit: tdsData.totalTDS,
    taxDue: Math.max(0, taxComp.totalTaxPayable - tdsData.totalTDS),
    refund: Math.max(0, tdsData.totalTDS - taxComp.totalTaxPayable)
  },
  tds: tdsData,
  bankInterest: [{ bank: 'STATE BANK OF INDIA', aCode: 'SB', aNum: '30001234567', ifsc: 'SBIN0001234', interest: 10000 }],
  banks: [{ name: 'STATE BANK OF INDIA', accountNo: '30001234567', ifsc: 'SBIN0001234', type: 'SB', primary: true }],
  stcgDetails: [],
  turnover: 0,
  profitPct: 0,
  compNo: 'CMP-2026-000001',
  adminConfig: {},
  balanceSheet: {}
};

const classicHtml = ReportClassic.generate(testClientData);
console.log('Classic Report HTML generated. Length:', classicHtml.length);

if (!classicHtml.includes('TATA CONSULTANCY SERVICES LTD')) throw new Error('Employer name missing in Classic Report');
if (!classicHtml.includes('Employer / Sector')) throw new Error('Assessee header should show Employer / Sector');
if (classicHtml.includes('Profits & Gains of Business')) throw new Error('44AD Business Income section should NOT appear for salaried person');
if (classicHtml.includes('BALANCE SHEET AS AT 31ST MARCH')) throw new Error('Commercial Balance Sheet should NOT appear for pure salaried return');
if (classicHtml.includes('ANNEXURE A: TURNOVER STATEMENT')) throw new Error('Annexure A Turnover Statement should NOT appear for pure salaried return');
if (!classicHtml.includes('192') || !classicHtml.includes('Salary / Employment (Form 16)')) throw new Error('Annexure E should have Section 192 row');
console.log(' ReportClassic ITR-1: PASSED\n');

console.log('--- TEST 4: ReportModern for ITR-1 Salaried ---');
const modernHtml = ReportModern.generate(testClientData);
console.log('Modern Report HTML generated. Length:', modernHtml.length);

if (!modernHtml.includes('Form ITR-1 (Sahaj)')) throw new Error('Form ITR-1 (Sahaj) chip missing in Modern Report');
if (!modernHtml.includes('Gross Salary (Form 16)')) throw new Error('Gross Salary KPI card missing in Modern Report');
if (modernHtml.includes('Gross Turnover (44AD)')) throw new Error('44AD Turnover KPI should NOT appear for salaried return');
if (modernHtml.includes('ANNEXURE B: BALANCE SHEET')) throw new Error('Balance sheet annexure should NOT appear in Modern Report for pure salaried');
console.log(' ReportModern ITR-1: PASSED\n');

console.log('--- TEST 5: ReportAck (ITR-V) for ITR-1 Salaried ---');
const ackHtml = ReportAck.generate(testClientData);
console.log('ITR-V Ack HTML generated. Length:', ackHtml.length);

if (!ackHtml.includes('>ITR-1<')) throw new Error('Form Number ITR-1 missing in ITR-V Ack');
if (!ackHtml.includes('ABCPS1234F01')) throw new Error('Barcode text should encode Form Code 01 for ITR-1');
console.log(' ReportAck ITR-1: PASSED\n');

console.log('--- TEST 6: Regression Test: ITR-4 Business (44AD) ---');
const bizTaxComp = TaxEngine.compute({
  ay: '2026-27',
  businessIncome: 500000,
  savingsInterest: 10000,
  salaryGross: 0,
  salaryPtax: 0,
  salaryHra: 0,
  stcg: 0,
  ltcg: 0,
  pl: 0,
  deduction80C: 0,
  deduction80D: 0,
  deduction80CCD1B: 0,
  deduction80G: 0,
  tds: 0,
  presumptiveSection: '44AD',
  adminOverrides: { regime: 'New' }
});

const bizTdsData = TDSEngine.generate(2500000, 'RETAIL TRADE', {
  rate194H: 5,
  rate194C: 1
}, [{ name: 'STATE BANK OF INDIA', accountNo: '30001234567', ifsc: 'SBIN0001234', type: 'CAA', primary: true }], '2026-27', '44AD', {
  isSalaried: false
});

const bizClientData = {
  client: {
    name: 'SURESH TRADING CO',
    pan: 'AABCS1234G',
    dob: '1980-01-01',
    ay: '2026-27',
    nature: 'RETAIL TRADE',
    bcode: '0901',
    bname: 'SURESH TRADERS',
    presumptiveSection: '44AD',
    formNumber: 'ITR-4',
    regime: 'New'
  },
  computation: bizTaxComp,
  tds: bizTdsData,
  bankInterest: [{ bank: 'STATE BANK OF INDIA', aCode: 'CAA', aNum: '30001234567', ifsc: 'SBIN0001234', interest: 10000 }],
  banks: [{ name: 'STATE BANK OF INDIA', accountNo: '30001234567', ifsc: 'SBIN0001234', type: 'CAA', primary: true }],
  stcgDetails: [],
  turnover: 2500000,
  profitPct: 20,
  compNo: 'CMP-2026-000002',
  adminConfig: {},
  balanceSheet: {
    assets: { cash: 50000, bank: 150000, stock: 200000, debtors: 100000, fixed: 0, total: 500000 },
    liabilities: { capital: 300000, loan: 100000, creditors: 100000, total: 500000 }
  }
};

const bizClassicHtml = ReportClassic.generate(bizClientData);
if (!bizClassicHtml.includes('PROFITS &amp; GAINS OF BUSINESS')) throw new Error('44AD section missing in business return');
if (!bizClassicHtml.includes('BALANCE SHEET (As on 31st March)')) throw new Error('Balance sheet missing in business return');
if (!bizClassicHtml.includes('ANNEXURE A &nbsp; STATEMENT UNDER SECTION')) throw new Error('Turnover statement missing in business return');

const bizAckHtml = ReportAck.generate(bizClientData);
if (!bizAckHtml.includes('>ITR-4<')) throw new Error('Form Number ITR-4 missing in business ITR-V');
if (!bizAckHtml.includes('AABCS1234G04')) throw new Error('Barcode text should encode Form Code 04 for ITR-4');

console.log(' ITR-4 Presumptive Regression: PASSED\n');

console.log('--- TEST 7: DB Client Save & Round-Trip Field Verification ---');
const storage = {};
global.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};

loadScript('js/db.js');

const savedClient = DB.save({
  compNo: 'CMP-2026-000003',
  ...testClientData.client,
  presumptiveSection: 'none',
  regime: 'New',
  banks: testClientData.banks,
  computation: testClientData.computation,
  tds: testClientData.tds,
  turnover: 0,
  profitPct: 0,
  stcgDetails: [],
  bankInterest: testClientData.bankInterest,
  incomeInputs: {
    desiredIncome: 1500000,
    savings: 10000,
    salaryGross: 1500000,
    salaryPtax: 2400,
    salaryHra: 0,
    employerName: 'TATA CONSULTANCY SERVICES LTD',
    employerCategory: 'Private',
    employerTan: 'MUMT01234A',
    isSalaried: true,
    stcg: 0,
    pl: 0,
    balanceSheet: null
  }
});

console.log('Saved Client ID:', savedClient.id);
const retrieved = DB.findById(savedClient.id);
if (!retrieved) throw new Error('Client record not found in DB');
if (retrieved.formNumber !== 'ITR-1') throw new Error('Form number mismatch');
if (retrieved.employerName !== 'TATA CONSULTANCY SERVICES LTD') throw new Error('Employer name mismatch');
if (retrieved.employerCategory !== 'Private') throw new Error('Employer category mismatch');
if (retrieved.employerTan !== 'MUMT01234A') throw new Error('Employer TAN mismatch');
if (retrieved.salaryGross !== 1500000) throw new Error('Gross salary mismatch');
if (retrieved.incomeInputs.employerName !== 'TATA CONSULTANCY SERVICES LTD') throw new Error('incomeInputs employerName mismatch');
if (retrieved.incomeInputs.salaryGross !== 1500000) throw new Error('incomeInputs salaryGross mismatch');

console.log(' DB Round-Trip Field Verification: PASSED\n');

console.log('--- TEST 8: Explicit Salary TDS Scenarios (Zero TDS, Partial, Refund) ---');

// Case 8A: Zero TDS specified by user
const zeroTdsData = TDSEngine.generate(0, '', {}, [], '2026-27', 'none', {
  isSalaried: true,
  salaryGross: 1500000,
  employerName: 'TATA CONSULTANCY SERVICES LTD',
  employerTan: 'MUMT01234A',
  salaryTds: 0,
  taxPayable: 98690
});
if (zeroTdsData.tds192 !== 0) throw new Error(`Zero TDS failed: expected 0, got ${zeroTdsData.tds192}`);
if (zeroTdsData.totalTDS !== 0) throw new Error(`Zero totalTDS failed: expected 0, got ${zeroTdsData.totalTDS}`);
if (zeroTdsData.entries[0].tdsClaimed !== 0) throw new Error('TDS claimed in entry should be 0');
console.log(' Case 8A (Zero TDS): PASSED');

// Case 8B: Partial TDS entered (e.g. 50,000 against actual tax liability -> balance payable)
const baseComp = TaxEngine.compute({
  ay: '2026-27',
  businessIncome: 0,
  savingsInterest: 0,
  salaryGross: 1500000,
  salaryPtax: 2400,
  salaryHra: 0,
  stcg: 0,
  ltcg: 0,
  pl: 0,
  deduction80C: 0,
  deduction80D: 0,
  deduction80CCD1B: 0,
  deduction80G: 0,
  tds: 0,
  presumptiveSection: 'none',
  adminOverrides: { regime: 'New' }
});

const partialTdsData = TDSEngine.generate(0, '', {}, [], '2026-27', 'none', {
  isSalaried: true,
  salaryGross: 1500000,
  employerName: 'TATA CONSULTANCY SERVICES LTD',
  employerTan: 'MUMT01234A',
  salaryTds: 50000,
  taxPayable: baseComp.totalTaxPayable
});
if (partialTdsData.tds192 !== 50000) throw new Error(`Partial TDS failed: expected 50000, got ${partialTdsData.tds192}`);
const partialComp = TaxEngine.compute({
  ay: '2026-27',
  businessIncome: 0,
  savingsInterest: 0,
  salaryGross: 1500000,
  salaryPtax: 2400,
  salaryHra: 0,
  stcg: 0,
  ltcg: 0,
  pl: 0,
  deduction80C: 0,
  deduction80D: 0,
  deduction80CCD1B: 0,
  deduction80G: 0,
  tds: partialTdsData.totalTDS,
  presumptiveSection: 'none',
  adminOverrides: { regime: 'New' }
});
if (partialComp.taxDue !== baseComp.totalTaxPayable - 50000) throw new Error(`Tax due mismatch: expected ${baseComp.totalTaxPayable - 50000}, got ${partialComp.taxDue}`);
if (partialComp.refund !== 0) throw new Error('Refund should be 0 for partial TDS');
console.log(' Case 8B (Partial TDS & Balance Tax Due): PASSED');

// Case 8C: Excess TDS entered (e.g. 1,20,000 against tax liability -> refund)
const excessTdsData = TDSEngine.generate(0, '', {}, [], '2026-27', 'none', {
  isSalaried: true,
  salaryGross: 1500000,
  employerName: 'TATA CONSULTANCY SERVICES LTD',
  employerTan: 'MUMT01234A',
  salaryTds: 120000,
  taxPayable: baseComp.totalTaxPayable
});
if (excessTdsData.tds192 !== 120000) throw new Error(`Excess TDS failed: expected 120000, got ${excessTdsData.tds192}`);
const refundComp = TaxEngine.compute({
  ay: '2026-27',
  businessIncome: 0,
  savingsInterest: 0,
  salaryGross: 1500000,
  salaryPtax: 2400,
  salaryHra: 0,
  stcg: 0,
  ltcg: 0,
  pl: 0,
  deduction80C: 0,
  deduction80D: 0,
  deduction80CCD1B: 0,
  deduction80G: 0,
  tds: excessTdsData.totalTDS,
  presumptiveSection: 'none',
  adminOverrides: { regime: 'New' }
});
if (refundComp.refund !== 120000 - baseComp.totalTaxPayable) throw new Error(`Refund mismatch: expected ${120000 - baseComp.totalTaxPayable}, got ${refundComp.refund}`);
if (refundComp.taxDue !== 0) throw new Error('Tax due should be 0 for refund case');
console.log(' Case 8C (Excess TDS & Refund Due): PASSED\n');

console.log('--- TEST 9: Salaried with Nil/Blank Savings (No Phantom Income) ---');
const pureSalComp = TaxEngine.compute({
  ay: '2026-27',
  businessIncome: 0,
  savingsInterest: 0,
  salaryGross: 750000,
  salaryPtax: 0,
  salaryHra: 0,
  stcg: 0,
  ltcg: 0,
  pl: 0,
  deduction80C: 0,
  deduction80D: 0,
  deduction80CCD1B: 0,
  deduction80G: 0,
  tds: 0,
  presumptiveSection: 'none',
  adminOverrides: { regime: 'New' }
});
// Gross 7.5L - Std Ded 75k = Net 6.75L
if (pureSalComp.netSalary !== 675000) throw new Error(`Net salary mismatch: expected 675000, got ${pureSalComp.netSalary}`);
if (pureSalComp.grossTotalIncome !== 675000) throw new Error(`Gross total income mismatch: expected 675000, got ${pureSalComp.grossTotalIncome}`);
if (pureSalComp.totalTaxPayable !== 0) throw new Error(`Tax on 6.75L New Regime should be 0 (u/s 87A rebate): got ${pureSalComp.totalTaxPayable}`);
console.log(' Pure Salaried Income Accuracy: PASSED\n');

console.log('=========================================');
console.log('ALL 9 TESTS PASSED FLAWLESSLY!');
console.log('=========================================');
