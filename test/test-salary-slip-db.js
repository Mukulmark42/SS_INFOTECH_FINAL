/**
 * ═══════════════════════════════════════════════════════════
 * TEST SUITE: SALARY SLIP DATABASE & CUSTOMER DISPLAY
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

console.log('Testing Salary Slip DB & Customer Directory...\n');

// 1. Save new slip record without ID
const r1 = DB.saveSlipRecord({
  empName: 'Mostafijur Rahaman',
  empCode: 'HUL001',
  companyId: 'comp-hullect',
  companyName: 'Hullect Services Private Limited',
  month: 'October',
  year: '2026',
  totalEarning: 65000,
  netPay: 58000,
  totalDeduction: 7000
});

assert.ok(r1.id, 'Record should have an assigned ID');
assert.strictEqual(DB.getSlipRecords().length, 1, 'Should have 1 slip record');
console.log('  ✓ saveSlipRecord assigns ID and saves new record');

// 2. Saving the same employee + company + month + year updates rather than duplicating
const r1_updated = DB.saveSlipRecord({
  empName: 'Mostafijur Rahaman',
  empCode: 'HUL001',
  companyId: 'comp-hullect',
  companyName: 'Hullect Services Private Limited',
  month: 'October',
  year: '2026',
  totalEarning: 70000,
  netPay: 63000,
  totalDeduction: 7000
});

assert.strictEqual(r1_updated.id, r1.id, 'Should update existing record keeping same ID');
assert.strictEqual(DB.getSlipRecords().length, 1, 'Record count should still be 1 (no duplicate)');
assert.strictEqual(DB.getSlipRecords()[0].netPay, 63000, 'Updated net pay should be 63000');
console.log('  ✓ saveSlipRecord deduplicates by (empName, company, month, year)');

// 3. Saving another month for same employee groups under same customer
const r2 = DB.saveSlipRecord({
  empName: 'Mostafijur Rahaman',
  empCode: 'HUL001',
  companyId: 'comp-hullect',
  companyName: 'Hullect Services Private Limited',
  month: 'November',
  year: '2026',
  totalEarning: 70000,
  netPay: 63000,
  totalDeduction: 7000
});

assert.strictEqual(DB.getSlipRecords().length, 2, 'Should now have 2 records');
const customers = DB.getSlipCustomers();
assert.strictEqual(customers.length, 1, 'Should have 1 customer profile');
assert.strictEqual(customers[0].empName, 'Mostafijur Rahaman', 'Customer name preserves casing');
assert.strictEqual(customers[0].totalSlips, 2, 'Customer should have 2 slips');
assert.strictEqual(customers[0].slips[0].month, 'November', 'November should sort before October');
assert.strictEqual(customers[0].slips[1].month, 'October', 'October should follow November');
console.log('  ✓ getSlipCustomers groups multiple month slips under one customer and sorts chronologically');

// 4. Multiple customers grouping
const r3 = DB.saveSlipRecord({
  empName: 'Anil Sharma',
  empCode: 'SSI005',
  companyId: 'comp-ss-infotech',
  companyName: 'SS INFOTECH SOLUTIONS',
  month: 'November',
  year: '2026',
  totalEarning: 50000,
  netPay: 46000,
  totalDeduction: 4000
});

const allCusts = DB.getSlipCustomers();
assert.strictEqual(allCusts.length, 2, 'Should have 2 customers in directory');
console.log('  ✓ Multiple customers cataloged name-wise');

// 5. Filtering customers
const filteredByComp = DB.getSlipCustomers('', 'comp-hullect');
assert.strictEqual(filteredByComp.length, 1, 'Filtered by comp-hullect should return 1 customer');
assert.strictEqual(filteredByComp[0].empName, 'Mostafijur Rahaman');

const searchByQuery = DB.getSlipCustomers('Anil', '');
assert.strictEqual(searchByQuery.length, 1, 'Search by "Anil" should return Anil Sharma');
assert.strictEqual(searchByQuery[0].empName, 'Anil Sharma');
console.log('  ✓ Customer filtering by company and search query works');

// 6. Delete customer profile
DB.deleteSlipCustomer(allCusts.find(c => c.empName === 'Anil Sharma').customerKey);
assert.strictEqual(DB.getSlipCustomers().length, 1, 'Deleting Anil leaves 1 customer');
assert.strictEqual(DB.getSlipRecords().length, 2, 'Mostafijur 2 records remain intact');
console.log('  ✓ deleteSlipCustomer deletes customer and their associated slips');

console.log('\n=========================================');
console.log('ALL SALARY SLIP DB TESTS PASSED!');
console.log('=========================================\n');
