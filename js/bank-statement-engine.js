/**
 * ═══════════════════════════════════════════════════════════════════════
 * BANK STATEMENT ENGINE – High-Fidelity Multi-Bank & ICICI Detailed Generator
 * ═══════════════════════════════════════════════════════════════════════
 */
let _BankLogos = typeof BankLogos !== 'undefined' ? BankLogos : null;
if (!_BankLogos && typeof require !== 'undefined') {
  try {
    _BankLogos = require('./bank-logos.js');
  } catch (e) {}
}

const BankStatementEngine = (() => {

  const _getBL = () => (_BankLogos || (typeof BankLogos !== 'undefined' ? BankLogos : null));

  const DEFAULT_MIN_BALANCE = 25000;

  // ── Bank Domain Mapping for Brandfetch & Favicon APIs ────────────────
  const BANK_DOMAINS = {
    'STATE BANK OF INDIA': 'sbi.co.in',
    'SBI': 'sbi.co.in',
    'HDFC BANK': 'hdfcbank.com',
    'HDFC BANK LTD': 'hdfcbank.com',
    'HDFC': 'hdfcbank.com',
    'ICICI BANK': 'icicibank.com',
    'ICICI BANK LTD': 'icicibank.com',
    'ICICI': 'icicibank.com',
    'AXIS BANK': 'axisbank.com',
    'AXIS BANK LTD': 'axisbank.com',
    'AXIS': 'axisbank.com',
    'KOTAK MAHINDRA BANK': 'kotak.com',
    'KOTAK MAHINDRA BANK LTD': 'kotak.com',
    'KOTAK': 'kotak.com',
    'PUNJAB NATIONAL BANK': 'pnbindia.in',
    'PNB': 'pnbindia.in',
    'BANK OF BARODA': 'bankofbaroda.in',
    'BOB': 'bankofbaroda.in',
    'CANARA BANK': 'canarabank.com',
    'CANARA': 'canarabank.com',
    'UNION BANK OF INDIA': 'unionbankofindia.co.in',
    'UNION BANK': 'unionbankofindia.co.in',
    'BANK OF INDIA': 'bankofindia.co.in',
    'BOI': 'bankofindia.co.in',
    'INDIAN OVERSEAS BANK': 'iob.in',
    'IOB': 'iob.in',
    'UCO BANK': 'ucobank.com',
    'UCO': 'ucobank.com',
    'CENTRAL BANK OF INDIA': 'centralbankofindia.co.in',
    'CBI': 'centralbankofindia.co.in',
    'IDBI BANK': 'idbibank.in',
    'IDBI BANK LTD': 'idbibank.in',
    'IDBI': 'idbibank.in',
    'INDUSIND BANK': 'indusind.com',
    'INDUSIND BANK LTD': 'indusind.com',
    'INDUSIND': 'indusind.com',
    'YES BANK': 'yesbank.in',
    'YES BANK LTD': 'yesbank.in',
    'FEDERAL BANK': 'federalbank.co.in',
    'FEDERAL BANK LTD': 'federalbank.co.in',
    'SOUTH INDIAN BANK': 'southindianbank.com',
    'SOUTH INDIAN BANK LTD': 'southindianbank.com',
    'KARUR VYSYA BANK': 'kvb.co.in',
    'CITY UNION BANK': 'cityunionbank.com',
    'CITY UNION BANK LTD': 'cityunionbank.com',
    'BANDHAN BANK': 'bandhanbank.com',
    'BANDHAN BANK LTD': 'bandhanbank.com',
    'PAYTM PAYMENTS BANK': 'paytmbank.com',
    'PAYTM PAYMENTS BANK LTD': 'paytmbank.com',
    'AIRTEL PAYMENTS BANK': 'airtel.in',
    'AIRTEL PAYMENTS BANK LTD': 'airtel.in',
    'INDIA POST PAYMENTS BANK': 'ippbonline.com',
    'IDFC FIRST BANK': 'idfcfirstbank.com',
    'IDFC FIRST BANK LTD': 'idfcfirstbank.com',
    'IDFC': 'idfcfirstbank.com',
    'RBL BANK': 'rblbank.com',
    'RBL BANK LTD': 'rblbank.com',
    'AU SMALL FINANCE BANK': 'aubank.in',
    'EQUITAS SMALL FINANCE BANK': 'equitasbank.com'
  };

  const DOMAIN_BY_KEY = {
    'SBI': 'sbi.co.in',
    'HDFC': 'hdfcbank.com',
    'ICICI': 'icicibank.com',
    'AXIS': 'axisbank.com',
    'KOTAK': 'kotak.com',
    'PNB': 'pnbindia.in',
    'BOB': 'bankofbaroda.in',
    'CANARA': 'canarabank.com',
    'UNION': 'unionbankofindia.co.in',
    'BOI': 'bankofindia.co.in',
    'IOB': 'iob.in',
    'UCO': 'ucobank.com',
    'CENTRAL': 'centralbankofindia.co.in',
    'IDBI': 'idbibank.in',
    'INDUSIND': 'indusind.com',
    'YES': 'yesbank.in',
    'FEDERAL': 'federalbank.co.in',
    'SIB': 'southindianbank.com',
    'KVB': 'kvb.co.in',
    'CUB': 'cityunionbank.com',
    'BANDHAN': 'bandhanbank.com',
    'PAYTM': 'paytmbank.com',
    'AIRTEL': 'airtel.in',
    'IPPB': 'ippbonline.com',
    'IDFC': 'idfcfirstbank.com',
    'RBL': 'rblbank.com',
    'AU': 'aubank.in',
    'EQUITAS': 'equitasbank.com'
  };

  function getBankDomain(name) {
    if (!name) return 'bank.com';
    const upper = name.trim().toUpperCase();
    if (BANK_DOMAINS[upper]) return BANK_DOMAINS[upper];
    const stripped = upper.replace(/\s+(LIMITED|LTD|PVT|PRIVATE)\b/g, '').trim();
    if (BANK_DOMAINS[stripped]) return BANK_DOMAINS[stripped];

    const bl = _getBL();
    if (bl && bl.normalizeKey) {
      const key = bl.normalizeKey(upper);
      if (DOMAIN_BY_KEY[key]) return DOMAIN_BY_KEY[key];
    }
    return `${stripped.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
  }

  const BRANDFETCH_API_KEY = 'lJ4dlae8YLrTAa4ueHBuIHSocbZFY7V4Wh5QmB402s_vUAfl-VC6fVNwIGIc7qyCYP42a-6mWMgvQdlcbG7pcQ';

  function getBrandfetchLogo(bankName, w = 300, h = 100) {
    const bl = _getBL();
    if (bl && bl.hasLogo(bankName)) {
      return bl.getLogo(bankName);
    }
    const domain = getBankDomain(bankName);
    const keyParam = BRANDFETCH_API_KEY ? `?c=${encodeURIComponent(BRANDFETCH_API_KEY)}` : '';
    return `https://cdn.brandfetch.io/${domain}/w/${w}/h/${h}${keyParam}`;
  }

  // ── Authentic Remarks Pool from Real Bank Statement PDF ───────────────
  const REMARKS_POOL = {
    upi_credits: [
      { tpl: 'UPI/MUKUL RAHA/9735545164-33@/Payment fr/AXIS BANK/{REF12}/YBL{HEX24}', desc: 'UPI from Mukul Raha (Axis)' },
      { tpl: 'UPI/FARUK ALI/7584804774-2@y/Payment fr/HDFC BANK/{REF12}/YBL{HEX24}', desc: 'UPI from Faruk Ali (HDFC)' },
      { tpl: 'UPI/FARUK ALI/farukalimondal/Payment fr/AIRTEL PAY/{REF12}/IBL{HEX24}', desc: 'UPI from Faruk Ali (Airtel)' },
      { tpl: 'UPI/MD SAKIBUL/sakibulislam33/Payment fr/HDFC BANK/{REF12}/YBL{HEX24}', desc: 'UPI from MD Sakibul (HDFC)' },
      { tpl: 'UPI/JOSIM IKBA/josim.ikbal@yb/Payment fr/Punjab Nat/{REF12}/YBL{HEX24}', desc: 'UPI from Josim Ikbal (PNB)' },
      { tpl: 'UPI/JOSIM IKBA/josim.ikbal@ax/Payment fr/Punjab Nat/{REF12}/AXL{HEX24}', desc: 'UPI from Josim Ikbal (PNB Axis)' },
      { tpl: 'UPI/MD SA SUJA/sasujalic@axl/Payment fr/State Bank/{REF12}/AXL{HEX24}', desc: 'UPI from MD Sa Suja (SBI)' },
      { tpl: 'UPI/MD SA SUJA/sasujalic@ibl/Payment fr/State Bank/{REF12}/IBL{HEX24}', desc: 'UPI from MD Sa Suja (SBI)' },
      { tpl: 'UPI/RUHUL AMIN/8250203580-2@a/Payment fr/AXIS BANK/{REF12}/AXL{HEX24}', desc: 'UPI from Ruhul Amin (Axis)' },
      { tpl: 'UPI/SAMIM DRES/8926001239-3@y/Payment fr/Punjab Nat/{REF12}/YBL{HEX24}', desc: 'UPI from Samim Dresses (PNB)' },
      { tpl: 'UPI/SAMIM DRES/8926001239-3@i/Payment fr/Punjab Nat/{REF12}/IBL{HEX24}', desc: 'UPI from Samim Dresses (PNB)' },
      { tpl: 'UPI/NAFICHA RA/9635848055@ibl/Payment fr/HDFC BANK/{REF12}/IBL{HEX24}', desc: 'UPI from Naficha Rahaman (HDFC)' },
      { tpl: 'UPI/NAFICHA RA/9635848055@yb/Payment fr/HDFC BANK/{REF12}/YBL{HEX24}', desc: 'UPI from Naficha Rahaman (HDFC)' },
      { tpl: 'UPI/Mr JAKIR H/9641927976@axl/Payment fr/CENTRAL BA/{REF12}/AXL{HEX24}', desc: 'UPI from Jakir Hossain (CBI)' },
      { tpl: 'UPI/Mr JAKIR H/9641927976@ibl/Payment fr/CENTRAL BA/{REF12}/BL{HEX24}', desc: 'UPI from Jakir Hossain (CBI)' },
      { tpl: 'UPI/MD KUTUBUD/9564061285-5@i/Payment fr/BANK OF IN/{REF12}/IBL{HEX24}', desc: 'UPI from Kutubuddin (BOI)' },
      { tpl: 'UPI/SUBHARAJ A/subharajakunji/Payment fr/State Bank/{REF12}/IBL{HEX24}', desc: 'UPI from Subharaj (SBI)' },
      { tpl: 'UPI/SS INFOTEC/9735545164-31@/Payment fr/BANK OF IN/{REF12}/YBL{HEX24}', desc: 'UPI from SS INFOTECH (BOI)' },
      { tpl: 'UPI/Master MUKU/mukulcentral00/Payment fr/CENTRAL BA/{REF12}/IBL{HEX24}', desc: 'UPI from Mukul (Central Bank)' },
      { tpl: 'UPI/ADHIKARY E/9593884464-9@y/Payment fr/State Bank/{REF12}/YBL{HEX24}', desc: 'UPI from Adhikary (SBI)' },
      { tpl: 'UPI/ALAMGIR MO/8617629376sbi@/Payment fr/State Bank/{REF12}/AXL{HEX24}', desc: 'UPI from Alamgir (SBI)' },
      { tpl: 'UPI/Jahangir M/8167091512-2@y/Payment fr/State Bank/{REF12}/YBL{HEX24}', desc: 'UPI from Jahangir (SBI)' },
      { tpl: 'UPI/SABANA HOS/9073025001-2@y/na/UCO BANK/{REF12}/ICIW{HEX24}', desc: 'UPI from Sabana (UCO)' },
      { tpl: 'UPI/Mr Vijendr/9028624696-4@a/Payment fr/INDIAN BAN/{REF12}/AXL{HEX24}', desc: 'UPI from Vijendra (Indian Bank)' }
    ],
    upi_debits: [
      { tpl: 'UPI/CRED Club/cred.club@axis/payment on/AXIS BANK/{REF12}/ACD{HEX24}', desc: 'UPI to CRED Club' },
      { tpl: 'UPI/MR MUKUL R/9735545164-13@/Payment fr/BANDHAN BA/{REF12}/IBL{HEX24}', desc: 'UPI transfer to Bandhan Bank' },
      { tpl: 'UPI/AAMAR KOLK/aamarkolkata me/Payment fr/HDFC BANK/{REF12}/IBL{HEX24}', desc: 'UPI to Aamar Kolkata' },
      { tpl: 'UPI/PURABI ENT/q088762656@ybl/IT{REF8}/YES BANKL/{REF12}/ICI{HEX24}', desc: 'UPI to Purabi Enterprise' },
      { tpl: 'UPI/PURABI ENT/paytmqr5hlewk@/YES BANKL/{REF12}/IBL{HEX24}', desc: 'UPI to Purabi Enterprise QR' },
      { tpl: 'UPI/CSC E Gove/cscegovernance/CSCEGovern/AIRTEL PAY/{REF12}/UPI{HEX24}', desc: 'UPI to CSC E-Governance' },
      { tpl: 'UPI/Digitalsev/Digitalseva.pa/UPIIntent/AIRTEL PAY/{REF12}/PPPL{HEX24}', desc: 'UPI to Digital Seva Portal' },
      { tpl: 'UPI/Amazon Pay/amazonpaybalan/Request fr/Amazon RBL/{REF12}/RBA{HEX24}', desc: 'UPI to Amazon Pay' },
      { tpl: 'UPI/UNIQUE IDE/resident.uidai/UPIIntent/AXIS BANK/{REF12}/PPPL{HEX24}', desc: 'UPI to UIDAI Aadhaar' },
      { tpl: 'UPI/GRIPS 2/sbiepay.grips2/GRIPS 2.0/State Bank/{REF12}/UPI{HEX24}', desc: 'UPI to GRIPS Govt Portal' },
      { tpl: 'UPI/SBI FASTAG/netc.34161fa82/na/State Bank/{REF12}/ICIW{HEX24}', desc: 'UPI to SBI FASTag' },
      { tpl: 'UPI/RELIANCE J/jio@citibank/JIO20BR000/CITIBANK C/{REF12}/crda{HEX24}', desc: 'UPI to Reliance Jio' },
      { tpl: 'UPI/Indian Rai/bdpg2.iruts@sb/NO REMARKS/State Bank/{REF12}/UPI{HEX24}', desc: 'UPI to IRCTC / Railway' },
      { tpl: 'UPI/WESTBENGAL/WESTBENGALINDU/UPIIntent/AIRTEL PAY/{REF12}/PPPL{HEX24}', desc: 'UPI to WBSEDCL / WB Industrial' },
      { tpl: 'UPI/BAJAJ FINA/bflautopay@hdf/Autopay/HDFC BANK/{REF12}/HDF{HEX24}', desc: 'UPI Autopay to Bajaj Finance' },
      { tpl: 'UPI/Shamma Kha/8293171689-2@y/Payment fr/FINO PAYME/{REF12}/YBL{HEX24}', desc: 'UPI to Shamma Khatun' },
      { tpl: 'UPI/GOLAM RASU/9593444991@yap/Payment fr/State Bank/{REF12}/IBL{HEX24}', desc: 'UPI to Golam Rasul' },
      { tpl: 'UPI/FARUK ALI/farukalimondal/Payment fr/AIRTEL PAY/{REF12}/IBL{HEX24}', desc: 'UPI to Faruk Ali' },
      { tpl: 'UPI/Bank Accou/20324731887@FI/Payment fr/FINO PAYME/{REF12}/IBL{HEX24}', desc: 'UPI to Bank Account' },
      { tpl: 'UPI/KUTUBUDDIN/7001657076@kot/UPI/Kotak Mahi/{REF12}/K811{HEX24}', desc: 'UPI to Kutubuddin' },
      { tpl: 'UPI/BARBEQUENA/barbequenation/NO REMARKS/AXIS BANK/{REF12}/UPI{HEX24}', desc: 'UPI to Barbeque Nation' },
      { tpl: 'UPI/LENSKART P/lenskart1.payu/UPIIntent/HDFC BANK/{REF12}/PPPL{HEX24}', desc: 'UPI to Lenskart' },
      { tpl: 'UPI/bigbasket/bigbasket.payu/UPIIntent/AXIS BANK/{REF12}/PPPL{HEX24}', desc: 'UPI to BigBasket' },
      { tpl: 'UPI/DELHIVERY/delhiverylimit/Transactio/AXIS BANK/{REF12}/UPI{HEX24}', desc: 'UPI to Delhivery Logistics' },
      { tpl: 'UPI/Dominos Pi/dominospizzaon/NO REMARKS/YES BANKL/{REF12}/PYTM{HEX24}', desc: 'UPI to Domino\'s Pizza' }
    ],
    neft_credits: [
      { tpl: 'NEFT-YESF36{REF8}-CHASEOUT TECHNOLOGIES PRIVATE LIMIT-REMETOBENEINFO-059481400005288-YESB000000', desc: 'NEFT from Chaseout Technologies Pvt Ltd' },
      { tpl: 'NEFT-AXNPN{REF10}-PHONEPE LIMITED-PAYMENT AGGREGATOR ESCROW ACCOUNT-F09 M6FOOZ2SYREDEMPT-922020', desc: 'NEFT from PhonePe Escrow Account' },
      { tpl: 'NEFT-HDFCH01181{REF6}-YAPER SECOND INCOME LLP-0001-99909999406669-HDFC0000240', desc: 'NEFT from Yaper Second Income LLP' },
      { tpl: 'NEFT-SBIN526220{REF6}-SHIVAM KUMAR-ATTNINBPAYMENT-00000045359267735-SBIN0016532', desc: 'NEFT from Shivam Kumar' },
      { tpl: 'NEFT-SBIN426224{REF6}-yaper second income LLP-ATTNVENDOR PAY AUG-00000045359267735-SBIN0065136', desc: 'NEFT from Yaper Second Income Vendor Pay' },
      { tpl: 'NEFT-BKID621364{REF6}-SS INFOTECH--433920110000345-BKID0000200', desc: 'NEFT from SS INFOTECH' },
      { tpl: 'NEFT-AXISCN1303{REF6}-MEESHO TECHNOLOGIES PRIVATELIMITED-PAYMENT MEESHO-925020018373648-UTIB000154', desc: 'NEFT from Meesho Technologies' },
      { tpl: 'NEFT-SBIN326216{REF6}-ITDTAX REFUND 2026-27 CYMPR5097Q-ATTNINB-00000033273316893-SBIN0000TBU', desc: 'NEFT Income Tax Refund (ITDTAX)' },
      { tpl: 'NEFT-INDBH{REF10}-JAKIR HOSSAIN-DD-259641927976-INDB0000006', desc: 'NEFT from Jakir Hossain (IndusInd)' },
      { tpl: 'NEFT-IDFB60025{REF6}-Mr Habibur Rahaman--10196115151-IDFB0060132', desc: 'NEFT from Habibur Rahaman (IDFC)' }
    ],
    imps_transfers: [
      { tpl: 'MMT/IMPS/60010956{REF4}/UAMBTransfer to/SS INFOTEC/Bank of India', desc: 'IMPS transfer to SS INFOTECH (BOI)' },
      { tpl: 'MMT/IMPS/60021062{REF4}/UAMBTransfer to/SS INFOTEC/Bank of India', desc: 'IMPS transfer to SS INFOTECH (BOI)' },
      { tpl: 'MMT/IMPS/60041354{REF4}/P2AMOB/HABIBUR RA/Indusind Bank', desc: 'IMPS from Habibur Rahaman (IndusInd)' },
      { tpl: 'MMT/IMPS/60603955{REF4}/IMPS/MUKUL RAHAM/Axis Bank', desc: 'IMPS from Mukul Rahaman (Axis Bank)' },
      { tpl: 'MMT/IMPS/62130701{REF4}/IMPS/MUKUL RAHAM/Axis Bank', desc: 'IMPS from Mukul Rahaman (Axis Bank)' },
      { tpl: 'MMT/IMPS/62171025{REF4}/IMPS/MUKUL RAHAM/Axis Bank', desc: 'IMPS from Mukul Rahaman (Axis Bank)' },
      { tpl: 'MMT/IMPS/61019012{REF4}/100000/MORJINABIB/Axis Bank', desc: 'IMPS from Morjina Bibi (Axis Bank)' },
      { tpl: 'MMT/IMPS/61842249{REF4}/IMPS/MUKUL RAHAM/Axis Bank', desc: 'IMPS from Mukul Rahaman (Axis Bank)' }
    ],
    internal_transfers: [
      { tpl: 'INF/INFT/042842250{REF3}/BULD64089842/WIB Office acco', desc: 'Internal transfer - WIB Office acco' },
      { tpl: 'INF/INFT/042852432{REF3}/BULD64126559/WIB Office acco', desc: 'Internal transfer - WIB Office acco' },
      { tpl: 'INF/INFT/042864816{REF3}/BULD64184289/WIB Office acco', desc: 'Internal transfer - WIB Office acco' },
      { tpl: 'INF/INFT/043255162{REF3}/BULD65973025/WIB Office acco', desc: 'Internal transfer - WIB Office acco' },
      { tpl: 'INF/INFT/043524862{REF3}/BULD67264186/WIB Office acco', desc: 'Internal transfer - WIB Office acco' },
      { tpl: 'INF/INFT/044060120{REF3}/BULD69724807/WIB Office acco', desc: 'Internal transfer - WIB Office acco' },
      { tpl: 'INF/INFT/045058693{REF3}/BULD74561994/WIB Office acco', desc: 'Internal transfer - WIB Office acco' },
      { tpl: 'INF/NEFT/IN42602459{REF4}/UTIB0005971/Maintenance/XXMUKULAXIS', desc: 'Maintenance transfer to Mukul Axis' },
      { tpl: 'INF/NEFT/IN42603052{REF4}/UTIB0005971/XXMUKULAXIS', desc: 'Transfer to Mukul Axis' }
    ],
    bill_and_cards: [
      { tpl: 'BIL/BPAY/0000001OHAE/BBPS/HDB Financial Ser', desc: 'Bill Pay to HDB Financial Services' },
      { tpl: 'BIL/BPAY/0000001TLJ3O/BBPS/HDFC Credit Card/', desc: 'Bill Pay to HDFC Credit Card' },
      { tpl: 'BIL/BPAY/0000001TLK1T/BBPS/Axis Bank Credit', desc: 'Bill Pay to Axis Bank Credit Card' },
      { tpl: 'BIL/BPAY/0000001TLX14/BBPS/Axis Bank Credit', desc: 'Bill Pay to Axis Bank Credit Card' },
      { tpl: 'BIL/BPAY/0000001TS4XQ/IDFC FIRST Bank Credit', desc: 'Bill Pay to IDFC FIRST Bank Credit Card' },
      { tpl: 'BIL/BPAY/0000001XVOIE/RBL Bank Credit Card/B', desc: 'Bill Pay to RBL Bank Credit Card' },
      { tpl: 'UPI/Axis Bank/billpay.axb@up/NO REMARKS/AXIS BANK/{REF11}/BBP{HEX20}/', desc: 'Axis BillPay Credit Card / Utility' },
      { tpl: 'UPI/SBI Cards/sbicardp.bdpg@/Pay/KOTAK MAHI/{REF11}/UPI{HEX20}/', desc: 'SBI Credit Card Bill Payment' }
    ],
    cash_and_charges: [
      { tpl: 'CAM/78611SRY/CASH DEP-Other/{DATE_SHORT}/1526', desc: 'Cash Deposit at CAM Machine' },
      { tpl: 'CAM/06231SRY/CASH DEP-Other/{DATE_SHORT}/4176', desc: 'Cash Deposit at Branch CAM' },
      { tpl: 'CashDep Chgs 01-31{MON}+GST', desc: 'Monthly Cash Deposit Charges + GST' },
      { tpl: 'IMPS chg {MON}+GST', desc: 'IMPS Service Charges + GST' }
    ]
  };

  // ── Salaried Person Transaction Remarks Pool ─────────────────────────
  const SALARIED_REMARKS_POOL = {
    daily_expenses: [
      { tpl: 'UPI/SWIGGY/swiggy@axis/{REF12}/UPI{HEX20}', desc: 'Swiggy Food Delivery' },
      { tpl: 'UPI/ZOMATO/zomato@icici/{REF12}/UPI{HEX20}', desc: 'Zomato Food Order' },
      { tpl: 'UPI/BIGBASKET/bbpay@icici/{REF12}/BB{HEX20}', desc: 'BigBasket Grocery' },
      { tpl: 'UPI/BLINKIT/blinkit@kotak/{REF12}/BL{HEX20}', desc: 'Blinkit Instant Grocery' },
      { tpl: 'UPI/ZEPTO/zepto@hdfc/{REF12}/ZP{HEX20}', desc: 'Zepto Quick Delivery' },
      { tpl: 'UPI/AMAZON/amazonpay@icici/{REF12}/AMZ{HEX20}', desc: 'Amazon Online Shopping' },
      { tpl: 'UPI/FLIPKART/fkrt@yesbank/{REF12}/FK{HEX20}', desc: 'Flipkart Shopping' },
      { tpl: 'UPI/DMART/dmart@hdfc/{REF12}/DMT{HEX20}', desc: 'DMart Supermarket' },
      { tpl: 'UPI/RELIANCE RETAIL/relpay@sbi/{REF12}/RR{HEX20}', desc: 'Reliance Retail Store' },
      { tpl: 'UPI/APOLLO PHARM/apollo@axis/{REF12}/APL{HEX20}', desc: 'Apollo Pharmacy Medicines' },
      { tpl: 'UPI/MEDPLUS/medplus@icici/{REF12}/MED{HEX20}', desc: 'MedPlus Healthcare' },
      { tpl: 'UPI/UBER INDIA/uber@axis/{REF12}/UBR{HEX20}', desc: 'Uber Ride' },
      { tpl: 'UPI/OLA CABS/olacabs@icici/{REF12}/OLA{HEX20}', desc: 'Ola Cabs Transit' },
      { tpl: 'UPI/INDIAN OIL/iocldlr@sbi/{REF12}/IOC{HEX20}', desc: 'Indian Oil Petrol Pump' },
      { tpl: 'UPI/HPCL PETROL/hpclpay@icici/{REF12}/HP{HEX20}', desc: 'HPCL Fuel Station' },
      { tpl: 'UPI/STARBUCKS/sbux@hdfc/{REF12}/SBX{HEX20}', desc: 'Starbucks Coffee' },
      { tpl: 'UPI/CAFE COFFEE/ccd@axis/{REF12}/CCD{HEX20}', desc: 'Cafe Coffee Day' },
      { tpl: 'UPI/BOOKMYSHOW/bms@icici/{REF12}/BMS{HEX20}', desc: 'BookMyShow Cinema' },
      { tpl: 'UPI/PVR CINEMAS/pvrcinemas@kotak/{REF12}/PVR{HEX20}', desc: 'PVR Movie Tickets' }
    ],
    bills_and_utilities: [
      { tpl: 'UPI/WBSEDCL/wbsedcl@sbi/ELECTRICITY/{REF12}', desc: 'Electricity Bill Payment' },
      { tpl: 'UPI/CESC LTD/cescbill@icici/POWER/{REF12}', desc: 'CESC Power Bill' },
      { tpl: 'UPI/AIRTEL POSTPAID/airtel@hdfc/BILLPAY/{REF12}', desc: 'Airtel Broadband / Postpaid' },
      { tpl: 'UPI/JIO FIBER/jio@citibank/BROADBAND/{REF12}', desc: 'JioFiber Internet Bill' },
      { tpl: 'UPI/TATA PLAY/tataplay@axis/DTH/{REF12}', desc: 'Tata Play DTH Recharge' },
      { tpl: 'UPI/NETFLIX/netflix@citi/SUBSCRIPTION/{REF12}', desc: 'Netflix Monthly Subscription' },
      { tpl: 'UPI/HOTSTAR/hotstar@axis/ANNUAL/{REF12}', desc: 'Disney+ Hotstar Subscription' },
      { tpl: 'UPI/SPOTIFY/spotify@icici/PREMIUM/{REF12}', desc: 'Spotify Music Premium' },
      { tpl: 'BIL/BPAY/CRED CLUB/CREDIT CARD PAY/{REF8}', desc: 'CRED Credit Card Bill Payment' },
      { tpl: 'BIL/BPAY/HDFC CREDIT CARD/{REF8}', desc: 'HDFC Bank Credit Card Bill' },
      { tpl: 'BIL/BPAY/ICICI CREDIT CARD/{REF8}', desc: 'ICICI Bank Credit Card Bill' },
      { tpl: 'BIL/BPAY/SBI CARD/{REF8}', desc: 'SBI Credit Card Payment' },
      { tpl: 'UPI/HOUSE RENT/renttransfer@icici/{REF12}', desc: 'Monthly House Rent Transfer' },
      { tpl: 'UPI/MAID SALARY/domestichelp@sbi/{REF12}', desc: 'Domestic Help / Maid Salary' },
      { tpl: 'UPI/SOCIETY MAINT/residentwelfare@axis/{REF12}', desc: 'Society Maintenance Charges' }
    ],
    cash_and_atm: [
      { tpl: 'ATM WDL/{DATE_SHORT}/ATMID:{REF6}/CASH', desc: 'ATM Cash Withdrawal' },
      { tpl: 'ATM WDL/{DATE_SHORT}/NFS*CASH*{REF6}', desc: 'NFS ATM Cash Withdrawal' },
      { tpl: 'POS/SWIPE/{DATE_SHORT}/SHOPPING/{REF8}', desc: 'POS Card Swipe / Retail POS' }
    ],
    bank_charges: [
      { tpl: 'SMS Alert Charges Qtr+{MON}', desc: 'SMS Alert Charges + GST' },
      { tpl: 'Debit Card Annual Fee+{MON}', desc: 'Debit Card Annual Maintenance Charges' },
      { tpl: 'Consolidated Charges for {MON}', desc: 'Consolidated Service Charges + GST' }
    ],
    secondary_credits: [
      { tpl: 'UPI/REFUND/AMAZON PAY/{REF12}', desc: 'Amazon Pay Refund Credit' },
      { tpl: 'UPI/REFUND/FLIPKART/{REF12}', desc: 'Flipkart Refund Credit' },
      { tpl: 'UPI/CASHBACK/CRED REWARDS/{REF12}', desc: 'CRED Cashback Reward Credit' },
      { tpl: 'UPI/FRIEND SETTLE/splitbill@upi/{REF12}', desc: 'UPI Split Bill Reimbursement' },
      { tpl: '1.INT.PD:{DATE_SHORT} SAVINGS INTEREST', desc: 'Quarterly Savings Bank Interest Credit' }
    ]
  };

  function fmt(n) {
    const v = parseFloat(n) || 0;
    return v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function fmtDate(d) {
    if (!d) return '--';
    const parts = String(d).split('-');
    if (parts.length === 3) return parts[2] + '/' + parts[1] + '/' + parts[0];
    return d;
  }

  function fmtDisplayDate(d) {
    if (!d) return '--';
    const parts = String(d).split('-');
    if (parts.length === 3) {
      const dt = new Date(parts[0], parts[1] - 1, parts[2]);
      return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    return d;
  }

  function fmtICICIDate(d) {
    if (!d) return '--';
    const parts = String(d).split('-');
    if (parts.length === 3) {
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const mIdx = parseInt(parts[1], 10) - 1;
      return `${parts[2]}/${months[mIdx] || 'Jan'}/${parts[0]}`;
    }
    return d;
  }

  function fmtAxisDate(d) {
    if (!d) return '--';
    const s = String(d).trim();
    if (s.includes('/')) {
      const parts = s.split('/');
      if (parts.length === 3) {
        if (parts[0].length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`;
        return `${parts[0]}-${parts[1]}-${parts[2]}`;
      }
    }
    const parts = s.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`;
      return `${parts[0]}-${parts[1]}-${parts[2]}`;
    }
    return s;
  }

  function _randomHex(len) {
    const chars = '0123456789abcdef';
    let res = '';
    for (let i = 0; i < len; i++) res += chars[Math.floor(Math.random() * chars.length)];
    return res;
  }

  function _randomDigits(len) {
    let res = '';
    for (let i = 0; i < len; i++) res += Math.floor(Math.random() * 10);
    return res;
  }

  function _fillRemarkTemplate(tpl, dateStr) {
    let res = tpl;
    res = res.replace(/{REF12}/g, () => '6' + _randomDigits(11));
    res = res.replace(/{REF11}/g, () => '2' + _randomDigits(10));
    res = res.replace(/{REF10}/g, () => _randomDigits(10));
    res = res.replace(/{REF8}/g, () => _randomDigits(8));
    res = res.replace(/{REF6}/g, () => _randomDigits(6));
    res = res.replace(/{REF4}/g, () => _randomDigits(4));
    res = res.replace(/{REF3}/g, () => _randomDigits(3));
    res = res.replace(/{HEX24}/g, () => _randomHex(24));
    res = res.replace(/{HEX20}/g, () => _randomHex(20));

    if (dateStr) {
      const parts = String(dateStr).split('-');
      if (parts.length === 3) {
        const shortDate = `${parts[2]}-${parts[1]}-${parts[0].slice(-2)}`;
        const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
        const mIdx = parseInt(parts[1], 10) - 1;
        const mon = `${months[mIdx] || 'MAY'}${parts[0].slice(-2)}`;
        res = res.replace(/{DATE_SHORT}/g, shortDate);
        res = res.replace(/{MON}/g, mon);
      }
    }
    return res;
  }

  /**
   * Generates realistic, balanced transactions where debits never exceed available funds,
   * naturally maintaining the running balance above minimum balance.
   */
  function generateHighDensityTransactions(fromDate, toDate, density = 30, openingBalance = 30211, minBalance = 25000) {
    if (!fromDate || !toDate) return [];
    const start = new Date(fromDate);
    const end = new Date(toDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return [];

    const txs = [];
    let cur = new Date(start.getFullYear(), start.getMonth(), 1);
    const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

    let tranSeq = Math.floor(10000000 + Math.random() * 80000000);
    let simBal = parseFloat(openingBalance) > 0 ? parseFloat(openingBalance) : 35000;
    const targetMin = parseFloat(minBalance) > 0 ? parseFloat(minBalance) : 25000;
    const safeFloor = targetMin + 1500;

    while (cur <= endMonth) {
      const year = cur.getFullYear();
      const month = cur.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      // Determine transaction count for this month (at least density)
      const countForMonth = Math.max(26, Math.floor(density + (Math.random() * 6 - 2)));

      // Generate days for this month
      const days = [];
      for (let i = 0; i < countForMonth; i++) {
        const day = Math.floor(1 + Math.random() * daysInMonth);
        const hour = Math.floor(7 + Math.random() * 16);
        const min = Math.floor(Math.random() * 60);
        const sec = Math.floor(Math.random() * 60);
        const dt = new Date(year, month, day, hour, min, sec);
        if (dt >= start && dt <= end) {
          days.push(dt);
        }
      }

      days.sort((a, b) => a.getTime() - b.getTime());

      days.forEach(d => {
        tranSeq += Math.floor(10 + Math.random() * 90);
        const tranId = `S${tranSeq}`;
        const dateISO = d.toISOString().slice(0, 10);
        const hh = String(d.getHours() % 12 || 12).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        const ss = String(d.getSeconds()).padStart(2, '0');
        const ampm = d.getHours() >= 12 ? 'PM' : 'AM';
        const postedTime = `${fmtDate(dateISO)} ${hh}:${mm}:${ss} ${ampm}`;

        let debit = 0;
        let credit = 0;
        let remark = '';

        // Dynamic cash-flow balancing:
        const availableDebitHeadroom = simBal - safeFloor;
        let isCredit = false;

        if (availableDebitHeadroom < 1000) {
          // Must generate credit (Deposit) to preserve buffer
          isCredit = true;
        } else if (simBal > targetMin * 3.5) {
          // Rich balance: mostly debits
          isCredit = Math.random() < 0.25;
        } else {
          // Normal balance: balanced mix
          isCredit = Math.random() < 0.42;
        }

        if (isCredit) {
          const catDice = Math.random();
          if (catDice < 0.45) {
            // NEFT bulk/escrow credit
            const pool = REMARKS_POOL.neft_credits;
            const item = pool[Math.floor(Math.random() * pool.length)];
            remark = _fillRemarkTemplate(item.tpl, dateISO);
            credit = Math.floor(15000 + Math.random() * 65000);
          } else if (catDice < 0.75) {
            // UPI credit
            const pool = REMARKS_POOL.upi_credits;
            const item = pool[Math.floor(Math.random() * pool.length)];
            remark = _fillRemarkTemplate(item.tpl, dateISO);
            credit = Math.floor(500 + Math.random() * 25000);
          } else if (catDice < 0.90) {
            // IMPS Inward
            const pool = REMARKS_POOL.imps_transfers;
            const item = pool[Math.floor(Math.random() * pool.length)];
            remark = _fillRemarkTemplate(item.tpl, dateISO);
            credit = Math.floor(10000 + Math.random() * 50000);
          } else {
            // Cash CAM deposit
            const pool = REMARKS_POOL.cash_and_charges.filter(c => c.tpl.includes('CAM'));
            const item = pool[Math.floor(Math.random() * pool.length)] || REMARKS_POOL.cash_and_charges[0];
            remark = _fillRemarkTemplate(item.tpl, dateISO);
            credit = Math.floor(20000 + Math.random() * 40000);
          }
          simBal += credit;
        } else {
          // Debit: Guarantee debit never exceeds available headroom
          const maxAllowed = Math.max(10, Math.floor(availableDebitHeadroom * (0.2 + Math.random() * 0.55)));
          const catDice = Math.random();
          if (catDice < 0.55) {
            // UPI Debit (retail, petty, shopping)
            const pool = REMARKS_POOL.upi_debits;
            const item = pool[Math.floor(Math.random() * pool.length)];
            remark = _fillRemarkTemplate(item.tpl, dateISO);
            debit = Math.min(maxAllowed, Math.random() < 0.35 ? Math.floor(20 + Math.random() * 600) : Math.floor(800 + Math.random() * 12000));
          } else if (catDice < 0.78) {
            // Internal fund transfer (WIB Office)
            const pool = REMARKS_POOL.internal_transfers;
            const item = pool[Math.floor(Math.random() * pool.length)];
            remark = _fillRemarkTemplate(item.tpl, dateISO);
            debit = Math.min(maxAllowed, Math.floor(5000 + Math.random() * 35000));
          } else if (catDice < 0.94) {
            // Bill & Credit Card payment
            const pool = REMARKS_POOL.bill_and_cards;
            const item = pool[Math.floor(Math.random() * pool.length)];
            remark = _fillRemarkTemplate(item.tpl, dateISO);
            debit = Math.min(maxAllowed, Math.floor(1500 + Math.random() * 20000));
          } else {
            // Bank charges / IMPS GST
            const pool = REMARKS_POOL.cash_and_charges.filter(c => !c.tpl.includes('CAM'));
            const item = pool[Math.floor(Math.random() * pool.length)] || pool[0];
            remark = _fillRemarkTemplate(item.tpl, dateISO);
            debit = Math.min(maxAllowed, Math.random() < 0.5 ? 5.90 : 59.00);
          }

          if (debit <= 0) debit = 10.00;
          simBal -= debit;
        }

        txs.push({
          tranId,
          txnDate: dateISO,
          valueDate: dateISO,
          postedDate: postedTime,
          description: remark,
          debit: debit > 0 ? debit.toFixed(2) : '',
          credit: credit > 0 ? credit.toFixed(2) : '',
        });
      });
      cur = new Date(year, month + 1, 1);
    }
    return txs;
  }

  /**
   * Generates authentic, realistic Salaried Person transactions where:
   * 1. Salary is credited every month on the 5th with a unique 12-digit UTR and exact remark:
   *    TRANSFER FROM {12-digit UTR} NEFT*UTIB0001550*AXISP00629663 007*{COMPANY_NAME}
   * 2. Monthly average account balance is maintained up to ~1.5 Lakh (₹1,50,000).
   * 3. Realistic daily personal expenses (UPI, groceries, dining, utilities, fuel, ATM) occur throughout.
   */
  function generateSalariedTransactions(options) {
    const opts = options || {};
    const fromDate = opts.fromDate;
    const toDate = opts.toDate;
    const density = parseInt(opts.density, 10) || 25;
    const openingBalance = parseFloat(opts.openingBalance) > 0 ? parseFloat(opts.openingBalance) : 150000;
    const minBalance = parseFloat(opts.minBalance) > 0 ? parseFloat(opts.minBalance) : 25000;
    const targetAvgBalance = parseFloat(opts.targetAvgBalance) > 0 ? parseFloat(opts.targetAvgBalance) : 150000;
    const salaryAmount = parseFloat(opts.salaryAmount) > 0 ? parseFloat(opts.salaryAmount) : 65000;
    const companyName = (opts.companyName || 'SS INFOTECH SOLUTIONS PVT LTD').toUpperCase().trim();
    const salaryDay = parseInt(opts.salaryDay, 10) || 5;

    if (!fromDate || !toDate) return [];
    const start = new Date(fromDate);
    const end = new Date(toDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return [];

    const txs = [];
    let cur = new Date(start.getFullYear(), start.getMonth(), 1);
    const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

    let tranSeq = Math.floor(10000000 + Math.random() * 80000000);
    let simBal = openingBalance;
    const targetMin = minBalance;
    const targetAvg = targetAvgBalance;

    while (cur <= endMonth) {
      const year = cur.getFullYear();
      const month = cur.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const monthTxItems = [];

      // 1. Mandatory Monthly Salary Credit on the 5th
      const actualSalaryDay = Math.min(salaryDay, daysInMonth);
      const salDate = new Date(year, month, actualSalaryDay, 9, Math.floor(15 + Math.random() * 30), 0);
      
      if (salDate >= start && salDate <= end) {
        tranSeq += Math.floor(10 + Math.random() * 90);
        const tranId = `S${tranSeq}`;
        const salDateISO = salDate.toISOString().slice(0, 10);
        const postedTime = `${fmtDate(salDateISO)} 09:30:00 AM`;
        const utr12 = _randomDigits(12);
        const salaryRemark = `TRANSFER FROM ${utr12} NEFT*UTIB0001550*AXISP00629663 007*${companyName}`;
        
        monthTxItems.push({
          date: salDate,
          tranId,
          txnDate: salDateISO,
          valueDate: salDateISO,
          postedDate: postedTime,
          description: salaryRemark,
          debit: '',
          credit: salaryAmount.toFixed(2),
          isSalary: true,
          amountCr: salaryAmount,
          amountDr: 0
        });
        simBal += salaryAmount;
      }

      // 2. Generate other days for personal expenses / debits and occasional secondary credits
      const countForMonth = Math.max(18, Math.floor(density + (Math.random() * 6 - 3)));
      const otherDays = [];
      for (let i = 0; i < countForMonth; i++) {
        let day = Math.floor(1 + Math.random() * daysInMonth);
        const hour = Math.floor(8 + Math.random() * 14);
        const min = Math.floor(Math.random() * 60);
        const sec = Math.floor(Math.random() * 60);
        const dt = new Date(year, month, day, hour, min, sec);
        if (dt >= start && dt <= end) {
          otherDays.push(dt);
        }
      }

      otherDays.sort((a, b) => a.getTime() - b.getTime());

      // Calculate monthly expense budget to balance against salary credit
      const currentSurplus = simBal - targetAvg;
      let targetMonthExpense = salaryAmount * (0.92 + Math.random() * 0.10);
      if (currentSurplus > 5000) {
        targetMonthExpense += currentSurplus * 0.35; // gently absorb surplus
      } else if (currentSurplus < -5000) {
        targetMonthExpense = Math.max(salaryAmount * 0.60, targetMonthExpense + currentSurplus * 0.35); // reduce expense if below target
      }

      // Distribute expenses across days
      const numDebits = Math.max(12, otherDays.length);
      const avgDebitPerItem = targetMonthExpense / numDebits;

      otherDays.forEach((d, idx) => {
        tranSeq += Math.floor(10 + Math.random() * 90);
        const tranId = `S${tranSeq}`;
        const dateISO = d.toISOString().slice(0, 10);
        const hh = String(d.getHours() % 12 || 12).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        const ss = String(d.getSeconds()).padStart(2, '0');
        const ampm = d.getHours() >= 12 ? 'PM' : 'AM';
        const postedTime = `${fmtDate(dateISO)} ${hh}:${mm}:${ss} ${ampm}`;

        let debit = 0;
        let credit = 0;
        let remark = '';

        // Occasional interest credit or cash back
        const isCredit = (simBal < targetMin + 15000) || (Math.random() < 0.06);

        if (isCredit) {
          const pool = SALARIED_REMARKS_POOL.secondary_credits;
          const item = pool[Math.floor(Math.random() * pool.length)];
          remark = _fillRemarkTemplate(item.tpl, dateISO);
          if (item.tpl.includes('INT.PD')) {
            credit = Math.floor(450 + Math.random() * 850);
          } else {
            credit = Math.floor(100 + Math.random() * 1500);
          }
          simBal += credit;
        } else {
          const catDice = Math.random();
          if (catDice < 0.58) {
            // Food, Grocery, Shopping, Transit, Dining
            const pool = SALARIED_REMARKS_POOL.daily_expenses;
            const item = pool[Math.floor(Math.random() * pool.length)];
            remark = _fillRemarkTemplate(item.tpl, dateISO);
            debit = Math.floor(avgDebitPerItem * (0.25 + Math.random() * 0.75));
            if (debit < 80) debit = Math.floor(80 + Math.random() * 450);
          } else if (catDice < 0.82) {
            // Bills, Utilities, Rent, Card payments
            const pool = SALARIED_REMARKS_POOL.bills_and_utilities;
            const item = pool[Math.floor(Math.random() * pool.length)];
            remark = _fillRemarkTemplate(item.tpl, dateISO);
            if (item.tpl.includes('RENT')) {
              debit = Math.floor(avgDebitPerItem * (2.2 + Math.random() * 1.5));
            } else if (item.tpl.includes('CREDIT CARD') || item.tpl.includes('BPAY')) {
              debit = Math.floor(avgDebitPerItem * (1.5 + Math.random() * 1.2));
            } else {
              debit = Math.floor(avgDebitPerItem * (0.5 + Math.random() * 0.8));
            }
          } else if (catDice < 0.94) {
            // ATM Cash
            const pool = SALARIED_REMARKS_POOL.cash_and_atm;
            const item = pool[Math.floor(Math.random() * pool.length)];
            remark = _fillRemarkTemplate(item.tpl, dateISO);
            debit = Math.floor(avgDebitPerItem * (1.0 + Math.random() * 1.5));
            if (debit < 1000) debit = 1000 + Math.floor(Math.random() * 2000);
          } else {
            // Bank charges / SMS / maintenance
            const pool = SALARIED_REMARKS_POOL.bank_charges;
            const item = pool[Math.floor(Math.random() * pool.length)];
            remark = _fillRemarkTemplate(item.tpl, dateISO);
            debit = Math.random() < 0.5 ? 17.70 : 59.00;
          }

          if (simBal - debit < targetMin) {
            debit = Math.max(10, Math.floor((simBal - targetMin) * 0.35));
          }
          if (debit <= 0) debit = 10.00;
          simBal -= debit;
        }

        monthTxItems.push({
          date: d,
          tranId,
          txnDate: dateISO,
          valueDate: dateISO,
          postedDate: postedTime,
          description: remark,
          debit: debit > 0 ? debit.toFixed(2) : '',
          credit: credit > 0 ? credit.toFixed(2) : '',
          amountCr: credit,
          amountDr: debit,
          isSalary: false
        });
      });

      monthTxItems.sort((a, b) => a.date.getTime() - b.date.getTime());
      monthTxItems.forEach(t => txs.push(t));

      cur = new Date(year, month + 1, 1);
    }
    return txs;
  }

  // ── Main Generate Dispatcher ──────────────────────────────────────────
  function generate(data) {
    const style = (data.style || 'icici').toLowerCase();

    // Specific optional format styles
    if (style === 'axis') {
      return _generateAxisStatement(data);
    }
    if (style === 'sbi') {
      return _generateSBIStatement(data);
    }
    if (style === 'hdfc') {
      return _generateHDFCStatement(data);
    }
    if (style === 'standard') {
      return _generateStandardStatement(data);
    }

    // Default format is ICICI Bank Detailed Statement
    return _generateICICIStatement(data);
  }

  // ── 1. ICICI Bank Detailed Statement Template (Exact PDF Replica) ──────
  function _generateICICIStatement(data) {
    const b = data.bank || {};
    const ac = data.account || {};
    const txs = data.transactions || [];
    const minBalance = parseFloat(data.minBalance) || 25000;

    const U = s => (s == null ? '' : String(s).trim().toUpperCase());
    const bankName = U(b.name) || 'ICICI BANK';
    const holder = U(ac.holder) || 'MUKUL RAHAMAN';
    const holderAddress = U(ac.address) || 'CHOWRASHI, DEGANGA, CHAURASHI, NORTH 24 PARGANAS, 743424, WEST BENGAL, INDIA';
    const branchName = U(ac.branch) || 'BASIRHAT';
    const branchAddress = U(b.address || ac.branchAddress) || 'ICICI BANK LTD., BASIRHAT BRANCH, BHAWANIPUR, PO.-BASIRHAT COLLEGE, DIST.- 24 PARGANAS (NORTH).743 412, NORTH 24 PARGANAS, WEST BENGAL, INDIA';
    const acNo = U(ac.accountNo) || '091405003332';
    const acType = U(ac.accountType) || 'CAA';
    const custId = U(ac.custId) || '573886835';
    const branchCode = U(ac.branchCode) || '0914';
    const ifsc = U(ac.ifsc) || 'ICIC0000914';
    const currency = 'INR';

    const fromDateDisplay = fmtDate(data.fromDate);
    const toDateDisplay = fmtDate(data.toDate);
    const periodText = `From ${fromDateDisplay} To ${toDateDisplay}`;
    const downloadDate = fmtDate(new Date().toISOString().slice(0, 10));

    // Calculate exact mathematical balances
    let balance = parseFloat(ac.openingBalance) || 0;
    let totalDr = 0;
    let totalCr = 0;

    const rows = txs.map((t, idx) => {
      const dr = parseFloat(t.debit) || 0;
      const cr = parseFloat(t.credit) || 0;
      balance = balance - dr + cr;
      totalDr += dr;
      totalCr += cr;
      return {
        ...t,
        slNo: idx + 1,
        tranId: U(t.tranId) || `S${Math.floor(10000000 + idx * 1000 + Math.random() * 900)}`,
        description: U(t.description || t.narration || t.remark || ''),
        valueDate: fmtICICIDate(t.valueDate || t.txnDate),
        txnDate: fmtICICIDate(t.txnDate),
        postedDate: t.postedDate || `${fmtDate(t.txnDate)} 10:30:00 AM`,
        refNo: U(t.refNo || ''),
        channel: U(t.channel || ''),
        dr,
        cr,
        balance
      };
    });

    const closingBalance = balance;
    const openingBalance = parseFloat(ac.openingBalance) || 0;

    // Bank Logo rendering - prioritize local project bank logo / admin saved logo
    const bl = _getBL();
    const logoData = b.logoData || (bl ? bl.getLogo(bankName) : null);
    let logoHtml;
    if (logoData) {
      logoHtml = `<div class="icici-logo-img-wrap"><img src="${logoData}" alt="${_esc(bankName)}" class="icici-logo-img" /></div>`;
    } else {
      const initial = (bankName || 'B').trim().toUpperCase().slice(0, 2) || 'B';
      logoHtml = `<div class="icici-logo-img-wrap" style="background:#1a3c6e;color:#fff;display:inline-flex;align-items:center;justify-content:center;border-radius:4px;font-weight:800;font-size:16px;padding:6px 12px;letter-spacing:1px;">${initial}</div>`;
    }

    // Build Transaction Rows HTML
    const txHtml = rows.map(r => {
      return `<tr>
        <td class="col-sl">${r.slNo}</td>
        <td class="col-tranid">${_esc(r.tranId)}</td>
        <td class="col-valdate">${_esc(r.valueDate)}</td>
        <td class="col-txndate">${_esc(r.txnDate)}</td>
        <td class="col-ref">${_esc(r.refNo)}</td>
        <td class="col-remarks">${_esc(r.description || '')}</td>
        <td class="col-dr">${r.dr ? fmt(r.dr) : ''}</td>
        <td class="col-cr">${r.cr ? fmt(r.cr) : ''}</td>
        <td class="col-bal">${fmt(r.balance)}</td>
      </tr>`;
    }).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${_esc(bankName)}_Detailed_Statement</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&family=Inter:wght@400;500;600;700;800;900&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Roboto', Arial, Helvetica, sans-serif;
    background: #e5e7eb;
    color: #000;
    padding: 20px;
    font-size: 8.5pt;
    line-height: 1.25;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  @media print {
    body { background: #fff; padding: 0; margin: 0; }
    .icici-page { box-shadow: none !important; margin: 0 !important; max-width: 100% !important; border: none !important; }
    .no-print { display: none !important; }
    @page { margin: 8mm 6mm 10mm 6mm; size: A4 portrait; }
    .page-break { page-break-after: always; }
  }

  .icici-page {
    max-width: 920px;
    margin: 0 auto;
    background: #fff;
    border: 1px solid #d1d5db;
    box-shadow: 0 4px 24px rgba(0,0,0,0.12);
    padding: 24px 28px 30px;
  }

  /* Header Branding */
  .icici-hdr {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 8px;
  }
  .icici-logo-img-wrap {
    max-height: 58px;
    max-width: 360px;
    display: flex;
    align-items: center;
    margin-bottom: 6px;
    overflow: visible;
  }
  .icici-logo-img {
    max-height: 58px;
    max-width: 360px;
    width: auto;
    height: auto;
    object-fit: contain;
  }
  .icici-logo-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #bd232b;
    padding: 5px 14px;
    border-radius: 4px;
    color: #fff;
    font-size: 16pt;
    font-weight: 900;
    letter-spacing: 0.5px;
    font-style: italic;
    font-family: 'Inter', sans-serif;
  }
  .icici-logo-badge span {
    font-style: normal;
    font-weight: 700;
    font-size: 13pt;
    color: #fff;
  }

  .icici-title-hdr {
    font-size: 12pt;
    font-weight: 900;
    text-transform: capitalize;
    color: #000;
    margin-bottom: 12px;
  }

  /* Meta Info Grid */
  .meta-grid {
    display: grid;
    grid-template-columns: 105px 1.4fr 115px 1.4fr;
    gap: 3px 10px;
    font-size: 8pt;
    margin-bottom: 14px;
  }
  .meta-lbl { font-weight: 700; color: #111; }
  .meta-val { font-weight: 600; color: #000; word-break: break-word; }

  /* Advanced Search Box */
  .adv-search {
    border-top: 1px solid #e5e7eb;
    padding-top: 6px;
    margin-bottom: 10px;
    font-size: 7.5pt;
  }
  .adv-search-title { font-weight: 800; text-transform: capitalize; margin-bottom: 2px; }
  .adv-search-grid {
    display: grid;
    grid-template-columns: 140px 1fr 140px 1fr;
    gap: 2px 8px;
  }

  /* Main Statement Table */
  .icici-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 7.2pt;
    margin-top: 6px;
  }
  .icici-table thead th {
    background: #f3f4f6;
    color: #000;
    font-weight: 800;
    border: 1px solid #374151;
    padding: 5px 3px;
    text-align: left;
    vertical-align: middle;
    line-height: 1.15;
  }
  .icici-table tbody td {
    border: 1px solid #4b5563;
    padding: 3.5px 3px;
    vertical-align: top;
    line-height: 1.25;
  }
  .col-sl { width: 4%; text-align: center; font-weight: 700; }
  .col-tranid { width: 8%; word-break: break-all; }
  .col-valdate { width: 9%; white-space: nowrap; }
  .col-txndate { width: 9%; white-space: nowrap; }
  .col-ref { width: 9%; word-break: break-all; }
  .col-remarks { width: 33%; word-break: break-word; font-family: monospace; font-size: 6.8pt; line-height: 1.2; }
  .col-dr { width: 9%; text-align: right; font-variant-numeric: tabular-nums; }
  .col-cr { width: 9%; text-align: right; font-variant-numeric: tabular-nums; }
  .col-bal { width: 10%; text-align: right; font-weight: 700; font-variant-numeric: tabular-nums; }

  /* Page Totals Box */
  .page-totals-wrap {
    margin-top: 14px;
    display: inline-block;
    border: 1px solid #1f2937;
    padding: 8px 14px;
    font-size: 8pt;
    background: #f9fafb;
  }
  .page-totals-title { font-weight: 800; margin-bottom: 4px; text-decoration: underline; }
  .totals-row { display: flex; justify-content: space-between; gap: 20px; font-weight: 700; margin-bottom: 2px; }

  /* Legends Section */
  .legends-wrap {
    margin-top: 16px;
    border-top: 1px solid #374151;
    padding-top: 8px;
    font-size: 6.8pt;
    line-height: 1.35;
  }
  .legends-title { font-weight: 800; font-size: 7.5pt; margin-bottom: 4px; }
  .legends-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1px 16px;
  }

  .end-statement {
    text-align: center;
    margin-top: 14px;
    font-weight: 700;
    letter-spacing: 1px;
    font-size: 8pt;
  }

  /* Actions bar */
  .stmt-print-bar { text-align: center; padding: 18px; }
  .stmt-print-bar button {
    padding: 10px 32px; font-size: 14px; font-weight: 600;
    font-family: 'Inter', sans-serif; border: none; cursor: pointer; margin: 0 6px;
    border-radius: 6px;
  }
  .btn-print { background: #bd232b; color: #fff; }
  .btn-print:hover { background: #961b22; }
  .btn-close-stmt { background: #e5e7eb; color: #374151; }
  .btn-close-stmt:hover { background: #d1d5db; }
</style>
</head>
<body>

<div class="stmt-print-bar no-print">
  <button class="btn-print" onclick="window.print()">Print / Save as PDF</button>
  <button class="btn-close-stmt" onclick="window.close()">Close</button>
</div>

<div class="icici-page">

  <!-- Header -->
  <div class="icici-hdr">
    ${logoHtml}
  </div>

  <div class="icici-title-hdr">Detailed Statement</div>

  <!-- Account & Branch Metadata -->
  <div class="meta-grid">
    <div class="meta-lbl">Name:</div>
    <div class="meta-val">${_esc(holder)}</div>
    <div class="meta-lbl">A/C Branch:</div>
    <div class="meta-val">${_esc(branchName)}</div>

    <div class="meta-lbl">Address:</div>
    <div class="meta-val">${_esc(holderAddress)}</div>
    <div class="meta-lbl">Branch Address:</div>
    <div class="meta-val">${_esc(branchAddress)}</div>

    <div class="meta-lbl">A/C No:</div>
    <div class="meta-val">${_esc(acNo)}</div>
    <div class="meta-lbl">A/C Type:</div>
    <div class="meta-val">${_esc(acType)}</div>

    <div class="meta-lbl">Jt. Holder:</div>
    <div class="meta-val">--</div>
    <div class="meta-lbl">Cust ID:</div>
    <div class="meta-val">${_esc(custId)}</div>

    <div class="meta-lbl">Transaction Date from:</div>
    <div class="meta-val">${fromDateDisplay}</div>
    <div class="meta-lbl">Branch Code:</div>
    <div class="meta-val">${_esc(branchCode)}</div>

    <div class="meta-lbl">Transaction Period:</div>
    <div class="meta-val">${periodText}</div>
    <div class="meta-lbl">IFSC Code:</div>
    <div class="meta-val">${_esc(ifsc)}</div>

    <div class="meta-lbl">Statement Request/Download Date:</div>
    <div class="meta-val">${downloadDate}</div>
    <div class="meta-lbl">Account Currency:</div>
    <div class="meta-val">${currency}</div>
  </div>

  <!-- Advanced Search Metadata Box -->
  <div class="adv-search">
    <div class="adv-search-title">Advanced Search</div>
    <div class="adv-search-grid">
      <div>Amount from: <strong>NA To NA</strong></div>
      <div>Cheque number from: <strong>NA To NA</strong></div>
      <div>Transaction remarks: <strong>ALL</strong></div>
      <div>Transaction type: <strong>ALL (DR/CR)</strong></div>
    </div>
  </div>

  <!-- Detailed Statement Table -->
  <table class="icici-table">
    <thead>
      <tr>
        <th class="col-sl">Sl<br>No</th>
        <th class="col-tranid">Tran<br>Id</th>
        <th class="col-valdate">Value<br>Date</th>
        <th class="col-txndate">Transaction<br>Date</th>
        <th class="col-ref">Cheque no /<br>Ref No</th>
        <th class="col-remarks">Transaction<br>Remarks</th>
        <th class="col-dr" style="text-align:right">Withdrawal<br>(Dr)</th>
        <th class="col-cr" style="text-align:right">Deposit<br>(Cr)</th>
        <th class="col-bal" style="text-align:right">Balance</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="col-sl">--</td>
        <td class="col-tranid">--</td>
        <td class="col-valdate">${fromDateDisplay}</td>
        <td class="col-txndate">${fromDateDisplay}</td>
        <td class="col-ref">--</td>
        <td class="col-remarks"><strong>OPENING BALANCE</strong></td>
        <td class="col-dr"></td>
        <td class="col-cr"></td>
        <td class="col-bal"><strong>${fmt(openingBalance)}</strong></td>
      </tr>
      ${txHtml}
    </tbody>
  </table>

  <!-- Page Total Box -->
  <div class="page-totals-wrap">
    <div class="page-totals-title">Statement Total</div>
    <div class="totals-row"><span>Opening Bal:</span> <span>${fmt(openingBalance)}</span></div>
    <div class="totals-row"><span>Withdrawals:</span> <span>${fmt(totalDr)}</span></div>
    <div class="totals-row"><span>Deposits:</span> <span>${fmt(totalCr)}</span></div>
    <div class="totals-row"><span>Closing Bal:</span> <span>${fmt(closingBalance)}</span></div>
  </div>

  <!-- Official Legends Used in Statement (Direct from PDF) -->
  <div class="legends-wrap">
    <div class="legends-title">Legends Used In Account Statement</div>
    <div class="legends-grid">
      <div>1. BBPS - Bharat Bill Payment Service</div>
      <div>16. NEFT - National Electronics Funds Transfer System</div>
      <div>2. BCTT - Banking Cash Transaction Tax</div>
      <div>17. ONL - Online Shopping transaction</div>
      <div>3. BIL - Internet Bill payment or funds transfer to Third party</div>
      <div>18. PAC - Personal Accident cover</div>
      <div>4. BPAY - Bill payment</div>
      <div>19. PAVC - Pay any Visa credit card</div>
      <div>5. CCWD - Cardless Cash Withdrawal</div>
      <div>20. PAYC - Pay to Contact</div>
      <div>6. DTAX - Direct Tax</div>
      <div>21. RCHG - Recharge</div>
      <div>7. EBA - Transaction on ICICI Direct</div>
      <div>22. SMO - Smart Money order</div>
      <div>8. IDTX - Indirect Tax</div>
      <div>23. T Chg - Travel Charges</div>
      <div>9. IMPS - Immediate Payment Service</div>
      <div>24. TOP - Mobile recharge</div>
      <div>10. INF - Internet fund transfer in linked accounts</div>
      <div>25. UCCBRN CMS - Upcountry cheque collection</div>
      <div>11. INFT - Internal Fund Transfer (Within Bank)</div>
      <div>26. VAT / MAT / NFS - Cash withdrawal at other bank ATM</div>
      <div>12. LCCBRN CMS - Local cheque collection</div>
      <div>27. VPS / IPS - Debit card transaction</div>
      <div>13. LNPY - Linked loan payment</div>
      <div>28. BIL - To third party is for RIB</div>
      <div>14. MMT - Mobile Money Transfer (Insta FT - IMPS)</div>
      <div>29. GIB - Tax & Statutory payment, EPFO, ESIC</div>
      <div>15. N chg - NEFT Charges</div>
      <div>30. CMS - Internet bulk payment fund trf</div>
    </div>
  </div>

  <div class="end-statement">---------- End Of Statement ----------</div>

</div>

</body>
</html>`;
  }

  // ── 2. Axis Bank Statement Template (Exact PDF Replica) ───────────────
  function _generateAxisStatement(data) {
    const b = data.bank || {};
    const ac = data.account || {};
    const txs = data.transactions || [];

    const U = s => (s == null ? '' : String(s).trim().toUpperCase());

    const holder = U(ac.holder) || 'MUKUL RAHAMAN';
    const jointHolder = ac.jointHolder || '- -';
    const rawHolderAddress = ac.address || 'CHOWRASHI, DEGANGA, CHAURASHI, NORTH 24 PARGANAS, WEST BENGAL-INDIA, 743424';
    
    // Split address into clean vertical lines matching the official PDF
    const addrParts = rawHolderAddress.includes('\n')
      ? rawHolderAddress.split('\n').map(s => s.trim()).filter(Boolean)
      : rawHolderAddress.split(',').map(s => s.trim()).filter(Boolean);
    const addressHtml = addrParts.map(line => `<div>${_esc(U(line))}</div>`).join('');

    const mobile = ac.mobile || 'XXXXXX5164';
    const email = ac.email || 'MUXXXXN1@GMAIL.COM';
    
    let scheme = ac.scheme;
    if (scheme === 'BURGUNDY - CURRENT ACCOUNT') {
      scheme = '';
    }
    if (!scheme && ac.scheme !== '') {
      const type = (ac.accountType || '').toUpperCase();
      if (type.includes('CURR') || type === 'CAA' || type === 'CA') {
        scheme = '';
      } else if (type.includes('SALARY')) {
        scheme = 'BURGUNDY - SALARY ACCOUNT';
      } else if (type.includes('SAVINGS') || type === 'SB') {
        scheme = 'BURGUNDY - SAVINGS ACCOUNT';
      } else {
        scheme = '';
      }
    }

    const currency = ac.currency || 'INR';
    const acNo = ac.accountNo || '924010058354195';
    const custId = ac.custId || '879157488';
    const ifsc = U(ac.ifsc) || 'UTIB0005971';
    const micr = ac.micr || '743211009';
    const nomineeReg = ac.nomineeRegistered || 'Y';
    const nomineeName = U(ac.nomineeName) || 'NAFICHA RAHAN';
    const pan = U(ac.pan) || 'CYMPR5097Q';
    const branchCode = U(ac.branchCode) || (ifsc.length >= 4 ? ifsc.slice(-4) : '5971');
    const branchAddress = U(b.address || ac.branchAddress) || 'AXIS BANK LTD, , GR FL JL NO 68 DAG NO 1415, KHATIAN NO 3871, BERACHAMPA, 743424, BERACHAMPA, WEST BENGAL, INDIA';
    const branchPhone = ac.branchPhone || '9004659712';

    const fromDateDisplay = fmtAxisDate(data.fromDate || '2026-06-20');
    const toDateDisplay = fmtAxisDate(data.toDate || '2026-09-20');

    let balance = parseFloat(ac.openingBalance) || 0;
    let totalDr = 0;
    let totalCr = 0;

    const rows = txs.map((t) => {
      const dr = parseFloat(t.debit) || 0;
      const cr = parseFloat(t.credit) || 0;
      balance = balance - dr + cr;
      totalDr += dr;
      totalCr += cr;
      return {
        ...t,
        txnDateFormatted: fmtAxisDate(t.txnDate),
        chqNo: t.chqNo || t.refNo || '',
        description: U(t.description || t.narration || t.remark || ''),
        dr,
        cr,
        balance,
        initBr: t.initBr || branchCode || '5971'
      };
    });

    const openingBalance = parseFloat(ac.openingBalance) || 0;
    const closingBalance = balance;

    let logoHtml;
    if (b.logoData) {
      logoHtml = `<img src="${b.logoData}" alt="AXIS BANK" style="max-height:52px;max-width:340px;width:auto;height:auto;object-fit:contain;" />`;
    } else {
      logoHtml = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 50" width="240" height="42">
  <g transform="translate(10, 4) scale(1.6)">
    <path d="M13.1365 3.62897C12.7598 2.9842 12.3832 2.33944 12.0075 1.69409C9.60607 5.81347 7.19564 9.92752 4.78522 14.0416C3.27037 16.6271 1.75553 19.2125 0.242924 21.7994C0.156387 21.9525 0.0847413 22.1134 0.0132221 22.2741L0 22.3038C2.48931 22.3073 4.97861 22.3082 7.46792 22.2932C7.75527 21.8008 8.0409 21.3073 8.32654 20.8138C8.80398 19.9889 9.28149 19.1638 9.76731 18.3437C11.323 15.7185 12.8228 13.0609 14.3226 10.4035C14.7739 9.60392 15.2251 8.80436 15.6779 8.00569C14.8384 6.54225 13.9874 5.0856 13.1365 3.62897Z" fill="#97144D"/>
    <path d="M13.6642 14.5147C13.1122 14.5157 12.5603 14.5167 12.0084 14.5169C12.8641 16.0531 13.7523 17.5702 14.6407 19.0874C15.2663 20.156 15.8921 21.2247 16.5065 22.3002C17.1678 22.3006 17.8291 22.3017 18.4904 22.3027C20.3269 22.3055 22.1632 22.3084 24 22.2993C23.175 20.844 22.3309 19.3998 21.4867 17.9555C20.8223 16.8188 20.1579 15.6821 19.5028 14.5399C17.5566 14.5075 15.6104 14.5111 13.6642 14.5147Z" fill="#97144D"/>
  </g>
  <text x="64" y="32" font-family="'Times New Roman', Arial, sans-serif" font-weight="bold" font-size="24" fill="#97144D" letter-spacing="1.5">AXIS BANK</text>
</svg>`;
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Axis_Bank_Statement_${_esc(acNo)}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Times New Roman', Times, 'Nimbus Roman No9 L', serif;
    background: #eef2f6;
    color: #000;
    padding: 20px;
    font-size: 8.5pt;
    line-height: 1.25;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  @media print {
    body { background: #fff; padding: 0; margin: 0; }
    .axis-page {
      box-shadow: none !important;
      margin: 0 !important;
      max-width: 100% !important;
      border: none !important;
      padding: 0 !important;
    }
    .no-print { display: none !important; }
    @page {
      margin: 10mm 10mm 10mm 10mm;
      size: A4 portrait;
    }
    table { page-break-inside: auto; }
    thead { display: table-header-group; }
    tr { page-break-inside: avoid; break-inside: avoid; }
    .axis-notes-block { page-break-inside: avoid; break-inside: avoid; }
    .axis-legends-block { page-break-inside: avoid; break-inside: avoid; }
  }

  .axis-page {
    max-width: 920px;
    margin: 0 auto;
    background: #fff;
    border: 1px solid #d1d5db;
    box-shadow: 0 4px 24px rgba(0,0,0,0.12);
    padding: 26px 30px;
  }

  /* Header Branding */
  .axis-hdr-logo {
    text-align: center;
    margin-bottom: 14px;
  }

  /* 2-Column Meta Layout */
  .axis-meta-grid {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
    font-size: 8.5pt;
    line-height: 1.35;
  }
  .axis-cust-col {
    flex: 1;
    max-width: 55%;
  }
  .axis-cust-name {
    font-weight: bold;
    font-size: 10.5pt;
    text-transform: uppercase;
    margin-bottom: 2px;
  }
  .axis-bank-col {
    width: 280px;
    text-align: left;
    font-size: 8.5pt;
    line-height: 1.35;
  }
  .axis-info-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 1px;
  }
  .axis-info-row .lbl {
    font-weight: normal;
  }
  .axis-info-row .val {
    font-weight: normal;
    text-align: right;
  }

  /* Statement Title */
  .axis-stmt-title {
    text-align: center;
    font-weight: bold;
    font-size: 9.5pt;
    margin: 14px 0 8px 0;
    padding: 4px 0;
  }

  /* Transactions Table */
  .axis-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 8pt;
    color: #000;
  }
  .axis-table th, .axis-table td {
    border: 1px solid #000;
    padding: 2px 4px;
    vertical-align: top;
    line-height: 1.25;
  }
  .axis-table th {
    font-weight: bold;
    background: #fff;
  }
  .axis-table td.r, .axis-table th.r {
    text-align: right;
  }
  .axis-table td.c, .axis-table th.c {
    text-align: center;
  }
  .axis-part {
    word-break: break-word;
    white-space: normal;
  }
  .axis-table tr.row-total td {
    font-weight: bold;
  }

  /* Disclaimers & Notes Block */
  .axis-notes-block {
    margin-top: 14px;
    font-size: 7pt;
    line-height: 1.3;
    color: #111;
  }
  .axis-notes-block p {
    margin-bottom: 5px;
    text-align: justify;
  }
  .axis-office-line {
    margin-top: 6px;
    font-size: 7.2pt;
    text-transform: uppercase;
  }

  /* Legends Block */
  .axis-legends-block {
    margin-top: 14px;
    font-size: 7pt;
    line-height: 1.3;
  }
  .axis-legends-title {
    font-weight: bold;
    font-size: 8pt;
    margin-bottom: 4px;
  }
  .axis-legends-list {
    margin-bottom: 12px;
  }
  .axis-legends-list div {
    margin-bottom: 1px;
  }
  .axis-sys-gen {
    margin-top: 12px;
    font-size: 7.5pt;
    margin-bottom: 16px;
  }
  .axis-end-stmt {
    text-align: center;
    font-weight: bold;
    font-size: 8.5pt;
    margin-top: 10px;
    letter-spacing: 1px;
  }

  /* Print Bar */
  .stmt-print-bar { text-align: center; padding: 18px; }
  .stmt-print-bar button {
    padding: 10px 32px; font-size: 14px; font-weight: 600;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    border: none; cursor: pointer; margin: 0 6px;
    border-radius: 6px;
  }
  .btn-print { background: #97144D; color: #fff; transition: background 0.2s; }
  .btn-print:hover { background: #7a103e; }
  .btn-close-stmt { background: #e5e7eb; color: #374151; transition: background 0.2s; }
  .btn-close-stmt:hover { background: #d1d5db; }
</style>
</head>
<body>

<div class="stmt-print-bar no-print">
  <button class="btn-print" onclick="window.print()">Print / Save as PDF</button>
  <button class="btn-close-stmt" onclick="window.close()">Close</button>
</div>

<div class="axis-page">
  <!-- Top Center Logo -->
  <div class="axis-hdr-logo">
    ${logoHtml}
  </div>

  <!-- Meta Information -->
  <div class="axis-meta-grid">
    <div class="axis-cust-col">
      <div class="axis-cust-name">${_esc(holder)}</div>
      <div>Joint Holder:- ${_esc(jointHolder)}</div>
      ${addressHtml}
      <div style="margin-top: 5px;">Registered Mobile No: ${_esc(mobile)}</div>
      <div>Registered Email ID: ${_esc(email)}</div>
      ${scheme && scheme !== 'BURGUNDY - CURRENT ACCOUNT' ? `<div>Scheme: ${_esc(scheme)}</div>` : ''}
      <div>Currency: ${_esc(currency)}</div>
    </div>
    <div class="axis-bank-col">
      <div class="axis-info-row"><span class="lbl">Customer ID:</span><span class="val">${_esc(custId)}</span></div>
      <div class="axis-info-row"><span class="lbl">IFSC Code:</span><span class="val">${_esc(ifsc)}</span></div>
      <div class="axis-info-row"><span class="lbl">MICR Code:</span><span class="val">${_esc(micr)}</span></div>
      <div class="axis-info-row"><span class="lbl">Nominee Registered:</span><span class="val">${_esc(nomineeReg)}</span></div>
      <div class="axis-info-row"><span class="lbl">Nominee Name:</span><span class="val">${_esc(nomineeName)}</span></div>
      <div class="axis-info-row"><span class="lbl">PAN:</span><span class="val">${_esc(pan)}</span></div>
    </div>
  </div>

  <!-- Statement Period Header -->
  <div class="axis-stmt-title">
    Statement of Axis Account No: ${_esc(acNo)} for the period (From: ${fromDateDisplay} To: ${toDateDisplay})
  </div>

  <!-- Transactions Table -->
  <table class="axis-table">
    <thead>
      <tr>
        <th style="width: 10%; text-align: left;">Tran Date</th>
        <th style="width: 8%; text-align: left;">Chq No</th>
        <th style="width: 44%; text-align: left;">Particulars</th>
        <th style="width: 11%; text-align: right;" class="r">Debit</th>
        <th style="width: 11%; text-align: right;" class="r">Credit</th>
        <th style="width: 11%; text-align: right;" class="r">Balance</th>
        <th style="width: 5%; text-align: center;" class="c">Init.<br>Br</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td></td>
        <td></td>
        <td><strong>OPENING BALANCE</strong></td>
        <td class="r"></td>
        <td class="r"></td>
        <td class="r"><strong>${fmt(openingBalance)}</strong></td>
        <td class="c"></td>
      </tr>
      ${rows.map(r => `
      <tr>
        <td>${r.txnDateFormatted}</td>
        <td>${_esc(r.chqNo)}</td>
        <td class="axis-part">${_esc(r.description)}</td>
        <td class="r">${r.dr > 0 ? fmt(r.dr) : ''}</td>
        <td class="r">${r.cr > 0 ? fmt(r.cr) : ''}</td>
        <td class="r">${fmt(r.balance)}</td>
        <td class="c">${_esc(r.initBr)}</td>
      </tr>`).join('')}
      <tr class="row-total">
        <td colspan="3"><strong>TRANSACTION TOTAL</strong></td>
        <td class="r"><strong>${fmt(totalDr)}</strong></td>
        <td class="r"><strong>${fmt(totalCr)}</strong></td>
        <td class="r"></td>
        <td class="c"></td>
      </tr>
      <tr class="row-total">
        <td colspan="5"><strong>CLOSING BALANCE</strong></td>
        <td class="r"><strong>${fmt(closingBalance)}</strong></td>
        <td class="c"></td>
      </tr>
    </tbody>
  </table>

  <!-- Disclaimers & Notes -->
  <div class="axis-notes-block">
    <p>Unless the constituent notifies the bank immediately of any discrepancy found by him/her in this statement of Account, it will be taken that he/she has found the account correct.</p>
    <p>The closing balance as shown/displayed includes not only the credit balance and / or overdraft limit, but also funds which are under clearing. It excludes the amount marked as lien, if any. Hence the closing balance displayed may not be the effective available balance. For any further clarifications, please contact the Branch.</p>
    <p>We would like to reiterate that, as a policy, Axis Bank never asks you to share, disclose, or revalidate your login Id, password or debit card number number through emails OR phone call Further,we would like to reiterate that Axis Bank shall not be liable for any losses arising from you sharing/disclosing of your login id, password and debit card number to anyone. Please co-operate by forwarding all such suspicious/spam emails, if received by you, to customer.service@axis.bank.in</p>
    <p>With effect from 1st August 2016, the replacement charges for Debit card and ATM card applicable on Current accounts have been revised. To know more about the applicable charges,please visit www.axis.bank.in</p>
    <p>Deposit Insurance and Credit Guarantee Corporation (DICGC) insurance cover is applicable in all Banks' deposits, such as savings, current, fixed, recurring etc* up to maximum amount of Rs 5 Lakh including principal &amp; interest both* (* or exceptions and details please refer www.dicgc.org.in )</p>
    <p>In compliance with regulatory guidelines, the non-CTS cheque books attached to the accounts would be destroyed in banks core banking System. Thus, Non CTS cheques will not be valid for CASH, Clearing and Transfer transactions</p>
    <p>To ensure you never miss any critical communication from us, it is important that your latest / correct mobile number and email ID are updated in our records. Kindly visit your nearest Axis Bank Loan Centre /Branch / Agri area office for updating your latest / correct mobile number and email ID in our records. You can also update your email ID using Internet Banking &amp; Mobile Banking App, open</p>
    <p class="axis-office-line"><strong>REGISTERED OFFICE -</strong> AXIS BANK LTD,TRISHUL,Opp. Samartheswar Temple, Near Law Garden, Ellisbridge, Ahmedabad . 380006.</p>
    <p class="axis-office-line"><strong>BRANCH ADDRESS -</strong> AXIS BANK LTD, , ${_esc(branchAddress)}, TEL:${_esc(branchPhone)} FAX: </p>
  </div>

  <!-- Legends -->
  <div class="axis-legends-block">
    <div class="axis-legends-title">Legends :</div>
    <div class="axis-legends-list">
      <div>ICONN-Transaction trough Internet Banking</div>
      <div>VMT-ICON-Visa Money Transfer through Internet Banking</div>
      <div>AUTOSWEEP-Transfer to linked fixed deposit</div>
      <div>REV SWEEP-Interest on Linked fixed Deposit</div>
      <div>SWEEP TRF-Transfer from Linked Fixed Deposit / Account</div>
      <div>VMT-Visa Money Transfer through ATM</div>
      <div>CWDR-Cash Withdrawal through ATM</div>
      <div>PUR-POS purchase</div>
      <div>TIP/ SCG-Surcharge on usage of debit card at pumps/railway ticket purchase or hotel tips</div>
      <div>RATE.DIFF-Difference in rates on usage of card internationally</div>
      <div>CLG-Cheque Clearing Transaction</div>
      <div>EDC-Credit transaction through EDC Machine</div>
      <div>SETU -Seamless electronic fund transfer through AXIS Bank</div>
      <div>Int.pd-Interest paid to customer</div>
      <div>Int.Coll-Interest collected from the customer</div>
    </div>
    <div class="axis-sys-gen">This is a system generated output and requires no signature.</div>
    <div class="axis-end-stmt">++++ End of Statement ++++</div>
  </div>
</div>
</body>
</html>`;
  }

  // ── 3. SBI (State Bank of India) Authentic Statement Template ─────────
  function _generateSBIStatement(data) {
    const b = data.bank || {};
    const ac = data.account || {};
    const txs = data.transactions || [];

    const U = s => (s == null ? '' : String(s).trim().toUpperCase());
    const holder = U(ac.holder) || 'CUSTOMER NAME';
    const holderAddress = U(ac.address) || 'VILL + PO - BASIRHAT, DIST - NORTH 24 PARGANAS, PIN - 743412';
    const branchName = U(ac.branch) || 'BASIRHAT MAIN BRANCH';
    const acNo = U(ac.accountNo) || '30894512345';
    const acType = U(ac.accountType) || 'SAVINGS BANK ACCOUNT';
    const cifNo = U(ac.cifNo || ac.custId) || '85412096321';
    const branchCode = U(ac.branchCode) || '00321';
    const ifsc = U(ac.ifsc) || 'SBIN0000321';
    const micr = U(ac.micr) || '700002045';
    const pan = U(ac.pan);
    const mobile = ac.mobile;
    const email = ac.email;
    const nomineeName = U(ac.nomineeName);

    const fromDateDisplay = fmtDate(data.fromDate);
    const toDateDisplay = fmtDate(data.toDate);
    const downloadDate = fmtDate(new Date().toISOString().slice(0, 10));

    let balance = parseFloat(ac.openingBalance) || 0;
    let totalDr = 0;
    let totalCr = 0;

    const rows = txs.map((t, idx) => {
      const dr = parseFloat(t.debit) || 0;
      const cr = parseFloat(t.credit) || 0;
      balance = balance - dr + cr;
      totalDr += dr;
      totalCr += cr;
      return {
        ...t,
        slNo: idx + 1,
        refNo: U(t.refNo || t.tranId) || `TRANSFER-${idx + 1}`,
        desc: U(t.description || t.narration || t.remark || ''),
        valDate: fmtDate(t.valueDate || t.txnDate),
        txnDate: fmtDate(t.txnDate),
        dr,
        cr,
        balance
      };
    });

    const openingBalance = parseFloat(ac.openingBalance) || 0;
    const closingBalance = balance;
    const bl = _getBL();
    const logoData = b.logoData || (bl ? bl.getLogo('SBI') : null);

    let logoHtml = logoData ? `<img src="${logoData}" alt="SBI Logo" class="sbi-logo-img" />` : `<div class="sbi-text-brand">STATE BANK OF INDIA</div>`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>SBI Account Statement - ${acNo}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Roboto', Arial, Helvetica, sans-serif;
    background: #e2e8f0;
    color: #111827;
    padding: 20px;
    font-size: 8.5pt;
    line-height: 1.3;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  @media print {
    body { background: #fff; padding: 0; margin: 0; }
    .sbi-page { box-shadow: none !important; margin: 0 !important; max-width: 100% !important; border: none !important; }
    .no-print { display: none !important; }
    @page { margin: 8mm 6mm 10mm 6mm; size: A4 portrait; }
  }
  .sbi-page {
    max-width: 920px;
    margin: 0 auto;
    background: #fff;
    border: 1px solid #cbd5e1;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  }
  .sbi-header-band {
    background: #003399;
    color: #fff;
    padding: 16px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .sbi-brand-title {
    font-size: 16pt;
    font-weight: 800;
    letter-spacing: 0.5px;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .sbi-logo-img { max-height: 50px; max-width: 340px; width: auto; height: auto; object-fit: contain; }
  .sbi-sub-tag { font-size: 8pt; font-weight: 400; opacity: 0.9; }
  .sbi-details-grid {
    padding: 18px 24px 14px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    background: #f8fafc;
    border-bottom: 2px solid #003399;
  }
  .sbi-box-title {
    font-size: 9pt;
    font-weight: 700;
    color: #003399;
    text-transform: uppercase;
    margin-bottom: 6px;
    border-bottom: 1px solid #cbd5e1;
    padding-bottom: 3px;
  }
  .sbi-info-table { width: 100%; border-collapse: collapse; font-size: 8pt; }
  .sbi-info-table td { padding: 2px 4px; vertical-align: top; }
  .sbi-info-table .lbl { font-weight: 600; color: #475569; width: 40%; }
  .sbi-info-table .val { font-weight: 700; color: #0f172a; }

  .sbi-summary-ribbon {
    padding: 10px 24px;
    background: #eff6ff;
    display: flex;
    justify-content: space-between;
    font-size: 8pt;
    font-weight: 600;
    border-bottom: 1px solid #bfdbfe;
  }
  .sbi-summary-item span { color: #1e40af; font-weight: 700; }

  .sbi-table-wrap { padding: 16px 24px; }
  .sbi-table { width: 100%; border-collapse: collapse; font-size: 7.8pt; }
  .sbi-table th {
    background: #003399;
    color: #fff;
    padding: 8px 6px;
    text-align: left;
    font-size: 7.5pt;
    font-weight: 700;
    text-transform: uppercase;
    border: 1px solid #002266;
  }
  .sbi-table th.r, .sbi-table td.r { text-align: right; }
  .sbi-table td {
    padding: 6px 6px;
    border: 1px solid #e2e8f0;
    vertical-align: top;
  }
  .sbi-table tr:nth-child(even) td { background: #f8fafc; }
  .sbi-td-desc { font-family: 'JetBrains Mono', monospace; font-size: 7.2pt; word-break: break-word; }
  .sbi-td-dr { color: #b91c1c; font-weight: 600; }
  .sbi-td-cr { color: #15803d; font-weight: 600; }
  .sbi-td-bal { font-weight: 700; color: #0f172a; }

  .sbi-footer {
    padding: 14px 24px;
    background: #f1f5f9;
    border-top: 1px solid #cbd5e1;
    font-size: 7.5pt;
    color: #475569;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  /* Print Bar */
  .stmt-print-bar { text-align: center; padding: 18px; }
  .stmt-print-bar button {
    padding: 10px 32px; font-size: 14px; font-weight: 600;
    font-family: 'Roboto', Arial, sans-serif;
    border: none; cursor: pointer; margin: 0 6px;
    border-radius: 6px;
  }
  .btn-print { background: #003399; color: #fff; transition: background 0.2s; }
  .btn-print:hover { background: #002266; }
  .btn-close-stmt { background: #e5e7eb; color: #374151; transition: background 0.2s; }
  .btn-close-stmt:hover { background: #d1d5db; }
</style>
</head>
<body>

<div class="stmt-print-bar no-print">
  <button class="btn-print" onclick="window.print()">Print / Save as PDF</button>
  <button class="btn-close-stmt" onclick="window.close()">Close</button>
</div>

<div class="sbi-page">
  <div class="sbi-header-band">
    <div class="sbi-brand-title">
      ${logoHtml}
    </div>
    <div style="text-align: right;">
      <div style="font-weight: 700; font-size: 10pt;">STATEMENT OF ACCOUNT</div>
      <div class="sbi-sub-tag">Generated: ${downloadDate}</div>
    </div>
  </div>

  <div class="sbi-details-grid">
    <div>
      <div class="sbi-box-title">Account Holder Details</div>
      <table class="sbi-info-table">
        <tr><td class="lbl">Account Name:</td><td class="val">${_esc(holder)}</td></tr>
        <tr><td class="lbl">Address:</td><td class="val">${_esc(holderAddress)}</td></tr>
        <tr><td class="lbl">Account Number:</td><td class="val">${_esc(acNo)}</td></tr>
        <tr><td class="lbl">Account Type:</td><td class="val">${_esc(acType)}</td></tr>
        ${pan ? `<tr><td class="lbl">PAN:</td><td class="val">${_esc(pan)}</td></tr>` : ''}
        ${mobile ? `<tr><td class="lbl">Mobile:</td><td class="val">${_esc(mobile)}</td></tr>` : ''}
        ${email ? `<tr><td class="lbl">Email:</td><td class="val">${_esc(email)}</td></tr>` : ''}
        ${nomineeName ? `<tr><td class="lbl">Nominee:</td><td class="val">${_esc(nomineeName)}</td></tr>` : ''}
      </table>
    </div>
    <div>
      <div class="sbi-box-title">Branch &amp; Banking Details</div>
      <table class="sbi-info-table">
        <tr><td class="lbl">Branch:</td><td class="val">${_esc(branchName)}</td></tr>
        <tr><td class="lbl">Branch Code:</td><td class="val">${_esc(branchCode)}</td></tr>
        <tr><td class="lbl">CIF Number:</td><td class="val">${_esc(cifNo)}</td></tr>
        <tr><td class="lbl">IFS Code:</td><td class="val">${_esc(ifsc)}</td></tr>
        <tr><td class="lbl">MICR Code:</td><td class="val">${_esc(micr)}</td></tr>
        <tr><td class="lbl">Statement Period:</td><td class="val">${fromDateDisplay} to ${toDateDisplay}</td></tr>
      </table>
    </div>
  </div>

  <div class="sbi-summary-ribbon">
    <div class="sbi-summary-item">Opening Balance: <span>₹ ${fmt(openingBalance)}</span></div>
    <div class="sbi-summary-item">Total Debit: <span>₹ ${fmt(totalDr)}</span></div>
    <div class="sbi-summary-item">Total Credit: <span>₹ ${fmt(totalCr)}</span></div>
    <div class="sbi-summary-item">Closing Balance: <span>₹ ${fmt(closingBalance)}</span></div>
  </div>

  <div class="sbi-table-wrap">
    <table class="sbi-table">
      <thead>
        <tr>
          <th style="width: 4%;">#</th>
          <th style="width: 10%;">Txn Date</th>
          <th style="width: 10%;">Value Date</th>
          <th style="width: 44%;">Description / Ref No</th>
          <th style="width: 10%;" class="r">Debit (₹)</th>
          <th style="width: 10%;" class="r">Credit (₹)</th>
          <th style="width: 12%;" class="r">Balance (₹)</th>
        </tr>
      </thead>
      <tbody>
        <tr style="background:#eff6ff;font-weight:700;">
          <td colspan="4">OPENING BALANCE B/F</td>
          <td class="r">--</td>
          <td class="r">--</td>
          <td class="r sbi-td-bal">${fmt(openingBalance)}</td>
        </tr>
        ${rows.map(r => `
        <tr>
          <td style="text-align:center;color:#64748b;">${r.slNo}</td>
          <td>${r.txnDate}</td>
          <td>${r.valDate}</td>
          <td class="sbi-td-desc"><strong>${_esc(r.desc)}</strong><br/><span style="color:#64748b;font-size:6.8pt;">REF: ${_esc(r.refNo)}</span></td>
          <td class="r sbi-td-dr">${r.dr > 0 ? fmt(r.dr) : '--'}</td>
          <td class="r sbi-td-cr">${r.cr > 0 ? fmt(r.cr) : '--'}</td>
          <td class="r sbi-td-bal">${fmt(r.balance)}</td>
        </tr>`).join('')}
        <tr style="background:#f0fdf4;font-weight:700;">
          <td colspan="4">CLOSING BALANCE C/F</td>
          <td class="r sbi-td-dr">${fmt(totalDr)}</td>
          <td class="r sbi-td-cr">${fmt(totalCr)}</td>
          <td class="r sbi-td-bal">${fmt(closingBalance)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="sbi-footer">
    <div>This is a computer generated account statement and does not require physical signature.</div>
    <div>State Bank of India &bull; The Banker to Every Indian</div>
  </div>
</div>
</body>
</html>`;
  }

  // ── 3. HDFC Bank Authentic Statement Template ─────────────────────────
  function _generateHDFCStatement(data) {
    const b = data.bank || {};
    const ac = data.account || {};
    const txs = data.transactions || [];

    const U = s => (s == null ? '' : String(s).trim().toUpperCase());
    const holder = U(ac.holder) || 'CUSTOMER NAME';
    const holderAddress = U(ac.address) || 'SUITE 402, CITY CENTRE, SALT LAKE, SECTOR 1, KOLKATA, 700064';
    const branchName = U(ac.branch) || 'SALT LAKE SECTOR I';
    const acNo = U(ac.accountNo) || '50100234891234';
    const acType = U(ac.accountType) || 'SAVINGS ACCOUNTS - REGULAR';
    const custId = U(ac.custId) || '72910485';
    const branchCode = U(ac.branchCode) || '0289';
    const ifsc = U(ac.ifsc) || 'HDFC0000289';
    const micr = U(ac.micr) || '700240012';
    const pan = U(ac.pan);
    const mobile = ac.mobile;
    const email = ac.email;
    const nomineeName = U(ac.nomineeName);

    const fromDateDisplay = fmtDate(data.fromDate);
    const toDateDisplay = fmtDate(data.toDate);
    const downloadDate = fmtDate(new Date().toISOString().slice(0, 10));

    let balance = parseFloat(ac.openingBalance) || 0;
    let totalDr = 0;
    let totalCr = 0;

    const rows = txs.map((t, idx) => {
      const dr = parseFloat(t.debit) || 0;
      const cr = parseFloat(t.credit) || 0;
      balance = balance - dr + cr;
      totalDr += dr;
      totalCr += cr;
      return {
        ...t,
        slNo: idx + 1,
        chqRef: U(t.refNo || t.tranId) || `REF${idx + 1000}`,
        narration: U(t.description || t.narration || t.remark || ''),
        valDate: fmtDate(t.valueDate || t.txnDate),
        txnDate: fmtDate(t.txnDate),
        dr,
        cr,
        balance
      };
    });

    const openingBalance = parseFloat(ac.openingBalance) || 0;
    const closingBalance = balance;
    const bl = _getBL();
    const logoData = b.logoData || (bl ? bl.getLogo('HDFC') : null);

    let logoHtml = logoData ? `<img src="${logoData}" alt="HDFC Bank Logo" class="hdfc-logo-img" />` : `<div class="hdfc-text-brand">HDFC BANK</div>`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>HDFC Bank Statement - ${acNo}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    background: #e2e8f0;
    color: #1c1c1c;
    padding: 20px;
    font-size: 8.5pt;
    line-height: 1.25;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  @media print {
    body { background: #fff; padding: 0; margin: 0; }
    .hdfc-page { box-shadow: none !important; margin: 0 !important; max-width: 100% !important; border: none !important; }
    .no-print { display: none !important; }
    @page { margin: 8mm 6mm 10mm 6mm; size: A4 portrait; }
  }
  .hdfc-page {
    max-width: 920px;
    margin: 0 auto;
    background: #fff;
    border: 1px solid #cbd5e1;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    padding: 24px;
  }
  .hdfc-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2px solid #004c8f;
    padding-bottom: 14px;
    margin-bottom: 14px;
  }
  .hdfc-logo-img { max-height: 50px; max-width: 320px; width: auto; height: auto; object-fit: contain; }
  .hdfc-title-box { text-align: right; }
  .hdfc-main-title { font-size: 13pt; font-weight: bold; color: #004c8f; text-transform: uppercase; }
  .hdfc-meta-sub { font-size: 8pt; color: #64748b; margin-top: 2px; }

  .hdfc-grid {
    display: grid;
    grid-template-columns: 1.1fr 0.9fr;
    gap: 16px;
    margin-bottom: 14px;
  }
  .hdfc-cust-card, .hdfc-summary-card {
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    padding: 12px;
    border-radius: 4px;
  }
  .hdfc-card-head {
    font-size: 8.5pt;
    font-weight: bold;
    color: #004c8f;
    border-bottom: 1px solid #cbd5e1;
    padding-bottom: 4px;
    margin-bottom: 8px;
    text-transform: uppercase;
  }
  .hdfc-info-line { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 8pt; }
  .hdfc-info-line .l { color: #475569; font-weight: 600; }
  .hdfc-info-line .v { color: #0f172a; font-weight: bold; }

  .hdfc-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 7.8pt;
    margin-top: 10px;
  }
  .hdfc-table th {
    background: #004c8f;
    color: #fff;
    padding: 8px 6px;
    text-align: left;
    font-size: 7.5pt;
    font-weight: bold;
    border: 1px solid #003366;
  }
  .hdfc-table th.r, .hdfc-table td.r { text-align: right; }
  .hdfc-table td {
    padding: 6px 6px;
    border: 1px solid #e2e8f0;
    vertical-align: top;
  }
  .hdfc-table tr:nth-child(even) td { background: #f8fafc; }
  .hdfc-desc { font-family: 'JetBrains Mono', monospace; font-size: 7.2pt; word-break: break-word; }
  .hdfc-dr { color: #dc2626; font-weight: bold; }
  .hdfc-cr { color: #16a34a; font-weight: bold; }
  .hdfc-bal { font-weight: bold; color: #0f172a; }

  .hdfc-foot {
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid #e2e8f0;
    font-size: 7.2pt;
    color: #64748b;
    display: flex;
    justify-content: space-between;
  }

  /* Print Bar */
  .stmt-print-bar { text-align: center; padding: 18px; }
  .stmt-print-bar button {
    padding: 10px 32px; font-size: 14px; font-weight: 600;
    font-family: Arial, sans-serif;
    border: none; cursor: pointer; margin: 0 6px;
    border-radius: 6px;
  }
  .btn-print { background: #004c8f; color: #fff; transition: background 0.2s; }
  .btn-print:hover { background: #003366; }
  .btn-close-stmt { background: #e5e7eb; color: #374151; transition: background 0.2s; }
  .btn-close-stmt:hover { background: #d1d5db; }
</style>
</head>
<body>

<div class="stmt-print-bar no-print">
  <button class="btn-print" onclick="window.print()">Print / Save as PDF</button>
  <button class="btn-close-stmt" onclick="window.close()">Close</button>
</div>

<div class="hdfc-page">
  <div class="hdfc-top">
    <div>${logoHtml}</div>
    <div class="hdfc-title-box">
      <div class="hdfc-main-title">Account Statement</div>
      <div class="hdfc-meta-sub">Period: ${fromDateDisplay} to ${toDateDisplay}</div>
      <div class="hdfc-meta-sub">Generated On: ${downloadDate}</div>
    </div>
  </div>

  <div class="hdfc-grid">
    <div class="hdfc-cust-card">
      <div class="hdfc-card-head">Account Holder &amp; Branch Details</div>
      <div class="hdfc-info-line"><span class="l">Name:</span><span class="v">${_esc(holder)}</span></div>
      <div class="hdfc-info-line"><span class="l">Address:</span><span class="v" style="max-width:240px;text-align:right;">${_esc(holderAddress)}</span></div>
      <div class="hdfc-info-line"><span class="l">Account No:</span><span class="v">${_esc(acNo)}</span></div>
      <div class="hdfc-info-line"><span class="l">Cust ID:</span><span class="v">${_esc(custId)}</span></div>
      <div class="hdfc-info-line"><span class="l">Account Type:</span><span class="v">${_esc(acType)}</span></div>
      <div class="hdfc-info-line"><span class="l">Branch / IFSC:</span><span class="v">${_esc(branchName)} / ${_esc(ifsc)}</span></div>
      ${pan ? `<div class="hdfc-info-line"><span class="l">PAN:</span><span class="v">${_esc(pan)}</span></div>` : ''}
      ${mobile ? `<div class="hdfc-info-line"><span class="l">Mobile:</span><span class="v">${_esc(mobile)}</span></div>` : ''}
      ${email ? `<div class="hdfc-info-line"><span class="l">Email:</span><span class="v">${_esc(email)}</span></div>` : ''}
      ${nomineeName ? `<div class="hdfc-info-line"><span class="l">Nominee:</span><span class="v">${_esc(nomineeName)}</span></div>` : ''}
    </div>
    <div class="hdfc-summary-card">
      <div class="hdfc-card-head">Account Statement Summary</div>
      <div class="hdfc-info-line"><span class="l">Opening Balance:</span><span class="v">₹ ${fmt(openingBalance)}</span></div>
      <div class="hdfc-info-line"><span class="l">Total Deposits / Credits (+):</span><span class="v" style="color:#16a34a;">₹ ${fmt(totalCr)}</span></div>
      <div class="hdfc-info-line"><span class="l">Total Withdrawals / Debits (-):</span><span class="v" style="color:#dc2626;">₹ ${fmt(totalDr)}</span></div>
      <div class="hdfc-info-line" style="border-top:1px dashed #cbd5e1;padding-top:4px;margin-top:6px;"><span class="l">Closing Balance:</span><span class="v" style="font-size:9pt;color:#004c8f;">₹ ${fmt(closingBalance)}</span></div>
    </div>
  </div>

  <table class="hdfc-table">
    <thead>
      <tr>
        <th style="width: 4%;">#</th>
        <th style="width: 10%;">Date</th>
        <th style="width: 42%;">Narration</th>
        <th style="width: 12%;">Chq / Ref No</th>
        <th style="width: 10%;">Value Dt</th>
        <th style="width: 11%;" class="r">Withdrawal (Dr)</th>
        <th style="width: 11%;" class="r">Deposit (Cr)</th>
        <th style="width: 12%;" class="r">Closing Balance</th>
      </tr>
    </thead>
    <tbody>
      <tr style="background:#eff6ff;font-weight:bold;">
        <td colspan="5">OPENING BALANCE</td>
        <td class="r">--</td>
        <td class="r">--</td>
        <td class="r hdfc-bal">${fmt(openingBalance)}</td>
      </tr>
      ${rows.map(r => `
      <tr>
        <td style="text-align:center;color:#64748b;">${r.slNo}</td>
        <td>${r.txnDate}</td>
        <td class="hdfc-desc">${_esc(r.narration)}</td>
        <td style="font-family:monospace;font-size:7pt;">${_esc(r.chqRef)}</td>
        <td>${r.valDate}</td>
        <td class="r hdfc-dr">${r.dr > 0 ? fmt(r.dr) : '--'}</td>
        <td class="r hdfc-cr">${r.cr > 0 ? fmt(r.cr) : '--'}</td>
        <td class="r hdfc-bal">${fmt(r.balance)}</td>
      </tr>`).join('')}
      <tr style="background:#f0fdf4;font-weight:bold;">
        <td colspan="5">CLOSING BALANCE</td>
        <td class="r hdfc-dr">${fmt(totalDr)}</td>
        <td class="r hdfc-cr">${fmt(totalCr)}</td>
        <td class="r hdfc-bal">${fmt(closingBalance)}</td>
      </tr>
    </tbody>
  </table>

  <div class="hdfc-foot">
    <div>HDFC Bank Ltd. Registered Office: HDFC Bank House, Senapati Bapat Marg, Lower Parel (West), Mumbai - 400 013.</div>
    <div>Computer Generated Statement &bull; Does Not Require Physical Signature</div>
  </div>
</div>
</body>
</html>`;
  }

  // ── 4. Refined Modern Statement Format ──────────────────────────────
  function _generateStandardStatement(data) {
    const b = data.bank || {};
    const ac = data.account || {};
    const txs = (data.transactions || []).slice();
    const minBalance = parseFloat(data.minBalance) > 0 ? parseFloat(data.minBalance) : DEFAULT_MIN_BALANCE;

    const U = s => (s ? String(s).trim().toUpperCase() : '');

    const bankName = U(b.name) || 'BANK STATEMENT';
    const logoText = (b.logoText || bankName).toUpperCase().slice(0, 2);
    const logoData = b.logoData || null;
    const branch = U(ac.branch || b.address) || 'MAIN BRANCH';
    const ifsc = U(ac.ifsc) || 'UTIB0000001';
    const acNo = U(ac.accountNo) || '--';
    const acType = U(ac.accountType) || 'CAA';
    const holder = U(ac.holder) || 'ACCOUNT HOLDER';
    const custId = U(ac.custId) || '--';
    const holderAddress = U(ac.address) || '';
    const pan = U(ac.pan);
    const mobile = ac.mobile;
    const email = ac.email;
    const nomineeName = U(ac.nomineeName);
    const fromDate = fmtDisplayDate(data.fromDate);
    const toDate = fmtDisplayDate(data.toDate);
    const periodText = `${fromDate}  TO  ${toDate}`;
    const generatedOn = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    let balance = parseFloat(ac.openingBalance) || 0;
    let totalDr = 0;
    let totalCr = 0;

    const rows = txs.map((t, idx) => {
      const dr = parseFloat(t.debit) || 0;
      const cr = parseFloat(t.credit) || 0;
      balance = balance - dr + cr;
      totalDr += dr;
      totalCr += cr;
      return {
        ...t,
        slNo: idx + 1,
        tranId: U(t.tranId) || `TXN${Math.floor(10000000 + idx * 1000 + Math.random() * 900)}`,
        description: U(t.description || t.narration || t.remark || ''),
        txnDateFormatted: fmtDate(t.txnDate),
        valueDateFormatted: fmtDate(t.valueDate || t.txnDate),
        dr,
        cr,
        balance
      };
    });

    const closingBalance = balance;
    const openingBalance = parseFloat(ac.openingBalance) || 0;

    // Bank Logo badge - prioritize local project bank logo / admin saved logo
    const bl = _getBL();
    const effectiveLogo = logoData || (bl ? bl.getLogo(bankName) : null);
    let logoHtml;
    if (effectiveLogo) {
      logoHtml = `<div class="mod-logo mod-logo-img-wrap" style="background:#fff;padding:2px;"><img src="${effectiveLogo}" alt="${_esc(bankName)}" class="mod-logo-img" style="width:100%;height:100%;object-fit:contain;" /></div>`;
    } else {
      const colors = [
        ['#0f172a','#1e293b'],['#0369a1','#0284c7'],['#1e3a8a','#2563eb'],
        ['#701a75','#86198f'],['#14532d','#15803d'],['#7c2d12','#9a3412'],
        ['#312e81','#4338ca'],['#831843','#9d174d']
      ];
      const ci = bankName.charCodeAt(0) % colors.length;
      const grad = `linear-gradient(135deg, ${colors[ci][0]}, ${colors[ci][1]})`;
      logoHtml = `<div class="mod-logo" style="background:${grad};color:#fff;border:1px solid #e2e8f0;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;">${_esc(logoText || bankName.slice(0,2))}</div>`;
    }

    const txRows = rows.map((r, i) => {
      const stripe = i % 2 === 0 ? 'row-even' : 'row-odd';
      return `<tr class="${stripe}">
        <td class="td-sl">${r.slNo}</td>
        <td class="td-date">${r.txnDateFormatted}</td>
        <td class="td-date">${r.valueDateFormatted}</td>
        <td class="td-tranid">${_esc(r.tranId)}</td>
        <td class="td-desc">${_esc(r.description || '')}</td>
        <td class="td-dr">${r.dr ? fmt(r.dr) : '-'}</td>
        <td class="td-cr">${r.cr ? fmt(r.cr) : '-'}</td>
        <td class="td-bal">${fmt(r.balance)}</td>
      </tr>`;
    }).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${_esc(bankName)}_Statement</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #e2e8f0;
    color: #0f172a;
    padding: 24px;
    font-size: 8.5pt;
    line-height: 1.4;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  @media print {
    body { background: #fff; padding: 0; margin: 0; }
    .mod-page { box-shadow: none !important; margin: 0 !important; max-width: 100% !important; border: none !important; border-radius: 0 !important; }
    .no-print { display: none !important; }
    @page { margin: 10mm 8mm; size: A4 portrait; }
  }

  .mod-page {
    max-width: 900px;
    margin: 0 auto;
    background: #fff;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
    overflow: hidden;
  }

  /* ── Header Top Bar ── */
  .mod-top-bar {
    height: 6px;
    background: linear-gradient(90deg, #1e3a8a, #3b82f6, #06b6d4);
  }

  .mod-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 28px 16px;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
  }
  .mod-brand {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .mod-logo {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16pt;
    font-weight: 900;
    letter-spacing: 0.5px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.12);
  }
  .mod-logo.mod-logo-img-wrap {
    width: auto !important;
    height: auto !important;
    max-height: 54px;
    max-width: 340px;
    display: flex;
    align-items: center;
    box-shadow: none;
    border-radius: 4px;
  }
  .mod-logo-img {
    max-height: 54px;
    max-width: 340px;
    width: auto;
    height: auto;
    object-fit: contain;
  }
  .mod-logo img { width: auto; height: auto; max-width: 340px; max-height: 54px; object-fit: contain; }
  .mod-brand-text h1 {
    font-size: 16pt;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.3px;
    line-height: 1.2;
  }
  .mod-brand-text p {
    font-size: 8.5pt;
    color: #64748b;
    font-weight: 500;
  }
  .mod-statement-badge {
    text-align: right;
  }
  .mod-statement-badge .badge-title {
    font-size: 12pt;
    font-weight: 800;
    color: #1e3a8a;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .mod-statement-badge .badge-period {
    font-size: 8.5pt;
    font-weight: 600;
    color: #475569;
    margin-top: 2px;
  }

  /* ── Account Summary & Meta ── */
  .mod-meta-section {
    padding: 16px 28px;
    display: grid;
    grid-template-columns: 1.4fr 1fr;
    gap: 20px;
    border-bottom: 1px solid #e2e8f0;
  }
  .mod-acc-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 12px 16px;
  }
  .mod-acc-card-title {
    font-size: 8pt;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
    border-bottom: 1px dashed #e2e8f0;
    padding-bottom: 4px;
  }
  .mod-grid-2 {
    display: grid;
    grid-template-columns: 100px 1fr;
    gap: 4px 10px;
    font-size: 8.5pt;
  }
  .mod-grid-lbl { color: #64748b; font-weight: 600; }
  .mod-grid-val { color: #0f172a; font-weight: 700; }

  /* ── Financial Highlights Cards ── */
  .mod-kpi-bar {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    padding: 14px 28px;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
  }
  .mod-kpi-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 10px 12px;
    text-align: center;
  }
  .mod-kpi-card.closing {
    background: #f0fdf4;
    border-color: #bbf7d0;
  }
  .mod-kpi-lbl {
    font-size: 7.5pt;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 2px;
  }
  .mod-kpi-val {
    font-size: 11pt;
    font-weight: 800;
    color: #0f172a;
    font-variant-numeric: tabular-nums;
  }
  .mod-kpi-card.closing .mod-kpi-val {
    color: #15803d;
  }

  /* ── Transaction Table ── */
  .mod-table-wrap {
    padding: 16px 28px 24px;
  }
  .mod-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 7.8pt;
  }
  .mod-table thead th {
    background: #0f172a;
    color: #f8fafc;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    font-size: 7.5pt;
    padding: 8px 6px;
    border: 1px solid #1e293b;
    text-align: left;
    white-space: nowrap;
  }
  .mod-table thead th.r { text-align: right; }
  .mod-table tbody td {
    padding: 6px 6px;
    border: 1px solid #e2e8f0;
    vertical-align: top;
    line-height: 1.35;
  }
  .row-even td { background: #ffffff; }
  .row-odd td { background: #f8fafc; }

  .td-sl { width: 3.5%; text-align: center; font-weight: 600; color: #64748b; }
  .td-date { width: 9%; white-space: nowrap; font-weight: 500; }
  .td-tranid { width: 9%; font-family: 'JetBrains Mono', monospace; font-size: 7.2pt; color: #475569; }
  .td-desc { width: 44.5%; font-family: 'JetBrains Mono', monospace; font-size: 7.2pt; word-break: break-word; color: #1e293b; }
  .td-dr { width: 11%; text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; color: #b91c1c; }
  .td-cr { width: 11%; text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; color: #15803d; }
  .td-bal { width: 12%; text-align: right; font-variant-numeric: tabular-nums; font-weight: 700; color: #0f172a; }

  .row-open-stmt td {
    background: #eff6ff !important;
    font-weight: 700;
    color: #1e3a8a;
  }
  .row-close-stmt td {
    background: #f0fdf4 !important;
    font-weight: 800;
    color: #15803d;
  }

  /* ── Footer ── */
  .mod-footer {
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
    padding: 14px 28px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 7.5pt;
    color: #64748b;
  }
  .mod-disclaimer {
    max-width: 68%;
    line-height: 1.4;
  }
  .mod-generated-stamp {
    text-align: right;
    font-weight: 600;
  }

  /* Print Bar */
  .stmt-print-bar { text-align: center; padding: 18px; }
  .stmt-print-bar button {
    padding: 10px 32px; font-size: 14px; font-weight: 600;
    font-family: 'Inter', sans-serif; border: none; cursor: pointer; margin: 0 6px;
    border-radius: 6px;
  }
  .btn-print { background: #1e3a8a; color: #fff; }
  .btn-print:hover { background: #172554; }
  .btn-close-stmt { background: #e2e8f0; color: #334155; }
  .btn-close-stmt:hover { background: #cbd5e1; }
</style>
</head>
<body>

<div class="stmt-print-bar no-print">
  <button class="btn-print" onclick="window.print()">Print / Save as PDF</button>
  <button class="btn-close-stmt" onclick="window.close()">Close</button>
</div>

<div class="mod-page">
  <div class="mod-top-bar"></div>

  <!-- Header -->
  <div class="mod-header">
    <div class="mod-brand">
      ${logoHtml}
      <div class="mod-brand-text">
        <h1>${_esc(bankName)}</h1>
        <p>${_esc(branch)} &nbsp;|&nbsp; IFSC: ${_esc(ifsc)}</p>
      </div>
    </div>
    <div class="mod-statement-badge">
      <div class="badge-title">Statement of Account</div>
      <div class="badge-period">${periodText}</div>
    </div>
  </div>

  <!-- Account & Customer Details -->
  <div class="mod-meta-section">
    <div class="mod-acc-card">
      <div class="mod-acc-card-title">Account Information</div>
      <div class="mod-grid-2">
        <div class="mod-grid-lbl">Account Holder:</div>
        <div class="mod-grid-val">${_esc(holder)}</div>
        <div class="mod-grid-lbl">Account Number:</div>
        <div class="mod-grid-val">${_esc(acNo)}</div>
        <div class="mod-grid-lbl">Account Type:</div>
        <div class="mod-grid-val">${_esc(acType)}</div>
        ${pan ? `<div class="mod-grid-lbl">PAN:</div><div class="mod-grid-val">${_esc(pan)}</div>` : ''}
        ${mobile ? `<div class="mod-grid-lbl">Mobile:</div><div class="mod-grid-val">${_esc(mobile)}</div>` : ''}
        ${email ? `<div class="mod-grid-lbl">Email:</div><div class="mod-grid-val">${_esc(email)}</div>` : ''}
        ${nomineeName ? `<div class="mod-grid-lbl">Nominee:</div><div class="mod-grid-val">${_esc(nomineeName)}</div>` : ''}
        ${holderAddress ? `<div class="mod-grid-lbl">Address:</div><div class="mod-grid-val">${_esc(holderAddress)}</div>` : ''}
      </div>
    </div>
    <div class="mod-acc-card">
      <div class="mod-acc-card-title">Branch & System Details</div>
      <div class="mod-grid-2">
        <div class="mod-grid-lbl">Branch:</div>
        <div class="mod-grid-val">${_esc(branch)}</div>
        <div class="mod-grid-lbl">IFSC Code:</div>
        <div class="mod-grid-val">${_esc(ifsc)}</div>
        <div class="mod-grid-lbl">Customer ID:</div>
        <div class="mod-grid-val">${_esc(custId)}</div>
        <div class="mod-grid-lbl">Statement Date:</div>
        <div class="mod-grid-val">${generatedOn}</div>
      </div>
    </div>
  </div>

  <!-- Financial Summary KPI Cards -->
  <div class="mod-kpi-bar">
    <div class="mod-kpi-card">
      <div class="mod-kpi-lbl">Opening Balance</div>
      <div class="mod-kpi-val">₹ ${fmt(openingBalance)}</div>
    </div>
    <div class="mod-kpi-card">
      <div class="mod-kpi-lbl">Total Deposits (Cr)</div>
      <div class="mod-kpi-val" style="color:#15803d">+ ₹ ${fmt(totalCr)}</div>
    </div>
    <div class="mod-kpi-card">
      <div class="mod-kpi-lbl">Total Withdrawals (Dr)</div>
      <div class="mod-kpi-val" style="color:#b91c1c">- ₹ ${fmt(totalDr)}</div>
    </div>
    <div class="mod-kpi-card closing">
      <div class="mod-kpi-lbl">Closing Balance</div>
      <div class="mod-kpi-val">₹ ${fmt(closingBalance)}</div>
    </div>
  </div>

  <!-- Transactions Table -->
  <div class="mod-table-wrap">
    <table class="mod-table">
      <thead>
        <tr>
          <th class="td-sl">#</th>
          <th class="td-date">Txn Date</th>
          <th class="td-date">Value Date</th>
          <th class="td-tranid">Tran ID</th>
          <th class="td-desc">Particulars / Remarks</th>
          <th class="td-dr r">Withdrawal (Dr)</th>
          <th class="td-cr r">Deposit (Cr)</th>
          <th class="td-bal r">Balance (₹)</th>
        </tr>
      </thead>
      <tbody>
        <tr class="row-open-stmt">
          <td class="td-sl">--</td>
          <td class="td-date">${fmtDate(data.fromDate)}</td>
          <td class="td-date">${fmtDate(data.fromDate)}</td>
          <td class="td-tranid">--</td>
          <td class="td-desc"><strong>OPENING BALANCE BROUGHT FORWARD</strong></td>
          <td class="td-dr">-</td>
          <td class="td-cr">-</td>
          <td class="td-bal">${fmt(openingBalance)}</td>
        </tr>
        ${txRows}
        <tr class="row-close-stmt">
          <td class="td-sl">--</td>
          <td class="td-date">${fmtDate(data.toDate)}</td>
          <td class="td-date">${fmtDate(data.toDate)}</td>
          <td class="td-tranid">--</td>
          <td class="td-desc"><strong>CLOSING BALANCE CARRIED FORWARD</strong></td>
          <td class="td-dr">-</td>
          <td class="td-cr">-</td>
          <td class="td-bal">${fmt(closingBalance)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Clean Footer -->
  <div class="mod-footer">
    <div class="mod-disclaimer">
      This is a computer-generated bank account statement. It is valid without signature.
    </div>
    <div class="mod-generated-stamp">
      Generated on ${generatedOn}
    </div>
  </div>
</div>

</body>
</html>`;
  }

  function _esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  const engine = {
    generate,
    generateHighDensityTransactions,
    generateSalariedTransactions,
    getBrandfetchLogo,
    getBankDomain,
    BANK_DOMAINS,
    REMARKS_POOL,
    SALARIED_REMARKS_POOL,
    DEFAULT_MIN_BALANCE,
    fmt,
    fmtDate,
    fmtDisplayDate,
    fmtICICIDate,
    fmtAxisDate
  };

  if (typeof window !== 'undefined') {
    window.BankStatementEngine = engine;
  }

  return engine;
})();

if (typeof module !== 'undefined') {
  module.exports = BankStatementEngine;
}
