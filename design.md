# UI/UX Design System & Style Guide
## SS INFOTECH – Tax Computation Pro

**Document Version:** 1.0.0  
**Design Philosophy:** Modern Indian FinTech & Accounting Workspace  
**Theme Engine:** Dual-Mode (Light & Dark) with Instant Zero-Flash CSS Attribute Switching  
**Typography Core:** DM Sans (UI), Manrope (Metrics), DejaVu Sans (ITR Replica), Times New Roman (Classic Audit)  

---

### 1. Design Philosophy & Visual Principles

**SS INFOTECH – Tax Computation Pro** combines the rigorous data density required by Indian accounting professionals with modern FinTech ergonomics. The visual system adheres to four foundational tenets:

1. **High Information Density with Visual Breathing Room:** Tax consultants process hundreds of monetary figures rapidly. Clean borders, structured card groupings, and subtle zebra striping prevent cognitive overload without wasting screen real estate.
2. **Instant Visual Feedback:** Form inputs, regime comparisons, and slab breakdowns update synchronously as the user types, delivering confidence in computational accuracy.
3. **Print-Perfect Output:** Reports and official acknowledgements are designed from the ground up to render flawlessly on standard physical A4 sheets without unwanted spillover, clipped text, or broken tables.
4. **Zero-Flash Theme Adaptability:** Dual-mode styling persists through `localStorage` and initializes synchronously in the document `<head>` to eliminate white-flash transitions upon page load.

---

### 2. Design Tokens & Color Palette (Stitch Luminous Glassmorphism)

The interface is driven by CSS custom properties bound to the `:root` pseudo-class and updated dynamically via the `[data-theme="light"]` / `[data-theme="dark"]` attributes, adopting the **Luminous Taxation** aesthetic.

```
                    LIGHT MODE                              DARK MODE (Luminous Glass)
┌─────────────────────────────────────────┐    ┌─────────────────────────────────────────┐
│ Primary Brand:    #4f46e5 (Indigo)      │    │ Primary Brand:    #6366f1 (Elec. Indigo)│
│ Secondary:        #8b5cf6 (Violet)      │    │ Secondary:        #8b5cf6 (Violet)      │
│ Body Background:  #f8fafc (Pure Slate)  │    │ Body Background:  #051424 (Space Navy)  │
│ Surface (Cards):  #ffffff (White Card)  │    │ Surface (Cards):  #0d1c2d (Tiered Glass)│
│ Card Glass Fill:  #ffffff (Crisp)       │    │ Card Glass Fill:  rgba(13,28,45, 0.75)  │
│ Border Color:     #e2e8f0 (Border)      │    │ Border Color:     rgba(255,255,255,0.08)│
│ Text Primary:     #0f172a (High Contrast│    │ Text Primary:     #f1f5f9 (Pristine)    │
│ Text Muted:       #334155 (Slate 700)   │    │ Text Muted:       #94a3b8 (Slate 400)   │
└─────────────────────────────────────────┘    └─────────────────────────────────────────┘
```

#### 2.1 CSS Custom Properties Token Map

```css
/* Dark Theme Defaults (Stitch Luminous Glassmorphism) */
:root {
  --font-base: 'DM Sans', 'Inter', -apple-system, sans-serif;
  --font-mono: 'Manrope', monospace;

  /* Brand Colors */
  --primary: #6366f1;
  --primary-light: #818cf8;
  --primary-dark: #4f46e5;
  --secondary: #8b5cf6;
  --secondary-light: #a78bfa;

  /* Surfaces & Glassmorphism */
  --bg: #051424;
  --bg2: #091728;
  --surface: #0d1c2d;
  --surface-hover: #14273d;
  --surface-active: rgba(99, 102, 241, 0.16);
  --surface-card: rgba(13, 28, 45, 0.75);
  --border: rgba(255, 255, 255, 0.08);
  --border-accent: rgba(99, 102, 241, 0.45);
  --glow-primary: 0 0 22px rgba(99, 102, 241, 0.28), 0 0 64px rgba(99, 102, 241, 0.1);
  --radius: 12px;
  --radius-sm: 8px;
  --radius-lg: 18px;
}

  /* Typography */
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #64748b;

  /* Status Colors */
  --color-success: #059669;       /* Refund Due / Verified */
  --color-success-bg: #ecfdf5;
  --color-danger: #dc2626;        /* Tax Due / Action Needed */
  --color-danger-bg: #fef2f2;
  --color-info: #0284c7;          /* General Notice */
  --color-info-bg: #f0f9ff;
  --color-warning: #d97706;       /* Deadlines & Attention */
  --color-warning-bg: #fffbeb;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.04);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.05);
}

/* Dark Theme Overrides */
[data-theme="dark"] {
  --bg-body: #0b0f19;
  --surface: #131a29;
  --surface-subtle: #1a2336;
  --surface-card: #131a29;
  --border-color: #223048;
  --border-color-focus: #3b82f6;

  --text-primary: #f8fafc;
  --text-secondary: #cbd5e1;
  --text-muted: #94a3b8;

  --brand-primary: #3b82f6;
  --brand-primary-hover: #60a5fa;
  --brand-primary-subtle: rgba(59, 130, 246, 0.15);

  --color-success: #10b981;
  --color-success-bg: rgba(16, 185, 129, 0.15);
  --color-danger: #ef4444;
  --color-danger-bg: rgba(239, 68, 68, 0.15);
  --color-info: #38bdf8;
  --color-info-bg: rgba(56, 189, 248, 0.15);
  --color-warning: #f59e0b;
  --color-warning-bg: rgba(245, 158, 11, 0.15);

  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.5);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.6);
}
```

---

### 3. Typography Hierarchy

The system pairs Google's **DM Sans** for human-centric readability with **Manrope** for financial numbers. Specialized font stacks are loaded for formal documents:

| Role | Font Family | Weights | Usage & Characteristics |
| :--- | :--- | :--- | :--- |
| **Primary UI & Headings** | `'DM Sans', sans-serif` | 400, 500, 600, 700 | Sidebar items, form field labels, modals, wizard steps, tables. |
| **Financial Metrics & KPIs** | `'Manrope', monospace` | 600, 700, 800 | Dashboard KPI cards, computation totals, tax comparison cards. |
| **Official ITR Acknowledgement** | `'DejaVu Sans', sans-serif` | 400, 700 | Official Income Tax Department receipt replica. |
| **CompuTax Classic Reports** | `'Times New Roman', serif` | 400, 700 | Traditional multi-page A4 audit computation reports. |

```
Typography Scale:
  Display Heading:   28px (1.75rem)  | Weight 800 (Manrope)
  Section Title:     18px (1.125rem) | Weight 700 (DM Sans)
  Card Subheading:   15px (0.937rem) | Weight 600 (DM Sans)
  Standard Body:     13.5px (0.84rem)| Weight 400/500 (DM Sans)
  Small / Meta Text: 12px (0.75rem)  | Weight 400/500 (DM Sans)
  Legal Footnotes:   10.5px (0.65rem)| Weight 400
```

---

### 4. Layout Architecture & UI Components

#### 4.1 Fixed Navigation Sidebar
- **Width:** 260px desktop (collapses to an off-canvas drawer with dimming overlay on mobile devices under 992px).
- **Branding Block:** Prominent SS INFOTECH logo with brand subtitle and calculator glyph.
- **Navigation Links:** Divided into logical sections (`MAIN` and `SETTINGS`). Active states feature a distinct left accent border and brand-tinted background highlight.
- **Footer Utilities:** Embedded zero-latency theme toggle switch and persistent current Assessment Year tag (`AY 2026-27`).

#### 4.2 Application Topbar
- **Height:** 64px sticky bar at the top of the main viewport.
- **Sidebar Hamburger Toggle:** Controls mobile drawer visibility.
- **Active Section Breadcrumb:** Displays dynamic icon and page title (e.g., *Client Database*, *New Computation*).
- **Supabase Cloud Status Widget (`#topbarCloudSync`):** Interactive status badge showing live connection states:
  - *Checking Cloud...* (Pulsing amber spinner)
  - *Cloud Connected* (Emerald cloud icon with record counts)
  - *Sync Now* (Integrated refresh button triggering immediate snapshot push)
- **Current Assessment Year Badge (`#currentAY`):** Visual calendar badge keeping the active tax year visible at all times.

#### 4.3 5-Step Computation Wizard
The wizard guides the practitioner systematically through returns preparation:
```
[ 1. Personal ] ──── [ 2. Business ] ──── [ 3. Bank ] ──── [ 4. Income ] ──── [ 5. Preview ]
```
- **Step 1 (Personal):** PAN, Assessee Name, Father's Name, DOB, Gender, Status, Residential Status, Address, and 1-click **AIS / 26AS JSON Import** button.
- **Step 2 (Business):** Presumptive selection (44AD Business vs 44ADA Professional), Turnover / Gross receipts, Profit %, and auto-calculated Balance Sheet values.
- **Step 3 (Bank):** Multiple bank account entries (IFSC auto-lookup, Account No, Savings vs Current, Refund credit nomination).
- **Step 4 (Income Heads & Deductions):** Salary with Standard Deduction, Capital Gains (STCG/LTCG), Speculative P&L, Chapter VI-A deductions (80C, 80D, 80CCD, 80G, 80TTA), and TDS breakdown.
- **Step 5 (Preview & Comparison):** High-level tax summary with live side-by-side New vs Old Regime comparison, report type selection, and instant print trigger.

#### 4.4 Live Regime Comparator Card
A focal UX element located on the Preview step:
- Side-by-side comparison cards for **New Regime** and **Old Regime**.
- Highlights Gross Total Income, Chapter VI-A Deductions allowed, Taxable Income, Slab Tax, Section 87A Rebate, and Net Tax.
- Displays an automated recommendation badge:
  - `RECOMMENDED: NEW REGIME` (with exact rupee tax savings)
  - `RECOMMENDED: OLD REGIME` (with exact rupee tax savings)
  - `BOTH REGIMES EQUAL`

#### 4.5 Global Form Ergonomics
- **Auto-Uppercase Masking:** Inputs designated for PAN, TAN, IFSC, Bank Account, and Transaction Reference auto-transform lowercase keystrokes into uppercase characters in real time while preserving caret placement.
- **Rupee Formatters:** Numerical summary values are formatted using the Indian numbering system (e.g., `₹ 12,45,000` rather than `₹ 1,245,000`).

---

### 5. Print & Document Styling Engine

The application includes print styling rules (`@media print`) that adapt the display for physical printers and PDF generators without manual resizing.

```css
@media print {
  /* Suppress screen chrome */
  #sidebar, .topbar, .wizard-steps, .wizard-nav-btns,
  .btn, .sidebar-overlay, .toast-container {
    display: none !important;
  }

  /* Reset document flow */
  body, .main-wrapper, .page-content {
    background: #ffffff !important;
    color: #000000 !important;
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
  }

  @page {
    size: A4 portrait;
    margin: 10mm 12mm 10mm 12mm;
  }

  /* Page Break Hygiene */
  .rpt-page-break {
    page-break-before: always !important;
    break-before: page !important;
  }

  .rpt-section, .table, tr {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
}
```

#### 5.1 Document Archetypes

1. **CompuTax Classic Report (`ReportClassic`):**
   - Styled after traditional CA audit printouts.
   - Distinct dotted rule separators (`.rpt-dots`) between ledger labels and numbers.
   - Dual-underline grand total borders.
   - Clear annexure titles (`Annexure A: Presumptive Business Income`, `Annexure G: Balance Sheet`).
   - Assessee & Office verification block at the end.

2. **Modern Executive Report (`ReportModern`):**
   - Color-accented gradient header bar.
   - Key metric KPI boxes for Total Income, Tax Due, and Net Refund with status badges.
   - Clean horizontal divider cards suitable for presentation to bank underwriters and credit analysts.

3. **Official ITR Acknowledgement (`ReportAck`):**
   - 100% pixel-perfect replica of the official Income Tax Department ITR-V form.
   - Rendered with `DejaVu Sans` font for authentic government receipt typography.
   - Government watermark centered behind the document body.
   - Official national emblem block, Form Type (ITR-1 / ITR-4) designation, and 15-digit E-filing Acknowledgement Number.
   - High-density 2D PDF417-style barcode canvas.
   - Strict CSS constraints ensuring content fits entirely onto a single A4 page.

4. **ICICI Detailed Bank Statement (Default Bank Template):**
   - Standard 9-column ledger grid with dark navy brand headers and structured customer/branch metadata table.
   - Advanced Search criteria box, statement period totals card, and official 30-point banking transaction legends.

5. **Axis Bank Statement (Optional PDF Replica Template):**
   - Pure Times New Roman serif typography matching official Axis Bank branch statements.
   - Centered Axis Burgundy (`#97144D`) logo and wordmark header.
   - Two-column metadata block: Left column with Customer Name, Joint Holder, stacked Address lines, Mobile, Email, Scheme, Currency; Right column with Customer ID, IFSC, MICR, Nominee, PAN.
   - 7-column ledger (`Tran Date`, `Chq No`, `Particulars`, `Debit`, `Credit`, `Balance`, `Init. Br`) with crisp 1px solid black grid borders.
   - Formal transaction total row, closing balance row, comprehensive legal and regulatory disclaimers, Registered Office, Branch contact, and 15-point transaction legends ending with `++++ End of Statement ++++`.

---

### 6. Accessibility & Responsive Design

- **Viewport Adaptability:** Tested across screen resolutions from 360px mobile viewports to 4K ultra-wide monitors.
- **Keyboard Shortcuts:**
  - `Alt + N`: Navigate to New Computation
  - `Alt + D`: Navigate to Dashboard
  - `Alt + C`: Navigate to Client Database
  - `Alt + S`: Navigate to Salary Slip Generator
  - `Alt + B`: Navigate to Bank Statement Generator
  - `Alt + A`: Navigate to Admin Panel
  - `Escape`: Close active modal dialog or print preview
- **Color Contrast:** Both light and dark theme text colors maintain a minimum contrast ratio of 4.5:1 against their corresponding surfaces, satisfying WCAG AA standards.
