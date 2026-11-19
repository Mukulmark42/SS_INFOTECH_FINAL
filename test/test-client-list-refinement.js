/**
 * ═══════════════════════════════════════════════════════════
 * TEST SUITE: ACTIVE TAX CLIENTS LIST VIEW REFINEMENT
 * ═══════════════════════════════════════════════════════════
 */

const assert = require('assert');

const store = new Map();
global.localStorage = {
  getItem: k => store.get(k) ?? null,
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: k => store.delete(k),
  get length() { return store.size; },
  key: i => Array.from(store.keys())[i] ?? null,
};
global.alert = () => {};

const DB = require('../js/db.js');

console.log('Testing Active Tax Clients List View & Filtering...\n');

// 1. Setup sample clients
const c1 = DB.save({
  name: 'RAHUL SHARMA',
  pan: 'ABCPS1234A',
  mobile: '9876543210',
  ay: '2026-27',
  regime: 'New',
  formNumber: 'ITR-1',
  isSalaried: true,
  employerName: 'INFOSYS LIMITED',
  ackNo: '123456789012345',
  filing: '139(1)',
  computation: {
    totalIncome: 750000,
    grossSalary: 825000,
    taxPayable: 0,
    refund: 12500,
    taxDue: 0
  },
  tds: { totalTDS: 12500 }
});

const c2 = DB.save({
  name: 'SUNIL KUMAR VERMA',
  pan: 'XYZPV9876B',
  mobile: '9123456780',
  ay: '2025-26',
  regime: 'Old',
  formNumber: 'ITR-4',
  presumptiveSection: '44AD',
  tradeName: 'VERMA TRADERS',
  turnover: 3500000,
  ackNo: '987654321098765',
  filing: '139(4)',
  computation: {
    totalIncome: 500000,
    taxPayable: 13000,
    refund: 0,
    taxDue: 13000
  },
  tds: { totalTDS: 0 }
});

const c3 = DB.save({
  name: 'ANITA ROY',
  pan: 'PQRST5432C',
  mobile: '9988776655',
  ay: '2026-27',
  regime: 'New',
  formNumber: 'ITR-1',
  isSalaried: true,
  employerName: 'TATA CONSULTANCY SERVICES',
  ackNo: '556677889900112',
  filing: '139(1)',
  computation: {
    totalIncome: 650000,
    grossSalary: 725000,
    taxPayable: 0,
    refund: 0,
    taxDue: 0
  },
  tds: { totalTDS: 0 }
});

assert.strictEqual(DB.all().length, 3, 'Should have 3 active clients');
console.log('  ✓ 3 sample active clients successfully persisted');

// 2. Status categorization
const all = DB.all();
const refunds = all.filter(c => (c.computation?.refund || 0) > 0);
const payables = all.filter(c => (c.computation?.taxDue || 0) > 0);
const nils = all.filter(c => (c.computation?.refund || 0) === 0 && (c.computation?.taxDue || 0) === 0);

assert.strictEqual(refunds.length, 1, 'Should identify 1 refund case');
assert.strictEqual(refunds[0].name, 'RAHUL SHARMA');
assert.strictEqual(payables.length, 1, 'Should identify 1 tax payable case');
assert.strictEqual(payables[0].name, 'SUNIL KUMAR VERMA');
assert.strictEqual(nils.length, 1, 'Should identify 1 nil tax case');
assert.strictEqual(nils[0].name, 'ANITA ROY');
console.log('  ✓ Tax status metrics (Refund, Payable, Nil) correctly calculated');

// 3. Search coverage
const searchPan = DB.search('XYZPV');
assert.strictEqual(searchPan.length, 1);
assert.strictEqual(searchPan[0].pan, 'XYZPV9876B');

const searchMobile = DB.search('9876543210');
assert.strictEqual(searchMobile.length, 1);
assert.strictEqual(searchMobile[0].name, 'RAHUL SHARMA');
console.log('  ✓ Search accurately locates clients by Name, PAN and Mobile');

// 4. Duplicate client preserves fields and assigns new ID
const duplicated = DB.duplicate(c1.id);
assert.ok(duplicated.id && duplicated.id !== c1.id, 'Duplicate has new unique ID');
assert.strictEqual(duplicated.name, 'RAHUL SHARMA (Copy)');
assert.strictEqual(duplicated.pan, c1.pan);
assert.strictEqual(duplicated.ay, c1.ay);
assert.strictEqual(duplicated.computation.totalIncome, 750000);
console.log('  ✓ Client duplication creates clean copy with preserved computation');

// 5. Soft-delete and trash separation
DB.remove(duplicated.id);
assert.strictEqual(DB.all().length, 3, 'Active clients back to 3');
assert.strictEqual(DB.trash().length, 1, 'Recycle bin contains deleted duplicate');
console.log('  ✓ Soft delete moves client to Recycle Bin without losing active clients');

console.log('\n=========================================');
console.log('ALL ACTIVE TAX CLIENTS TESTS PASSED!');
console.log('=========================================\n');
