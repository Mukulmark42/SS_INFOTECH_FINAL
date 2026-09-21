/**
 * ═══════════════════════════════════════════════════════════
 * TAX ENGINE  –  New & Old Regime | 44AD & 44ADA Support
 * AY-wise slabs are configurable from Admin Panel.
 * Computes: GTI → Total Income → Tax → Cess → 87A Rebate
 *           → Net Tax Payable / Refund
 * ═══════════════════════════════════════════════════════════
 */

const TaxEngine = (() => {

  // ── Default New Regime Configurations ─────────────────────
  const DEFAULT_NEW_AY_CONFIG = {
    '2023-24': {
      label:          'AY 2023-24 (FY 2022-23)',
      regime:         'New',
      slabs: [
        { upto: 250000,   rate: 0    },
        { upto: 500000,   rate: 0.05 },
        { upto: 750000,   rate: 0.10 },
        { upto: 1000000,  rate: 0.15 },
        { upto: 1250000,  rate: 0.20 },
        { upto: 1500000,  rate: 0.25 },
        { upto: Infinity, rate: 0.30 },
      ],
      rebateLimit:    500000,    // 87A: full rebate if income <= ₹5L
      rebateMax:      12500,     // Max rebate ₹12,500
      basicExemption: 250000,
      cess:           0.04,
      stdDeduction:   0,
      tttaLimit:      10000,
      allow80TTA:     false,
      stcgRate:       0.15,
      ltcgRate:       0.10,
      ltcgExemption:  100000,
      marginalRelief87A: false,
    },
    '2024-25': {
      label:          'AY 2024-25 (FY 2023-24)',
      regime:         'New',
      slabs: [
        { upto: 300000,   rate: 0    },
        { upto: 600000,   rate: 0.05 },
        { upto: 900000,   rate: 0.10 },
        { upto: 1200000,  rate: 0.15 },
        { upto: 1500000,  rate: 0.20 },
        { upto: Infinity, rate: 0.30 },
      ],
      rebateLimit:    700000,    // 87A: full rebate if income <= ₹7L
      rebateMax:      25000,     // Max rebate ₹25,000
      basicExemption: 300000,
      cess:           0.04,
      stdDeduction:   50000,
      tttaLimit:      10000,
      allow80TTA:     false,
      stcgRate:       0.15,
      ltcgRate:       0.10,
      ltcgExemption:  100000,
      marginalRelief87A: true,
    },
    '2025-26': {
      label:          'AY 2025-26 (FY 2024-25)',
      regime:         'New',
      slabs: [
        { upto: 300000,   rate: 0    },
        { upto: 700000,   rate: 0.05 },
        { upto: 1000000,  rate: 0.10 },
        { upto: 1200000,  rate: 0.15 },
        { upto: 1500000,  rate: 0.20 },
        { upto: Infinity, rate: 0.30 },
      ],
      rebateLimit:    700000,   // 87A: full rebate if income ≤ ₹7L
      rebateMax:      25000,     // Max rebate ₹25,000
      basicExemption: 300000,
      cess:           0.04,
      stdDeduction:   75000,
      tttaLimit:      10000,
      allow80TTA:     false,
      stcgRate:       0.20,      // STCG raised to 20% from Budget 2024
      ltcgRate:       0.125,     // LTCG raised to 12.5% from Budget 2024
      ltcgExemption:  125000,    // LTCG exemption raised to ₹1.25L from Budget 2024
      marginalRelief87A: true,
    },
    '2026-27': {
      label:          'AY 2026-27 (FY 2025-26)',
      regime:         'New',
      slabs: [
        { upto: 400000,   rate: 0    },
        { upto: 800000,   rate: 0.05 },
        { upto: 1200000,  rate: 0.10 },
        { upto: 1600000,  rate: 0.15 },
        { upto: 2000000,  rate: 0.20 },
        { upto: 2400000,  rate: 0.25 },
        { upto: Infinity, rate: 0.30 },
      ],
      rebateLimit:    1200000,
      rebateMax:      60000,
      basicExemption: 400000,
      cess:           0.04,
      stdDeduction:   75000,
      tttaLimit:      10000,
      allow80TTA:     false,
      stcgRate:       0.20,
      ltcgRate:       0.125,
      ltcgExemption:  125000,
      marginalRelief87A: true,
    },
  };

  // ── Default Old Regime Configuration ──────────────────────
  const OLD_REGIME_CONFIG = {
    regime:         'Old',
    slabs: [
      { upto: 250000,   rate: 0    },
      { upto: 500000,   rate: 0.05 },
      { upto: 1000000,  rate: 0.20 },
      { upto: Infinity, rate: 0.30 },
    ],
    rebateLimit:    500000,
    rebateMax:      12500,
    basicExemption: 250000,
    cess:           0.04,
    stdDeduction:   50000,
    tttaLimit:      10000,
    allow80TTA:     true,
    stcgRate:       0.15,
    ltcgRate:       0.125,
    ltcgExemption:  125000,
    marginalRelief87A: false,
  };

  /**
   * Get effective AY config, merging regime and admin overrides if any.
   */
  function getConfig(ay, adminOverrides = {}) {
    const isOld = (adminOverrides.regime || '').toLowerCase() === 'old';
    const baseNew = DEFAULT_NEW_AY_CONFIG[ay] || DEFAULT_NEW_AY_CONFIG['2026-27'];
    const base = isOld
      ? { ...baseNew, ...OLD_REGIME_CONFIG, label: `${baseNew.label.split('(')[0].trim()} (Old Regime)` }
      : baseNew;

    return { ...base, ...adminOverrides };
  }

  /**
   * Presumptive Taxation Helper for 44AD (Business) and 44ADA (Professionals)
   */
  function computePresumptive(incomeOrTurnover, mode = 'fromIncome', section = '44AD', userProfitPct = null) {
    const is44ADA = section === '44ADA';
    const defaultPct = is44ADA ? 50 : 20;
    const profitPct = userProfitPct !== null && userProfitPct !== undefined ? parseFloat(userProfitPct) : defaultPct;
    const profitDec = profitPct / 100;

    if (mode === 'fromIncome') {
      const income = parseFloat(incomeOrTurnover) || 0;
      const turnover = profitDec > 0 ? Math.round(income / profitDec) : 0;
      return { income, turnover, profitPct, section, is44ADA };
    } else {
      const turnover = parseFloat(incomeOrTurnover) || 0;
      const income = Math.round(turnover * profitDec);
      return { income, turnover, profitPct, section, is44ADA };
    }
  }

  /**
   * Compute tax on income using slab rates.
   * @param {number} income   Taxable income
   * @param {Array}  slabs    AY slab array
   * @returns {number}        Tax before cess & rebate (rounded)
   */
  function computeSlabTax(income, slabs) {
    if (!income || income <= 0) return 0;
    let tax  = 0;
    let prev = 0;
    for (const slab of slabs) {
      if (income <= prev) break;
      const taxable = Math.min(income, slab.upto) - prev;
      tax += taxable * slab.rate;
      prev = slab.upto;
    }
    return Math.round(tax);
  }

  /**
   * Full computation pipeline supporting Salary, Presumptive, Capital Gains,
   * Chapter VI-A Deductions, Rebate 87A, and AY 2023-27 rules.
   */
  function compute(input) {
    const cfg = getConfig(input.ay, input.adminOverrides || {});
    const isOld = (cfg.regime || '').toLowerCase() === 'old';

    const businessIncome  = Math.round(input.businessIncome  || 0);
    const savingsInterest = Math.round(input.savingsInterest || 0);
    const stcg            = Math.round(input.stcg            || 0);
    const ltcg            = Math.round(input.ltcg            || 0);
    const pl              = Math.round(input.pl              || 0);
    const presumptiveSection = input.presumptiveSection || '44AD';

    // ── Salary Income Calculation ────────────────────────────
    const salaryGross = Math.round(input.salaryGross || 0);
    let salaryStdDeduction = 0;
    let salaryPtax = 0;
    let salaryHraExemption = 0;
    let netSalary = 0;
    let deduction80CCD2 = 0;

    if (salaryGross > 0) {
      salaryStdDeduction = Math.min(salaryGross, cfg.stdDeduction || 50000);
      salaryPtax = Math.min(salaryGross - salaryStdDeduction, Math.round(input.salaryPtax || 0));

      // HRA Exemption u/s 10(13A) - Correct calculation
      // Minimum of: (1) Actual HRA received, (2) 50% of salary (metro) / 40% (non-metro), (3) Rent paid - 10% of salary
      if (isOld && (input.salaryHra || 0) > 0) {
        const hraReceived = Math.round(input.salaryHra || 0);
        const isMetro = input.salaryHraMetro === true;
        const rentPaid = Math.round(input.salaryRentPaid || 0);
        const basicSalary = salaryGross; // For HRA calculation, "salary" = basic + DA (if part of retirement benefits)

        const metroLimit = isMetro ? 0.50 : 0.40;
        const limit2 = Math.round(basicSalary * metroLimit);
        const limit3 = rentPaid > 0 ? Math.max(0, rentPaid - Math.round(basicSalary * 0.10)) : 0;

        salaryHraExemption = Math.min(hraReceived, limit2, limit3);
      } else {
        salaryHraExemption = 0;
      }

      // Section 80CCD(2) - Employer NPS contribution (New Regime only)
      // Deduction up to 10% of salary (14% for Central Govt employees)
      if (!isOld && (input.salary80CCD2 || 0) > 0) {
        const isCentralGovt = input.salaryEmployerCategory === 'Central Govt';
        const limit80CCD2 = Math.round(salaryGross * (isCentralGovt ? 0.14 : 0.10));
        deduction80CCD2 = Math.min(Math.round(input.salary80CCD2), limit80CCD2);
      }

      netSalary = Math.max(0, salaryGross - salaryStdDeduction - salaryPtax - salaryHraExemption - deduction80CCD2);
    }

    // ── Gross Total Income ───────────────────────────────────
    const grossTotalIncome = businessIncome + savingsInterest + stcg + ltcg + pl + netSalary;

    // ── Chapter VI-A Deductions ──────────────────────────────
    let deduction80C     = 0;
    let deduction80D     = 0;
    let deduction80CCD1B = 0;
    let deduction80G     = 0;
    let deduction80TTA   = 0;
    let totalDeductions  = 0;

    // Incomes eligible for Chapter VI-A (excludes special rate capital gains)
    const eligibleForDeductions = Math.max(0, grossTotalIncome - stcg - ltcg);

    if (isOld) {
      deduction80C     = Math.min(150000, Math.round(input.deduction80C || 0));
      deduction80D     = Math.min(100000, Math.round(input.deduction80D || 0));
      deduction80CCD1B = Math.min(50000,  Math.round(input.deduction80CCD1B || 0));
      deduction80G     = Math.max(0,      Math.round(input.deduction80G || 0));
      deduction80TTA   = cfg.allow80TTA ? Math.min(savingsInterest, cfg.tttaLimit || 10000) : 0;

      const rawDeductions = deduction80C + deduction80D + deduction80CCD1B + deduction80G + deduction80TTA;
      totalDeductions = Math.min(eligibleForDeductions, rawDeductions);
    } else {
      // New Regime: 80CCD(2) employer contribution could apply, default Chapter VI-A disallowed
      deduction80TTA = 0;
      totalDeductions = 0;
    }

    // ── Total Income (before rounding) ───────────────────────
    const totalIncomeBeforeRounding = Math.max(0, grossTotalIncome - totalDeductions);

    // Round off u/s 288A (nearest ₹10)
    const totalIncome   = Math.round(totalIncomeBeforeRounding / 10) * 10;
    const roundOffAmt   = totalIncome - totalIncomeBeforeRounding;

    // ── Tax Computation ──────────────────────────────────────
    // LTCG u/s 112A has an exemption (₹1.25L for AY 25-26+, ₹1L earlier)
    const ltcgExemptionLimit = cfg.ltcgExemption || 125000;
    const taxableLTCG = Math.max(0, ltcg - ltcgExemptionLimit);
    const taxOnLTCG   = Math.round(taxableLTCG * (cfg.ltcgRate || 0.125));

    // STCG u/s 111A flat special rate
    const taxOnSTCG   = Math.round(stcg * (cfg.stcgRate || 0.15));

    // Regular slab income
    const regularIncome = Math.max(0, totalIncome - stcg - taxableLTCG);
    const taxOnRegular  = computeSlabTax(regularIncome, cfg.slabs);
    const taxBeforeRebate = taxOnRegular + taxOnSTCG + taxOnLTCG;

    // ── Rebate u/s 87A ───────────────────────────────────────
    let rebate = 0;
    if (taxBeforeRebate > 0) {
      if (totalIncome <= cfg.rebateLimit) {
        rebate = Math.min(taxBeforeRebate, cfg.rebateMax);
      } else if (cfg.marginalRelief87A) {
        // Marginal Relief for 87A: tax payable cannot exceed income in excess of rebate limit
        const margin = totalIncome - cfg.rebateLimit;
        if (margin > 0 && taxBeforeRebate > margin) {
          rebate = taxBeforeRebate - margin;
        }
      }
    }

    const taxAfterRebate = Math.max(0, taxBeforeRebate - rebate);

    // ── Health & Education Cess @ 4% ─────────────────────────
    const cess = Math.round(taxAfterRebate * cfg.cess);

    // ── Total Tax Payable (before TDS) ───────────────────────
    let totalTaxPayable = taxAfterRebate + cess;

    // Round off u/s 288B (nearest ₹10)
    totalTaxPayable = Math.round(totalTaxPayable / 10) * 10;

    // ── TDS Credit ───────────────────────────────────────────
    const tdsCredit = Math.round(input.tds || 0);

    // ── Net Refund / Tax Due ─────────────────────────────────
    const netTax  = totalTaxPayable - tdsCredit;
    const refund  = netTax < 0 ? Math.abs(netTax) : 0;
    const taxDue  = netTax > 0 ? netTax : 0;

    return {
      // Income heads
      businessIncome, savingsInterest, stcg, ltcg, pl,
      salaryGross, salaryStdDeduction, salaryPtax, salaryHraExemption, netSalary,
      deduction80CCD2,
      presumptiveSection,
      // Deductions
      deduction80C, deduction80D, deduction80CCD1B, deduction80G, deduction80TTA,
      totalDeductions,
      // GTI and Net
      grossTotalIncome,
      totalIncomeBeforeRounding,
      totalIncome,
      roundOffAmt,
      // Tax breakdown
      regularIncome,
      taxOnRegular,
      taxOnSTCG,
      taxableLTCG,
      taxOnLTCG,
      taxBeforeRebate,
      rebate,
      taxAfterRebate,
      cess,
      totalTaxPayable,
      // Credits
      tdsCredit,
      // Final
      netTax, refund, taxDue,
      // Config used
      cfg,
    };
  }

  /**
   * Live Regime Comparator: Compares New vs Old Regime side-by-side
   * and recommends the optimal choice with tax savings.
   */
  function compareRegimes(input) {
    const newComp = compute({
      ...input,
      adminOverrides: { ...(input.adminOverrides || {}), regime: 'New' },
    });

    const oldComp = compute({
      ...input,
      adminOverrides: { ...(input.adminOverrides || {}), regime: 'Old' },
    });

    const taxNew = newComp.totalTaxPayable;
    const taxOld = oldComp.totalTaxPayable;

    let recommended = 'New';
    let savings = 0;

    if (taxOld < taxNew) {
      recommended = 'Old';
      savings = taxNew - taxOld;
    } else {
      recommended = 'New';
      savings = taxOld - taxNew;
    }

    return {
      newRegime: newComp,
      oldRegime: oldComp,
      taxNew,
      taxOld,
      recommended,
      savings,
      isEqual: taxNew === taxOld,
    };
  }

  /** Format number in Indian locale with ₹ prefix */
  function fmt(n, showRupee = true) {
    if (n == null || isNaN(n)) return showRupee ? '₹ 0' : '0';
    const s = Math.abs(Math.round(n)).toLocaleString('en-IN');
    return (showRupee ? '₹ ' : '') + s;
  }

  /** Format number for computation display (no ₹, no sign) */
  function fmtNum(n) {
    if (n == null || isNaN(n)) return '0';
    return Math.abs(Math.round(n)).toLocaleString('en-IN');
  }

  /** Get slab description lines for report display */
  function getSlabLines(totalIncome, cfg) {
    const lines = [];
    let prev = 0;
    for (const slab of cfg.slabs) {
      if (prev >= totalIncome) break;
      const taxable = Math.min(totalIncome, slab.upto) - prev;
      if (taxable <= 0) { prev = slab.upto; continue; }
      const tax = Math.round(taxable * slab.rate);
      const from = prev + 1;
      const to   = Math.min(totalIncome, slab.upto);
      lines.push({
        from, to, taxable, rate: slab.rate,
        tax,
        label: slab.rate === 0
          ? `Upto ₹${slab.upto.toLocaleString('en-IN')} – Nil`
          : `₹${from.toLocaleString('en-IN')} to ₹${to.toLocaleString('en-IN')} @ ${(slab.rate*100).toFixed(0)}%`,
      });
      prev = slab.upto;
    }
    return lines;
  }

  return {
    compute,
    compareRegimes,
    computeSlabTax,
    computePresumptive,
    getConfig,
    getSlabLines,
    fmt,
    fmtNum,
    AY_CONFIG: DEFAULT_NEW_AY_CONFIG,
    OLD_CONFIG: OLD_REGIME_CONFIG,
  };
})();

if (typeof module !== 'undefined') {
  module.exports = TaxEngine;
}
