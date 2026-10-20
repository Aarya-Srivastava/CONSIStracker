# CONSIStracker (Full-Stack React + Tailwind CSS + Node/Express)

A consistency and study tracker built with **React 19**, **Tailwind CSS v4**, **Node/Express**, **JWT Multi-User Authentication**, **Subject Analytics**, and **Anti-Distraction Behavioral Systems**.

---

## 🚀 Quick Start

From the `CONSIStracker` directory, run:

```bash
npm run dev
```

*(Or double-click **[`run.bat`](file:///c:/Users/Yash%20Srivastava/OneDrive/Desktop/CONSIStracker/run.bat)** on Windows)*

- **Frontend App:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:5000](http://localhost:5000)

---

## 🧠 Anti-Distraction & Anti-Derailment Systems

Designed specifically for easily distracted minds and overcoming procrastination:

### 1. Brain Dump / Distraction Parking Lot (Hotkey: `D`)
- While the timer is running, press **`D`** (or tap the **🧠 Brain Dump** button).
- Quickly type any intrusive thought or urge (e.g., *"Look up shoe price"*, *"Check email"*), press `Enter`, and it is instantly parked.
- **Zero tab-switching required:** Your session stays unbroken.
- When you end your session, Diano lists all parked thoughts on the celebration screen so you can check them guilt-free.

### 2. Time Sanity Check (Anti-False Reading Protection) ⏱️
- **Problem Solved:** Ever started a timer, forgot to turn it off, and came back hours later to find a false 4-hour reading that ruins your stats?
- **How it Works:** If a session exceeds 45 minutes or experiences extended absence, clicking *End Session* triggers the **Time Sanity Check**:
  - Displays: *"Your timer clocked 2h 45m. Did you study the whole time, or did you forget to turn off the timer?"*
  - **1-Click Trim Buttons:** Trim to **25m**, **45m**, **1 hour**, or enter custom minutes.
  - **Discard Button:** Erase accidental runaway sessions with one click.

### 3. The Sarcastic Tab Guard 🦆🚨
- When you switch away from the study tab to another website, the tab title flashes sarcastic callouts:
  - `👀 Already on YouTube?`
  - `🚨 Diano is watching you procrastinate`
  - `🦆 Your streak is weeping`
- When you return, Sarcastic Duck greets you with a contextual roast banner based on how many minutes you were gone.

### 4. The 5-Minute Pact (Break Initiation Friction) ⚡
- Feeling overwhelmed by a 2-hour goal? Tap **"⚡ The 5-Minute Pact"**.
- A compact 300-second sprint with zero pressure.
- Once 5 minutes are up, initiation friction is broken, and you choose to keep rolling or stop guilt-free.

### 5. Pomodoro & Deep Work Rhythm Intervals 🍅
- Switch between **Flexible**, **Strict**, **Pomodoro (25m Focus / 5m Break)**, and **Deep Work (50m Focus / 10m Break)**.
- Guaranteed breaks prevent mental fatigue and aimless browsing.

### 6. Anti-Derailment Streak Shield (Mending Mode) 🛡️
- If you miss a day, your streak does **not** reset to 0 immediately (preventing the "I already failed, so I quit" spiral).
- The streak enters **🛡️ Shield Active** mode: complete a 20-minute session today to mend and preserve your hard-earned streak.

---

## 🌟 Full-Stack Features

- **Multi-User & JWT Authentication:** Default login with `focus` or register unique user accounts. Passwords hashed with `bcryptjs`.
- **Subject Category Analytics:** Tag sessions as *Coding, Math, Reading, Design, Writing*, with color-coded stacked bar charts and percentage breakdowns.
- **The Monthly Mist:** Procedural SVG landscapes with dynamic fog that clears based on study consistency.
- **Evening Ritual:** Calming breath animation where Diano blows out the candle with synthesized Web Audio sound effects.
- **Persistent Storage:** Server-backed JSON database in `server/data/db.json` with instant local fallback.

---

## 📁 Architecture Overview

```
CONSIStracker/
├── package.json                         # Starts server and client concurrently
├── run.bat                              # 1-click launcher for Windows
├── README.md                            # Documentation & guide
│
├── server/                              # Node.js + Express Backend
│   ├── server.js                        # Express REST API with JWT Auth & Data routes
│   ├── db.js                            # Multi-user file database & bcrypt helpers
│   └── data/
│       └── db.json                      # Persistent database for users and state
│
└── client/                              # React 19 + Tailwind CSS Frontend (Vite)
    ├── vite.config.js                   # Vite config with Tailwind v4 & /api proxy
    ├── index.html                       # Fonts (Inter, Fraunces, Instrument Sans)
    ├── src/
    │   ├── App.jsx                      # Coordinates Phase 1 -> 2 -> 3
    │   ├── index.css                    # Tailwind CSS, glassmorphism & keyframes
    │   ├── components/
    │   │   ├── Phase1Intro.jsx          # Sarcastic Duck, quotes, randomized accessories
    │   │   ├── Phase2Login.jsx          # Multi-user login gate, shake & success modal
    │   │   ├── Phase3Dashboard.jsx      # Study dashboard, 5-min pact & streak shield
    │   │   ├── DianoSvg.jsx             # SVG symbols for Diano mascot & characters
    │   │   ├── TimerOverlay.jsx         # Fullscreen timer, Brain Dump & Time Sanity Check
    │   │   ├── StairsOverlay.jsx        # Step climbing celebration & parked thoughts list
    │   │   ├── EveningRitualModal.jsx   # Diano candle blowout & rest quote
    │   │   ├── ManualEntryModal.jsx     # Log manual study hours with subject tags
    │   │   ├── ScrapbookModal.jsx       # Kept months & Scrapbook Duck quotes
    │   │   ├── DayGoalModal.jsx         # Custom day study goals and notes
    │   │   └── WelcomeModal.jsx         # First-time onboarding goal selector
    │   └── utils/
    │       ├── api.js                   # JWT API client with offline fallback
    │       └── audio.js                 # Web Audio API sound synthesizer
```
