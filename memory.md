# Project Memory & Knowledge Base
## SS INFOTECH – Tax Computation Pro

**Repository:** `Mukulmark42/SS_INFOTECH_FINAL`  
**Current Assessment Year:** AY 2026-27 (FY 2025-26)  
**System Status:** Production Ready  
**Last Updated:** September 2026  

---

### 1. Project Genesis & Core Mission

**SS INFOTECH – Tax Computation Pro** was created to provide Indian Chartered Accountants, Tax Practitioners, and Tax Advocates with a fast, zero-latency, and zero-maintenance alternative to heavy legacy Windows desktop software (e.g., CompuTax, Winman).

The system operates **entirely client-side** using standard web technologies. All financial calculations, report generation, payslip drafting, bank statement simulations, and data persistence take place within the user's browser runtime. Client data remains 100% private and on-premise unless the user chooses to enable the integrated **Supabase Cloud Sync Hub**.

---

### 2. Key Architectural Decisions (ADRs)

#### ADR 1: Zero-Build Vanilla JavaScript Architecture
- **Decision:** The application is written in clean, modular vanilla JavaScript using the **IIFE / Module Pattern** without build steps (no Webpack, Vite, React, or npm dependencies).
- **Rationale:** 
  1. Allows immediate execution by opening `index.html` in any browser or serving via any static web server (Nginx, GitHub Pages, Vercel).
  2. Eliminates `node_modules` dependency vulnerabilities, supply-chain risks, and build-time breakages.
  3. Ensures high long-term stability with minimal maintenance overhead.

#### ADR 2: LocalStorage-First Data Tenancy
- **Decision:** Browser `window.localStorage` serves as the primary database for clients, salary slip history, statement records, and office settings.
- **Rationale:** 
  1. Guarantees complete data privacy for tax consultants handling confidential client PAN and income details.
  2. Works natively in air-gapped or offline office environments.
  3. All local writes are protected by an abstract wrapper (`_safeSetItem` in `js/db.js`) that intercepts `QuotaExceededError` and alerts the user before storage saturation occurs.

#### ADR 3: Dual-Mode Cloud Sync with Overwrite Guards
- **Decision:** Supabase integration acts as an asynchronous cloud backup and multi-device sync layer.
- **Rationale:**
  1. **Debounced Auto-Sync:** A 2-second debounce timer triggers silent cloud backups following any data mutation without stalling the UI.
  2. **Empty-Workspace Overwrite Guard:** If a user opens the application in a clean browser or private window with empty local storage, the auto-sync engine is blocked from pushing an empty backup, protecting existing cloud snapshots.
  3. **Auto-Restore on First Boot:** Automatically detects an empty local store on startup and prompts or restores the latest valid cloud snapshot.
  4. **Smart Merge Conflict Resolution:** When merging cloud snapshots with local data, the engine compares individual records by identifier (`id` or `PAN + AY`) and retains the record with the most recent `updatedAt` timestamp.

#### ADR 4: Tri-Format Report Rendering Strategy
- **Decision:** Provide three distinct reporting engines for different stakeholder needs:
  1. `ReportClassic`: CompuTax-style multi-page A4 audit report in Times New Roman with formal annexures, ledger lines, and office verification seals.
  2. `ReportModern`: Executive gradient presentation report with KPI stat cards, charts, and clean cards designed for bank loan underwriting.
  3. `ReportAck`: Exact 1:1 pixel-perfect replica of the official Income Tax Department ITR-V acknowledgement form, complete with official watermark, DejaVu Sans typography, 2D PDF417-style barcode, and single-page A4 layout.

#### ADR 5: Bank Statement Formatting Hierarchy (ICICI Default & Optional Formats)
- **Decision:** The ICICI Bank Detailed Statement format (`icici`) remains the default generator format for all bank accounts unless another format is explicitly selected. Bank-specific formats (such as `axis` for Axis Bank, and future bank replicas) are maintained as optional templates selectable via the Statement Style dropdown.
- **Rationale:** 
  1. Preserves backwards compatibility for existing saved records and user workflows that rely on the established ICICI layout.
  2. Provides dedicated pixel-perfect PDF replicas (such as Axis Bank's 7-column Times New Roman statement) when users explicitly require authentic bank-specific branch statement layouts.

---

### 3. Critical Edge Cases & Statutory Nuances

#### 3.1 Section 87A Rebate & Marginal Relief
- Under the New Tax Regime, Section 87A rebate provides full tax relief if total taxable income is at or below the statutory threshold:
  - **AY 2023-24:** Threshold ₹5,00,000 (Max rebate ₹12,500).
  - **AY 2024-25 & AY 2025-26:** Threshold ₹7,00,000 (Max rebate ₹25,000).
  - **AY 2026-27:** Threshold ₹12,00,000 (Max rebate ₹60,000).
- **Marginal Relief Nuance:** If taxable income marginally exceeds the rebate threshold, marginal relief ensures that the net tax payable cannot exceed the income in excess of the threshold.
  $$\text{Margin} = \text{Total Income} - \text{Rebate Limit}$$
  $$\text{If } \text{Tax Before Rebate} > \text{Margin} \implies \text{Rebate} = \text{Tax Before Rebate} - \text{Margin}$$

#### 3.2 Finance Act 2024 Capital Gains Amendments
- Applies to **AY 2025-26 and AY 2026-27**:
  - **STCG u/s 111A:** Rate increased from 15% to **20%**.
  - **LTCG u/s 112A:** Rate increased from 10% to **12.5%**.
  - **LTCG Exemption Limit:** Exemption threshold raised from ₹1,00,000 to **₹1,25,000**.
  - Capital gains subject to special tax rates are excluded from regular slab calculations and are ineligible for Chapter VI-A deductions.

#### 3.3 Standard Deduction Rules
- **New Regime:**
  - AY 2023-24: ₹0
  - AY 2024-25: ₹50,000
  - AY 2025-26: ₹75,000
  - AY 2026-27: ₹75,000
- **Old Regime:** Uniformly ₹50,000 across all assessment years.
- Standard deduction is capped at the gross salary amount (cannot create a negative salary head).

#### 3.4 Savings Bank Interest Allocation
- In `js/interest-engine.js`, accounts designated as Current Accounts (`type === 'CA'`) are strictly assigned ₹0 interest, as commercial current accounts do not accrue interest under RBI regulations.
- The randomized distribution algorithm splits interest realistically across Savings Bank (`SB`) accounts while ensuring the exact sum matches the entered total.

#### 3.5 44AD Book Profit Fix
- In `js/report-classic.js` (Annexure A), the redundant "Book Profit" column has been intentionally removed. For presumptive taxation under Section 44AD, showing turnover as book profit caused audit confusion. The annexure now clearly displays Gross Turnover, Presumptive Rate %, and Deemed Profit.

---

### 4. Complete Codebase Sitemap

```
d:\Antigravity_workFile\SS INFOTECH_GITHUB_WORK FILE\
│
├── index.html                       # Master SPA HTML; all views, modals, wizard steps, and CDN links
│
├── css/
│   └── styles.css                   # Complete application CSS, CSS tokens, dark mode, and @media print
│
├── js/
│   ├── app.js                       # Main application controller, MVC state, event listeners, AIS import
│   ├── tax-engine.js                # Tax computation engine: multi-year slabs, 87A, 44AD/ADA, regime comparator
│   ├── tds-engine.js                # Business-aware realistic TDS generator (194H, 194C, 194J, 194N)
│   ├── interest-engine.js           # Savings bank interest distribution across accounts
│   ├── db.js                        # LocalStorage abstraction, Recycle Bin, CSV export, storage telemetry
│   ├── supabase-sync.js             # Supabase cloud backup, debounced auto-sync, and smart merge engine
│   ├── report-classic.js            # CompuTax-style multi-page A4 computation report generator
│   ├── report-modern.js             # Executive gradient summary presentation report generator
│   ├── report-ack.js                # 1:1 official Income Tax Department ITR-V acknowledgement replica
│   ├── salary-slip-engine.js        # Corporate payslip engine with number-to-words and batch printing
│   ├── bank-statement-engine.js     # High-fidelity multi-bank ledger and transaction simulator
│   └── bank-logos.js                # Bank logo resolver with Brandfetch API and Favicon fallback
│
├── assets/
│   ├── it-dept-watermark.jpg        # Official Income Tax Department watermark image
│   ├── it-dept-watermark.b64        # Base64 encoded watermark string for embedded offline PDF rendering
│   └── bank-logos/                  # Directory containing local vector and raster bank logos
│
├── prd.md                           # Product Requirements Document
├── architecture.md                  # System Architecture & Technical Specification
├── design.md                        # UI/UX Design System & Style Guide
└── memory.md                        # Project Memory & Knowledge Base (This Document)
```

---

### 5. Maintenance & Extension Guidelines

#### 5.1 Adding a New Assessment Year
To introduce a future Assessment Year (e.g., AY 2027-28):
1. Open `js/tax-engine.js`.
2. Add a new configuration block inside `DEFAULT_NEW_AY_CONFIG`:
   ```javascript
   '2027-28': {
     label: 'AY 2027-28 (FY 2026-27)',
     regime: 'New',
     slabs: [ /* updated statutory slabs */ ],
     rebateLimit: 1200000,
     rebateMax: 60000,
     basicExemption: 400000,
     cess: 0.04,
     stdDeduction: 75000,
     allow80TTA: false,
     stcgRate: 0.20,
     ltcgRate: 0.125,
     ltcgExemption: 125000,
     marginalRelief87A: true,
   }
   ```
3. Update the AY dropdown options in `index.html` (both in the wizard `#f-ay` and in the Admin Panel `#admin-ay-select`).
4. Update the default version and AY badge labels in `index.html` and `js/app.js`.

#### 5.2 Adding a New Bank to the Statement Engine
1. Open `js/bank-logos.js` and register the bank alias, full name, and official domain:
   ```javascript
   'BANDHAN BANK': 'bandhanbank.com',
   ```
2. Open `js/bank-statement-engine.js` and add the bank's domain to `BANK_DOMAINS` and `DOMAIN_BY_KEY`.
3. If an SVG logo is available, place it in `assets/bank-logos/<bank-slug>.svg`.
4. Add the bank to the bank selector dropdown in `index.html`.

#### 5.3 Modifying Supabase Sync Configuration
1. Credentials and table configurations are managed via `js/supabase-sync.js` under `DEFAULT_CONFIG`.
2. If the backup schema needs extension, update `collectAllData()` and `_mergePayloadIntoLocalStorage()` to serialize and restore the new keys.
3. Update `getSqlSchema()` to reflect any new database columns or indexes.

---

### 6. Verification & Health Checklist

When validating any updates or fixes to this codebase:
- [ ] **Tax Slab Verification:** Verify that calculations for AY 2023-24, AY 2024-25, AY 2025-26, and AY 2026-27 yield exact statutory results for both New and Old regimes.
- [ ] **Rebate 87A Marginal Relief:** Verify that an income of ₹7,05,000 (AY 24-25) or ₹12,10,000 (AY 26-27) correctly applies marginal relief rather than levying full tax.
- [ ] **Rounding Compliance:** Check that Taxable Income rounds to the nearest ₹10 (Section 288A) and Tax Due/Refund rounds to the nearest ₹10 (Section 288B).
- [ ] **A4 Print Alignment:** Verify that `ReportClassic` cleanly paginates across multi-page schedules, and `ReportAck` strictly remains confined to a single A4 sheet without spilling onto page 2.
- [ ] **LocalStorage Quota Protection:** Ensure adding and soft-deleting clients updates storage telemetry in the Admin panel without throwing unhandled exceptions.
- [ ] **Cloud Sync Safeguard:** Confirm that auto-sync does not trigger when opening the application in a clean profile with 0 local records.
