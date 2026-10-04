/**
 * ═══════════════════════════════════════════════════════════
 * DB LAYER – Regression Tests
 * Covers:
 *  • Recycle Bin (soft-delete) preservation across mutations
 *  • CRUD, search, duplicate, CSV export
 *  • Storage usage telemetry
 * ═══════════════════════════════════════════════════════════
 */

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

let passed = 0, failed = 0;
function check(name, actual, expected) {
  if (actual === expected) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.log(`  ✗ ${name} — expected ${expected}, got ${actual}`); }
}

// Reset storage between logical groups
function reset() { store.clear(); }

console.log('── CRUD lifecycle ──');
reset();
const c1 = DB.save({ name: 'ALPHA', pan: 'AAAAA0000A', mobile: '1111111111', ay: '2026-27' });
const c2 = DB.save({ name: 'BETA', pan: 'BBBBB0000B', mobile: '2222222222', ay: '2026-27' });
check('Two active clients after save', DB.all().length, 2);
check('Save assigns unique IDs', c1.id !== c2.id, true);

const updated = DB.save({ ...c1, name: 'ALPHA V2' });
check('Update keeps same ID', updated.id, c1.id);
check('Update persists new name', DB.findById(c1.id).name, 'ALPHA V2');
check('Update bumps updatedAt', DB.findById(c1.id).updatedAt >= c1.updatedAt, true);

console.log('── Search ──');
check('Search by name', DB.search('alpha').length, 1);
check('Search by PAN (case-insensitive)', DB.search('aaaaa0000a').length, 1);
check('Search by mobile', DB.search('2222222222').length, 1);
check('Empty search returns all', DB.search('').length, 2);

console.log('── Recycle Bin preservation (duplicate bug regression) ──');
DB.remove(c1.id);
check('Soft-delete moves client to Recycle Bin', DB.trash().length, 1);
check('Soft-deleted client hidden from active list', DB.all().length, 1);

// REGRESSION: duplicate() used to persist all() (active only),
// permanently erasing soft-deleted records.
DB.duplicate(c2.id);
check('Recycle Bin survives duplicate()', DB.trash().length, 1);
check('Active count grows after duplicate', DB.all().length, 2);
check('Duplicate gets fresh ID', DB.all().some(c => c.id !== c1.id && c.id !== c2.id), true);
check('Duplicate name suffixed', DB.all().some(c => c.name === 'BETA (Copy)'), true);

DB.restore(c1.id);
check('Restore returns client to active', DB.all().length, 3);
check('Restore empties Recycle Bin', DB.trash().length, 0);

console.log('── Bulk operations ──');
reset();
const ids = [];
for (let i = 0; i < 5; i++) ids.push(DB.save({ name: 'C' + i, pan: 'C' + i + '0000X', mobile: '99999999' + i, ay: '2026-27' }).id);
check('Bulk remove soft-deletes', DB.bulkRemove(ids.slice(0, 3)), 3);
check('Recycle Bin holds 3', DB.trash().length, 3);
check('Bulk restore recovers', DB.bulkRestore(ids.slice(0, 2)), 2);
check('Recycle Bin down to 1', DB.trash().length, 1);
check('Permanent remove deletes outright', DB.permanentRemove(ids[4]), undefined);
check('Active count after permanent remove', DB.all().length, 3);
DB.emptyTrash();
check('emptyTrash clears Recycle Bin', DB.trash().length, 0);

console.log('── CSV export ──');
reset();
DB.save({ name: 'CSV TEST', pan: 'CSVTS0000T', father: 'FATHER T', mobile: '1234567890', ay: '2026-27', computation: { totalIncome: 500000, taxDue: 12500, refund: 0 } });
const csv = DB.exportCSV();
check('CSV has header row', csv.split('\r\n')[0].includes('PAN'), true);
check('CSV contains client PAN', csv.includes('CSVTS0000T'), true);
check('CSV contains total income', csv.includes('500000'), true);

console.log('── Storage telemetry ──');
const usage = DB.getStorageUsage();
check('Usage reports positive bytes', usage.totalBytes > 0, true);
check('Usage reports KB', usage.totalKB > 0, true);
check('Usage reports client count', usage.clientCount, 1);

console.log('── Stats ──');
const stats = DB.stats();
check('Stats total matches', stats.total, 1);
check('Stats byAY includes 2026-27', stats.byAY['2026-27'], 1);

console.log(`\nResults: ${passed} passed, ${failed} failed.`);
process.exit(failed ? 1 : 0);
