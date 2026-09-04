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
   * Full computation pipeline.
   */
  function compute(input) {
    const cfg = getConfig(input.ay, input.adminOverrides || {});

    const businessIncome  = Math.round(input.businessIncome  || 0);
    const savingsInterest = Math.round(input.savingsInterest || 0);
    const stcg            = Math.round(input.stcg            || 0);
    const pl              = Math.round(input.pl              || 0);
    const presumptiveSection = input.presumptiveSection || '44AD';

    // ── 80TTA Deduction ──────────────────────────────────────
    const deduction80TTA = cfg.allow80TTA
      ? Math.min(savingsInterest, cfg.tttaLimit)
      : 0;

    // ── Gross Total Income ───────────────────────────────────
    const grossTotalIncome = businessIncome + savingsInterest + stcg + pl;

    // ── Total Income (before rounding) ───────────────────────
    const totalIncomeBeforeRounding = grossTotalIncome - deduction80TTA;

    // Round off u/s 288A (nearest ₹10)
    const totalIncome   = Math.round(totalIncomeBeforeRounding / 10) * 10;
    const roundOffAmt   = totalIncome - totalIncomeBeforeRounding;

    // ── Tax Computation ──────────────────────────────────────
    // STCG (u/s 111A) is taxed at special flat rate; rest at slab rates
    const regularIncome = Math.max(0, totalIncome - stcg);
    const taxOnRegular  = computeSlabTax(regularIncome, cfg.slabs);
    const taxOnSTCG     = Math.round(stcg * (cfg.stcgRate || 0.15));
    const taxBeforeRebate = taxOnRegular + taxOnSTCG;

    // ── Rebate u/s 87A ───────────────────────────────────────
    let rebate = 0;
    if (taxBeforeRebate > 0) {
      if (totalIncome <= cfg.rebateLimit) {
        rebate = Math.min(taxBeforeRebate, cfg.rebateMax);
      } else if (cfg.marginalRelief87A) {
        // Marginal Relief for 87A
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
      businessIncome, savingsInterest, stcg, pl,
      presumptiveSection,
      // Deductions
      deduction80TTA,
      // GTI and Net
      grossTotalIncome,
      totalIncomeBeforeRounding,
      totalIncome,
      roundOffAmt,
      // Tax breakdown
      regularIncome,
      taxOnRegular,
      taxOnSTCG,
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
