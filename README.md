# ⚡ ElectrospinTEK - Machine Tracking & Production ERP System

A web-based Enterprise Resource Planning (ERP) and Machine Lifecycle Tracking Application built for **ElectrospinTEK**. This platform tracks electrospinning and nanofiber production machinery from fabrication to warehouse storage and final customer delivery.

---

## ✨ Features

- **📊 Master Machine Directory**: Track machine serial numbers, models, owners, stage locations, invoice numbers, and payment status in real-time.
- **🔢 Strict 8-Character Serial Number Generator**: Automatically generates non-duplicated, 8-character serial numbers combining model prefixes and global sequential counters (e.g., `LS325044`, `TK801045`).
- **💰 Machines Sold Sales & Financial ERP**: Overview of total quoted revenue, cash collected, outstanding balance, and customer delivery timelines.
- **🔄 Kanban Lifecycle Pipeline**: Visual progression across 6 stages:
  1. *In Production / Fabrication*
  2. *Stock - Turkey Warehouse*
  3. *Stock - USA Warehouse*
  4. *Shipping to Customer (from Turkey)*
  5. *Shipping to Customer (from USA)*
  6. *Delivered to Customer*
- **⚙️ Technical Engineering & Specs**: Manage CAD Versions, PLC Firmware, and upload Excel/PDF Bill of Materials (BOM) files.
- **☑️ Factory Acceptance Testing (FAT)**: Interactive inspection checklists and signed FAT PDF certificate upload vault.
- **📷 Photo Gallery & Document Vault**: Upload and inspect high-res photos, inside-the-box packaging list PDFs, and sales invoices.
- **🖨️ PDF & Printer Report Generator**: Generate and print comprehensive machine spec sheets and compliance certificates.
- **📊 Google Sheets CSV Import / Export**: Direct compatibility to backup, restore, and transfer ERP data to Google Sheets or Excel.
- **👥 Multi-User Role Access Control**:
  - `⚡ Super Admin` (Full Edit & Clear Data with Password)
  - `🔧 Field Engineer` (QC Inspection & Service Visits)
  - `💰 Sales Manager` (Financials & Invoices)
  - `👁️ Guest Observer` (Read-only access)

---

## 🚀 Getting Started

### 1. Running Locally
Simply launch the PowerShell server script or open `index.html` directly in any web browser:

```powershell
powershell -ExecutionPolicy Bypass -File .\server.ps1
```

Then open your browser to `http://localhost:8080/`.

---

## 🔒 Security & Data Storage
- Local data persistence via `localStorage`.
- Super Admin password safeguard (`admin123`) required to execute database resets.
- Full undo history (`Ctrl + Z`).

---

© 2026 ElectrospinTEK Production Systems. All rights reserved.
