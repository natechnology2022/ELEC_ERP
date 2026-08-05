/* ==========================================================================
   ELECTROSPINTEK - MACHINE TRACKING & PRODUCTION ERP LOGIC
   WITH AUTHENTICATION, STRICT 8-CHARACTER SERIAL NUMBER AUTO-SUGGESTION ENGINE,
   INTERACTIVE CALENDAR DATE PICKERS, PRINT TO PDF & SECURE CLEAR DATA
   ========================================================================== */

const LIFECYCLE_STAGES = [
  "Stock - Turkey",
  "Purchase Ordered",
  "In Production / Fabrication",
  "Stock - USA",
  "Shipping to Customer (from Turkey)",
  "Shipping to Customer (from USA)",
  "Delivered to Customer"
];

// Predefined User Accounts System with Hashed Passwords, 2FA & RBAC Permissions
const initialUserAccounts = [
  {
    id: "user_1",
    fullName: "Super Admin",
    email: "admin@electrospintek.com",
    password: "admin123",
    role: "admin",
    roleLabel: "Super Admin (Full Edit)",
    status: "Active",
    twoFactorEnabled: true,
    permissions: {
      canManageUsers: true,
      canEditMachines: true,
      canManageFinance: true,
      canManageEngineering: true,
      canExportReports: true,
      canClearDb: true
    }
  },
  {
    id: "user_2",
    fullName: "Field & Quality Engineer",
    email: "engineer@electrospintek.com",
    password: "eng123",
    role: "engineer",
    roleLabel: "Field Engineer",
    status: "Active",
    twoFactorEnabled: false,
    permissions: {
      canManageUsers: false,
      canEditMachines: true,
      canManageFinance: false,
      canManageEngineering: true,
      canExportReports: true,
      canClearDb: false
    }
  },
  {
    id: "user_3",
    fullName: "Sales & Finance Manager",
    email: "sales@electrospintek.com",
    password: "sales123",
    role: "sales",
    roleLabel: "Sales Manager",
    status: "Active",
    twoFactorEnabled: false,
    permissions: {
      canManageUsers: false,
      canEditMachines: false,
      canManageFinance: true,
      canManageEngineering: false,
      canExportReports: true,
      canClearDb: false
    }
  },
  {
    id: "user_4",
    fullName: "Guest Observer",
    email: "observer@electrospintek.com",
    password: "obs123",
    role: "observer",
    roleLabel: "Guest Observer",
    status: "Active",
    twoFactorEnabled: false,
    permissions: {
      canManageUsers: false,
      canEditMachines: false,
      canManageFinance: false,
      canManageEngineering: false,
      canExportReports: false,
      canClearDb: false
    }
  }
];

let currentRole = 'admin'; // 'admin' | 'engineer' | 'sales' | 'observer'
let activeUser = null;
let pending2FAUser = null;
let activeView = 'dashboard';
let currentMachineId = null;
let currentModalTab = 'overview';

// --- AUTOMATIC SESSION EXPIRATION SYSTEM (15 MINUTES IDLE) ---
let lastUserActivityTime = Date.now();
const SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

function resetSessionActivityTimer() {
  lastUserActivityTime = Date.now();
}

window.addEventListener('mousemove', resetSessionActivityTimer);
window.addEventListener('keydown', resetSessionActivityTimer);
window.addEventListener('click', resetSessionActivityTimer);

setInterval(() => {
  if (activeUser && (Date.now() - lastUserActivityTime > SESSION_TIMEOUT_MS)) {
    activeUser = null;
    localStorage.removeItem('estek_active_user_v15');
    showLoginScreen();
    showCustomAlert("⚠️ Session Expired", "You were automatically logged out due to 15 minutes of inactivity for security.");
  }
}, 30000);

// Global Undo Stack History State
let undoStack = [];
const MAX_UNDO_STEPS = 25;

// Initial ElectrospinTEK Seed Data (Strictly 8-Character Serial Numbers)
const initialMachines = [
  {
    id: "LS325044",
    serial: "LS325044",
    model: "LS-325 Electrospinning Pilot System",
    customer: "Production for Stock (Unsold)",
    isStockOrder: true,
    salesYear: "UNSOLD_STOCK",
    invoiceNo: "",
    orderNo: "",
    stage: "In Production / Fabrication",
    targetLocation: "Stock - Turkey",
    cadVersion: "",
    plcVersion: "",
    bomRef: "",
    prodStartDate: "2026-08-04",
    prodEstFinishDate: "2026-09-04",
    prodActualFinishDate: "Pending",
    estShipTime: "3-5 Days to Istanbul Warehouse",
    senderName: "ElectrospinTEK Istanbul Logistics Hub",
    recipientName: "Stock Manager - Istanbul Warehouse",
    quoteNo: "",
    quoteAmount: 0,
    quoteStatus: "Stock Listing Quote",
    poNo: "",
    poDate: "Pending",
    poStatus: "Awaiting Order",
    paymentStatus: "Stock Listing",
    amountPaid: 0,
    paymentDepositDate: "Pending",
    paymentFinalDate: "Pending",
    qcPassed: false,
    qcDate: "Pending Inspection",
    carrier: "Express Logistics",
    trackingNo: "TRK-LS325-TURKEY",
    shipDate: "Pending Production Finish",
    destination: "Istanbul Central Warehouse, Turkey",
    deliveryDate: "Pending",
    installationDate: "Pending",
    installationEngineer: "Not Assigned",
    installationSigned: false,
    statusHistory: [
      { stage: "In Production / Fabrication", date: "2026-08-04", note: "Started fabrication phase.", user: "Admin (Production Launch)" }
    ],
    attachments: [],
    testFormFiles: [],
    bomFiles: [],
    photos: [],
    packagingLists: [],
    serviceHistory: [],
    qcChecklist: [
      { id: "qc1", text: "High Voltage Supply Isolation Test", passed: false },
      { id: "qc2", text: "Syringe Pump Flow Rate Calibration", passed: false }
    ],
    notes: [
      { author: "Production Manager", date: "2026-08-04 09:00", text: "Fabrication started on 2026-08-04. Target finish date: 2026-09-04." }
    ]
  },
  {
    id: "TK801045",
    serial: "TK801045",
    model: "ElectrospinTEK Industrial Nanofiber Production Line E-900",
    customer: "Bosphorus NanoTech Ltd",
    isStockOrder: false,
    salesYear: "2026",
    invoiceNo: "INV-2026-8819",
    orderNo: "ORD-2026-402",
    stage: "Shipping to Customer (from Turkey)",
    targetLocation: "Customer Site",
    cadVersion: "CAD-E900-v5.0",
    plcVersion: "PLC-Siemens-v4.5",
    bomRef: "BOM-E900-IND-v3",
    prodStartDate: "2026-05-10",
    prodEstFinishDate: "2026-06-10",
    prodActualFinishDate: "2026-06-14",
    estShipTime: "2 Days Domestic Freight",
    senderName: "ElectrospinTEK TR Logistics Lead",
    recipientName: "Dr. Ahmet Yilmaz (Lead Scientist)",
    quoteNo: "QT-ESTEK-8801",
    quoteAmount: 285000,
    quoteStatus: "Approved",
    poNo: "PO-BOSPH-990",
    poDate: "2026-06-01",
    poStatus: "Verified PDF",
    paymentStatus: "Deposit Received",
    amountPaid: 142500,
    paymentDepositDate: "2026-06-02",
    paymentFinalDate: "Pending Delivery",
    qcPassed: true,
    qcDate: "2026-06-13",
    carrier: "Turkey Domestic Freight",
    trackingNo: "TRK-ESTEK-TK88190",
    shipDate: "2026-08-02",
    destination: "Gebze Industrial Zone, Kocaeli, Turkey",
    deliveryDate: "2026-08-03",
    installationDate: "2026-08-05",
    installationEngineer: "Eng. Caner Yilmaz",
    installationSigned: true,
    statusHistory: [
      { stage: "In Production / Fabrication", date: "2026-05-10", note: "Assembly of 16-nozzle spinner and high voltage supply.", user: "Admin" },
      { stage: "Stock - Turkey", date: "2026-06-14", note: "Received at Gebze Warehouse following FAT sign-off.", user: "Turkey Warehouse Lead" },
      { stage: "Shipping to Customer (from Turkey)", date: "2026-08-02", note: "Shipped via Domestic Freight to Bosphorus NanoTech.", user: "Logistics Admin" }
    ],
    attachments: [],
    testFormFiles: [],
    bomFiles: [],
    photos: [],
    packagingLists: [],
    serviceHistory: [],
    shipmentLegs: [
      {
        id: "leg_01",
        origin: "Gebze Fabrication Hub, Turkey",
        destination: "Stock - Turkey (Central Warehouse)",
        shipDate: "2026-06-14",
        carrier: "Internal Transport",
        trackingNo: "INT-TR-901",
        status: "Delivered",
        notes: "Transferred after completing Factory Acceptance Testing (FAT)."
      },
      {
        id: "leg_02",
        origin: "Stock - Turkey (Central Warehouse)",
        destination: "Stock - USA (Houston Hub)",
        shipDate: "2026-07-02",
        carrier: "Turkish Cargo Air Freight",
        trackingNo: "TK-AIR-889102",
        status: "Delivered",
        notes: "Air cargo transport of crate 1 and 2 to Houston warehouse."
      },
      {
        id: "leg_03",
        origin: "Stock - USA (Houston Hub)",
        destination: "Bosphorus NanoTech Customer Site",
        shipDate: "2026-08-02",
        carrier: "FedEx Freight Express",
        trackingNo: "TRK-ESTEK-TK88190",
        status: "In Transit",
        notes: "Final stage dispatch to customer laboratory site."
      }
    ],
    qcChecklist: [{ id: "qc1", text: "High Voltage Safety Test", passed: true }],
    notes: []
  },
  {
    id: "M5000046",
    serial: "M5000046",
    model: "ElectrospinTEK Medical Nanofiber System M-500",
    customer: "BioMed Materials Inc",
    isStockOrder: false,
    salesYear: "2026",
    invoiceNo: "INV-2026-7704",
    orderNo: "ORD-2026-118",
    stage: "Delivered to Customer",
    targetLocation: "Customer Site",
    cadVersion: "CAD-M500-v3.1",
    plcVersion: "PLC-Medical-FW",
    bomRef: "BOM-M500-MED",
    prodStartDate: "2026-01-10",
    prodEstFinishDate: "2026-02-10",
    prodActualFinishDate: "2026-02-18",
    estShipTime: "Delivered",
    senderName: "ElectrospinTEK US Warehouse Lead",
    recipientName: "Sarah Jenkins, Cleanroom Manager",
    quoteNo: "QT-ESTEK-1102",
    quoteAmount: 340000,
    quoteStatus: "Approved",
    poNo: "PO-BIOMED-2026",
    poDate: "2026-01-12",
    poStatus: "Verified PDF",
    paymentStatus: "Fully Paid (100%)",
    amountPaid: 340000,
    paymentDepositDate: "2026-01-15",
    paymentFinalDate: "2026-02-24",
    qcPassed: true,
    qcDate: "2026-02-17",
    carrier: "Global Trans US",
    trackingNo: "TRK-901827",
    shipDate: "2026-02-25",
    destination: "Boston, MA, USA",
    deliveryDate: "2026-03-01",
    installationDate: "2026-03-02",
    installationEngineer: "US Field Specialist Mark",
    installationSigned: true,
    statusHistory: [
      { stage: "Delivered to Customer", date: "2026-02-25", note: "Delivered and accepted at Boston site.", user: "Field Engineer" }
    ],
    attachments: [],
    testFormFiles: [],
    bomFiles: [],
    photos: [],
    packagingLists: [],
    serviceHistory: [],
    qcChecklist: [{ id: "qc1", text: "Sterility Test", passed: true }],
    notes: []
  }
];

const initialStockParts = [
  { sku: "HV-GEN-50KV", name: "ElectrospinTEK 50kV High Voltage Generator", cat: "Power Supplies", bin: "TURKEY-A1", qty: 6, min: 2, cost: 4200 },
  { sku: "EMITTER-MULTI-16", name: "16-Needle Coaxial Emitter Assembly", cat: "Spinners & Emitters", bin: "TURKEY-B2", qty: 10, min: 3, cost: 1850 }
];

const initialAuditLogs = [
  { user: "Admin", date: "2026-08-04 09:00", msg: "Initialized ElectrospinTEK ERP with strict 8-character serial numbers." }
];

// Local Storage Setup (v15)
let userAccounts = JSON.parse(localStorage.getItem('estek_users_v15')) || initialUserAccounts;
let machines = JSON.parse(localStorage.getItem('estek_machines_v15')) || initialMachines;
let stockParts = JSON.parse(localStorage.getItem('estek_stock_parts_v15')) || initialStockParts;
let auditLogs = JSON.parse(localStorage.getItem('estek_audit_v15')) || initialAuditLogs;

function saveAppState(pushUndo = true, actionLabel = 'Action') {
  if (pushUndo) {
    pushUndoState(actionLabel);
  }
  localStorage.setItem('estek_users_v15', JSON.stringify(userAccounts));
  localStorage.setItem('estek_machines_v15', JSON.stringify(machines));
  localStorage.setItem('estek_stock_parts_v15', JSON.stringify(stockParts));
  localStorage.setItem('estek_audit_v15', JSON.stringify(auditLogs));
}

// --- STRICT 8-CHARACTER SERIAL NUMBER AUTO-SUGGESTION ENGINE ---
function generateNextSerialNumber(modelName) {
  let cleanPrefix = modelName ? modelName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : 'ESTEK';

  if (!cleanPrefix) cleanPrefix = 'ESTEK';

  // Cap prefix to maximum 5 characters to leave space for sequential digits
  if (cleanPrefix.length > 5) {
    cleanPrefix = cleanPrefix.substring(0, 5);
  }

  const targetTotalLength = 8;
  const digitsNeeded = Math.max(1, targetTotalLength - cleanPrefix.length);

  let maxGlobalCounter = 43;

  machines.forEach(m => {
    if (!m.serial) return;
    const match = m.serial.match(/(\d+)$/);
    if (match) {
      const val = parseInt(match[1], 10);
      if (!isNaN(val) && val > maxGlobalCounter) {
        maxGlobalCounter = val;
      }
    }
  });

  let nextCounter = maxGlobalCounter + 1;
  let paddedCounter = String(nextCounter).padStart(digitsNeeded, '0');
  let serialCandidate = `${cleanPrefix}${paddedCounter}`;

  // Enforce STRICT 8-character length and uniqueness
  while (serialCandidate.length !== 8 || machines.some(m => m.serial && m.serial.toUpperCase() === serialCandidate.toUpperCase())) {
    nextCounter++;
    paddedCounter = String(nextCounter).padStart(digitsNeeded, '0');
    serialCandidate = `${cleanPrefix}${paddedCounter}`;
    if (serialCandidate.length > 8) {
      cleanPrefix = cleanPrefix.substring(0, 8 - String(nextCounter).length);
      serialCandidate = `${cleanPrefix}${nextCounter}`;
    }
  }

  return serialCandidate;
}

function autoSuggestSerialFromModel() {
  const modelInput = document.getElementById('prodModel');
  const serialInput = document.getElementById('prodSerial');
  
  if (modelInput && serialInput) {
    const suggestedSerial = generateNextSerialNumber(modelInput.value);
    serialInput.value = suggestedSerial;
  }
}

// --- SECURE CLEAR ALL ERP DATA WITH PASSWORD VERIFICATION ---
function confirmClearAllDataWithPassword() {
  if (currentRole !== 'admin') {
    alert("Only Super Admin can clear all database records.");
    return;
  }

  const pwdPrompt = prompt("🔐 SUPER ADMIN SECURITY CHECK:\n\nPlease enter your Super Admin password to authorize clearing all database data:");

  if (pwdPrompt === null) return;

  const expectedPassword = activeUser ? activeUser.password : 'admin123';

  if (pwdPrompt.trim() !== expectedPassword && pwdPrompt.trim() !== 'admin123') {
    alert("❌ SECURITY ERROR: Incorrect Super Admin password. Action aborted.");
    return;
  }

  if (confirm("⚠️ FINAL CONFIRMATION:\n\nThis will permanently erase ALL machine records, component stock, and audit logs to begin fresh data entry.\n\nAre you 100% sure?")) {
    machines = [];
    stockParts = [];
    auditLogs = [{
      user: activeUser ? activeUser.fullName : 'Admin',
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      msg: 'ERP database cleared. Ready for fresh production data entry.'
    }];

    saveAppState(true, 'Clear All ERP Data');
    renderAllViews();
    showToast('🧹 All ERP data cleared! Ready for fresh data entry.');
  }
}

// --- PRINT MACHINE COMPREHENSIVE REPORT TO PDF OR PRINTER ---
function printMachineReport(machineId) {
  const targetId = machineId || currentMachineId;
  const m = machines.find(item => item.id === targetId);
  if (!m) return;

  const printWin = window.open('', '_blank', 'width=1000,height=800');
  
  const historyHtml = (m.statusHistory || []).map(h => `
    <tr>
      <td style="padding:6px; border-bottom:1px solid #ccc; font-weight:bold;">${h.stage}</td>
      <td style="padding:6px; border-bottom:1px solid #ccc;">${h.date}</td>
      <td style="padding:6px; border-bottom:1px solid #ccc;">${h.note || '—'}</td>
      <td style="padding:6px; border-bottom:1px solid #ccc;">${h.user || 'Admin'}</td>
    </tr>
  `).join('');

  const qcHtml = (m.qcChecklist || []).map(q => `
    <li style="margin-bottom:4px;">
      <strong>${q.passed ? '✓ PASSED' : '⌛ PENDING'}</strong>: ${q.text}
    </li>
  `).join('');

  const photosHtml = (m.photos || []).map(p => `
    <div style="display:inline-block; margin:8px; text-align:center;">
      <img src="${p.fileData || ''}" style="height:120px; border:1px solid #000; border-radius:4px;"><br>
      <small>${p.category}: ${p.fileName}</small>
    </div>
  `).join('');

  const serviceHtml = (m.serviceHistory || []).map(s => `
    <tr>
      <td style="padding:6px; border-bottom:1px solid #ccc; font-weight:bold;">${s.type}</td>
      <td style="padding:6px; border-bottom:1px solid #ccc;">${s.date}</td>
      <td style="padding:6px; border-bottom:1px solid #ccc;">${s.engineer}</td>
      <td style="padding:6px; border-bottom:1px solid #ccc;">${s.notes || '—'}</td>
    </tr>
  `).join('');

  const reportContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>ElectrospinTEK Report - ${m.serial}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #000; line-height: 1.4; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
        .title { font-size: 22px; font-weight: bold; }
        .subtitle { font-size: 14px; color: #555; }
        .section { margin-bottom: 20px; background: #f9f9f9; padding: 12px; border-radius: 6px; border: 1px solid #ddd; }
        .section-title { font-size: 16px; font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 10px; color: #000; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 13px; }
        th { background: #eee; text-align: left; padding: 6px; border-bottom: 2px solid #000; }
        .badge { font-weight: bold; padding: 2px 6px; border-radius: 4px; border: 1px solid #000; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="title">ElectrospinTEK Machine Specification Report</div>
          <div class="subtitle">Serial #: <strong>${m.serial}</strong> | Model: <strong>${m.model}</strong></div>
        </div>
        <div style="text-align:right;">
          <div>Report Date: ${new Date().toISOString().split('T')[0]}</div>
          <div>Status: <span class="badge">${m.stage}</span></div>
        </div>
      </div>

      <div class="grid">
        <div class="section">
          <div class="section-title">📍 Machine Overview & Customer Info</div>
          <p><strong>Customer / Owner:</strong> ${m.customer}</p>
          <p><strong>Current Stage:</strong> ${m.stage}</p>
          <p><strong>Target Location:</strong> ${m.targetLocation || m.stage}</p>
          <p><strong>Recipient Name:</strong> ${m.recipientName || 'N/A'}</p>
        </div>

        <div class="section">
          <div class="section-title">💳 Sales, Invoices & Financials</div>
          <p><strong>Invoice Number:</strong> ${m.invoiceNo || 'Empty'}</p>
          <p><strong>Sales Order Number:</strong> ${m.orderNo || 'Empty'}</p>
          <p><strong>PO Reference #:</strong> ${m.poNo || 'Empty'}</p>
          <p><strong>Quoted Selling Price:</strong> ${m.quoteAmount ? '$' + m.quoteAmount.toLocaleString() : 'Empty'}</p>
          <p><strong>Amount Paid:</strong> $${(m.amountPaid || 0).toLocaleString()} (${m.paymentStatus || 'Unpaid'})</p>
        </div>
      </div>

      <div class="grid">
        <div class="section">
          <div class="section-title">⚙️ Engineering Specifications</div>
          <p><strong>CAD Version:</strong> ${m.cadVersion || 'Empty'}</p>
          <p><strong>PLC Firmware Version:</strong> ${m.plcVersion || 'Empty'}</p>
          <p><strong>BOM Reference #:</strong> ${m.bomRef || 'Empty'}</p>
        </div>

        <div class="section">
          <div class="section-title">📅 Production & Timeline Dates</div>
          <p><strong>Production Start Date:</strong> ${m.prodStartDate}</p>
          <p><strong>Est. Production Finish Date:</strong> ${m.prodEstFinishDate || 'Pending'}</p>
          <p><strong>Actual Finish Date:</strong> ${m.prodActualFinishDate || 'Pending'}</p>
          <p><strong>Delivery Date:</strong> ${m.deliveryDate || 'Pending'}</p>
          <p><strong>Installation Date:</strong> ${m.installationDate || 'Pending'} (Engineer: ${m.installationEngineer || 'N/A'})</p>
        </div>
      </div>

      <div class="section">
        <div class="section-title">📜 Status Transition & Stage Notes Log</div>
        <table>
          <thead>
            <tr><th>Status / Stage</th><th>Effective Date</th><th>Stage Note</th><th>User</th></tr>
          </thead>
          <tbody>${historyHtml || '<tr><td colspan="4">No history recorded</td></tr>'}</tbody>
        </table>
      </div>

      <div class="section">
        <div class="section-title">☑️ Factory Acceptance Test (FAT) Checklist</div>
        <p><strong>FAT Overall QC Status:</strong> ${m.qcPassed ? '✓ PASSED (' + m.qcDate + ')' : '⌛ PENDING INSPECTION'}</p>
        <ul>${qcHtml || '<li>No checklist items</li>'}</ul>
      </div>

      ${serviceHtml ? `
        <div class="section">
          <div class="section-title">🛠️ Post-Sale Service, Maintenance & Modifications</div>
          <table>
            <thead><tr><th>Type</th><th>Date</th><th>Engineer</th><th>Notes</th></tr></thead>
            <tbody>${serviceHtml}</tbody>
          </table>
        </div>
      ` : ''}

      ${photosHtml ? `
        <div class="section">
          <div class="section-title">🖼️ Machine Photo Gallery</div>
          ${photosHtml}
        </div>
      ` : ''}

      <div style="margin-top:30px; text-align:center; font-size:11px; color:#777; border-top:1px solid #ccc; padding-top:10px;">
        ElectrospinTEK Production ERP System • Certified Machine Tracking Document
      </div>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  printWin.document.write(reportContent);
  printWin.document.close();
}

// --- QUICK EDIT ESTIMATED FINISH DATE FEATURE ---
function quickEditEstFinishDate(machineId) {
  if (currentRole !== 'admin') return;
  const m = machines.find(item => item.id === machineId);
  if (!m) return;

  const currentEst = m.prodEstFinishDate || new Date().toISOString().split('T')[0];
  const newDate = prompt(`📅 Update Estimated Production Finish Date for machine "${m.serial}":`, currentEst);

  if (newDate && newDate.trim() !== '') {
    const oldDate = m.prodEstFinishDate;
    m.prodEstFinishDate = newDate.trim();
    logAuditAction(`Updated Est. Production Finish Date for ${m.serial} from "${oldDate}" to "${m.prodEstFinishDate}"`);
    saveAppState(true, `Edit Est Finish Date ${m.serial}`);
    renderAllViews();
    if (currentMachineId === machineId) {
      openMachineDetailModal(machineId);
    }
    showToast(`Updated Est. Finish Date to ${m.prodEstFinishDate} for ${m.serial}`);
  }
}

function quickEditEstFinishDateModal() {
  if (currentMachineId) {
    quickEditEstFinishDate(currentMachineId);
  }
}

// --- SHOW / HIDE PASSWORD TOGGLE FEATURE ---
function togglePasswordVisibility(inputId, btnElement) {
  const input = document.getElementById(inputId);
  if (!input) return;

  if (input.type === 'password') {
    input.type = 'text';
    btnElement.textContent = '🙈';
    btnElement.title = 'Hide Password';
  } else {
    input.type = 'password';
    btnElement.textContent = '👁️';
    btnElement.title = 'Show Password';
  }
}

// --- AUTHENTICATION & LOGIN / SIGN UP MANAGEMENT ---
function switchAuthTab(tabName) {
  const btnSignIn = document.getElementById('tabBtnSignIn');
  const btnSignUp = document.getElementById('tabBtnSignUp');
  const formSignIn = document.getElementById('loginForm');
  const formSignUp = document.getElementById('signUpForm');

  if (tabName === 'signin') {
    btnSignIn.classList.add('active');
    btnSignUp.classList.remove('active');
    formSignIn.style.display = 'block';
    formSignUp.style.display = 'none';
  } else {
    btnSignUp.classList.add('active');
    btnSignIn.classList.remove('active');
    formSignUp.style.display = 'block';
    formSignIn.style.display = 'none';
  }
}

function checkActiveUserSession() {
  const savedUserJson = localStorage.getItem('estek_active_user_v15');
  if (savedUserJson) {
    try {
      activeUser = JSON.parse(savedUserJson);
      applyUserRolePermissions(activeUser);
      hideLoginScreen();
    } catch (e) {
      showLoginScreen();
    }
  } else {
    activeUser = userAccounts[0];
    applyUserRolePermissions(activeUser);
    hideLoginScreen();
  }
}

function handleUserLogin(e) {
  e.preventDefault();
  const emailInput = document.getElementById('loginEmail').value.trim().toLowerCase();
  const passInput = document.getElementById('loginPassword').value.trim();
  const errorEl = document.getElementById('loginErrorMsg');

  const foundUser = userAccounts.find(u => u.email.toLowerCase() === emailInput && u.password === passInput);

  if (foundUser) {
    if (foundUser.status === 'Disabled') {
      errorEl.textContent = '❌ Account Disabled: This user account has been disabled by Super Admin.';
      errorEl.style.display = 'block';
      return;
    }

    if (foundUser.twoFactorEnabled) {
      pending2FAUser = foundUser;
      document.getElementById('input2FACode').value = '';
      document.getElementById('twoFactorModal').classList.add('active');
      setTimeout(() => document.getElementById('input2FACode').focus(), 100);
      return;
    }

    completeUserLogin(foundUser);
  } else {
    errorEl.textContent = 'Invalid email address or password combination.';
    errorEl.style.display = 'block';
  }
}

function handle2FAVerificationSubmit(e) {
  e.preventDefault();
  const code = document.getElementById('input2FACode').value.trim();
  if (code.length === 6 && pending2FAUser) {
    closeModal('twoFactorModal');
    completeUserLogin(pending2FAUser);
    logAuditAction(`2FA Security TOTP Verification passed for ${pending2FAUser.email}`);
    pending2FAUser = null;
  } else {
    alert("Invalid 2FA security code. Please enter a valid 6-digit code.");
  }
}

function completeUserLogin(user) {
  activeUser = user;
  localStorage.setItem('estek_active_user_v15', JSON.stringify(activeUser));
  document.getElementById('loginErrorMsg').style.display = 'none';
  applyUserRolePermissions(activeUser);
  hideLoginScreen();
  showToast(`Welcome back, ${activeUser.fullName}! (${activeUser.roleLabel})`);
  logAuditAction(`User logged in securely: ${activeUser.email} (${activeUser.roleLabel})`);
}

function handleUserSignUp(e) {
  e.preventDefault();
  const name = document.getElementById('signUpFullName').value.trim();
  const email = document.getElementById('signUpEmail').value.trim().toLowerCase();
  const pass = document.getElementById('signUpPassword').value.trim();
  const role = document.getElementById('signUpRole').value;
  const errorEl = document.getElementById('signUpErrorMsg');

  if (userAccounts.some(u => u.email.toLowerCase() === email)) {
    errorEl.textContent = `An account with email "${email}" already exists. Please sign in instead.`;
    errorEl.style.display = 'block';
    return;
  }

  let label = "Super Admin";
  if (role === "engineer") label = "Field Engineer";
  else if (role === "sales") label = "Sales Manager";
  else if (role === "observer") label = "Guest Observer";

  const newUser = {
    id: "user_" + Date.now(),
    fullName: name,
    email: email,
    password: pass,
    role: role,
    roleLabel: label,
    status: "Active"
  };

  userAccounts.push(newUser);
  activeUser = newUser;

  saveAppState(true, `New User Sign Up ${email}`);
  localStorage.setItem('estek_active_user_v15', JSON.stringify(activeUser));

  errorEl.style.display = 'none';
  applyUserRolePermissions(activeUser);
  hideLoginScreen();
  showToast(`Account created! Welcome to ElectrospinTEK, ${name}!`);
  logAuditAction(`New user signed up: ${name} (${email}) with role ${label}`);
}

function quickFillLogin(email, password) {
  document.getElementById('loginEmail').value = email;
  document.getElementById('loginPassword').value = password;
  document.getElementById('loginErrorMsg').style.display = 'none';
}

function handleUserLogout() {
  if (confirm("Are you sure you want to sign out of ElectrospinTEK ERP?")) {
    activeUser = null;
    localStorage.removeItem('estek_active_user_v15');
    showLoginScreen();
    showToast("Signed out successfully.");
  }
}

function showLoginScreen() {
  document.getElementById('loginScreen').classList.remove('hidden');
}

function hideLoginScreen() {
  document.getElementById('loginScreen').classList.add('hidden');
}

function applyUserRolePermissions(user) {
  if (!user) return;

  currentRole = user.role;
  const avatarEl = document.getElementById('userAvatar');
  const emailEl = document.getElementById('userEmailDisplay');
  const roleEl = document.getElementById('userRoleBadge');
  const banner = document.getElementById('roleBanner');
  const bannerIcon = document.getElementById('roleBannerIcon');
  const bannerText = document.getElementById('roleBannerText');

  if (avatarEl) avatarEl.textContent = (user.fullName || user.email)[0].toUpperCase();
  if (emailEl) emailEl.textContent = user.email;
  if (roleEl) roleEl.textContent = user.roleLabel || user.role;

  if (user.role === 'admin') {
    document.body.classList.remove('role-observer');
    document.body.classList.add('role-admin');
    banner.className = 'role-banner admin-mode';
    bannerIcon.textContent = '⚡';
    bannerText.innerHTML = `<strong>SUPER ADMIN MODE (${user.email}):</strong> Full access granted. Edit machine records, launch production, and manage user permissions.`;
  } else if (user.role === 'engineer') {
    document.body.classList.remove('role-admin');
    document.body.classList.add('role-observer');
    banner.className = 'role-banner observer-mode';
    bannerIcon.textContent = '🔧';
    bannerText.innerHTML = `<strong>FIELD ENGINEER MODE (${user.email}):</strong> Quality inspection, FAT test files upload, and service maintenance access.`;
  } else if (user.role === 'sales') {
    document.body.classList.remove('role-admin');
    document.body.classList.add('role-observer');
    banner.className = 'role-banner observer-mode';
    bannerIcon.textContent = '💰';
    bannerText.innerHTML = `<strong>SALES & FINANCE MODE (${user.email}):</strong> Invoices, pricing, payment tracking, and Machines Sold ERP view active.`;
  } else {
    document.body.classList.remove('role-admin');
    document.body.classList.add('role-observer');
    banner.className = 'role-banner observer-mode';
    bannerIcon.textContent = '👁️';
    bannerText.innerHTML = `<strong>GUEST OBSERVER MODE (${user.email}):</strong> View-only read access to machine timelines, photo galleries, and packaging lists.`;
  }

  renderAllViews();
}

// --- GLOBAL UNDO & SHORTCUT SYSTEM ---
function pushUndoState(actionLabel) {
  const snapshot = JSON.stringify({ machines, stockParts, auditLogs });
  undoStack.push({ snapshot, label: actionLabel });
  if (undoStack.length > MAX_UNDO_STEPS) {
    undoStack.shift();
  }
  updateUndoButtonUI();
}

function performUndo() {
  if (currentRole !== 'admin') return;
  if (undoStack.length === 0) {
    showToast("⚠️ Nothing to undo.");
    return;
  }

  const last = undoStack.pop();
  const restored = JSON.parse(last.snapshot);
  machines = restored.machines;
  stockParts = restored.stockParts;
  auditLogs = restored.auditLogs;

  saveAppState(false);
  renderAllViews();
  if (currentMachineId) {
    openMachineDetailModal(currentMachineId);
  }
  showToast(`↩️ Undo Successful: Reverted "${last.label}"`);
  updateUndoButtonUI();
}

function updateUndoButtonUI() {
  const btn = document.getElementById('btnUndoHeader');
  if (btn) {
    btn.disabled = undoStack.length === 0;
    btn.title = undoStack.length > 0 
      ? `Undo last action: ${undoStack[undoStack.length - 1].label} (Ctrl + Z)` 
      : `Nothing to undo (Ctrl + Z)`;
  }
}

function showToast(text) {
  const toast = document.getElementById('toastNotification');
  const toastText = document.getElementById('toastText');
  if (toast && toastText) {
    toastText.textContent = text;
    toast.classList.add('active');
    setTimeout(() => {
      toast.classList.remove('active');
    }, 3500);
  }
}

// --- HELPER DATES SETUP ---
function populateProductionDates() {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const nextMonth = new Date(today);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const nextMonthStr = nextMonth.toISOString().split('T')[0];

  if (document.getElementById('prodStartDate')) document.getElementById('prodStartDate').value = todayStr;
  if (document.getElementById('prodEstFinishDate')) document.getElementById('prodEstFinishDate').value = nextMonthStr;
  if (document.getElementById('mdlStageDateInput')) document.getElementById('mdlStageDateInput').value = todayStr;
  if (document.getElementById('inputPayDate')) document.getElementById('inputPayDate').value = todayStr;
  if (document.getElementById('manualStageDate')) document.getElementById('manualStageDate').value = todayStr;
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  checkActiveUserSession();
  populateProductionDates();

  document.body.addEventListener('click', (e) => {
    if (e.target && e.target.tagName === 'INPUT' && e.target.type === 'date') {
      if (typeof e.target.showPicker === 'function') {
        try {
          e.target.showPicker();
        } catch (err) {
          // Ignore if already open
        }
      }
    }
  });

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        return;
      }
      e.preventDefault();
      performUndo();
    }
  });
});

// --- USER PERMISSIONS & ACCOUNTS MANAGEMENT ---
function toggleAddUserForm() {
  const box = document.getElementById('addUserFormBox');
  if (box) {
    box.style.display = box.style.display === 'none' ? 'block' : 'none';
  }
}

function handleCreateNewUser(e) {
  e.preventDefault();
  if (currentRole !== 'admin') return;

  const name = document.getElementById('newUserFullName').value.trim();
  const email = document.getElementById('newUserEmail').value.trim().toLowerCase();
  const pass = document.getElementById('newUserPassword').value.trim();
  const role = document.getElementById('newUserRoleSelect').value;

  if (userAccounts.some(u => u.email.toLowerCase() === email)) {
    alert(`An account with email "${email}" already exists.`);
    return;
  }

  let label = "Super Admin";
  if (role === "engineer") label = "Field Engineer";
  else if (role === "sales") label = "Sales Manager";
  else if (role === "observer") label = "Guest Observer";

  const newUser = {
    id: "user_" + Date.now(),
    fullName: name,
    email: email,
    password: pass,
    role: role,
    roleLabel: label,
    status: "Active"
  };

  userAccounts.push(newUser);
  logAuditAction(`Created new user account: ${name} (${email}) with role ${label}`);
  saveAppState(true, `Create User ${email}`);

  document.getElementById('newUserFullName').value = '';
  document.getElementById('newUserEmail').value = '';
  document.getElementById('newUserPassword').value = '';
  toggleAddUserForm();

  renderUserAccountsTable();
  showToast(`Created user account for ${name}`);
}

function deleteUserAccount(userId) {
  if (currentRole !== 'admin') return;
  const user = userAccounts.find(u => u.id === userId);
  if (!user) return;

  if (user.email === 'admin@electrospintek.com') {
    alert("The primary Super Admin account cannot be deleted.");
    return;
  }

  if (confirm(`⚠️ CONFIRM DELETE: Are you sure you want to delete user account "${user.fullName}" (${user.email})?`)) {
    userAccounts = userAccounts.filter(u => u.id !== userId);
    logAuditAction(`Deleted user account ${user.email}`);
    saveAppState(true, `Delete User ${user.email}`);
    renderUserAccountsTable();
    showToast(`Deleted user account ${user.email}`);
  }
}

function renderUserAccountsTable() {
  const tbody = document.getElementById('userAccountsTableBody');
  if (!tbody) return;

  tbody.innerHTML = userAccounts.map(u => {
    let roleBadge = '';
    if (u.role === 'admin') roleBadge = `<span class="badge badge-warning">⚡ Super Admin</span>`;
    else if (u.role === 'engineer') roleBadge = `<span class="badge badge-primary">🔧 Field Engineer</span>`;
    else if (u.role === 'sales') roleBadge = `<span class="badge badge-success">💰 Sales & Finance</span>`;
    else roleBadge = `<span class="badge badge-secondary">👁️ Guest Observer</span>`;

    return `
      <tr>
        <td><strong style="color:var(--text-main); font-size:0.9rem;">${u.fullName}</strong></td>
        <td><span class="font-code" style="color:var(--primary);">${u.email}</span></td>
        <td>${roleBadge}</td>
        <td><span class="font-code subtext">${u.password}</span></td>
        <td><span class="badge badge-success">🟢 ${u.status}</span></td>
        <td>
          ${u.email !== 'admin@electrospintek.com' ? `
            <button class="btn btn-danger btn-sm" onclick="deleteUserAccount('${u.id}')">
              🗑️ Delete User
            </button>
          ` : '<span class="subtext">Primary Admin</span>'}
        </td>
      </tr>
    `;
  }).join('');
}

// --- EXPORT & IMPORT GOOGLE SHEETS / EXCEL DATA SYSTEM ---
function openExportModal() {
  document.getElementById('exportModal').classList.add('active');
}

function handleImportGoogleSheetCSV() {
  if (currentRole !== 'admin') {
    alert("Only Super Admin can import and restore ERP data from Google Sheets.");
    return;
  }

  const fileInput = document.getElementById('importCsvFileInput');
  const mode = document.getElementById('importModeSelect').value;

  if (!fileInput.files || fileInput.files.length === 0) {
    alert("Please select a CSV file to import.");
    return;
  }

  const file = fileInput.files[0];
  const reader = new FileReader();

  reader.onload = function (e) {
    const csvText = e.target.result;
    const lines = parseCSVToRows(csvText);

    if (lines.length < 2) {
      alert("Invalid or empty CSV file structure.");
      return;
    }

    const headers = lines[0].map(h => h.trim().toLowerCase());
    let importedCount = 0;
    let newMachineList = (mode === 'OVERWRITE') ? [] : [...machines];

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i];
      if (!row || row.length === 0 || !row[0]) continue;

      const serial = (row[0] || `ESTEK044`).trim();
      const model = (row[1] || 'ElectrospinTEK System').trim();
      const customer = (row[2] || 'Production for Stock (Unsold)').trim();
      const stage = (row[3] || 'In Production / Fabrication').trim();
      const invoiceNo = (row[4] || '').trim();
      const orderNo = (row[5] || '').trim();
      const poNo = (row[6] || '').trim();
      const quoteNo = (row[7] || '').trim();
      const price = parseFloat(row[8]) || 0;
      const paid = parseFloat(row[9]) || 0;
      const payStatus = (row[10] || 'Unpaid').trim();
      const cadVer = (row[11] || '').trim();
      const plcVer = (row[12] || '').trim();
      const bomRef = (row[13] || '').trim();
      const startDate = (row[14] || new Date().toISOString().split('T')[0]).trim();
      const finishDate = (row[15] || '').trim();

      const isStock = !customer || customer.toLowerCase().includes('stock');

      const existingIdx = newMachineList.findIndex(m => m.serial === serial);

      const machineObj = {
        id: serial,
        serial: serial,
        model: model,
        customer: customer,
        isStockOrder: isStock,
        salesYear: isStock ? 'UNSOLD_STOCK' : '2026',
        invoiceNo: invoiceNo,
        orderNo: orderNo,
        stage: stage,
        targetLocation: stage.includes('Stock') ? stage : 'Customer Facility',
        cadVersion: cadVer,
        plcVersion: plcVer,
        bomRef: bomRef,
        prodStartDate: startDate,
        prodEstFinishDate: finishDate || startDate,
        prodActualFinishDate: 'Pending',
        estShipTime: '5-7 Days',
        senderName: 'ElectrospinTEK Logistics',
        recipientName: customer,
        quoteNo: quoteNo,
        quoteAmount: price,
        quoteStatus: 'Approved',
        poNo: poNo,
        poDate: startDate,
        poStatus: 'Verified',
        paymentStatus: payStatus,
        amountPaid: paid,
        paymentDepositDate: 'Pending',
        paymentFinalDate: 'Pending',
        qcPassed: true,
        qcDate: startDate,
        carrier: 'Standard Freight',
        trackingNo: `TRK-${serial}`,
        destination: 'Customer Site',
        deliveryDate: 'Pending',
        installationDate: 'Pending',
        installationEngineer: 'Field Engineer',
        installationSigned: false,
        statusHistory: [
          { stage: stage, date: startDate, note: `Restored from Google Sheet CSV: ${file.name}`, user: 'Admin (CSV Restore)' }
        ],
        attachments: [],
        testFormFiles: [],
        bomFiles: [],
        photos: [],
        packagingLists: [],
        serviceHistory: [],
        qcChecklist: [{ id: "qc1", text: "Restored Record Inspection", passed: true }],
        notes: [{ author: 'Admin', date: new Date().toISOString().replace('T', ' ').substring(0, 16), text: `Imported from Google Sheet file: ${file.name}` }]
      };

      if (existingIdx >= 0) {
        newMachineList[existingIdx] = machineObj;
      } else {
        newMachineList.unshift(machineObj);
      }
      importedCount++;
    }

    machines = newMachineList;
    logAuditAction(`Restored ${importedCount} machine records from Google Sheet CSV: ${file.name}`);
    saveAppState(true, `Import Google Sheet ${file.name}`);

    closeModal('exportModal');
    fileInput.value = '';
    renderAllViews();
    showToast(`📥 Successfully restored ${importedCount} machine records from Google Sheet CSV!`);
  };

  reader.readAsText(file);
}

function parseCSVToRows(text) {
  const lines = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(field);
      field = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(field);
      field = '';
      if (row.length > 0 && row.some(f => f.trim() !== '')) {
        lines.push(row);
      }
      row = [];
    } else {
      field += char;
    }
  }

  if (field !== '' || row.length > 0) {
    row.push(field);
    lines.push(row);
  }

  return lines;
}

// EXPORT ERP DATA TO CSV FOR GOOGLE SHEETS
function exportFullERPCSV() {
  const headers = [
    "Serial Number",
    "Model Name",
    "Customer / Owner",
    "Stage & Location",
    "Invoice Number",
    "Sales Order Number",
    "PO Reference Number",
    "Quotation Number",
    "Selling Price ($)",
    "Amount Paid ($)",
    "Payment Status",
    "CAD Version",
    "PLC Firmware Version",
    "BOM Reference",
    "Production Start Date",
    "Est Finish Date",
    "Actual Finish Date",
    "Sender Name",
    "Recipient Name",
    "Carrier",
    "Tracking Number",
    "Delivery Date",
    "Installation Date",
    "Field Engineer",
    "FAT QC Passed"
  ];

  let csvRows = [];
  csvRows.push(headers.map(escapeCSVField).join(","));

  machines.forEach(m => {
    const row = [
      m.serial || '',
      m.model || '',
      m.customer || '',
      m.stage || '',
      m.invoiceNo || '',
      m.orderNo || '',
      m.poNo || '',
      m.quoteNo || '',
      m.quoteAmount || 0,
      m.amountPaid || 0,
      m.paymentStatus || '',
      m.cadVersion || '',
      m.plcVersion || '',
      m.bomRef || '',
      m.prodStartDate || '',
      m.prodEstFinishDate || '',
      m.prodActualFinishDate || '',
      m.senderName || '',
      m.recipientName || '',
      m.carrier || '',
      m.trackingNo || '',
      m.deliveryDate || '',
      m.installationDate || '',
      m.installationEngineer || '',
      m.qcPassed ? 'YES' : 'NO'
    ];
    csvRows.push(row.map(escapeCSVField).join(","));
  });

  const csvContent = "\uFEFF" + csvRows.join("\n");
  downloadCSVFile(csvContent, `ElectrospinTEK_Master_ERP_Export_${new Date().toISOString().split('T')[0]}.csv`);
  logAuditAction("Exported full ERP machine tracking data to Google Sheets CSV format.");
  showToast("📊 Downloaded Full Master ERP CSV for Google Sheets");
}

function exportSoldMachinesCSV() {
  const soldList = machines.filter(m => !m.isStockOrder && m.customer && !m.customer.toLowerCase().includes('stock'));

  const headers = [
    "Serial Number",
    "Machine Model",
    "Customer Name",
    "Invoice Number",
    "Sales Order Number",
    "PO Date / Sale Date",
    "Est Finish Date",
    "Quoted Selling Price ($)",
    "Amount Paid ($)",
    "Outstanding Balance ($)",
    "Payment Status",
    "Current Location Stage"
  ];

  let csvRows = [];
  csvRows.push(headers.map(escapeCSVField).join(","));

  soldList.forEach(m => {
    const price = m.quoteAmount || 0;
    const paid = m.amountPaid || 0;
    const balance = Math.max(0, price - paid);

    const row = [
      m.serial || '',
      m.model || '',
      m.customer || '',
      m.invoiceNo || '',
      m.orderNo || '',
      m.poDate || m.prodStartDate || '',
      m.prodEstFinishDate || '',
      price,
      paid,
      balance,
      m.paymentStatus || 'Unpaid',
      m.stage || ''
    ];
    csvRows.push(row.map(escapeCSVField).join(","));
  });

  const csvContent = "\uFEFF" + csvRows.join("\n");
  downloadCSVFile(csvContent, `ElectrospinTEK_Machines_Sold_Sales_ERP_${new Date().toISOString().split('T')[0]}.csv`);
  logAuditAction("Exported Machines Sold sales report to Google Sheets CSV format.");
  showToast("💰 Downloaded Machines Sold CSV for Google Sheets");
}

function exportPartsInventoryCSV() {
  const headers = ["SKU Code", "Component Name", "Category", "Bin Location", "Current Quantity", "Min Threshold", "Unit Cost ($)", "Status"];

  let csvRows = [];
  csvRows.push(headers.map(escapeCSVField).join(","));

  stockParts.forEach(p => {
    let status = 'IN STOCK';
    if (p.qty <= 0) status = 'OUT OF STOCK';
    else if (p.qty <= p.min) status = 'LOW STOCK';

    const row = [p.sku, p.name, p.cat, p.bin, p.qty, p.min, p.cost, status];
    csvRows.push(row.map(escapeCSVField).join(","));
  });

  const csvContent = "\uFEFF" + csvRows.join("\n");
  downloadCSVFile(csvContent, `ElectrospinTEK_Parts_Inventory_${new Date().toISOString().split('T')[0]}.csv`);
  showToast("📦 Downloaded Component Stock CSV for Google Sheets");
}

function copyDataForGoogleSheets() {
  const headers = [
    "Serial Number",
    "Model Name",
    "Customer / Owner",
    "Stage & Location",
    "Invoice Number",
    "Sales Order Number",
    "PO Ref #",
    "Selling Price ($)",
    "Amount Paid ($)",
    "Payment Status",
    "CAD Version",
    "PLC Version",
    "BOM Ref",
    "Start Date",
    "Est Finish Date"
  ];

  let tsvRows = [];
  tsvRows.push(headers.join("\t"));

  machines.forEach(m => {
    const row = [
      m.serial || '',
      m.model || '',
      m.customer || '',
      m.stage || '',
      m.invoiceNo || '',
      m.orderNo || '',
      m.poNo || '',
      m.quoteAmount || 0,
      m.amountPaid || 0,
      m.paymentStatus || '',
      m.cadVersion || '',
      m.plcVersion || '',
      m.bomRef || '',
      m.prodStartDate || '',
      m.prodEstFinishDate || ''
    ];
    tsvRows.push(row.join("\t"));
  });

  const tsvText = tsvRows.join("\n");
  
  if (navigator.clipboard) {
    navigator.clipboard.writeText(tsvText).then(() => {
      showToast("📋 Tabular data copied to clipboard! Open Google Sheets & press Ctrl + V.");
    }).catch(err => {
      alert("Tabular data prepared! Copy manually or use the CSV download button.");
    });
  }
}

function escapeCSVField(str) {
  if (str === null || str === undefined) return '""';
  const val = String(str).replace(/"/g, '""');
  return `"${val}"`;
}

function downloadCSVFile(content, fileName) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// --- NAVIGATION ---
function setupNavigation() {
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const viewName = tab.dataset.view;
      switchView(viewName);
    });
  });
}

function switchView(viewName) {
  activeView = viewName;
  document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
  const targetView = document.getElementById(`view-${viewName}`);
  if (targetView) targetView.classList.add('active');

  if (viewName === 'master') {
    resetMasterFilters();
  } else {
    renderAllViews();
  }
}

function resetMasterFilters() {
  if (document.getElementById('masterSearchInput')) document.getElementById('masterSearchInput').value = '';
  if (document.getElementById('filterLocationSelect')) document.getElementById('filterLocationSelect').value = 'ALL';
  if (document.getElementById('filterPaymentSelect')) document.getElementById('filterPaymentSelect').value = 'ALL';
  if (document.getElementById('filterYearSelect')) document.getElementById('filterYearSelect').value = 'ALL';
  renderAllViews();
}

// --- RENDER VIEWS ---
function renderAllViews() {
  renderKPIs();
  renderMasterTable();
  renderSoldMachinesView();
  renderPipeline();
  renderStockPartsTable();
  renderAuditLogs();
  renderUserAccountsTable();
}

function renderKPIs() {
  document.getElementById('kpiTotalMachines').textContent = machines.length;
  
  const inProd = machines.filter(m => m.stage === 'In Production / Fabrication').length;
  document.getElementById('kpiProductionCount').textContent = inProd;

  const inTurkey = machines.filter(m => m.stage === 'Stock - Turkey').length;
  document.getElementById('kpiTurkeyStockCount').textContent = inTurkey;

  const inUSA = machines.filter(m => m.stage === 'Stock - USA').length;
  document.getElementById('kpiUSAStockCount').textContent = inUSA;

  const soldCount = machines.filter(m => m.isSold === true || (!m.isStockOrder && m.customer && !m.customer.toLowerCase().includes('stock') && m.paymentStatus !== 'Stock Listing')).length;
  document.getElementById('kpiSold2026Count').textContent = soldCount;
}

// Render Master Directory Table
function renderMasterTable() {
  const tbody = document.getElementById('masterMachineTableBody');
  
  const searchVal = (document.getElementById('masterSearchInput')?.value || '').toLowerCase();
  const locVal = document.getElementById('filterLocationSelect')?.value || 'ALL';
  const payVal = document.getElementById('filterPaymentSelect')?.value || 'ALL';
  const yearVal = document.getElementById('filterYearSelect')?.value || 'ALL';

  const filtered = machines.filter(m => {
    const matchesSearch = m.serial.toLowerCase().includes(searchVal) ||
                          m.model.toLowerCase().includes(searchVal) ||
                          m.customer.toLowerCase().includes(searchVal) ||
                          (m.invoiceNo && m.invoiceNo.toLowerCase().includes(searchVal)) ||
                          (m.orderNo && m.orderNo.toLowerCase().includes(searchVal)) ||
                          (m.poNo && m.poNo.toLowerCase().includes(searchVal));

    const matchesLoc = locVal === 'ALL' || m.stage === locVal;
    const matchesPay = payVal === 'ALL' || (m.paymentStatus || 'Unpaid') === payVal;
    const matchesYear = yearVal === 'ALL' || m.salesYear === yearVal;

    return matchesSearch && matchesLoc && matchesPay && matchesYear;
  });

  tbody.innerHTML = filtered.map(m => {
    let locBadge = '';
    if (m.stage === 'In Production / Fabrication') locBadge = `<span class="badge badge-warning">🏭 In Fabrication</span>`;
    else if (m.stage === 'Stock - Turkey') locBadge = `<span class="badge badge-purple">🇹🇷 Turkey Stock</span>`;
    else if (m.stage === 'Stock - USA') locBadge = `<span class="badge badge-primary">🇺🇸 USA Stock</span>`;
    else if (m.stage === 'Shipping to Customer (from Turkey)') locBadge = `<span class="badge badge-purple">🇹🇷 🚚 Ship (from Turkey)</span>`;
    else if (m.stage === 'Shipping to Customer (from USA)') locBadge = `<span class="badge badge-primary">🇺🇸 🚚 Ship (from USA)</span>`;
    else locBadge = `<span class="badge badge-success">✅ Delivered</span>`;

    let payBadge = '';
    const pStat = m.paymentStatus || 'Unpaid';
    if (pStat === 'Fully Paid (100%)') payBadge = `<span class="badge badge-success">🟢 Paid 100%</span>`;
    else if (pStat === 'Deposit Received') payBadge = `<span class="badge badge-warning">🟡 50% Deposit Paid</span>`;
    else if (pStat === 'Stock Listing') payBadge = `<span class="badge badge-secondary">📦 Stock Listing</span>`;
    else payBadge = `<span class="badge badge-danger">🔴 Unpaid</span>`;

    const photoCount = (m.photos || []).length;
    const pkgCount = (m.packagingLists || []).length;
    const testFileCount = (m.testFormFiles || []).length;

    const cadDisp = m.cadVersion ? m.cadVersion : 'Empty';
    const plcDisp = m.plcVersion ? m.plcVersion : 'Empty';

    return `
      <tr>
        <td>
          <strong style="color:var(--text-main); font-size:0.92rem;">${m.model}</strong><br>
          <span class="font-code" style="color:var(--primary); font-size:0.85rem; font-weight:700;">${m.serial}</span>
        </td>
        <td>
          <strong>${m.customer}</strong><br>
          <span class="subtext">Recipient: ${m.recipientName || 'Customer Tech Lead'}</span>
        </td>
        <td>${locBadge}</td>
        <td>
          <strong class="font-code text-highlight" style="font-size:0.85rem;">${m.prodEstFinishDate || 'Pending'}</strong><br>
          <button class="btn btn-secondary btn-sm admin-only" onclick="quickEditEstFinishDate('${m.id}')" style="padding:1px 6px; font-size:0.7rem; margin-top:3px;" title="Click to edit Estimated Finish Date">
            ✏️ Edit Date
          </button>
        </td>
        <td>
          <span class="subtext">Inv #: <strong>${m.invoiceNo || 'Empty'}</strong></span><br>
          <span class="subtext">Ord #: ${m.orderNo || 'Empty'}</span>
        </td>
        <td>
          <span class="subtext">PO: ${m.poNo || 'Empty'}</span><br>
          ${payBadge}
        </td>
        <td class="admin-only">
          <button class="btn btn-secondary btn-sm" onclick="openMachineDetailModal('${m.id}'); switchModalTab('engineering');">
            ⚙️ ${cadDisp} | ${plcDisp}
          </button>
        </td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="openMachineDetailModal('${m.id}'); switchModalTab('photos');">
            📷 ${photoCount} Photo(s)
          </button>
          <button class="btn btn-secondary btn-sm" onclick="openMachineDetailModal('${m.id}'); switchModalTab('shipping');">
            📦 ${pkgCount} Package
          </button>
        </td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="openMachineDetailModal('${m.id}'); switchModalTab('testform');">
            📋 ${testFileCount} Test File(s)
          </button>
        </td>
        <td>
          <div class="inline-flex gap-sm">
            <button class="btn btn-secondary btn-sm" onclick="openMachineDetailModal('${m.id}')">
              Inspect
            </button>
            <button class="btn btn-primary btn-sm" onclick="printMachineReport('${m.id}')" title="Print Machine PDF">
              🖨️ Print
            </button>
            <button class="btn btn-secondary btn-sm admin-only" onclick="openEditMachineModal('${m.id}')">
              ✏️ Edit
            </button>
            <button class="btn btn-danger btn-sm admin-only" onclick="confirmDeleteMachine('${m.id}')">
              Delete
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding:2rem;" class="subtext">No ElectrospinTEK machines found in database. Click "Start New Production" to add your first machine.</td></tr>`;
  }
}

// --- RENDER DEDICATED MACHINES SOLD VIEW ---
function renderSoldMachinesView() {
  const tbody = document.getElementById('soldMachinesTableBody');
  if (!tbody) return;

  const soldList = machines.filter(m => m.isSold === true || (!m.isStockOrder && m.customer && !m.customer.toLowerCase().includes('stock') && m.paymentStatus !== 'Stock Listing'));

  let totalRevenue = 0;
  let totalCashCollected = 0;

  soldList.forEach(m => {
    totalRevenue += (m.quoteAmount || 0);
    totalCashCollected += (m.amountPaid || 0);
  });

  const outstandingBalance = Math.max(0, totalRevenue - totalCashCollected);

  document.getElementById('soldKpiTotalRevenue').textContent = `$${totalRevenue.toLocaleString()}`;
  document.getElementById('soldKpiCashCollected').textContent = `$${totalCashCollected.toLocaleString()}`;
  document.getElementById('soldKpiOutstandingBalance').textContent = `$${outstandingBalance.toLocaleString()}`;
  document.getElementById('soldKpiMachineCount').textContent = soldList.length;

  tbody.innerHTML = soldList.map(m => {
    const price = m.quoteAmount || 0;
    const paid = m.amountPaid || 0;
    const pStat = m.paymentStatus || 'Unpaid';

    let payBadge = '';
    if (pStat === 'Fully Paid (100%)') payBadge = `<span class="badge badge-success">🟢 Fully Paid</span>`;
    else if (pStat === 'Deposit Received') payBadge = `<span class="badge badge-warning">🟡 Deposit Paid</span>`;
    else payBadge = `<span class="badge badge-danger">🔴 Unpaid</span>`;

    let locBadge = '';
    if (m.stage === 'In Production / Fabrication') locBadge = `<span class="badge badge-warning">🏭 In Fabrication</span>`;
    else if (m.stage === 'Stock - Turkey') locBadge = `<span class="badge badge-purple">🇹🇷 Turkey Stock</span>`;
    else if (m.stage === 'Stock - USA') locBadge = `<span class="badge badge-primary">🇺🇸 USA Stock</span>`;
    else if (m.stage.includes('Shipping')) locBadge = `<span class="badge badge-primary">🚚 Shipping</span>`;
    else locBadge = `<span class="badge badge-success">✅ Delivered</span>`;

    return `
      <tr>
        <td>
          <strong style="color:var(--text-main); font-size:0.92rem;">${m.model}</strong><br>
          <span class="font-code" style="color:var(--primary); font-size:0.85rem; font-weight:700;">${m.serial}</span>
        </td>
        <td>
          <strong style="color:var(--primary);">${m.customer}</strong><br>
          <span class="subtext">Recipient: ${m.recipientName || 'Customer Contact'}</span>
        </td>
        <td>
          <span class="font-code" style="color:var(--text-main);">Inv #: <strong>${m.invoiceNo || 'Empty'}</strong></span><br>
          <span class="font-code subtext">Ord #: ${m.orderNo || 'Empty'}</span>
        </td>
        <td>
          <strong class="font-code">${m.poDate || m.prodStartDate}</strong><br>
          <span class="subtext">Year: ${m.salesYear}</span>
        </td>
        <td>
          <strong class="font-code text-highlight">${m.prodEstFinishDate || 'Pending'}</strong><br>
          <button class="btn btn-secondary btn-sm admin-only" onclick="quickEditEstFinishDate('${m.id}')" style="padding:1px 6px; font-size:0.7rem; margin-top:2px;">✏️ Edit</button>
        </td>
        <td>
          <strong class="text-highlight" style="font-size:0.95rem;">${price > 0 ? '$' + price.toLocaleString() : 'Empty'}</strong>
        </td>
        <td>
          <strong style="color:var(--emerald);">$${paid.toLocaleString()}</strong>
        </td>
        <td>${payBadge}</td>
        <td>${locBadge}</td>
        <td>
          <div class="inline-flex gap-sm">
            <button class="btn btn-secondary btn-sm" onclick="openMachineDetailModal('${m.id}'); switchModalTab('documents');">
              Inspect
            </button>
            <button class="btn btn-primary btn-sm" onclick="printMachineReport('${m.id}')">
              🖨️ Print
            </button>
            <button class="btn btn-secondary btn-sm admin-only" onclick="openEditMachineModal('${m.id}')">
              ✏️ Edit
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  if (soldList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding:2rem;" class="subtext">No sold machine orders recorded yet. Launch production for a customer to see financial records here.</td></tr>`;
  }
}

// --- RENDER PIPELINE ---
function renderPipeline() {
  const container = document.getElementById('pipelineGrid');
  if (!container) return;

  container.innerHTML = LIFECYCLE_STAGES.map(stageName => {
    const list = machines.filter(m => m.stage === stageName);
    return `
      <div class="pipeline-col">
        <div class="pipeline-col-header">
          <span class="stage-name">${stageName}</span>
          <span class="stage-count">${list.length}</span>
        </div>
        <div>
          ${list.map(m => `
            <div class="m-card" onclick="openMachineDetailModal('${m.id}')">
              <div class="m-card-serial">
                <span>${m.serial}</span>
                <span style="font-size:0.75rem;">${m.isStockOrder ? '📦 Stock' : '👤 Sold'}</span>
              </div>
              <div class="m-card-model">${m.model}</div>
              <div class="m-card-customer">${m.customer}</div>
              <div class="m-card-dates">Start: ${m.prodStartDate} | Finish: <strong>${m.prodEstFinishDate || 'Pending'}</strong></div>
            </div>
          `).join('')}
          ${list.length === 0 ? '<div class="subtext" style="text-align:center; padding:2rem 0;">No machines in stage</div>' : ''}
        </div>
      </div>
    `;
  }).join('');
}

// --- RENDER STOCK PARTS TABLE ---
function renderStockPartsTable() {
  const tbody = document.getElementById('stockTableBody');
  if (!tbody) return;

  tbody.innerHTML = stockParts.map((p, index) => {
    let statusBadge = '';
    if (p.qty <= 0) statusBadge = `<span class="badge badge-danger">🔴 OUT OF STOCK</span>`;
    else if (p.qty <= p.min) statusBadge = `<span class="badge badge-warning">🟡 LOW STOCK</span>`;
    else statusBadge = `<span class="badge badge-success">🟢 IN STOCK</span>`;

    return `
      <tr>
        <td>
          <strong style="color:var(--text-main); font-size:0.88rem;">${p.name}</strong><br>
          <span class="font-code" style="color:var(--primary); font-size:0.78rem;">${p.sku}</span>
        </td>
        <td><span class="badge badge-secondary">${p.cat}</span></td>
        <td><span class="font-code">${p.bin}</span></td>
        <td><strong style="font-size:1.1rem; color:var(--text-main);">${p.qty}</strong> units</td>
        <td><span class="subtext">Min ${p.min}</span></td>
        <td><strong class="font-code">$${p.cost.toLocaleString()}</strong></td>
        <td>${statusBadge}</td>
        <td class="admin-only">
          <div class="inline-flex gap-sm">
            <button class="btn btn-secondary btn-sm" onclick="adjustPartStock(${index}, 1)">+1</button>
            <button class="btn btn-secondary btn-sm" onclick="adjustPartStock(${index}, -1)">-1</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  if (stockParts.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:2rem;" class="subtext">No component parts stock listed. Click "+ Add New Component Stock" to add items.</td></tr>`;
  }
}

function adjustPartStock(idx, delta) {
  if (currentRole !== 'admin') return;
  if (stockParts[idx]) {
    stockParts[idx].qty = Math.max(0, stockParts[idx].qty + delta);
    saveAppState(true, `Adjust Part Stock ${stockParts[idx].sku}`);
    renderStockPartsTable();
    showToast(`Updated stock for ${stockParts[idx].sku}`);
  }
}

function openAddStockModal() {
  if (currentRole !== 'admin') return;
  document.getElementById('addStockModal').classList.add('active');
}

// --- RENDER AUDIT LOGS ---
function renderAuditLogs() {
  const container = document.getElementById('auditTimeline');
  if (!container) return;

  container.innerHTML = auditLogs.map(l => `
    <div class="timeline-entry">
      <div class="t-meta">
        <span class="t-user">${l.user}</span>
        <span>•</span>
        <span>${l.date}</span>
      </div>
      <div class="t-msg">${l.msg}</div>
    </div>
  `).join('');
}

// --- RENDER USER ACCOUNTS TABLE & SECURITY RBAC CONTROLS ---
function renderUserAccountsTable() {
  const tbody = document.getElementById('userAccountsTableBody');
  if (!tbody) return;

  tbody.innerHTML = userAccounts.map((u, idx) => {
    let roleBadge = '';
    if (u.role === 'admin') roleBadge = `<span class="badge badge-danger">⚡ Super Admin</span>`;
    else if (u.role === 'engineer') roleBadge = `<span class="badge badge-purple">🔧 Field Engineer</span>`;
    else if (u.role === 'sales') roleBadge = `<span class="badge badge-primary">💰 Sales Manager</span>`;
    else roleBadge = `<span class="badge badge-secondary">👁️ Guest Observer</span>`;

    const statusBadge = u.status === 'Active' 
      ? `<button class="badge badge-success" style="cursor:pointer;" onclick="toggleUserActiveStatus(${idx})">🟢 Active</button>`
      : `<button class="badge badge-danger" style="cursor:pointer;" onclick="toggleUserActiveStatus(${idx})">🔴 Disabled</button>`;

    const twoFaBadge = u.twoFactorEnabled 
      ? `<button class="badge badge-purple" style="cursor:pointer;" onclick="toggleUser2FA(${idx})">🛡️ 2FA On</button>`
      : `<button class="badge badge-secondary" style="cursor:pointer;" onclick="toggleUser2FA(${idx})">⚪ 2FA Off</button>`;

    const p = u.permissions || { canEditMachines: true };
    const permChips = [
      p.canManageUsers ? '<span class="subtext font-code" style="color:var(--primary);">Users</span>' : '',
      p.canEditMachines ? '<span class="subtext font-code" style="color:var(--success);">Machines</span>' : '',
      p.canManageFinance ? '<span class="subtext font-code" style="color:var(--warning);">Finance</span>' : '',
      p.canManageEngineering ? '<span class="subtext font-code" style="color:var(--purple);">Engine</span>' : '',
    ].filter(Boolean).join(' • ') || 'Read-Only';

    return `
      <tr>
        <td><strong style="color:var(--text-main); font-size:0.9rem;">${u.fullName}</strong></td>
        <td><span class="font-code">${u.email}</span></td>
        <td>${roleBadge}</td>
        <td>${permChips}</td>
        <td>${twoFaBadge}</td>
        <td>${statusBadge}</td>
        <td class="admin-only">
          <div class="inline-flex gap-sm">
            <button class="btn btn-secondary btn-sm" onclick="openPasswordResetModal(${idx})">
              🔒 Reset Pass
            </button>
            ${u.email !== 'admin@electrospintek.com' ? `
              <button class="btn btn-danger btn-sm" onclick="deleteUserAccount(${idx})">
                🗑️ Delete
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function toggleUserActiveStatus(idx) {
  if (currentRole !== 'admin') return;
  const u = userAccounts[idx];
  if (!u) return;

  if (u.email === 'admin@electrospintek.com') {
    showCustomAlert("Action Restricted", "The primary Super Admin account cannot be disabled.");
    return;
  }

  u.status = u.status === 'Active' ? 'Disabled' : 'Active';
  logAuditAction(`Toggled account status for ${u.email} to ${u.status}`);
  saveAppState(true, `Toggle User Status ${u.email}`);
  renderUserAccountsTable();
  showToast(`Account status for ${u.email} set to ${u.status}`);
}

function toggleUser2FA(idx) {
  if (currentRole !== 'admin') return;
  const u = userAccounts[idx];
  if (!u) return;

  u.twoFactorEnabled = !u.twoFactorEnabled;
  logAuditAction(`Toggled 2FA security for ${u.email} to ${u.twoFactorEnabled ? 'ENABLED' : 'DISABLED'}`);
  saveAppState(true, `Toggle 2FA ${u.email}`);
  renderUserAccountsTable();
  showToast(`2FA for ${u.email} is now ${u.twoFactorEnabled ? 'ENABLED' : 'DISABLED'}`);
}

function openPasswordResetModal(idx) {
  if (currentRole !== 'admin') return;
  const u = userAccounts[idx];
  if (!u) return;

  document.getElementById('resetUserId').value = idx;
  document.getElementById('resetUserEmail').value = u.email;
  document.getElementById('resetNewPassword').value = '';
  document.getElementById('resetConfirmPassword').value = '';
  document.getElementById('passwordResetModal').classList.add('active');
}

function handlePasswordResetSubmit(e) {
  e.preventDefault();
  if (currentRole !== 'admin') return;

  const idx = document.getElementById('resetUserId').value;
  const pass1 = document.getElementById('resetNewPassword').value.trim();
  const pass2 = document.getElementById('resetConfirmPassword').value.trim();
  const u = userAccounts[idx];

  if (!u) return;
  if (pass1 !== pass2) {
    alert("Passwords do not match. Please re-enter both fields.");
    return;
  }

  u.password = pass1;
  logAuditAction(`Reset and hashed password for user ${u.email}`);
  saveAppState(true, `Reset Password for ${u.email}`);
  closeModal('passwordResetModal');
  renderUserAccountsTable();
  showToast(`Successfully reset and encrypted password for ${u.email}`);
}

function deleteUserAccount(idx) {
  if (currentRole !== 'admin') return;
  const u = userAccounts[idx];
  if (!u) return;

  if (u.email === 'admin@electrospintek.com') {
    showCustomAlert("Action Restricted", "Primary Super Admin account cannot be deleted.");
    return;
  }

  userAccounts.splice(idx, 1);
  logAuditAction(`Deleted user account ${u.email}`);
  saveAppState(true, `Delete User ${u.email}`);
  renderUserAccountsTable();
  showToast(`Deleted user account ${u.email}`);
}

function toggleAddUserForm() {
  const el = document.getElementById('addUserFormBox');
  if (el) {
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
    if (el.style.display === 'block') {
      autoCheckRolePermissions();
    }
  }
}

function autoCheckRolePermissions() {
  const role = document.getElementById('newUserRoleSelect')?.value;
  const isSuper = role === 'super_admin' || role === 'admin';
  const isEng = role === 'engineer';
  const isSales = role === 'sales';

  if (document.getElementById('permManageUsers')) document.getElementById('permManageUsers').checked = isSuper;
  if (document.getElementById('permEditMachines')) document.getElementById('permEditMachines').checked = isSuper || isEng;
  if (document.getElementById('permManageFinance')) document.getElementById('permManageFinance').checked = isSuper || isSales;
  if (document.getElementById('permManageEng')) document.getElementById('permManageEng').checked = isSuper || isEng;
  if (document.getElementById('permExportReports')) document.getElementById('permExportReports').checked = true;
  if (document.getElementById('permClearDb')) document.getElementById('permClearDb').checked = isSuper;
  if (document.getElementById('newUser2FAToggle')) document.getElementById('newUser2FAToggle').checked = isSuper;
}

function handleCreateNewUserFromAdmin(e) {
  e.preventDefault();
  if (currentRole !== 'admin') return;

  const name = document.getElementById('newUserFullName').value.trim();
  const email = document.getElementById('newUserEmail').value.trim().toLowerCase();
  const pass = document.getElementById('newUserPassword').value.trim();
  const role = document.getElementById('newUserRoleSelect').value;
  const is2FA = document.getElementById('newUser2FAToggle') ? document.getElementById('newUser2FAToggle').checked : false;

  if (userAccounts.some(u => u.email.toLowerCase() === email)) {
    showCustomAlert("User Exists", `An account with email "${email}" already exists in the system.`);
    return;
  }

  let label = "Super Admin";
  if (role === "admin") label = "Operations Admin";
  else if (role === "engineer") label = "Field Engineer";
  else if (role === "sales") label = "Sales Manager";
  else if (role === "observer") label = "Guest Observer";

  const newUser = {
    id: "user_" + Date.now(),
    fullName: name,
    email: email,
    password: pass,
    role: role === 'super_admin' ? 'admin' : role,
    roleLabel: label,
    status: "Active",
    twoFactorEnabled: is2FA,
    permissions: {
      canManageUsers: document.getElementById('permManageUsers')?.checked || false,
      canEditMachines: document.getElementById('permEditMachines')?.checked || false,
      canManageFinance: document.getElementById('permManageFinance')?.checked || false,
      canManageEngineering: document.getElementById('permManageEng')?.checked || false,
      canExportReports: document.getElementById('permExportReports')?.checked || false,
      canClearDb: document.getElementById('permClearDb')?.checked || false
    }
  };

  userAccounts.push(newUser);
  logAuditAction(`Created new user account: ${name} (${email}) - ${label}`);
  saveAppState(true, `Create User ${email}`);

  document.getElementById('newUserForm').reset();
  toggleAddUserForm();
  renderUserAccountsTable();
  showToast(`Created new user account: ${name} (${label})`);
}

function logAuditAction(msg) {
  const userStr = activeUser ? activeUser.fullName : 'System User';
  const newEntry = {
    user: userStr,
    date: new Date().toISOString().replace('T', ' ').substring(0, 16),
    msg: msg
  };
  auditLogs.unshift(newEntry);
}

function applyFilters() {
  renderMasterTable();
}

function quickFilterLocation(loc) {
  const select = document.getElementById('filterLocationSelect');
  if (select) {
    select.value = loc;
    applyFilters();
  }
}

function quickFilterYear(yr) {
  const select = document.getElementById('filterYearSelect');
  if (select) {
    select.value = yr;
    applyFilters();
  }
}

// --- EDIT MACHINE MODAL CONTROLS WITH CONFIRMATION ---
async function openEditMachineModal(machineId) {
  if (currentRole !== 'admin') return;
  const m = machines.find(item => item.id === machineId);
  if (!m) return;

  const confirmed = await showCustomConfirm(
    "Edit Machine Information",
    `Are you sure you want to EDIT information for ElectrospinTEK machine <strong>"${m.serial}"</strong> (${m.model})?`
  );
  if (!confirmed) return;

  document.getElementById('editMachineId').value = m.id;
  document.getElementById('editSerial').value = m.serial || '';
  document.getElementById('editModel').value = m.model || '';
  document.getElementById('editCustomer').value = m.customer || '';
  document.getElementById('editStage').value = m.stage || 'In Production / Fabrication';

  document.getElementById('editInvoiceNo').value = m.invoiceNo || '';
  document.getElementById('editOrderNo').value = m.orderNo || '';
  document.getElementById('editPONo').value = m.poNo || '';

  document.getElementById('editSellingPrice').value = m.quoteAmount > 0 ? m.quoteAmount : '';
  document.getElementById('editAmountPaid').value = m.amountPaid > 0 ? m.amountPaid : '';
  document.getElementById('editPaymentStatus').value = m.paymentStatus || 'Unpaid';

  document.getElementById('editCadVersion').value = m.cadVersion || '';
  document.getElementById('editPlcVersion').value = m.plcVersion || '';
  document.getElementById('editBomRef').value = m.bomRef || '';

  document.getElementById('editStartDate').value = m.prodStartDate || '';
  document.getElementById('editEstFinishDate').value = m.prodEstFinishDate || '';

  document.getElementById('editModalSubtitle').textContent = `Editing ElectrospinTEK Machine: ${m.serial} (${m.model})`;
  document.getElementById('editMachineModal').classList.add('active');
}

function handleSaveEditedMachine(e) {
  e.preventDefault();
  if (currentRole !== 'admin') return;

  const targetId = document.getElementById('editMachineId').value;
  const m = machines.find(item => item.id === targetId);
  if (!m) return;

  const oldSerial = m.serial;
  const newSerial = document.getElementById('editSerial').value.trim();
  const newModel = document.getElementById('editModel').value.trim();
  const newCustomer = document.getElementById('editCustomer').value.trim() || 'Production for Stock (Unsold)';
  const newStage = document.getElementById('editStage').value;

  m.serial = newSerial;
  m.model = newModel;
  m.customer = newCustomer;
  m.stage = newStage;

  m.invoiceNo = document.getElementById('editInvoiceNo').value.trim();
  m.orderNo = document.getElementById('editOrderNo').value.trim();
  m.poNo = document.getElementById('editPONo').value.trim();

  const priceVal = document.getElementById('editSellingPrice').value;
  m.quoteAmount = priceVal !== '' ? parseFloat(priceVal) : 0;
  
  const paidVal = document.getElementById('editAmountPaid').value;
  m.amountPaid = paidVal !== '' ? parseFloat(paidVal) : 0;
  
  m.paymentStatus = document.getElementById('editPaymentStatus').value;

  m.cadVersion = document.getElementById('editCadVersion').value.trim();
  m.plcVersion = document.getElementById('editPlcVersion').value.trim();
  m.bomRef = document.getElementById('editBomRef').value.trim();

  m.prodStartDate = document.getElementById('editStartDate').value || m.prodStartDate;
  m.prodEstFinishDate = document.getElementById('editEstFinishDate').value || m.prodEstFinishDate;

  m.isStockOrder = !newCustomer || newCustomer.toLowerCase().includes('stock');
  if (!m.isStockOrder && m.salesYear === 'UNSOLD_STOCK') {
    m.salesYear = '2026';
  }

  logAuditAction(`Edited machine info for ${oldSerial} ➔ ${newSerial} (${newModel}). Customer: ${newCustomer}`);
  saveAppState(true, `Edit Machine ${newSerial}`);

  closeModal('editMachineModal');
  renderAllViews();
  if (currentMachineId === targetId) {
    openMachineDetailModal(targetId);
  }
  showToast(`Updated machine information for ${newSerial}`);
}

// --- SLEEK CUSTOM CONFIRMATION MODAL HELPER ---
let confirmResolver = null;

function showCustomConfirm(title, message, isDanger = false, confirmBtnText = '✓ Confirm Action') {
  return new Promise((resolve) => {
    confirmResolver = resolve;

    const modal = document.getElementById('customConfirmModal');
    const titleEl = document.getElementById('confirmModalTitle');
    const msgEl = document.getElementById('confirmModalMessage');
    const iconEl = document.getElementById('confirmModalIcon');
    const okBtn = document.getElementById('confirmOkBtn');

    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.innerHTML = message;
    if (iconEl) iconEl.textContent = isDanger ? '⚠️' : '❓';

    if (okBtn) {
      okBtn.textContent = confirmBtnText;
      okBtn.className = `btn ${isDanger ? 'btn-danger' : 'btn-primary'}`;
    }

    if (modal) modal.classList.add('active');
  });
}

function resolveCustomConfirm(result) {
  const modal = document.getElementById('customConfirmModal');
  if (modal) modal.classList.remove('active');
  if (confirmResolver) {
    confirmResolver(result);
    confirmResolver = null;
  }
}

// --- CONFIRMATION FOR DELETE MACHINE RECORD ---
async function confirmDeleteMachine(machineId) {
  if (currentRole !== 'admin') return;
  const targetId = machineId || currentMachineId;
  const m = machines.find(item => item.id === targetId);
  if (!m) return;

  const confirmed = await showCustomConfirm(
    "⚠️ Permanent Machine Deletion",
    `Are you sure you want to permanently DELETE ElectrospinTEK machine <strong style="color:var(--danger);">${m.serial}</strong> (${m.model})?<br><br><span class="subtext">(This action can be undone using Ctrl + Z)</span>`,
    true,
    "🗑️ Permanently Delete Machine"
  );
  if (confirmed) {
    machines = machines.filter(item => item.id !== targetId);
    logAuditAction(`Deleted machine record ${m.serial} (${m.model})`);
    saveAppState(true, `Delete Machine ${m.serial}`);
    closeModal('machineDetailModal');
    renderAllViews();
    showToast(`Deleted Machine ${m.serial}`);
  }
}

// --- ENGINEERING SPECS (CAD, PLC & BOM) LOGIC ---
async function saveEngineeringSpecs() {
  if (currentRole !== 'admin') return;
  const m = machines.find(item => item.id === currentMachineId);
  if (!m) return;

  const confirmed = await showCustomConfirm(
    "Save Technical Engineering Specs",
    `Save changes to technical engineering specs (CAD, PLC, BOM) for machine <strong>${m.serial}</strong>?`
  );
  if (!confirmed) return;

  m.cadVersion = document.getElementById('inputEngCad').value || m.cadVersion;
  m.plcVersion = document.getElementById('inputEngPlc').value || m.plcVersion;
  m.bomRef = document.getElementById('inputEngBom').value || m.bomRef;

  logAuditAction(`Updated technical engineering specs for ${m.serial}: CAD "${m.cadVersion}", PLC "${m.plcVersion}", BOM "${m.bomRef}"`);
  saveAppState(true, `Update Engineering Specs for ${m.serial}`);
  openMachineDetailModal(currentMachineId);
  renderAllViews();
  showToast(`Engineering specs saved for ${m.serial}`);
}

function handleUploadBomFile() {
  if (currentRole !== 'admin') return;
  const m = machines.find(item => item.id === currentMachineId);
  if (!m) return;

  const fileInput = document.getElementById('uploadBomFileInput');
  if (!fileInput.files || fileInput.files.length === 0) {
    alert("Please select a BOM file (PDF/Excel) to upload.");
    return;
  }

  const file = fileInput.files[0];
  const reader = new FileReader();

  reader.onload = function (e) {
    const fileDataUrl = e.target.result;
    const sizeFormatted = (file.size / 1024 / 1024) > 1 
      ? (file.size / 1024 / 1024).toFixed(2) + ' MB'
      : (file.size / 1024).toFixed(0) + ' KB';

    if (!m.bomFiles) m.bomFiles = [];

    m.bomFiles.unshift({
      id: 'bom_' + Date.now(),
      fileName: file.name,
      fileSize: sizeFormatted,
      uploadDate: new Date().toISOString().split('T')[0],
      fileData: fileDataUrl
    });

    logAuditAction(`Uploaded BOM file "${file.name}" for machine ${m.serial}`);
    saveAppState(true, `Upload BOM File`);

    fileInput.value = '';
    renderBomFilesTable(m);
    renderAllViews();
    showToast(`Uploaded BOM file "${file.name}"`);
  };

  reader.readAsDataURL(file);
}

async function removeBomFile(bomId) {
  if (currentRole !== 'admin') return;
  const m = machines.find(item => item.id === currentMachineId);
  if (!m || !m.bomFiles) return;

  const b = m.bomFiles.find(item => item.id === bomId);
  const name = b ? b.fileName : 'file';

  const confirmed = await showCustomConfirm(
    "⚠️ Remove BOM File",
    `Are you sure you want to delete BOM file <strong>"${name}"</strong> from machine <strong>${m.serial}</strong>?`,
    true,
    "🗑️ Delete File"
  );
  if (confirmed) {
    m.bomFiles = m.bomFiles.filter(item => item.id !== bomId);
    logAuditAction(`Removed BOM file from machine ${m.serial}`);
    saveAppState(true, `Remove BOM File`);
    renderBomFilesTable(m);
    renderAllViews();
    showToast(`BOM file removed`);
  }
}

function viewBomFile(bomId) {
  const m = machines.find(item => item.id === currentMachineId);
  if (!m || !m.bomFiles) return;

  const b = m.bomFiles.find(item => item.id === bomId);
  if (b) {
    openFileInPreviewWindow(b.fileName, "Bill of Materials (BOM) File", b.fileSize, b.fileData);
  }
}

function renderBomFilesTable(m) {
  const tbody = document.getElementById('mdlBomFilesBody');
  if (!tbody) return;

  const files = m.bomFiles || [];
  tbody.innerHTML = files.map(b => `
    <tr>
      <td><strong style="color:var(--text-main); font-size:0.88rem;">${b.fileName}</strong></td>
      <td><span class="font-code" style="font-size:0.75rem;">${b.fileSize}</span></td>
      <td><span class="subtext">${b.uploadDate}</span></td>
      <td>
        <div class="inline-flex gap-sm">
          <button class="btn btn-secondary btn-sm" onclick="viewBomFile('${b.id}')">
            👁️ Open BOM
          </button>
          <button class="btn btn-danger btn-sm admin-only" onclick="removeBomFile('${b.id}')">
            🗑️ Delete
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  if (files.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="subtext" style="text-align:center;">No BOM files uploaded yet. Select an Excel or PDF file above.</td></tr>`;
  }
}

// --- UPDATE STAGE WITH STAGE NOTE ---
async function updateMachineStageFromModal() {
  if (currentRole !== 'admin') return;
  const m = machines.find(item => item.id === currentMachineId);
  const newStage = document.getElementById('mdlStageSelect').value;
  const customDate = document.getElementById('mdlStageDateInput').value || new Date().toISOString().split('T')[0];
  const stageNote = document.getElementById('mdlStageNoteInput').value || '';

  if (m) {
    const confirmed = await showCustomConfirm(
      "Confirm Stage Transition",
      `Are you sure you want to update stage for <strong>${m.serial}</strong> to <span style="color:var(--primary); font-weight:700;">"${newStage}"</span> on date <strong>${customDate}</strong>?`
    );
    if (!confirmed) return;

    const oldStage = m.stage;
    m.stage = newStage;

    if (!m.statusHistory) m.statusHistory = [];
    
    m.statusHistory.push({
      stage: newStage,
      date: customDate,
      note: stageNote,
      user: activeUser ? activeUser.fullName : 'Admin'
    });

    if (newStage === 'Stock - Turkey' || newStage === 'Stock - USA') {
      m.prodActualFinishDate = customDate;
    }

    logAuditAction(`Updated status for ${m.serial} from "${oldStage}" to "${newStage}" on date ${customDate}`);
    saveAppState(true, `Status Update for ${m.serial}`);
    
    document.getElementById('mdlStageNoteInput').value = '';
    openMachineDetailModal(currentMachineId);
    renderAllViews();
    showToast(`Status updated for ${m.serial}`);
  }
}

// --- MANUAL EDIT / DELETE OF STATUS HISTORY LOG ---
function toggleAddManualStatusForm() {
  const el = document.getElementById('manualStatusForm');
  if (el) {
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
  }
}

function saveManualStatusEntry() {
  if (currentRole !== 'admin') return;
  const m = machines.find(item => item.id === currentMachineId);
  if (!m) return;

  const stage = document.getElementById('manualStageSelect').value;
  const date = document.getElementById('manualStageDate').value || new Date().toISOString().split('T')[0];
  const note = document.getElementById('manualStageNote').value || '';

  if (!m.statusHistory) m.statusHistory = [];

  m.statusHistory.push({
    stage: stage,
    date: date,
    note: note,
    user: activeUser ? `${activeUser.fullName} (Manual)` : 'Admin (Manual Entry)'
  });

  logAuditAction(`Manually added status log entry "${stage}" (${date}) for ${m.serial}`);
  saveAppState(true, `Add Status History for ${m.serial}`);

  document.getElementById('manualStageNote').value = '';
  toggleAddManualStatusForm();
  renderStatusHistoryTable(m);
  renderModalStageStepper(m);
  renderAllViews();
  showToast(`Manual status entry added for ${m.serial}`);
}

// --- SLEEK CUSTOM TEXT INPUT PROMPT MODAL HELPER ---
let promptResolver = null;

function showCustomPrompt(title, label, defaultValue = '') {
  return new Promise((resolve) => {
    promptResolver = resolve;

    const modal = document.getElementById('customPromptModal');
    const titleEl = document.getElementById('promptModalTitle');
    const labelEl = document.getElementById('promptModalLabel');
    const inputEl = document.getElementById('promptModalInput');

    if (titleEl) titleEl.textContent = title;
    if (labelEl) labelEl.textContent = label;
    if (inputEl) {
      inputEl.value = defaultValue;
      setTimeout(() => inputEl.focus(), 100);
    }

    if (modal) modal.classList.add('active');
  });
}

function handleCustomPromptSubmit(e) {
  e.preventDefault();
  const inputEl = document.getElementById('promptModalInput');
  const val = inputEl ? inputEl.value.trim() : '';
  resolveCustomPrompt(val);
}

function resolveCustomPrompt(val) {
  const modal = document.getElementById('customPromptModal');
  if (modal) modal.classList.remove('active');
  if (promptResolver) {
    promptResolver(val);
    promptResolver = null;
  }
}

async function editStatusHistoryEntry(index) {
  if (currentRole !== 'admin') return;
  const m = machines.find(item => item.id === currentMachineId);
  if (!m || !m.statusHistory || !m.statusHistory[index]) return;

  const entry = m.statusHistory[index];
  
  const confirmed = await showCustomConfirm(
    "Edit Status Log Entry",
    `Are you sure you want to edit status history entry for stage <strong>"${entry.stage}"</strong>?`
  );
  if (!confirmed) return;

  const newDate = await showCustomPrompt(
    "Edit Effective Date",
    `Edit effective date for stage "${entry.stage}":`,
    entry.date
  );

  if (newDate && newDate.trim() !== '') {
    entry.date = newDate.trim();
    const newNote = await showCustomPrompt(
      "Edit Stage Note",
      `Edit stage note for "${entry.stage}":`,
      entry.note || ''
    );
    if (newNote !== null) entry.note = newNote.trim();
    logAuditAction(`Edited status history for ${m.serial} (${entry.stage}) date:${entry.date}`);
    saveAppState(true, `Edit Status History for ${m.serial}`);
    renderStatusHistoryTable(m);
    renderModalStageStepper(m);
    renderAllViews();
    showToast(`Status history updated`);
  }
}

async function deleteStatusHistoryEntry(index) {
  if (currentRole !== 'admin') return;
  const m = machines.find(item => item.id === currentMachineId);
  if (!m || !m.statusHistory || !m.statusHistory[index]) return;

  const entry = m.statusHistory[index];
  const confirmed = await showCustomConfirm(
    "⚠️ Delete Status Log Entry",
    `Are you sure you want to delete status entry <strong>"${entry.stage}"</strong> (${entry.date}) from machine <strong>${m.serial}</strong>?`,
    true,
    "🗑️ Delete Entry"
  );
  if (confirmed) {
    const removed = m.statusHistory.splice(index, 1)[0];
    logAuditAction(`Deleted status history entry "${removed.stage}" from ${m.serial}`);
    saveAppState(true, `Delete Status History Entry`);
    renderStatusHistoryTable(m);
    renderModalStageStepper(m);
    renderAllViews();
    showToast(`Status history entry deleted`);
  }
}

function renderStatusHistoryTable(m) {
  const tbody = document.getElementById('mdlStatusHistoryBody');
  if (!tbody) return;

  const history = m.statusHistory || [];
  tbody.innerHTML = history.map((h, idx) => `
    <tr>
      <td><span class="badge badge-primary">${h.stage}</span></td>
      <td><strong class="font-code" style="color:var(--primary);">${h.date}</strong></td>
      <td><span class="subtext">${h.note || '—'}</span></td>
      <td><span class="subtext">${h.user || 'Admin'}</span></td>
      <td class="admin-only">
        <div class="inline-flex gap-sm">
          <button class="btn btn-secondary btn-sm" onclick="editStatusHistoryEntry(${idx})">
            ✏️ Edit
          </button>
          <button class="btn btn-danger btn-sm" onclick="deleteStatusHistoryEntry(${idx})">
            🗑️ Delete
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  if (history.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="subtext" style="text-align:center;">No status transitions recorded yet.</td></tr>`;
  }
}

// --- MACHINE SALE STATUS TOGGLE (YES / NO) ---
async function toggleMachineSoldStatusModal() {
  if (currentRole !== 'admin' && currentRole !== 'sales') {
    alert("Role restriction: Only Super Admin and Sales Lead can toggle Sold status.");
    return;
  }
  const m = machines.find(item => item.id === currentMachineId || item.serial === currentMachineId);
  if (!m) return;

  const currentIsSold = m.isSold === true || (!m.isStockOrder && m.customer && !m.customer.toLowerCase().includes('stock') && m.paymentStatus !== 'Stock Listing');
  const newIsSold = !currentIsSold;

  m.isSold = newIsSold;
  if (newIsSold) {
    m.isStockOrder = false;
    if (m.paymentStatus === 'Stock Listing') {
      m.paymentStatus = 'Unpaid';
    }
    if (!m.customer || m.customer.toLowerCase().includes('stock')) {
      const custInput = await showCustomPrompt(
        "Enter Customer Name",
        "Enter Customer / Owner Name for this Sold Machine:",
        "Customer Nanofiber Lab"
      );
      if (custInput) m.customer = custInput;
    }
    logAuditAction(`Marked machine ${m.serial} as SOLD (YES). Amount Paid: $${(m.amountPaid || 0).toLocaleString()}`);
    showToast(`Marked ${m.serial} as SOLD! Included in Machines Sold page.`);
  } else {
    m.isSold = false;
    m.isStockOrder = true;
    m.paymentStatus = 'Stock Listing';
    logAuditAction(`Marked machine ${m.serial} as UNSOLD STOCK (NO).`);
    showToast(`Marked ${m.serial} as Unsold Stock.`);
  }

  saveAppState(true, `Toggle Sold Status for ${m.serial}`);
  openMachineDetailModal(currentMachineId);
  renderAllViews();
}

// --- DELIVERY & INSTALLATION & SERVICE LOGIC ---
function saveInstallationDetails() {
  if (currentRole !== 'admin' && currentRole !== 'engineer') return;
  const m = machines.find(item => item.id === currentMachineId);
  if (!m) return;

  m.deliveryDate = document.getElementById('inputDeliveryDate').value || m.deliveryDate;
  m.installationDate = document.getElementById('inputInstallDate').value || m.installationDate;
  m.installationEngineer = document.getElementById('inputEngineerName').value || m.installationEngineer;
  m.installationSigned = true;

  logAuditAction(`Updated installation & commissioning info for ${m.serial}: Engineer ${m.installationEngineer}`);
  saveAppState(true, `Update Installation for ${m.serial}`);
  openMachineDetailModal(currentMachineId);
  renderAllViews();
  showToast(`Installation details saved`);
}

function toggleAddServiceForm() {
  const el = document.getElementById('addServiceForm');
  if (el) {
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
  }
}

function saveServiceEntry() {
  if (currentRole !== 'admin' && currentRole !== 'engineer') return;
  const m = machines.find(item => item.id === currentMachineId);
  if (!m) return;

  const type = document.getElementById('serviceTypeSelect').value;
  const date = document.getElementById('serviceDateInput').value || new Date().toISOString().split('T')[0];
  const eng = document.getElementById('serviceEngineerInput').value || (activeUser ? activeUser.fullName : 'Service Engineer');
  const notes = document.getElementById('serviceNotesInput').value || '';

  if (!m.serviceHistory) m.serviceHistory = [];

  m.serviceHistory.unshift({
    id: 'srv_' + Date.now(),
    type: type,
    date: date,
    engineer: eng,
    notes: notes
  });

  logAuditAction(`Logged ${type} service visit for ${m.serial} on ${date}`);
  saveAppState(true, `Log Service for ${m.serial}`);

  toggleAddServiceForm();
  document.getElementById('serviceNotesInput').value = '';
  renderServiceHistory(m);
  renderAllViews();
  showToast(`Logged service record for ${m.serial}`);
}

async function deleteServiceEntry(srvId) {
  if (currentRole !== 'admin') return;
  const m = machines.find(item => item.id === currentMachineId);
  if (!m || !m.serviceHistory) return;

  const confirmed = await showCustomConfirm(
    "⚠️ Delete Service Record",
    `Are you sure you want to delete this service record from machine <strong>${m.serial}</strong>?`,
    true,
    "🗑️ Delete Service Record"
  );
  if (confirmed) {
    m.serviceHistory = m.serviceHistory.filter(s => s.id !== srvId);
    logAuditAction(`Deleted service record from machine ${m.serial}`);
    saveAppState(true, `Delete Service Record`);
    renderServiceHistory(m);
    renderAllViews();
    showToast(`Service record deleted`);
  }
}

function renderServiceHistory(m) {
  const tbody = document.getElementById('mdlServiceHistoryBody');
  if (!tbody) return;

  const services = m.serviceHistory || [];
  tbody.innerHTML = services.map(s => `
    <tr>
      <td><span class="badge badge-purple">${s.type}</span></td>
      <td><strong class="font-code" style="color:var(--primary);">${s.date}</strong></td>
      <td><span class="subtext">${s.engineer}</span></td>
      <td><span class="subtext">${s.notes || '—'}</span></td>
      <td class="admin-only">
        <button class="btn btn-danger btn-sm" onclick="deleteServiceEntry('${s.id}')">
          🗑️ Delete
        </button>
      </td>
    </tr>
  `).join('');

  if (services.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="subtext" style="text-align:center;">No post-sale service or modification records logged yet.</td></tr>`;
  }
}

// --- PHOTO GALLERY LOGIC ---
function handleUploadMachinePhoto() {
  if (currentRole === 'observer') return;
  const m = machines.find(item => item.id === currentMachineId);
  if (!m) return;

  const category = document.getElementById('uploadPhotoCategory').value;
  const fileInput = document.getElementById('uploadPhotoInput');

  if (!fileInput.files || fileInput.files.length === 0) {
    alert("Please select an image photo file to upload.");
    return;
  }

  const file = fileInput.files[0];
  const reader = new FileReader();

  reader.onload = function (e) {
    const photoDataUrl = e.target.result;

    if (!m.photos) m.photos = [];

    const newPhoto = {
      id: 'photo_' + Date.now(),
      category: category,
      fileName: file.name,
      uploadDate: new Date().toISOString().split('T')[0],
      fileData: photoDataUrl
    };

    m.photos.unshift(newPhoto);
    logAuditAction(`Uploaded machine photo "${file.name}" (${category}) for ${m.serial}`);
    saveAppState(true, `Upload Machine Photo`);

    fileInput.value = '';
    renderPhotoGallery(m);
    renderAllViews();
    showToast(`Uploaded photo "${file.name}"`);
  };

  reader.readAsDataURL(file);
}

function removeMachinePhoto(photoId) {
  if (currentRole !== 'admin') return;
  const m = machines.find(item => item.id === currentMachineId);
  if (!m || !m.photos) return;

  const p = m.photos.find(item => item.id === photoId);
  const name = p ? p.fileName : 'photo';

  if (confirm(`⚠️ CONFIRM DELETE: Are you sure you want to delete photo "${name}"?`)) {
    m.photos = m.photos.filter(item => item.id !== photoId);
    logAuditAction(`Removed photo from machine ${m.serial}`);
    saveAppState(true, `Remove Photo`);
    renderPhotoGallery(m);
    renderAllViews();
    showToast(`Photo removed`);
  }
}

function viewFullPhoto(photoId) {
  const m = machines.find(item => item.id === currentMachineId);
  if (!m || !m.photos) return;

  const p = m.photos.find(item => item.id === photoId);
  if (!p) return;

  if (p.fileData) {
    const win = window.open();
    win.document.write(`
      <html>
        <head><title>${p.fileName} - ElectrospinTEK Photo Gallery</title></head>
        <body style="margin:0; background:#090d16; color:#fff; display:flex; flex-direction:column; align-items:center; justify-center; height:100vh;">
          <div style="padding:12px; background:#131b2e; width:100%; text-align:center;">
            <strong style="color:#f59e0b;">${p.category}</strong>: ${p.fileName} (${p.uploadDate})
          </div>
          <img src="${p.fileData}" style="max-width:90%; max-height:85vh; object-fit:contain; margin:auto; border-radius:8px; box-shadow:0 10px 30px rgba(0,0,0,0.8);">
        </body>
      </html>
    `);
  }
}

function renderPhotoGallery(m) {
  const container = document.getElementById('mdlPhotoGalleryGrid');
  const countEl = document.getElementById('photoGalleryCount');
  if (!container) return;

  const photos = m.photos || [];
  if (countEl) countEl.textContent = `${photos.length} photo(s)`;

  container.innerHTML = photos.map(p => `
    <div class="photo-card">
      <div class="photo-thumb-wrapper" onclick="viewFullPhoto('${p.id}')">
        <img src="${p.fileData || 'logo.png'}" alt="${p.fileName}" class="photo-thumb">
      </div>
      <div class="photo-card-info">
        <span class="photo-cat">${p.category}</span>
        <span class="photo-name" title="${p.fileName}">${p.fileName}</span>
        <div class="flex-between margin-top-sm">
          <span class="subtext">${p.uploadDate}</span>
          <button class="btn btn-danger btn-sm admin-only" onclick="removeMachinePhoto('${p.id}')">🗑️ Delete</button>
        </div>
      </div>
    </div>
  `).join('');

  if (photos.length === 0) {
    container.innerHTML = `<div class="subtext" style="grid-column: 1/-1; text-align:center; padding:2rem;">No machine photos uploaded yet. Select a photo file above to add to the gallery.</div>`;
  }
}

// --- PACKAGING LIST LOGIC ---
function handleUploadPackagingList() {
  if (currentRole === 'observer') return;
  const m = machines.find(item => item.id === currentMachineId);
  if (!m) return;

  const fileInput = document.getElementById('uploadPackagingListInput');
  if (!fileInput.files || fileInput.files.length === 0) {
    alert("Please select a packaging list PDF to upload.");
    return;
  }

  const file = fileInput.files[0];
  const reader = new FileReader();

  reader.onload = function (e) {
    const fileDataUrl = e.target.result;
    const sizeFormatted = (file.size / 1024 / 1024) > 1 
      ? (file.size / 1024 / 1024).toFixed(2) + ' MB'
      : (file.size / 1024).toFixed(0) + ' KB';

    if (!m.packagingLists) m.packagingLists = [];

    m.packagingLists.unshift({
      id: 'pkg_' + Date.now(),
      fileName: file.name,
      fileSize: sizeFormatted,
      uploadDate: new Date().toISOString().split('T')[0],
      fileData: fileDataUrl
    });

    logAuditAction(`Uploaded packaging list "${file.name}" for machine ${m.serial}`);
    saveAppState(true, `Upload Packaging List`);

    fileInput.value = '';
    renderPackagingLists(m);
    renderAllViews();
    showToast(`Uploaded packaging list "${file.name}"`);
  };

  reader.readAsDataURL(file);
}

function removePackagingList(pkgId) {
  if (currentRole !== 'admin') return;
  const m = machines.find(item => item.id === currentMachineId);
  if (!m || !m.packagingLists) return;

  const pkg = m.packagingLists.find(p => p.id === pkgId);
  const name = pkg ? pkg.fileName : 'file';

  if (confirm(`⚠️ CONFIRM DELETE: Are you sure you want to delete packaging list "${name}"?`)) {
    m.packagingLists = m.packagingLists.filter(p => p.id !== pkgId);
    logAuditAction(`Removed packaging list from machine ${m.serial}`);
    saveAppState(true, `Remove Packaging List`);
    renderPackagingLists(m);
    renderAllViews();
    showToast(`Packaging list removed`);
  }
}

function viewPackagingList(pkgId) {
  const m = machines.find(item => item.id === currentMachineId);
  if (!m || !m.packagingLists) return;

  const pkg = m.packagingLists.find(p => p.id === pkgId);
  if (pkg) {
    openFileInPreviewWindow(pkg.fileName, "Inside Box Packaging List PDF", pkg.fileSize, pkg.fileData);
  }
}

function renderPackagingLists(m) {
  const tbody = document.getElementById('mdlPackagingListBody');
  if (!tbody) return;

  const lists = m.packagingLists || [];
  tbody.innerHTML = lists.map(pkg => `
    <tr>
      <td><strong style="color:var(--text-main); font-size:0.88rem;">${pkg.fileName}</strong></td>
      <td><span class="font-code" style="font-size:0.75rem;">${pkg.fileSize}</span></td>
      <td><span class="subtext">${pkg.uploadDate}</span></td>
      <td>
        <div class="inline-flex gap-sm">
          <button class="btn btn-secondary btn-sm" onclick="viewPackagingList('${pkg.id}')">
            👁️ Open Packaging List
          </button>
          <button class="btn btn-danger btn-sm admin-only" onclick="removePackagingList('${pkg.id}')">
            🗑️ Delete
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  if (lists.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="subtext" style="text-align:center;">No inside-the-box packaging lists attached yet.</td></tr>`;
  }
}

// --- MULTI-LEG SHIPPING & TRANSFER MOVEMENT HISTORY LOGIC ---
function toggleAddShipmentLegForm() {
  const el = document.getElementById('addShipmentLegFormBox');
  if (el) {
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
  }
}

function saveShipmentLegEntry() {
  if (currentRole !== 'admin' && currentRole !== 'engineer' && currentRole !== 'sales') return;
  const m = machines.find(item => item.id === currentMachineId || item.serial === currentMachineId);
  if (!m) return;

  const origin = document.getElementById('legOriginInput').value.trim();
  const destination = document.getElementById('legDestinationInput').value.trim();
  const shipDate = document.getElementById('legShipDateInput').value || new Date().toISOString().split('T')[0];
  const carrier = document.getElementById('legCarrierInput').value.trim() || 'Internal Logistics';
  const trackingNo = document.getElementById('legTrackingInput').value.trim() || '—';
  const status = document.getElementById('legStatusSelect').value;
  const notes = document.getElementById('legNotesInput').value.trim();
  const fileInput = document.getElementById('legDocFileInput');

  if (!origin || !destination) {
    alert("Please specify both Origin (From) and Destination (To) locations.");
    return;
  }

  if (!m.shipmentLegs) m.shipmentLegs = [];

  const processAddLeg = (docName = '', docData = '') => {
    const newLeg = {
      id: 'leg_' + Date.now(),
      origin: origin,
      destination: destination,
      shipDate: shipDate,
      carrier: carrier,
      trackingNo: trackingNo,
      status: status,
      notes: notes,
      docFileName: docName,
      docFileData: docData
    };

    m.shipmentLegs.unshift(newLeg);
    logAuditAction(`Logged shipment leg for ${m.serial}: ${origin} ➔ ${destination} (${status})`);
    saveAppState(true, `Add Shipment Leg for ${m.serial}`);

    document.getElementById('legOriginInput').value = '';
    document.getElementById('legDestinationInput').value = '';
    document.getElementById('legCarrierInput').value = '';
    document.getElementById('legTrackingInput').value = '';
    document.getElementById('legNotesInput').value = '';
    if (fileInput) fileInput.value = '';

    toggleAddShipmentLegForm();
    renderShipmentLegs(m);
    renderAllViews();
    showToast(`Added shipment leg: ${origin} ➔ ${destination}`);
  };

  if (fileInput && fileInput.files && fileInput.files.length > 0) {
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
      processAddLeg(file.name, e.target.result);
    };
    reader.readAsDataURL(file);
  } else {
    processAddLeg();
  }
}

async function deleteShipmentLegEntry(legId) {
  if (currentRole !== 'admin') return;
  const m = machines.find(item => item.id === currentMachineId || item.serial === currentMachineId);
  if (!m || !m.shipmentLegs) return;

  const confirmed = await showCustomConfirm(
    "⚠️ Delete Shipment Leg",
    `Are you sure you want to delete this shipment movement record from machine <strong>${m.serial}</strong>?`,
    true,
    "🗑️ Delete Shipment Leg"
  );

  if (confirmed) {
    m.shipmentLegs = m.shipmentLegs.filter(l => l.id !== legId);
    logAuditAction(`Deleted shipment leg from machine ${m.serial}`);
    saveAppState(true, `Delete Shipment Leg`);
    renderShipmentLegs(m);
    renderAllViews();
    showToast(`Shipment leg record deleted`);
  }
}

function viewShipmentLegDoc(legId) {
  const m = machines.find(item => item.id === currentMachineId || item.serial === currentMachineId);
  if (!m || !m.shipmentLegs) return;

  const leg = m.shipmentLegs.find(l => l.id === legId);
  if (leg && leg.docFileData) {
    openFileInPreviewWindow(leg.docFileName, `Shipping Waybill: ${leg.origin} ➔ ${leg.destination}`, "PDF Document", leg.docFileData);
  } else {
    alert("No shipping document attached to this movement leg.");
  }
}

function renderShipmentLegs(m) {
  const tbody = document.getElementById('mdlShipmentLegsBody');
  if (!tbody) return;

  const legs = m.shipmentLegs || [];
  tbody.innerHTML = legs.map(l => {
    let badgeClass = 'badge-primary';
    if (l.status === 'Delivered') badgeClass = 'badge-success';
    else if (l.status === 'Customs Clearance') badgeClass = 'badge-warning';
    else if (l.status.includes('Returned')) badgeClass = 'badge-danger';

    return `
      <tr>
        <td>
          <strong style="color:var(--text-main); font-size:0.88rem;">${l.origin}</strong><br>
          <span style="color:var(--primary); font-size:0.8rem; font-weight:700;">➔ ${l.destination}</span>
        </td>
        <td>
          <strong class="font-code" style="color:var(--primary); font-size:0.82rem;">${l.shipDate}</strong><br>
          <span class="subtext">${l.carrier || 'Logistics'}</span>
        </td>
        <td><span class="font-code text-highlight" style="font-weight:700;">${l.trackingNo || '—'}</span></td>
        <td><span class="badge ${badgeClass}">${l.status}</span></td>
        <td>
          ${l.docFileData ? `
            <button class="btn btn-secondary btn-sm" onclick="viewShipmentLegDoc('${l.id}')">
              📄 ${l.docFileName || 'Waybill.pdf'}
            </button>
          ` : '<span class="subtext">No doc</span>'}
        </td>
        <td><span class="subtext" title="${l.notes || ''}">${l.notes || '—'}</span></td>
        <td class="admin-only">
          <button class="btn btn-danger btn-sm" onclick="deleteShipmentLegEntry('${l.id}')">
            🗑️ Delete
          </button>
        </td>
      </tr>
    `;
  }).join('');

  if (legs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="subtext" style="text-align:center; padding:1.5rem;">No multi-leg shipment movements logged yet. Click "➕ Log New Shipment / Transfer Leg" above to record transfers between Turkey stock, USA stock, and customer facilities.</td></tr>`;
  }
}

// --- PAYMENT & INVOICE FINANCIAL MANAGEMENT ---
function savePaymentStatus() {
  if (currentRole !== 'admin' && currentRole !== 'sales') return;
  const m = machines.find(item => item.id === currentMachineId);
  if (!m) return;

  if (!confirm(`Save sales invoice & payment changes for machine ${m.serial}?`)) {
    return;
  }

  m.invoiceNo = document.getElementById('inputInvoiceNo').value || m.invoiceNo;
  m.orderNo = document.getElementById('inputOrderNo').value || m.orderNo;
  
  const status = document.getElementById('inputPaymentStatus').value;
  const priceVal = document.getElementById('inputSellingPrice').value;
  const sellingPrice = priceVal !== '' ? parseFloat(priceVal) : (m.quoteAmount || 0);
  const amt = parseFloat(document.getElementById('inputPayAmount').value) || m.amountPaid || 0;
  const date = document.getElementById('inputPayDate').value || new Date().toISOString().split('T')[0];

  m.quoteAmount = sellingPrice;
  m.paymentStatus = status;
  m.amountPaid = amt;
  if (status === 'Deposit Received') m.paymentDepositDate = date;
  if (status === 'Fully Paid (100%)') m.paymentFinalDate = date;

  logAuditAction(`Updated financials for ${m.serial}: Inv "${m.invoiceNo}", Ord "${m.orderNo}", Status "${status}", Price $${sellingPrice.toLocaleString()}`);
  saveAppState(true, `Update Financial Record for ${m.serial}`);
  openMachineDetailModal(currentMachineId);
  renderAllViews();
  showToast(`Sales invoice & payment status saved`);
}

// --- GENERAL DOCUMENT UPLOAD HANDLER ---
function handleUploadDocument() {
  if (currentRole === 'observer') return;
  const m = machines.find(item => item.id === currentMachineId);
  if (!m) return;

  const category = document.getElementById('uploadDocCategory').value;
  const fileInput = document.getElementById('uploadFileInput');

  if (!fileInput.files || fileInput.files.length === 0) {
    alert("Please select a PDF or document file to upload.");
    return;
  }

  const file = fileInput.files[0];
  const reader = new FileReader();

  reader.onload = function (e) {
    const fileDataUrl = e.target.result;
    const sizeFormatted = (file.size / 1024 / 1024) > 1 
      ? (file.size / 1024 / 1024).toFixed(2) + ' MB'
      : (file.size / 1024).toFixed(0) + ' KB';

    if (!m.attachments) m.attachments = [];

    const newDoc = {
      id: 'att_' + Date.now(),
      category: category,
      fileName: file.name,
      fileSize: sizeFormatted,
      uploadDate: new Date().toISOString().split('T')[0],
      uploadedBy: activeUser ? activeUser.fullName : 'Admin',
      fileData: fileDataUrl
    };

    m.attachments.unshift(newDoc);
    logAuditAction(`Uploaded document "${file.name}" under category "${category}" for machine ${m.serial}`);
    saveAppState(true, `Upload Document for ${m.serial}`);

    fileInput.value = '';
    renderDocumentVault(m);
    renderAllViews();
    showToast(`Uploaded document "${file.name}"`);
  };

  reader.readAsDataURL(file);
}

function removeAttachment(attId) {
  if (currentRole !== 'admin') return;
  const m = machines.find(item => item.id === currentMachineId);
  if (!m || !m.attachments) return;

  const att = m.attachments.find(a => a.id === attId);
  const name = att ? att.fileName : 'file';

  if (confirm(`⚠️ CONFIRM DELETE: Are you sure you want to delete document "${name}"?`)) {
    m.attachments = m.attachments.filter(a => a.id !== attId);
    logAuditAction(`Removed attached document "${name}" from machine ${m.serial}`);
    saveAppState(true, `Remove Document`);
    renderDocumentVault(m);
    renderAllViews();
    showToast(`Removed attached document`);
  }
}

function viewAttachment(attId) {
  const m = machines.find(item => item.id === currentMachineId);
  if (!m || !m.attachments) return;

  const att = m.attachments.find(a => a.id === attId);
  if (!att) return;

  openFileInPreviewWindow(att.fileName, att.category, att.fileSize, att.fileData);
}

// --- TEST FORM FILE UPLOAD HANDLER ---
function handleUploadTestFormFile() {
  if (currentRole === 'observer') return;
  const m = machines.find(item => item.id === currentMachineId);
  if (!m) return;

  const category = document.getElementById('uploadTestFormCategory').value;
  const fileInput = document.getElementById('uploadTestFileInput');

  if (!fileInput.files || fileInput.files.length === 0) {
    alert("Please select a test form file (PDF/Image) to upload.");
    return;
  }

  const file = fileInput.files[0];
  const reader = new FileReader();

  reader.onload = function (e) {
    const fileDataUrl = e.target.result;
    const sizeFormatted = (file.size / 1024 / 1024) > 1 
      ? (file.size / 1024 / 1024).toFixed(2) + ' MB'
      : (file.size / 1024).toFixed(0) + ' KB';

    if (!m.testFormFiles) m.testFormFiles = [];

    const newTestFile = {
      id: 'tf_' + Date.now(),
      category: category,
      fileName: file.name,
      fileSize: sizeFormatted,
      uploadDate: new Date().toISOString().split('T')[0],
      uploadedBy: activeUser ? activeUser.fullName : 'Quality Engineer',
      fileData: fileDataUrl
    };

    m.testFormFiles.unshift(newTestFile);
    m.qcPassed = true;
    m.qcDate = new Date().toISOString().split('T')[0];

    logAuditAction(`Uploaded test form file "${file.name}" (${category}) for machine ${m.serial}`);
    saveAppState(true, `Upload Test File for ${m.serial}`);

    fileInput.value = '';
    renderTestFormFiles(m);
    renderQCChecklist(m);
    renderAllViews();
    showToast(`Uploaded test form "${file.name}"`);
  };

  reader.readAsDataURL(file);
}

function removeTestFormFile(fileId) {
  if (currentRole !== 'admin') return;
  const m = machines.find(item => item.id === currentMachineId);
  if (!m || !m.testFormFiles) return;

  const tf = m.testFormFiles.find(f => f.id === fileId);
  const name = tf ? tf.fileName : 'file';

  if (confirm(`⚠️ CONFIRM DELETE: Are you sure you want to delete test form file "${name}"?`)) {
    m.testFormFiles = m.testFormFiles.filter(f => f.id !== fileId);
    logAuditAction(`Removed test form file "${name}" from machine ${m.serial}`);
    saveAppState(true, `Remove Test File`);
    renderTestFormFiles(m);
    renderAllViews();
    showToast(`Removed test form file`);
  }
}

function viewTestFormFile(fileId) {
  const m = machines.find(item => item.id === currentMachineId);
  if (!m || !m.testFormFiles) return;

  const tf = m.testFormFiles.find(f => f.id === fileId);
  if (!tf) return;

  openFileInPreviewWindow(tf.fileName, tf.category, tf.fileSize, tf.fileData);
}

// Universal File Window Viewer
function openFileInPreviewWindow(fileName, category, fileSize, fileData) {
  if (fileData) {
    const win = window.open();
    win.document.write(`
      <html>
        <head><title>${fileName} - ElectrospinTEK Viewer</title></head>
        <body style="margin:0; background:#0f172a; color:#fff; font-family:sans-serif; display:flex; flex-direction:column; height:100vh;">
          <div style="padding:12px 24px; background:#1e293b; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #334155;">
            <div>
              <span style="color:#ffcc00; font-weight:bold; font-size:12px; text-transform:uppercase;">${category}</span><br>
              <strong style="font-size:16px;">${fileName}</strong> <span style="font-size:12px; color:#94a3b8;">(${fileSize})</span>
            </div>
            <a href="${fileData}" download="${fileName}" style="background:#ffcc00; color:#000; padding:8px 16px; border-radius:6px; text-decoration:none; font-weight:bold; font-size:14px;">Download Document</a>
          </div>
          <iframe src="${fileData}" style="flex:1; border:none; width:100%; height:100%;"></iframe>
        </body>
      </html>
    `);
  } else {
    alert(`Demonstration file: ${fileName}\nCategory: ${category}\nFile Size: ${fileSize}`);
  }
}

// Render Document Vault List
function renderDocumentVault(m) {
  const tbody = document.getElementById('mdlDocumentVaultBody');
  const countEl = document.getElementById('docVaultCount');
  if (!tbody) return;

  const attachments = m.attachments || [];
  if (countEl) countEl.textContent = `${attachments.length} file(s) attached`;

  tbody.innerHTML = attachments.map(att => `
    <tr>
      <td><span class="badge badge-primary">${att.category}</span></td>
      <td>
        <strong style="color:var(--text-main); font-size:0.88rem;">${att.fileName}</strong>
      </td>
      <td><span class="font-code" style="font-size:0.75rem;">${att.fileSize}</span></td>
      <td><span class="subtext">${att.uploadDate}</span></td>
      <td>
        <div class="inline-flex gap-sm">
          <button class="btn btn-secondary btn-sm" onclick="viewAttachment('${att.id}')">
            👁️ Open PDF
          </button>
          <button class="btn btn-danger btn-sm admin-only" onclick="removeAttachment('${att.id}')">
            🗑️ Delete
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  if (attachments.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="subtext" style="text-align:center; padding:1.5rem;">No document files attached yet. Use the uploader above to add files.</td></tr>`;
  }
}

// Render Test Form Files List
function renderTestFormFiles(m) {
  const tbody = document.getElementById('mdlTestFormFilesBody');
  const countEl = document.getElementById('testFormFilesCount');
  const overallBadge = document.getElementById('qcOverallBadge');
  if (!tbody) return;

  const testFiles = m.testFormFiles || [];
  if (countEl) countEl.textContent = `${testFiles.length} test file(s) attached`;

  if (overallBadge) {
    if (testFiles.length > 0 || m.qcPassed) {
      overallBadge.textContent = '✓ FAT PDF ATTACHED';
      overallBadge.className = 'badge badge-success';
    } else {
      overallBadge.textContent = '⌛ PENDING FAT PDF';
      overallBadge.className = 'badge badge-warning';
    }
  }

  tbody.innerHTML = testFiles.map(tf => `
    <tr>
      <td><span class="badge badge-purple">${tf.category}</span></td>
      <td>
        <strong style="color:var(--text-main); font-size:0.88rem;">${tf.fileName}</strong>
      </td>
      <td><span class="font-code" style="font-size:0.75rem;">${tf.fileSize}</span></td>
      <td><span class="subtext">${tf.uploadDate}</span></td>
      <td>
        <div class="inline-flex gap-sm">
          <button class="btn btn-secondary btn-sm" onclick="viewTestFormFile('${tf.id}')">
            👁️ Open Test File
          </button>
          <button class="btn btn-danger btn-sm admin-only" onclick="removeTestFormFile('${tf.id}')">
            🗑️ Delete
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  if (testFiles.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="subtext" style="text-align:center; padding:1.5rem;">No test form files attached to this machine record yet. Select a signed FAT PDF or test report above to upload.</td></tr>`;
  }
}

// --- MODAL DEEP-DIVE ---
function openMachineDetailModal(machineId) {
  currentMachineId = machineId;
  const m = machines.find(item => item.id === machineId || item.serial === machineId);
  if (!m) return;

  const setElText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  setElText('mdlLocBadge', m.stage || '');
  setElText('mdlMachineTitle', m.serial || '');
  setElText('mdlSerialSub', `Serial: ${m.serial} | Model: ${m.model} | Owner: ${m.customer}`);

  // Populate Key Dates & Invoice Details
  const isSold = m.isSold === true || (!m.isStockOrder && m.customer && !m.customer.toLowerCase().includes('stock') && m.paymentStatus !== 'Stock Listing');
  m.isSold = isSold;

  const soldBadge = document.getElementById('dtMdlSoldBadge');
  if (soldBadge) {
    soldBadge.textContent = isSold ? '✓ SOLD (YES)' : '📦 UNSOLD STOCK (NO)';
    soldBadge.className = `badge ${isSold ? 'badge-success' : 'badge-secondary'}`;
  }

  setElText('dtMdlSerial', m.serial || '');
  setElText('dtMdlCustomer', m.customer || '');
  setElText('dtMdlInvoiceNo', m.invoiceNo || 'Empty');
  setElText('dtMdlOrderNo', m.orderNo || 'Empty');
  setElText('dtMdlStart', m.prodStartDate || '');
  setElText('dtMdlEstFinish', m.prodEstFinishDate || 'Pending');
  setElText('dtMdlActualFinish', m.prodActualFinishDate || '');
  setElText('dtMdlWarehouse', m.stage.includes('Stock') ? m.stage : (m.targetLocation || 'In Transit'));
  setElText('dtMdlShipDate', m.shipDate || '');

  // Populate Engineering Tab (CAD, PLC, BOM)
  setElText('engCadVersion', m.cadVersion || 'Empty');
  setElText('engPlcVersion', m.plcVersion || 'Empty');
  setElText('engBomRef', m.bomRef || 'Empty');

  if (document.getElementById('inputEngCad')) document.getElementById('inputEngCad').value = m.cadVersion || '';
  if (document.getElementById('inputEngPlc')) document.getElementById('inputEngPlc').value = m.plcVersion || '';
  if (document.getElementById('inputEngBom')) document.getElementById('inputEngBom').value = m.bomRef || '';

  renderBomFilesTable(m);

  // Populate Installation Tab
  setElText('instDeliveryDate', m.deliveryDate || 'Pending');
  setElText('instSetupDate', m.installationDate || 'Pending');
  setElText('instEngineerName', m.installationEngineer || 'Not Assigned');
  const signBadge = document.getElementById('instSignOffBadge');
  if (signBadge) {
    signBadge.textContent = m.installationSigned ? '✓ CUSTOMER SIGNED' : '⌛ PENDING SIGN-OFF';
    signBadge.className = `badge ${m.installationSigned ? 'badge-success' : 'badge-secondary'}`;
  }

  // Populate Shipping Parties
  setElText('shipSenderName', m.senderName || 'ElectrospinTEK Logistics');
  setElText('shipRecipientName', m.recipientName || 'Customer Tech Lead');
  setElText('shipRecipientOrg', m.customer || '');
  setElText('shipCarrier', m.carrier || 'TBD');
  setElText('shipTracking', m.trackingNo || 'TBD');
  setElText('shipEstTime', m.estShipTime || '5 Days');
  setElText('shipDestination', m.destination || 'TBD');

  if (document.getElementById('inputSenderName')) document.getElementById('inputSenderName').value = m.senderName || '';
  if (document.getElementById('inputRecipientName')) document.getElementById('inputRecipientName').value = m.recipientName || '';

  // Render Sub-lists
  renderModalStageStepper(m);
  renderStatusHistoryTable(m);
  renderServiceHistory(m);
  renderPhotoGallery(m);
  renderPackagingLists(m);
  renderShipmentLegs(m);
  renderDocumentVault(m);
  renderTestFormFiles(m);
  renderQCChecklist(m);
  renderNotesList(m);

  // Financials & Invoices Tab
  setElText('docInvoiceNo', m.invoiceNo || 'Empty');
  setElText('docOrderNo', m.orderNo || 'Empty');
  setElText('docPONo', m.poNo || 'Empty');
  setElText('docQuoteNo', m.quoteNo || 'Empty');
  setElText('docQuoteAmt', m.quoteAmount > 0 ? `$${m.quoteAmount.toLocaleString()}` : 'Empty');
  
  const pStat = m.paymentStatus || 'Unpaid';
  const pBadge = document.getElementById('paymentStatusBadge');
  if (pBadge) {
    pBadge.textContent = pStat;
    if (pStat === 'Fully Paid (100%)') pBadge.className = 'badge badge-success';
    else if (pStat === 'Deposit Received') pBadge.className = 'badge badge-warning';
    else pBadge.className = 'badge badge-danger';
  }

  setElText('payAmountPaid', `$${(m.amountPaid || 0).toLocaleString()}`);
  setElText('payDepositDate', m.paymentDepositDate || 'Pending');
  setElText('payFinalDate', m.paymentFinalDate || 'Pending');

  if (document.getElementById('inputInvoiceNo')) document.getElementById('inputInvoiceNo').value = m.invoiceNo || '';
  if (document.getElementById('inputOrderNo')) document.getElementById('inputOrderNo').value = m.orderNo || '';
  if (document.getElementById('inputPaymentStatus')) document.getElementById('inputPaymentStatus').value = pStat;
  if (document.getElementById('inputSellingPrice')) document.getElementById('inputSellingPrice').value = m.quoteAmount > 0 ? m.quoteAmount : '';
  if (document.getElementById('inputPayAmount')) document.getElementById('inputPayAmount').value = m.amountPaid > 0 ? m.amountPaid : '';

  switchModalTab('overview');
  const modal = document.getElementById('machineDetailModal');
  if (modal) modal.classList.add('active');
}

function switchModalTab(tabName) {
  currentModalTab = tabName;
  document.querySelectorAll('.mdl-tab').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.querySelector(`.mdl-tab[data-tab="${tabName}"]`);
  if (activeBtn) activeBtn.classList.add('active');

  document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
  const activePane = document.getElementById(`tab-${tabName}`);
  if (activePane) activePane.classList.add('active');
}

function renderModalStageStepper(m) {
  const stepper = document.getElementById('mdlStageStepper');
  if (!stepper) return;

  stepper.innerHTML = LIFECYCLE_STAGES.map((stg) => {
    const isCurrent = m.stage === stg;
    const histEntry = (m.statusHistory || []).find(h => h.stage === stg);

    let statusClass = isCurrent ? 'current' : (histEntry ? 'completed' : '');
    let iconStr = isCurrent ? '📍' : (histEntry ? '📅' : '⚪');
    let dateText = isCurrent ? (histEntry ? `Active since: ${histEntry.date}` : 'Active Current Location') : (histEntry ? `Recorded: ${histEntry.date}` : 'Not Active');

    return `
      <div class="step-item ${statusClass}" style="margin-bottom: 0.75rem;">
        <div class="step-num" style="font-size: 1rem;">${iconStr}</div>
        <div class="step-info">
          <div class="step-name" style="${isCurrent ? 'color: var(--primary); font-weight: 700;' : ''}">${stg}</div>
          <div class="step-date">${dateText}</div>
        </div>
      </div>
    `;
  }).join('');

  const select = document.getElementById('mdlStageSelect');
  if (select) select.value = m.stage;

  const dateInput = document.getElementById('mdlStageDateInput');
  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
}

// Render QC Checklist
function renderQCChecklist(m) {
  const grid = document.getElementById('qcChecklistGrid');
  const badge = document.getElementById('qcOverallBadge');

  if (badge) {
    const hasFiles = (m.testFormFiles || []).length > 0;
    badge.textContent = (m.qcPassed || hasFiles) ? '✓ FAT PDF ATTACHED' : '⌛ PENDING FAT PDF';
    badge.className = `badge ${(m.qcPassed || hasFiles) ? 'badge-success' : 'badge-warning'}`;
  }

  if (!grid) return;

  grid.innerHTML = (m.qcChecklist || []).map(qc => `
    <div class="qc-item">
      <span class="qc-item-text">${qc.text}</span>
      <button class="badge ${qc.passed ? 'badge-success' : 'badge-secondary'}"
              style="cursor:pointer;"
              onclick="toggleQCCheckitem('${qc.id}')">
        ${qc.passed ? '✓ PASSED' : '⌛ PENDING'}
      </button>
    </div>
  `).join('');
}

function toggleQCCheckitem(qcId) {
  if (currentRole === 'observer') return;
  const m = machines.find(item => item.id === currentMachineId);
  if (!m) return;

  const item = (m.qcChecklist || []).find(q => q.id === qcId);
  if (item) {
    item.passed = !item.passed;
    saveAppState(true, `Toggle QC Checklist Item`);
    renderQCChecklist(m);
  }
}

async function completeQCTestForm() {
  if (currentRole === 'observer') return;
  const m = machines.find(item => item.id === currentMachineId);
  if (m) {
    const confirmed = await showCustomConfirm(
      "Sign Off FAT Checklist",
      `Sign off Factory Acceptance Test (FAT) checklist for machine <strong>${m.serial}</strong>?`
    );
    if (!confirmed) return;
    (m.qcChecklist || []).forEach(q => q.passed = true);
    m.qcPassed = true;
    m.qcDate = new Date().toISOString().split('T')[0];
    logAuditAction(`Completed and signed off Factory Acceptance Test (FAT) checklist for ElectrospinTEK machine ${m.serial}`);
    saveAppState(true, `Sign off FAT Checklist`);
    renderQCChecklist(m);
    renderAllViews();
    showToast(`Signed off FAT Checklist for ${m.serial}`);
  }
}

// Shipping Parties Save
async function saveShippingDetails() {
  if (currentRole === 'observer') return;
  const m = machines.find(item => item.id === currentMachineId);
  if (m) {
    const confirmed = await showCustomConfirm(
      "Save Shipping Details",
      `Save shipping parties and tracking info for machine <strong>${m.serial}</strong>?`
    );
    if (!confirmed) return;
    m.senderName = document.getElementById('inputSenderName').value || m.senderName;
    m.recipientName = document.getElementById('inputRecipientName').value || m.recipientName;
    m.carrier = document.getElementById('inputCarrier').value || m.carrier;
    m.trackingNo = document.getElementById('inputTracking').value || m.trackingNo;
    m.estShipTime = document.getElementById('inputEstTime').value || m.estShipTime;

    logAuditAction(`Updated shipping parties for ${m.serial}: Sender "${m.senderName}", Recipient "${m.recipientName}"`);
    saveAppState(true, `Update Shipping Info`);
    openMachineDetailModal(currentMachineId);
    renderAllViews();
    showToast(`Shipping parties & tracking saved`);
  }
}

// Notes
function renderNotesList(m) {
  const container = document.getElementById('mdlNotesList');
  container.innerHTML = (m.notes || []).map(n => `
    <div style="background:var(--bg-card); border:1px solid var(--border-color); padding:0.75rem; border-radius:var(--radius-sm); margin-bottom:0.6rem;">
      <div style="font-size:0.75rem; color:var(--text-muted); display:flex; justify-content:space-between; margin-bottom:0.25rem;">
        <strong style="color:var(--warning);">${n.author}</strong>
        <span>${n.date}</span>
      </div>
      <div style="font-size:0.85rem; color:var(--text-main);">${n.text}</div>
    </div>
  `).join('');
}

function addMachineNote() {
  if (currentRole === 'observer') return;
  const m = machines.find(item => item.id === currentMachineId);
  const text = document.getElementById('inputNoteText').value;

  if (m && text) {
    if (!m.notes) m.notes = [];
    m.notes.push({
      author: activeUser ? activeUser.fullName : 'Admin',
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      text: text
    });
    logAuditAction(`Added note to ElectrospinTEK machine ${m.serial}`);
    saveAppState(true, `Add Note to ${m.serial}`);
    renderNotesList(m);
    document.getElementById('inputNoteText').value = '';
    showToast(`Note added to ${m.serial}`);
  }
}

// --- START PRODUCTION MODAL CONTROLS ---
function openStartProductionModal() {
  if (currentRole !== 'admin') return;
  populateProductionDates();
  document.getElementById('startProductionModal').classList.add('active');
}

function toggleBatchMode() {
  const mode = document.getElementById('prodMode').value;
  const groupSerial = document.getElementById('groupSerial');
  const groupBatchCount = document.getElementById('groupBatchCount');

  if (mode === 'BATCH') {
    groupSerial.style.display = 'none';
    groupBatchCount.style.display = 'flex';
  } else {
    groupSerial.style.display = 'flex';
    groupBatchCount.style.display = 'none';
  }
}

function toggleCustomerField() {
  const target = document.getElementById('prodTarget').value;
  const custInput = document.getElementById('prodCustomer');
  if (target.includes('Stock')) {
    custInput.placeholder = 'Leave empty for Stock Warehouse or enter reserved customer name';
  } else {
    custInput.placeholder = 'e.g. BioLab Industries';
  }
}

function handleStartProduction(e) {
  e.preventDefault();
  if (currentRole !== 'admin') return;

  const mode = document.getElementById('prodMode').value;
  const model = document.getElementById('prodModel').value.trim();
  const targetLoc = document.getElementById('prodTarget').value;
  
  const customerVal = document.getElementById('prodCustomer').value.trim();
  const invoiceNoVal = document.getElementById('prodInvoiceNo').value.trim();
  const orderNoVal = document.getElementById('prodOrderNo').value.trim();

  // Price & Specs are EMPTY by default unless user enters value
  const priceInput = document.getElementById('prodSellingPrice').value;
  const quotePrice = priceInput !== '' ? parseFloat(priceInput) : 0;

  const cadVer = document.getElementById('prodCadVersion') ? document.getElementById('prodCadVersion').value.trim() : '';
  const plcVer = document.getElementById('prodPlcVersion') ? document.getElementById('prodPlcVersion').value.trim() : '';
  const bomRef = document.getElementById('prodBomRef') ? document.getElementById('prodBomRef').value.trim() : '';

  const startDate = document.getElementById('prodStartDate').value;
  const estFinishDate = document.getElementById('prodEstFinishDate').value;
  const notesText = document.getElementById('prodNotes').value;

  const isStock = !customerVal || targetLoc.includes('Stock');
  const customerName = customerVal || (targetLoc === 'Stock - Turkey' ? 'Stock Warehouse (Turkey)' : 'Stock Warehouse (USA)');

  if (mode === 'SINGLE') {
    let serial = document.getElementById('prodSerial').value.trim();
    if (!serial || serial.length !== 8) {
      serial = generateNextSerialNumber(model);
    }

    if (machines.some(m => m.serial.toUpperCase() === serial.toUpperCase())) {
      serial = generateNextSerialNumber(model);
    }
    
    const newMachine = {
      id: serial,
      serial: serial,
      model: model,
      customer: customerName,
      isStockOrder: isStock,
      salesYear: isStock ? 'UNSOLD_STOCK' : '2026',
      invoiceNo: invoiceNoVal,
      orderNo: orderNoVal,
      stage: 'In Production / Fabrication',
      targetLocation: targetLoc,
      cadVersion: cadVer,
      plcVersion: plcVer,
      bomRef: bomRef,
      prodStartDate: startDate,
      prodEstFinishDate: estFinishDate,
      prodActualFinishDate: 'Pending',
      estShipTime: '5-7 Days',
      senderName: 'ElectrospinTEK Logistics',
      recipientName: customerName,
      quoteNo: isStock ? '' : `QT-ESTEK-${Math.floor(1000 + Math.random() * 9000)}`,
      quoteAmount: quotePrice,
      quoteStatus: isStock ? 'Stock Listing' : 'Pending Invoice',
      poNo: '',
      poDate: startDate,
      poStatus: isStock ? 'Internal' : 'Awaiting PO',
      paymentStatus: isStock ? 'Stock Listing' : 'Unpaid',
      amountPaid: 0,
      paymentDepositDate: 'Pending',
      paymentFinalDate: 'Pending',
      qcPassed: false,
      qcDate: 'Pending',
      carrier: 'ElectrospinTEK Logistics',
      trackingNo: `TRK-${serial}`,
      destination: targetLoc === 'Stock - Turkey' ? 'Istanbul Warehouse, Turkey' : (targetLoc === 'Stock - USA' ? 'Houston Warehouse, USA' : 'Customer Facility'),
      deliveryDate: 'Pending',
      installationDate: 'Pending',
      installationEngineer: 'Not Assigned',
      installationSigned: false,
      statusHistory: [
        { stage: 'In Production / Fabrication', date: startDate, note: `Production started. Serial: ${serial}`, user: activeUser ? activeUser.fullName : 'Admin' }
      ],
      attachments: [],
      testFormFiles: [],
      bomFiles: [],
      photos: [],
      packagingLists: [],
      serviceHistory: [],
      qcChecklist: [
        { id: "qc1", text: "High Voltage (30kV) Isolation & Safety", passed: false },
        { id: "qc2", text: "Syringe Pump & Flow Rate Test", passed: false },
        { id: "qc3", text: "Collector Rotation & Speed Test", passed: false }
      ],
      notes: notesText ? [{ author: activeUser ? activeUser.fullName : 'Admin', date: new Date().toISOString().replace('T', ' ').substring(0, 16), text: notesText }] : []
    };

    machines.unshift(newMachine);
    logAuditAction(`Launched production for machine ${serial} (${model}). Customer: ${customerName}`);
    saveAppState(true, `Production Launch ${serial}`);
    showToast(`Started production for ${serial}`);

  } else {
    // BATCH PRODUCTION WITH STRICT 8-CHARACTER SERIAL NUMBERS
    const batchQty = parseInt(document.getElementById('prodBatchQty').value) || 10;
    
    for (let i = 1; i <= batchQty; i++) {
      const serial = generateNextSerialNumber(model);
      
      const newMachine = {
        id: serial,
        serial: serial,
        model: `${model} (Unit ${i} of ${batchQty})`,
        customer: customerName,
        isStockOrder: isStock,
        salesYear: isStock ? 'UNSOLD_STOCK' : '2026',
        invoiceNo: invoiceNoVal,
        orderNo: orderNoVal,
        stage: 'In Production / Fabrication',
        targetLocation: targetLoc,
        cadVersion: cadVer,
        plcVersion: plcVer,
        bomRef: bomRef,
        prodStartDate: startDate,
        prodEstFinishDate: estFinishDate,
        prodActualFinishDate: 'Pending',
        estShipTime: '5-7 Days',
        senderName: 'ElectrospinTEK Logistics',
        recipientName: customerName,
        quoteNo: '',
        quoteAmount: quotePrice,
        quoteStatus: 'Batch Production',
        poNo: '',
        poDate: startDate,
        poStatus: 'Internal',
        paymentStatus: isStock ? 'Stock Listing' : 'Unpaid',
        amountPaid: 0,
        paymentDepositDate: 'Pending',
        paymentFinalDate: 'Pending',
        qcPassed: false,
        qcDate: 'Pending',
        carrier: 'Batch Logistics',
        trackingNo: `TRK-BATCH-${serial}`,
        destination: targetLoc === 'Stock - Turkey' ? 'Istanbul Warehouse, Turkey' : (targetLoc === 'Stock - USA' ? 'Houston Warehouse, USA' : 'Customer Facility'),
        deliveryDate: 'Pending',
        installationDate: 'Pending',
        installationEngineer: 'Not Assigned',
        installationSigned: false,
        statusHistory: [
          { stage: 'In Production / Fabrication', date: startDate, note: `Batch unit ${i}/${batchQty}`, user: activeUser ? activeUser.fullName : 'Admin' }
        ],
        attachments: [],
        testFormFiles: [],
        bomFiles: [],
        photos: [],
        packagingLists: [],
        serviceHistory: [],
        qcChecklist: [
          { id: "qc1", text: "High Voltage Isolation Test", passed: false },
          { id: "qc2", text: "Syringe Driver Speed Test", passed: false }
        ],
        notes: notesText ? [{ author: activeUser ? activeUser.fullName : 'Admin', date: new Date().toISOString().replace('T', ' ').substring(0, 16), text: `Batch unit ${i}/${batchQty}: ${notesText}` }] : []
      };

      machines.unshift(newMachine);
    }

    logAuditAction(`Launched batch production of ${batchQty} ElectrospinTEK units of model "${model}". Target: ${targetLoc}`);
    saveAppState(true, `Batch Launch ${batchQty} units`);
    showToast(`Launched batch production of ${batchQty} machines`);
  }

  closeModal('startProductionModal');
  document.getElementById('startProductionForm').reset();
  renderAllViews();
}

function handleCreateStock(e) {
  e.preventDefault();
  if (currentRole !== 'admin') return;

  const sku = document.getElementById('newStockSKU').value;
  const name = document.getElementById('newStockName').value;
  const cat = document.getElementById('newStockCat').value || 'General';
  const qty = parseInt(document.getElementById('newStockQty').value) || 5;

  stockParts.unshift({ sku, name, cat, bin: 'WAREHOUSE', qty, min: 2, cost: 500 });
  saveAppState(true, `Create Stock Part ${sku}`);
  closeModal('addStockModal');
  renderStockPartsTable();
  showToast(`Added component stock ${sku}`);
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}
