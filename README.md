# CareTrack — Virus Quarantine Facility Management System

**CareTrack** is a clinical quarantine facility operations and outcome surveillance web application built for the **Technical Product Manager (TPM)** assessment.

It digitizes the clinical workflow for a **74-bed virus quarantine facility**, coordinating nurses, attending physicians, and administrators to eliminate missing temperature readings, prevent bed double-assignments, enforce rigorous 3-day afebrile recovery rules, and deliver real-time mortality surveillance against expected benchmarks.

---

## 1. Quick Start: Local Run on macOS

The application requires **Node.js (v18+)** and **npm**.

### Clone & Navigate
```bash
cd "/Users/jyoti/Documents/jyoti/CareTrack — Virus Quarantine Facility Management System"
```

### Install Dependencies
```bash
npm install
```

### Start Development Server
```bash
npm run dev
```

The application will immediately be accessible at:
```
http://localhost:5173/
```

### Production Build & Local Preview
```bash
npm run build
npm run preview
```

---

## 2. Core Clinical Business Rules & Guardrails

| Clinical Rule | Implementation in CareTrack |
| :--- | :--- |
| **Facility Capacity Limit** | Hard maximum of **74 patients**. System prevents admissions once all 74 beds are occupied. |
| **Bed Assignment** | Bed numbers 1–74. A bed cannot be assigned to two active patients. Discharging a patient immediately deallocates and releases the bed. |
| **Afebrile Recovery Rule** | A patient must be afebrile (< 38.0°C default, configurable) for **three full consecutive calendar days** prior to discharge review. |
| **Missing Data Penalty** | **Missing temperature data never counts as fever-free**. Partial days do not count as full days. |
| **Sequential Afebrile Streak** | Any reading $\ge 38.0^\circ\text{C}$ immediately breaks the consecutive streak and flags pyrexia. |
| **Doctor Clinical Review** | A Doctor must review temperature trajectories and explicitly **Approve** or **Reject** eligibility (rejection requires mandatory clinical rationale). |
| **Admin Final Discharge** | Only an Administrator can execute final discharge. Administrator discharge is **strictly blocked** until Doctor clinical approval is granted. |
| **Mortality Surveillance** | Calculated as $\frac{\text{Recorded Deaths}}{\text{Recorded Recoveries} + \text{Recorded Deaths}} \times 100\%$, bench-marked against the **15.0% expected mortality**. Active admitted patients are not presumed recovered or deceased. |

---

## 3. User Roles & Permission Matrix

CareTrack features an instant **Role Switcher** banner in the top navigation for demonstration and assessment testing:

```
[ Nurse: Elena Rostova, RN ]  |  [ Doctor: Dr. Marcus Vance, MD ]  |  [ Administrator: Arthur Pendelton ]
```

| Capability / Workflow | Nurse | Doctor | Administrator |
| :--- | :---: | :---: | :---: |
| View 74-Bed Map & Occupancy | ✓ | ✓ | ✓ |
| Record Patient Temperatures | ✓ | ✓ | ✓ |
| View Duplicate Reading Warnings | ✓ | ✓ | ✓ |
| Record Clinical Doctor Visits | ✗ | **✓** | ✗ |
| Authorize Urgent Visit Override | ✗ | **✓** | ✗ |
| Approve / Reject Discharge Eligibility | ✗ | **✓** | ✗ |
| Admit Patient & Assign Bed (1–74) | ✗ | ✗ | **✓** |
| Process Final Discharge & Release Bed | ✗ | ✗ | **✓** (requires Dr approval) |
| Export Audit CSVs & Configure Rules | ✗ | ✗ | **✓** |

---

## 4. Required Screens Overview

1. **Screen 1: Dashboard (`/`)**
   - 74-bed capacity gauge, active census, and available bed counters.
   - Real-time workflow counters: patients needing today's temperature check, patients awaiting doctor visit, patients ready for discharge.
   - Cumulative mortality rate vs. **15.0% expected benchmark** with variance analysis.
   - Interactive 74-Bed Map floor plan modal.
   - Chronological audit log of facility activities.

2. **Screen 2: Patient Admission (`/register`)**
   - Validated admission form with auto-generated unique ID (`CT-2026-XXX`).
   - Dynamic bed selector showing available vs. occupied beds (1–74).
   - Real-time capacity guardrail: blocks registration if 74 beds are filled.
   - Automatic logging of baseline admission vitals.

3. **Screen 3: Patient Directory (`/patients`)**
   - Searchable by name, ID, or bed number.
   - Quick filters: *All Admitted*, *Needs Temp Check*, *Needs Doctor Visit*, *Discharge Eligible*, *Discharged*.
   - Comprehensive Patient Profile Modal with complete vitals history, 3-day recovery audit checklist, and clinical notes.

4. **Screen 4: Nurse Temperature Recording (`/nurse-entry`)**
   - Patient selection with quick-pills for patients still needing today's check.
   - Temperature logging in °C with timestamp and nurse attribution.
   - **Duplicate Detection**: Flags multiple readings entered for the same patient on the same day.
   - **Fever Spike Alert**: Readings $\ge 38.0^\circ\text{C}$ prompt immediate medical escalation warnings.

5. **Screen 5: Doctor Visits (`/doctor-visits`)**
   - Mandatory temperature trajectory review prior to documenting visit.
   - Clinical observation notes, treatment modifications, and follow-up directives.
   - **Coordination Guardrail**: Warns if patient has not had a temperature check today; requires explicit doctor acknowledgment for urgent visits.

6. **Screen 6: Discharge Review (`/discharge-review`)**
   - Dedicated 3-day consecutive afebrile audit matrix.
   - Identifies exact missing calendar days and pyrexia spikes.
   - Two-step authorization: Doctor Clinical Clearance $\rightarrow$ Administrator Bed Deallocation.

7. **Screen 7: Reports & Outcomes Surveillance (`/reports`)**
   - Total admissions, current occupancy, total discharges, recoveries, and deaths.
   - Completed outcomes denominator with variance against the 15% benchmark.
   - Daily temperature check compliance rate and doctor coordination percentage.
   - Isolation of incomplete or unconfirmed outcome records.
   - One-click CSV Exports: **Patient Records CSV**, **Temperature Logs CSV**, and **Outcomes Audit Report CSV**.

---

## 5. Seed Demonstration Dataset

CareTrack initializes with realistic, fictional patient records showcasing all assessment test cases:

- **Eleanor Vance (`CT-2026-001`, Bed 04)**: Admitted 5 days ago. Has achieved 3 full consecutive fever-free days. **Awaiting Doctor Approval**.
- **Grace Miller (`CT-2026-005`, Bed 22)**: Completed 3 fever-free days and **already Doctor Approved**. Ready for **Administrator Final Discharge**.
- **David Kim (`CT-2026-002`, Bed 09)**: Day 2 temperature reading is missing. System cleanly blocks discharge eligibility and highlights the missing record.
- **Amara Okafor (`CT-2026-003`, Bed 12)**: Active high fever spike ($39.1^\circ\text{C}$). Highlighted in red with escalation alert.
- **Robert Chen (`CT-2026-004`, Bed 17)**: Has morning temperature logged today; awaiting doctor visit.
- **Lucas Santos (`CT-2026-006`, Bed 28)**: Admitted patient with **no temperature logged yet today**. Demonstrates the missing-reading warning in Doctor Visits.
- **Miriam Al-Hassan (`CT-2026-007`)**: Discharged (Recovered). Bed 15 sanitized and returned to inventory.
- **James Worthington (`CT-2026-008`)**: Discharged (Deceased). Demonstrates clinical outcome mortality recording.
- **Marcus Brody (`CT-2026-010`)**: Discharged with pending transfer outcome. Demonstrates the **Incomplete Records Warning**.

> **Reset Demo Data Button**: Located in the top navigation bar with a confirmation modal, allowing you to restore the pristine seed dataset at any time.

---

## 6. TPM Assessor Demonstration Walkthrough

Follow this 5-minute step-by-step workflow to evaluate all core features:

1. **Verify Facility Dashboard**:
   - Open `http://localhost:5173/`.
   - Confirm Capacity shows 74 beds, active occupancy, and mortality variance vs 15%.
   - Click **Interactive Bed Map** to view the full 74-bed visual layout.
2. **Log Nurse Temperature**:
   - Switch role to **Nurse**.
   - Navigate to **Temperature Entry**.
   - Quick-select **Lucas Santos (Bed 28)** from the pending banner.
   - Enter `37.1`°C and click **Save Temperature Reading**.
   - Notice the reading appears in his history and the pending count decrements.
3. **Conduct Doctor Review**:
   - Switch role to **Doctor**.
   - Navigate to **Doctor Visits**.
   - Select **Robert Chen (Bed 17)**.
   - Enter observations: *"Patient lungs clear, oxygen saturation 98%, vitals stable."*
   - Click **Save Doctor Visit Record**.
4. **Approve Discharge Clearance**:
   - Navigate to **Discharge Review**.
   - Select **Eleanor Vance (CT-2026-001)**.
   - Observe the 3-day consecutive afebrile audit checklist (all 3 days green).
   - Under Step 1, select **Approve Clearance** and click **Submit Physician Decision**.
5. **Process Administrator Discharge**:
   - Switch role to **Administrator**.
   - Notice that Step 2 (**Administrator Final Discharge**) is now enabled for Eleanor Vance.
   - Click **Process Final Discharge & Release Bed**, select **Recovered**, and confirm.
   - Verify Bed 4 is released and available beds increases on the dashboard!
6. **Inspect Audit Reports & CSV Export**:
   - Navigate to **Reports & Outcomes**.
   - Review the updated recoveries, mortality rate, and compliance scores.
   - Click **Export Patient Directory** or **Export Clinical Outcomes** to download instant CSV files.

---

## 7. Deployment Instructions for Vercel

CareTrack includes a root `vercel.json` configured with SPA routing rewrites.

### Option A: Deploy via Vercel CLI
1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```
2. In the project directory, run:
   ```bash
   vercel
   ```
3. Follow the CLI prompts:
   - Set up and deploy? **Yes**
   - Which scope? Select your personal or team account
   - Link to existing project? **No**
   - What's your project's name? `caretrack-quarantine`
   - In which directory is your code located? `./`
   - Want to modify settings? **No** (Vite settings are auto-detected)
4. For production deployment:
   ```bash
   vercel --prod
   ```

### Option B: Deploy via GitHub + Vercel Web Dashboard
1. Push this repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial CareTrack Quarantine Facility MVP"
   git remote add origin https://github.com/YOUR_USERNAME/caretrack.git
   git push -u origin main
   ```
2. Log into [vercel.com](https://vercel.com) and click **Add New Project**.
3. Import your `caretrack` repository.
4. Keep standard Vite framework settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click **Deploy**. Vercel will build and assign your live production URL (e.g., `https://caretrack-quarantine.vercel.app`).
