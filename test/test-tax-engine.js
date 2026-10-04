/**
 * ═══════════════════════════════════════════════════════════
 * TAX ENGINE – Statutory Regression Tests
 * Covers:
 *  • Old Regime AY-wise capital gains rates (u/s 111A / 112A)
 *  • New Regime capital gains rates
 *  • Section 87A rebate + marginal relief
 *  • Section 288A / 288B rounding
 * ═══════════════════════════════════════════════════════════
 */

const TaxEngine = require('../js/tax-engine.js');

let passed = 0, failed = 0;
function check(name, actual, expected) {
  if (actual === expected) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.log(`  ✗ ${name} — expected ${expected}, got ${actual}`); }
}

function oldComp(ay, heads) {
  return TaxEngine.compute({ ay, adminOverrides: { regime: 'Old' }, ...heads });
}

console.log('── Old Regime: LTCG u/s 112A is AY-dependent ──');

// AY 2023-24 & 2024-25: LTCG @ 10% above ₹1,00,000
let r = oldComp('2023-24', { ltcg: 1000000 });
check('AY23-24 Old: LTCG taxable base (₹10L − ₹1L exemption)', r.taxableLTCG, 900000);
check('AY23-24 Old: tax on LTCG @10%', r.taxOnLTCG, 90000);
check('AY23-24 Old: total tax payable incl. 4% cess', r.totalTaxPayable, 93600);

r = oldComp('2024-25', { ltcg: 1000000 });
check('AY24-25 Old: LTCG taxable base (₹10L − ₹1L exemption)', r.taxableLTCG, 900000);
check('AY24-25 Old: tax on LTCG @10%', r.taxOnLTCG, 90000);
check('AY24-25 Old: total tax payable incl. 4% cess', r.totalTaxPayable, 93600);

// AY 2025-26 & 2026-27: LTCG @ 12.5% above ₹1,25,000 (Finance Act 2024)
r = oldComp('2025-26', { ltcg: 1000000 });
check('AY25-26 Old: LTCG taxable base (₹10L − ₹1.25L exemption)', r.taxableLTCG, 875000);
check('AY25-26 Old: tax on LTCG @12.5%', r.taxOnLTCG, 109375);
check('AY25-26 Old: total tax payable incl. 4% cess', r.totalTaxPayable, 113750);

r = oldComp('2026-27', { ltcg: 1000000 });
check('AY26-27 Old: LTCG taxable base (₹10L − ₹1.25L exemption)', r.taxableLTCG, 875000);
check('AY26-27 Old: tax on LTCG @12.5%', r.taxOnLTCG, 109375);
check('AY26-27 Old: total tax payable incl. 4% cess', r.totalTaxPayable, 113750);

console.log('── Old Regime: STCG u/s 111A is AY-dependent ──');

// ₹10L STCG keeps income above the ₹5L 87A threshold (no rebate interference)
r = oldComp('2024-25', { stcg: 1000000 });
check('AY24-25 Old: STCG tax @15% + cess', r.totalTaxPayable, 156000);

r = oldComp('2025-26', { stcg: 1000000 });
check('AY25-26 Old: STCG tax @20% + cess', r.totalTaxPayable, 208000);

console.log('── New Regime: capital gains rates unchanged ──');

r = TaxEngine.compute({ ay: '2024-25', ltcg: 1000000 });
check('AY24-25 New: LTCG taxable base (₹10L − ₹1L)', r.taxableLTCG, 900000);
check('AY24-25 New: tax on LTCG @10%', r.taxOnLTCG, 90000);

r = TaxEngine.compute({ ay: '2025-26', ltcg: 1000000 });
check('AY25-26 New: LTCG taxable base (₹10L − ₹1.25L)', r.taxableLTCG, 875000);
check('AY25-26 New: tax on LTCG @12.5%', r.taxOnLTCG, 109375);

console.log('── Section 87A marginal relief (AY 2026-27 New) ──');

// Income ₹12,10,000: slab tax = 4L@0 + 4L@5% + 4L@10% + 10k@15% = ₹61,500
// Margin over ₹12L rebate limit = ₹10,000 → rebate = 61,500 − 10,000 = ₹51,500
// Net tax = ₹10,000 + 4% cess = ₹10,400
r = TaxEngine.compute({ ay: '2026-27', businessIncome: 1210000 });
check('AY26-27 New: marginal-relief tax payable on ₹12.1L', r.totalTaxPayable, 10400);

console.log('── Section 288A rounding (nearest ₹10) ──');

r = TaxEngine.compute({ ay: '2026-27', businessIncome: 500003 });
check('Total income ₹5,00,003 rounds to ₹5,00,000', r.totalIncome, 500000);
check('Round-off amount is −3', r.roundOffAmt, -3);

console.log(`\nResults: ${passed} passed, ${failed} failed.`);
process.exit(failed ? 1 : 0);
