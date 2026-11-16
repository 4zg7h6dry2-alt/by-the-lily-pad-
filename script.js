// The Kitsuné Nook – script.js
// Features get added one at a time, each in its own section below.

"use strict";

// ---- Storage helpers (used by every feature) ----
const Storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem("kitsune:" + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem("kitsune:" + key, JSON.stringify(value)); }
    catch { /* storage full or blocked */ }
  }
};

// ---- Step 2: Navigation + storage notice (coming next) ----
// ---- Step 3: Kitsu dialogue ----
// ---- Step 4: Pomodoro + Little Accomplishment Bar ----
