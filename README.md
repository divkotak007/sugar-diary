# OneTruth Sugar Diary | Secure Clinical Management

A premium, healthcare-focused diabetes management application designed for precision, safety, and elderly-friendly usability.

---

## ⚖️ Intellectual Property Notice
**PROPRIETARY & CONFIDENTIAL**  
Copyright © 2026 OneTruth Healthcare. All Rights Reserved.  
This software, including its clinical logic, proprietary 'Compliance Engine', and user interface design, is protected by international intellectual property laws. Unauthorized copying, distribution, or reverse engineering of any part of this codebase is strictly prohibited.

---

## 🛡️ Security & Privacy Architecture
We have implemented multiple layers of defense to protect patient data and system integrity:

### 1. Frontend Firewall
* **DevTools Interlock**: Context menus and developer inspection tools (F12, Ctrl+Shift+I) are programmatically disabled to prevent code inspection.
* **Content Security Policy (CSP)**: Strict browser-level rules to block Cross-Site Scripting (XSS) and unauthorized data exfiltration.
* **Property Watermarking**: Subtle background watermarks identify active sessions as proprietary property of OneTruth Healthcare.
* **Scraping Prevention**: Global selection locks prevent unauthorized text and data copying.

### 2. Clinical Data Integrity
* **Firebase User Isolation**: Strict server-side Firestore rules ensure each user can only ever access their own encrypted records.
* **Audit Interlock**: A 30-minute deletion lock prevents accidental or malicious ledger tampering for recent documentation.
* **Derived State Engine**: Vitals and compliance stats are computed on-the-fly from the source-of-truth logbook, preventing stale data caching.

---

## ✨ Features
* **Smart Compliance Tracking**: Real-time adherence scoring for Oral medications and Insulin.
* **Clinical Trend Graphs**: Interactive, read-only SVG visualizations with medical-grade error boundaries.
* **Safety Validation Engine**:
    * Insulin-Glucose interlock (Safety Rule: No insulin without sugar value).
    * Single-parameter vital updates with dynamic profile indicators.
    * 1-hour duplicate entry protection.
* **Elderly-Friendly UI**: High-contrast, large-font typography and intuitive collapsible history logs.

## 🛠 Tech Stack
* **Frontend**: React.js, TailwindCSS, Lucide-React.
* **Backend**: Firebase Firestore, Firebase Authentication.
* **Reporting**: jsPDF, autoTable.
