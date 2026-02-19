# Implementation Plan: IT Web Portal for Office Workers

## Project Goal
Create a modern, clean, and eye-comfortable web portal for IT services, targeting office workers aged 30-60.
Tech Stack: Next.js (App Router), React, Tailwind CSS.

## Design Philosophy (Target Audience 30-60)
- **Typography:** Clear, readable fonts with good contrast (not too small).
- **Color Palette:** Soothing, professional, low eye strain (e.g., soft blues, warm greys, off-whites). Avoid harsh neons.
- **Layout:** Spacious, intuitive navigation, consistent structure.

## Tasks & Checklist

### Phase 1: Foundation & Styling
- [x] **Setup Global Styles:** Define color palette and typography in `globals.css` / Tailwind config for "comfortable viewing".
- [x] **Layout Component:** Create a main layout with a persistent Header/Navbar and Footer.

### Phase 1.5: Backend & API (Simple)
- [ ] **Login API (`/api/auth/login`):** Create a Next.js API route to handle login requests.
    - Accept `username` and `password`.
    - Validate against hardcoded user (e.g., `admin` / `password`).
    - Return success (mock token) or error message.

### Phase 2: Page Implementation
- [x] **Index Page (`/`):**
    - Welcome message.
    - Quick overview of services.
    - Link/Button to Login.
- [x] **Login Page (`/login`):**
    - Simple form (Username, Password).
    - "Forgot Password" link (placeholder).
    - Clear validation feedback.
- [ ] **Home (Dashboard) Page (`/home`):**
    - Main dashboard after login.
    - Quick links to common IT tasks (Ticket status, Requests, Knowledge Base).
- [ ] **Contact Page (`/contact`):**
    - Contact form or IT support contact details.
    - Map or Office location info.

### Phase 3: Components & Navigation
- [ ] **Navigation Bar:** Responsive, clear labels.
- [ ] **Footer:** Copyright, simple links.
- [ ] **Card Component:** Reusable for dashboard widgets.

## Execution Order
1. Define styles.
2. Build Layout.
3. Build Pages (Index -> Login -> Home -> Contact).
4. Review and Refine.
