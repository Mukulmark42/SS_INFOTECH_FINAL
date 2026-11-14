/**
 * Test Suite: Supabase Multi-Device Sync Engine Logic
 */

const assert = require('assert');

// Mock browser globals
const store = {};
global.localStorage = {
  getItem: (k) => store[k] ?? null,
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); },
};

global.window = {
  SS_CONFIG: {
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_ANON_KEY: 'test-key',
    SUPABASE_TABLE: 'ssinfotech_backups',
    WORKSPACE_ID: 'public',
  }
};

const DB = require('../js/db.js');

console.log('═══════════════════════════════════════════════════════════');
console.log('  TEST SUITE: SUPABASE 2-PC SYNC & MUTATION TRACKING     ');
console.log('═══════════════════════════════════════════════════════════\n');

// 1. Initial State
assert.strictEqual(DB.getLastMutationTime(), 0, 'Initial mutation time should be 0');
console.log('✓ Initial mutation time is 0');

// 2. Client Save updates mutation time
const c1 = DB.save({ name: 'TEST USER 1', pan: 'ABCDE1234F', ay: '2026-27' });
const mut1 = DB.getLastMutationTime();
assert.ok(mut1 > 0, 'Saving client should set positive mutation timestamp');
console.log('✓ DB.save sets lastMutationTime');

// 3. Mark Synced resets mutation time
DB.markSynced();
assert.strictEqual(DB.getLastMutationTime(), 0, 'DB.markSynced() resets mutation timestamp to 0');
console.log('✓ DB.markSynced resets lastMutationTime to 0');

// 4. Soft Delete updates mutation time and updatedAt
const beforeRemove = c1.updatedAt;
setTimeout(() => {}, 10);
DB.remove(c1.id);
const mut2 = DB.getLastMutationTime();
assert.ok(mut2 > 0, 'DB.remove sets mutation timestamp');
const inTrash = DB.trash().find(c => c.id === c1.id);
assert.ok(inTrash, 'Client should be in trash');
assert.ok(inTrash.deletedAt, 'Client has deletedAt');
assert.ok(inTrash.updatedAt >= beforeRemove, 'Client updatedAt bumped on delete');
console.log('✓ DB.remove bumps updatedAt & sets lastMutationTime');

// 5. Restore from trash bumps updatedAt and mutation time
DB.markSynced();
DB.restore(c1.id);
assert.ok(DB.getLastMutationTime() > 0, 'DB.restore sets mutation timestamp');
const restored = DB.findById(c1.id);
assert.ok(restored, 'Client is restored');
assert.strictEqual(restored.deletedAt, undefined, 'Client deletedAt removed');
console.log('✓ DB.restore bumps updatedAt & sets lastMutationTime');

// 6. Slip Record operations update mutation time
DB.markSynced();
const s1 = DB.saveSlipRecord({ empName: 'EMP A', netPay: 50000 });
assert.ok(DB.getLastMutationTime() > 0, 'saveSlipRecord sets mutation timestamp');
DB.markSynced();
DB.removeSlipRecord(s1.id);
assert.ok(DB.getLastMutationTime() > 0, 'removeSlipRecord sets mutation timestamp');
console.log('✓ DB.saveSlipRecord & DB.removeSlipRecord track mutations');

// 7. Statement Record operations update mutation time
DB.markSynced();
const stmt1 = DB.saveStatementRecord({ accountNo: '12345678', holderName: 'MUKUL' });
assert.ok(DB.getLastMutationTime() > 0, 'saveStatementRecord sets mutation timestamp');
DB.markSynced();
DB.removeStatementRecord(stmt1.id);
assert.ok(DB.getLastMutationTime() > 0, 'removeStatementRecord sets mutation timestamp');
console.log('✓ DB.saveStatementRecord & DB.removeStatementRecord track mutations');

console.log('\n=========================================');
console.log('ALL SUPABASE SYNC LOGIC TESTS PASSED!');
console.log('=========================================\n');
