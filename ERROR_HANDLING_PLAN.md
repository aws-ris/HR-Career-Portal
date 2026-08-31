# 🛡️ Production Error Handling & Candidate Experience Architecture Plan

> **Role**: Senior Solutions Architect Briefing  
> **Target System**: RIS HR Career Portal (Public Job Board, Candidate Application Engine, & HR Management Portal)

---

## 📋 Executive Overview

In production-grade enterprise software, system resilience and user experience are defined by two principles:
1. **Zero Blinding Failures**: The candidate or HR manager must *never* experience a blank white screen, unhandled browser alert, raw code traceback, or silent failure.
2. **Context-Aware Guidance & Persistent Support**: When an issue occurs (e.g., missing field, network glitch, file size limit, or server error), the system guides the user inline, auto-scrolls to the exact point of attention, and provides a **single, uniform HR contact safety net**.

This document outlines the **Production Error Handling & Notification System**, incorporating persistent HR support integration.

---

## 📧 Standardized Uniform Support Contact

To ensure total brand consistency and eliminate candidate confusion, all support callouts and error fallbacks across the portal utilize **one single uniform statement**:

> **"For any recruitment queries or technical assistance, please email Mr. Parmod Kumar at [parmod.kumar@ris.org.in](mailto:parmod.kumar@ris.org.in)."**

### Persistent Touchpoints:
1. **Persistent Header Support Banner**: Visible at the top of the form across all application steps (1 to 5).
2. **Step 0 Terms & Conditions Support Box**: Embedded below the T&C block before the candidate starts.
3. **Submission Failure Modals & Banners**: Embedded directly inside error dialogs if network or server issues occur.
4. **Portal Footer Navigation**: Clickable link alongside *Official Website* and *Contact Us*.

---

## 🎨 Part 1: Interactive Form Validation & Auto-Scroll (Candidate Portal)

### 1.1 Inline Red Field Highlighting & Error Messages (No Browser `alert()` Popups)
* **What it means**: Currently, if a candidate forgets a field (like Full Name or Resume), the browser pops up a native OS alert dialog (`alert(...)`). Native browser alerts interrupt flow and look unpolished.
* **What it will do**:
  - Eliminates browser `alert()` popups entirely across all steps of the form.
  - Whenever a field is invalid or missing, its border turns to a soft red (`border: 2px solid #ef4444`, `background: #fef2f2`).
  - Displays a clean, specific error message directly below the input field in red text (e.g., *"Resume PDF/DOCX file is required before proceeding"* or *"Statement of Purpose exceeds 300 words"*).

---

### 1.2 Smooth Auto-Scroll & Auto-Focus on Errors
* **What it means**: On long form pages (like Step 1 Personal Info or Step 3 Work Experience), if the first error is near the top of the page and the candidate is scrolled down near the "Proceed" button, they might not notice why clicking the button didn't advance the page.
* **What it will do**:
  - When the candidate clicks **"Proceed"** or **"Submit Application"**, the form validates all inputs.
  - If any input is invalid, the page **smoothly auto-scrolls** directly to the very first faulty field on the screen.
  - Automatically places the cursor inside that field (`.focus()`) so the candidate can fix it immediately without manual searching.

---

### 1.3 Universal Field Validation Rules
* **What it means**: Every field has customized, real-time validation checks.
* **What it will do**:
  - **Date of Birth**: Validates DD/MM/YYYY format and ensures age is >= 18.
  - **Email & Mobile**: Validates regex email patterns and 4–15 digit phone numbers.
  - **Scores & CGPA**: Validates percentage <= 100% and CGPA <= 10.0 or <= 4.0 based on selected grading system.
  - **Resume Upload**: Enforces PDF/DOCX format and max 5MB file size limit with inline file size alerts.
  - **Statement of Purpose (SOP)**: Live word counter showing word count (e.g., *240/300 words*) with red highlight if exceeded.

---

## 💳 Part 2: Centered Modal Cards (Submission & Server Responses)

### 2.1 Centered Modal Pop-up Card for Submission Success
* **What it means**: Replaces standard browser alerts upon completing an application with an executive, modern popup dialog.
* **What it will do**:
  - Displays a centered, glassmorphism modal with a success checkmark animation.
  - Displays application details: Candidate Name, Position Applied, Job ID, and Submission Timestamp.
  - Offers immediate actions:
    - 📥 **Download Copy of Submitted Application (PDF)**
    - 🏠 **Return to Job Board**

---

### 2.2 Centered Modal Pop-up Card for Submission Errors & HR Contact Fallback
* **What it means**: If the candidate's internet drops during submission or the database rejects a payload, the app shows a structured retry card rather than breaking.
* **What it will do**:
  - Displays a centered error modal with a soft warning icon.
  - Explains the exact issue in plain English (e.g., *"Network Connection Dropped. Your application data has been preserved in memory."*).
  - Provides a **"Retry Submission"** button.
  - **HR Support Safety Net**: Includes the uniform contact instruction: *"If the issue persists, please email Mr. Parmod Kumar at parmod.kumar@ris.org.in with your application details."*

---

## 📡 Part 3: Network & Connectivity Resilience (System Level)

### 3.1 Network Offline Floating Toast Banner
* **What it means**: Monitors the browser's internet connection status in real-time.
* **What it will do**:
  - If the candidate's Wi-Fi drops while filling out the form, a floating top banner appears: ⚠️ *"You are currently offline. Please check your internet connection before submitting."*
  - Automatically hides once internet is restored.

---

### 3.2 Automatic Fetch Retries with Exponential Backoff
* **What it means**: If a network request encounters a brief 1-second server blip or proxy delay (502 / 504 gateway timeout), standard web apps crash immediately.
* **What it will do**:
  - Automatically retries the backend request **3 times** with increasing delays (1s, 2s, 3s) behind the scenes before showing an error card to the user.

---

## 🛡️ Part 4: React Error Boundaries (Zero White Screens)

### 4.1 Global & Route-Level Error Boundaries
* **What it means**: If a rare JavaScript crash occurs inside a React component (e.g., trying to read a missing property on an old browser), React unmounts the whole page, leaving a blank white screen.
* **What it will do**:
  - Wraps all major pages (`JobBoard`, `ApplicationForm`, `HRPortal`) in `<ErrorBoundary>`.
  - Catches the crash silently and renders a clean **System Health Fallback Card**:
    > *"Notice: A component rendering issue occurred. Your progress is safe. For immediate assistance, please email Mr. Parmod Kumar at [parmod.kumar@ris.org.in](mailto:parmod.kumar@ris.org.in). [Reload Page]"*

---

## 📝 Summary Decision Table for User Review

| # | Feature | What it does | Status |
|---|---|---|---|
| 1 | **Uniform HR Support Email** | Persistent support banner (`parmod.kumar@ris.org.in`) on header, T&C, errors & footer | 🟢 Live & Deployed |
| 2 | **Inline Red Borders & Messages** | Replaces browser alerts with inline red borders & error text under fields | ✅ Recommended |
| 3 | **Auto-Scroll to 1st Error** | Smoothly scrolls & focuses the first missing/invalid field on click | ✅ Recommended |
| 4 | **Centered Submission Modal** | Displays a modern centered popup card for successful submission & PDF summary | ✅ Recommended |
| 5 | **Centered Server Error Modal** | Displays a centered card with a "Retry Submission" button & HR email fallback | ✅ Recommended |
| 6 | **Offline Status Toast Banner** | Detects Wi-Fi drops and warns user before they try to submit | ✅ Recommended |
| 7 | **Auto Fetch Retries (3x)** | Retries transient network glitches behind the scenes before throwing an error | ✅ Recommended |
| 8 | **React Error Boundary** | Prevents white screens by displaying a clean fallback card with HR email link | ✅ Recommended |
