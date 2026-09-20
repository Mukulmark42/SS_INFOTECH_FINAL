# Product Requirements Document (PRD)
## SS INFOTECH – Tax Computation Pro

**Document Version:** 1.0.0  
**Status:** Approved / Active Production  
**Current Assessment Year:** AY 2026-27 (FY 2025-26)  
**Supported Assessment Years:** AY 2023-24, AY 2024-25, AY 2025-26, AY 2026-27  
**Product Category:** FinTech / Tax Compliance & Office Automation Software  

---

### 1. Executive Summary

**SS INFOTECH – Tax Computation Pro** is a high-performance, offline-first professional tax computation, reporting, and office automation platform developed for Indian Chartered Accountants (CAs), Tax Practitioners, Tax Advocates, and Accounting Professionals.

The software addresses the operational friction in Indian tax consultancy offices by consolidating income tax computation (New & Old regimes across multi-year statutory rules), presumptive taxation (Sections 44AD and 44ADA), realistic TDS and interest distribution, 1:1 pixel-perfect ITR acknowledgement replica generation, standard enterprise payslip creation, and high-fidelity multi-bank statement generation into a unified, privacy-first, zero-install web workspace.

---

### 2. Problem Statement & Market Opportunity

#### 2.1 The Problem
1. **Disjointed Tooling:** Tax practitioners frequently juggle multiple heavy, expensive desktop software (e.g., CompuTax, Winman) that lack agility, require local dongles/licenses, and charge exorbitant annual renewal fees.
2. **Dynamic Tax Legislation Complexity:** The introduction of the New Tax Regime as default (Finance Acts 2023, 2024, and 2025) introduced fluctuating slab structures, standard deduction variations (₹50,000 to ₹75,000), revised Capital Gains rates (12.5% LTCG, 20% STCG), and Section 87A Marginal Relief nuances, leading to frequent manual calculation errors.
3. **Ancillary Document Generation Delays:** Clients applying for bank loans, visas, or tenders require computation sheets, official ITR-V acknowledgements, monthly salary slips, and multi-bank statements. Preparing these in disjointed Word or Excel templates creates formatting inconsistencies, calculation mismatches, and compliance risks.
4. **Data Privacy & Multi-Device Sync:** Practicing accountants demand client data privacy (preventing client data exposure to third-party SaaS servers) while simultaneously needing cloud backup and effortless synchronization across multiple office laptops.

#### 2.2 The Solution
SS INFOTECH Tax Computation Pro delivers:
- **Instant Client-Side Computation:** Zero-server calculations for instant responsiveness with 100% data residency inside the practitioner's browser (`localStorage`).
- **Comprehensive Tax Engine:** Built-in statutory logic for AY 2023-24 through AY 2026-27 with live New vs. Old Regime side-by-side comparison and tax-saving recommendations.
- **Tri-Format Reporting:** Instant generation of CompuTax-style Classic Multi-Page A4 Reports, Modern Executive Gradient Reports, and 100% official ITR-V / Acknowledgement replicas.
- **Ancillary Office Engines:** Integrated Salary Slip Generator (batch multi-month) and Bank Statement Generator (chronological balance simulator for major Indian banks).
- **Hybrid Cloud Sync:** Optional, end-to-end auto-backup and snapshot restoration powered by Supabase BaaS.

---

### 3. User Personas & Target Audience

| Persona | Role & Work Setting | Primary Goals | Key Pain Points |
| :--- | :--- | :--- | :--- |
| **CA / Tax Advocate** | Independent or Mid-sized CA Firm | Fast computation for hundreds of individual & presumptive clients during filing season; generate bank-ready computations. | Legacy desktop tools are slow; complex regime comparisons; manual report formatting. |
| **Tax Consultant / TRP** | Semi-urban / Tier-2 Tax Office | Compute returns for small traders, shopkeepers, professionals (44AD/44ADA); generate TDS and ITR-V receipts. | Lack of technical knowledge for complex software; need simple wizard and instant printouts. |
| **Corporate Accountant / HR** | SME / Enterprise Back-office | Generate monthly payslips, calculate employee TDS, simulate bank credit statements. | Inconsistent Excel slip templates; difficulty calculating PF, ESI, and net salary in words. |
| **Self-Employed Professional** | Freelancer / Consultant / Trader | Estimate tax under 44ADA vs 44AD, evaluate Old vs New regime benefit, verify TDS credits. | Complex tax portal UI; confusion over deductions and rebates under Section 87A. |

---

### 4. Detailed Functional Requirements

#### 4.1 Module 1: Income Tax Computation Engine
- **Multi-Year Assessment Support:** Native parameter configurations for:
  - **AY 2026-27 (Current):** Basic exemption ₹4,00,000; slabs up to ₹24,00,000; 87A rebate up to ₹12,00,000 (Max ₹60,000 rebate); Standard Deduction ₹75,000.
  - **AY 2025-26:** Basic exemption ₹3,00,000; Standard Deduction ₹75,00,00; STCG @ 20%, LTCG @ 12.5% (>₹1.25L exemption); 87A rebate up to ₹7,00,000.
  - **AY 2024-25:** Basic exemption ₹3,00,000; Standard Deduction ₹50,000; STCG @ 15%, LTCG @ 10% (>₹1L exemption); 87A rebate up to ₹7,00,000.
  - **AY 2023-24:** Basic exemption ₹2,50,000; 87A rebate up to ₹5,00,000; Standard Deduction ₹0 in New Regime.
  - **Old Regime Matrix:** Uniform slab structure (₹2.5L / ₹5L / ₹10L @ 5%, 20%, 30%), Section 87A rebate up to ₹5L (Max ₹12,500), 4% Health & Education Cess across all regimes.
- **Presumptive Taxation (Sections 44AD & 44ADA):**
  - Section 44AD: Business turnover & presumptive net profit calculation (configurable profit margin %; default 20% for retail/trading or custom 6%/8%).
  - Section 44ADA: Professional gross receipts calculation (default 50% deemed profit).
  - Bi-directional computation: Calculate Deemed Income from Gross Turnover OR derive Gross Turnover required for a target Deemed Income.
- **Salary Income Module:**
  - Gross salary breakdown, automated Standard Deduction application (capped to gross salary), Professional Tax (PTax) deduction, and HRA exemption u/s 10(13A) for Old Regime.
- **Capital Gains & Trading P&L:**
  - Short-Term Capital Gains u/s 111A (flat rate calculation).
  - Long-Term Capital Gains u/s 112A (statutory threshold deduction and surplus tax calculation).
  - Speculative / Intra-day Business Profit & Loss aggregation.
- **Chapter VI-A Deductions (Old Regime):**
  - Section 80C (Life insurance, PPF, ELSS, EPF - capped at ₹1,50,000).
  - Section 80D (Health Insurance - self, family, senior citizen parents - capped at ₹1,00,000).
  - Section 80CCD(1B) (National Pension Scheme - capped at ₹50,000).
  - Section 80G (Donations to charitable funds).
  - Section 80TTA (Savings account interest deduction up to ₹10,000).
- **Statutory Rounding Off:**
  - Total Taxable Income rounded off to the nearest ₹10 under **Section 288A**.
  - Total Tax Payable / Refund rounded off to the nearest ₹10 under **Section 288B**.
- **Live Regime Comparison Matrix:**
  - Real-time parallel calculation of New Regime vs. Old Regime.
  - Clear visual indicator showing the optimal regime and exact rupee tax savings.

#### 4.2 Module 2: Intelligent TDS & Interest Automation Engines
- **Business-Type Aware TDS Generator (`TDSEngine`):**
  - Automatically identifies business profile (Retail Trade, Mobile Store, Electronics, Grocery, Professional Services).
  - Generates realistic TDS credit records:
    - **Section 194H:** Payment gateway fees & commission (Razorpay, Paytm, PhonePe).
    - **Section 194C:** Transport & courier logistics (Delhivery, BlueDart, Ekart) for turnover > ₹15 Lakhs.
    - **Section 194J:** Professional & technical service fees.
    - **Section 194N:** Cash withdrawal tax for turnover > ₹2 Crore.
  - Multi-deductor selection, realistic TAN generation, gross transaction base back-calculation, and chronological quarterly distribution.
- **Interest Distribution Engine (`InterestEngine`):**
  - Automatically distributes total annual savings interest across client's active savings bank accounts.
  - Excludes Current Accounts (CA receives strictly ₹0 interest).
  - Auto-generate algorithm calculating realistic interest based on gross income (approx. 0.04%, clamped between ₹1,200 and ₹8,000).

#### 4.3 Module 3: Client Database & CRM (`DB`)
- **Full Lifecycle Client Management:** Create, view, update, search, duplicate, and soft-delete client computation files.
- **Recycle Bin (Soft-Delete Architecture):** Accidental deletions are routed to the Recycle Bin with options for individual restoration, bulk restoration, bulk permanent deletion, and complete purge.
- **Instant Search & Filter:** Sub-millisecond filter by Client Name, PAN card number, and Mobile number.
- **CSV Export:** Comprehensive data export including PAN, Father Name, Assessment Year, Section, Total Income, Tax Due, Refund, Mobile, and Filing Date.
- **Client Duplicate Feature:** 1-click duplication to easily create revised returns or roll over records to a new Assessment Year.
- **Storage Quota Telemetry:** Real-time diagnostics monitoring browser `localStorage` utilization in Bytes, KB, and MB, with safety warnings at 90% capacity.

#### 4.4 Module 4: Multi-Format Report & Receipt Generation Suite
- **CompuTax Classic Report (`ReportClassic`):**
  - Multi-page A4 computation sheet styled after traditional Indian CA practice software.
  - Includes Assessee particulars, Filing section, Computation Number (`CMP-YYYY-NNNNNN`), Gross Total Income, Deductions, Slab-wise breakdown, and Annexures:
    - *Annexure A:* Computation of Business Income u/s 44AD / 44ADA.
    - *Annexure B:* Capital Gains statement.
    - *Annexure C:* Bank Interest & Account listing.
    - *Annexure D:* Chapter VI-A itemized deduction schedule.
    - *Annexure E:* Head-wise Income Summary.
    - *Annexure F:* TIS/AIS Comparison schedule.
    - *Annexure G:* Particulars of Balance Sheet u/s 44AD (Debtors, Creditors, Stock, Cash, Capital).
    - *Verification:* Signature block, Date, Place, and Office / Preparer stamp.
- **Modern Executive Report (`ReportModern`):**
  - High-impact presentation report for corporate clients and bank loan officers.
  - Gradient header, key metric summary cards (Total Income, Tax Due, Net Refund), timeline view, and visual breakdown charts.
- **ITR-V Acknowledgement Receipt (`ReportAck`):**
  - 100% pixel-perfect replica of the official Income Tax Department e-Filing Acknowledgement.
  - Features official watermark, DejaVu Sans font rendering, 15-digit e-Filing Ack Number, verified barcode (PDF417 style), electronic verification code (EVC), and official statutory warning banners. Calibrated strictly for a single A4 page.

#### 4.5 Module 5: Corporate Salary Slip Generator (`SalarySlipEngine`)
- **Company Master Management:** Configurable corporate profiles (Company Name, Full Address, Contact No, Email, Corporate Logo/Badge).
- **Employee Information Master:** Employee Code auto-generation, Name, Designation, Department, Date of Joining, Bank Name, Account Number, IFSC, PAN, UAN, PF Number, ESI Number.
- **Attendance Registry:** Total Calendar Days, Paid Days, Present Days, Absent / LOP (Loss of Pay) Days.
- **Earnings & Deductions Calculator:**
  - Earnings: Basic Salary, HRA, Conveyance, Special Allowance, Medical Allowance, Overtime, Performance Bonus.
  - Deductions: Provident Fund (PF), Employee State Insurance (ESI), Professional Tax (PTax), Income Tax (TDS), Loan/Advance Recovery.
  - Automated conversion of Net Pay into Indian English words (e.g., *"Rupees Forty-Five Thousand Two Hundred Only"*).
- **Batch Processing:** Generate, preview, print, and save multiple consecutive months for an employee in one continuous operation.

#### 4.6 Module 6: High-Fidelity Bank Statement Generator (`BankStatementEngine`)
- **Default Statement Format (ICICI Detailed Statement):**
  - High-fidelity replica of the official ICICI Bank Detailed Statement. Serves as the primary default rendering template for all bank accounts unless another optional format is explicitly chosen.
  - Features 9-column ledger (Sl No, Tran Id, Value Date, Transaction Date, Cheque/Ref No, Remarks, Withdrawal Dr, Deposit Cr, Balance), account metadata grid, advanced search box, statement totals, and 30-point official ICICI transaction legends.
- **Optional Bank Statement Formats:**
  - **Axis Bank Statement (Exact PDF Replica):**
    - Authentic 7-column ledger: `Tran Date`, `Chq No`, `Particulars`, `Debit`, `Credit`, `Balance`, `Init. Br`.
    - Centered official Axis Bank Burgundy vector logo & wordmark (`#97144D`).
    - Two-column header: Left column with Customer Name, Joint Holder, stacked Address lines, Registered Mobile, Registered Email, Scheme (e.g., `BURGUNDY - SAVINGS ACCOUNT`), and Currency (`INR`); Right column with Customer ID, IFSC (`UTIB0005971`), MICR (`743211009`), Nominee Registration (`Y`), Nominee Name (`NAFICHA RAHAN`), and PAN (`CYMPR5097Q`).
    - Statement period header: `Statement of Axis Account No: <acNo> for the period (From: <fromDate> To: <toDate>)`.
    - Opening Balance row, transaction list with multi-line narrative wrapping, `TRANSACTION TOTAL` row with sum of Debits & Credits, and `CLOSING BALANCE` row.
    - Official regulatory disclaimers, Registered Office (`AXIS BANK LTD, TRISHUL... Ellisbridge, Ahmedabad`), Branch Address with telephone contact, and official 15-point Axis Bank transaction legends (`ICONN`, `VMT-ICON`, `AUTOSWEEP`, `REV SWEEP`, `SETU`, etc.) terminating with `++++ End of Statement ++++`.
  - **Other Optional Formats:** Standard Modern Statement, SBI, and HDFC templates available via the Statement Style selector.
- **Multi-Bank Letterheads & Logo Resolution:** Tri-tier logo hierarchy: Local SVG/PNG asset &rarr; Brandfetch API &rarr; High-resolution Google Favicon fallback.
- **Chronological Balance Simulation:**
  - Generates realistic credit and debit transactions over custom date ranges.
  - Supports transaction personas: Salaried Individual (monthly salary credits, bill payments), Retail Trader (daily UPI/POS credits, vendor transfers), Professional Consultant, High Net Worth.
  - Authentic transaction narrations (UPI/P2A, NEFT, IMPS, POS, ATM cash withdrawals, quarterly interest credits).
  - Maintains accurate running daily balances with minimum balance threshold rules.
- **Monthly Summary Metrics:** Total deposits, total withdrawals, cheque clearing totals, and Average Monthly Balance (AMB).

#### 4.7 Module 7: Supabase Cloud Synchronization Hub (`SupabaseSync`)
- **Zero-Friction Hybrid Sync:** Retains all client data locally while offering optional multi-device backup to a secure Supabase PostgreSQL database.
- **Debounced Auto-Sync:** Automatically triggers a silent cloud snapshot 2 seconds after any data mutation (client add, delete, admin update).
- **Empty-Workspace Overwrite Guard:** Prohibits automatic blank syncs from overriding cloud backups when opening the app on a fresh device.
- **Auto-Restore on First Boot:** Automatically detects an empty browser state and restores the latest cloud snapshot seamlessly.
- **Snapshot Manager:** View historical cloud snapshots with device ID, client counts, statement counts, and timestamps. Supports both **Replace** and **Smart Merge** (conflict resolution preserving the latest timestamped record).
- **1-Click SQL Setup:** Integrated modal providing pre-formatted PostgreSQL DDL and Row Level Security (RLS) policies for instant database initialization.

#### 4.8 Module 8: External Data Ingestion & Admin Customization
- **AIS / 26AS JSON Importer:** Native file parser capable of extracting PAN, Name, Date of Birth, Gross Receipts, and TDS credit details directly from official Income Tax Department JSON files.
- **Admin Panel Configurations:** Firm Name, Proprietor / Signatory designation, Office Address, Contact details, Custom Assessment Year slab adjustments, and custom TDS deductor directory.
- **Global Input Masking:** Auto-enforces uppercase formatting on PAN, IFSC, TAN, and transaction IDs across all input interfaces.
- **Theme & Accessibility:** Instant Light / Dark mode toggle with zero-flash rendering and comprehensive keyboard navigation shortcuts.

---

### 5. Non-Functional Requirements (NFRs)

| Attribute | Specification & Acceptance Criteria |
| :--- | :--- |
| **Performance** | Initial page render < 500ms; tax recalculation response < 16ms (60 FPS UI performance); zero server network roundtrips for computations. |
| **Data Privacy** | 100% client-side data isolation. Client PAN, financials, and salary records are never transmitted to unauthorized external endpoints. |
| **Reliability** | LocalStorage read/write wrappers intercept `QuotaExceededError` gracefully with user alerts and automated payload pruning. |
| **Print Fidelity** | Standard A4 print layouts strictly adhering to ISO 216 dimensions (210mm x 297mm). Clean page breaks without orphaned table headers. |
| **Browser Support** | Modern Chromium (Chrome, Edge, Brave), Firefox, and Safari on Windows, macOS, and Linux. Responsive layout scaling down to mobile viewports. |
| **Offline Capability** | Fully operable without an active internet connection (using cached assets, embedded fonts, and local IFSC/Bank lookup tables). |

---

### 6. Release Milestones & Roadmap

- **Phase 1 (Completed - v1.0.0):** Core tax engine (AY 2023-27), Wizard workflow, Client DB with Recycle Bin, CompuTax Classic and Modern reports, 1:1 ITR Acknowledgement replica, Supabase cloud sync engine.
- **Phase 2 (Completed - Current):** Integrated Salary Slip Engine with batch generation, High-Fidelity Bank Statement Generator with Brandfetch/Favicon integration, AIS/26AS JSON parser.
- **Phase 3 (Upcoming):** Direct JSON export matching official ITR-1 / ITR-4 utility schema for 1-click upload to the Income Tax e-Filing portal; multi-user RBAC for multi-branch CA firms.
