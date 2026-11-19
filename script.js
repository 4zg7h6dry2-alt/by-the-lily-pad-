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

// ---- Step 2: Storage note popup ----
(function initStorageNote() {
  const openBtn = document.getElementById("note-open");
  const modal   = document.getElementById("note-modal");
  const closers = [document.getElementById("note-x"), document.getElementById("note-ok")];

  // Heart gently pulses until the note has been read once
  if (!Storage.get("noteRead", false)) openBtn.classList.add("unread");

  function open() {
    modal.hidden = false;
    document.getElementById("note-ok").focus();
  }
  function close() {
    modal.hidden = true;
    openBtn.classList.remove("unread");
    Storage.set("noteRead", true);
    openBtn.focus();
  }

  openBtn.addEventListener("click", open);
  closers.forEach(b => b.addEventListener("click", close));
  modal.addEventListener("click", e => { if (e.target === modal) close(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !modal.hidden) close(); });
})();
// ---- Step 3: Kitsu dialogue ----
const KITSU_LINES = {
  greetings: [
    "Welcome, traveller! Your tea is ready. Shall we settle down for a little study session?",
    "Well, well. Look who wandered into the nook.",
    "Welcome back, little scholar.",
    "The tea is warm, and the desk is waiting.",
    "There you are! I was beginning to think you'd forgotten me.",
    "Make yourself comfortable. This is your little corner.",
    "A new day, a new page. How mysterious."
  ],
  // Time-of-day and weekday lines (starter set, edit freely)
  timeOfDay: {
    morning:   ["Good morning! The tea is fresh and so, I hope, is your mind.", "Early start? Admirable. Suspicious, but admirable."],
    afternoon: ["Afternoon already? The tea has opinions about that.", "A fine hour for a little study."],
    evening:   ["Evening, traveller. The lanterns are lit.", "The day is winding down. Shall we tie up a few loose ends?"],
    night:     ["Still awake? The moon and I approve. Just a little.", "Late hours call for strong tea and small goals."]
  },
  weekday: {
    1: ["Monday. We begin again, gently."],
    5: ["It's friyay! Study? Of course! ;) Just a bit."],
    0: ["Sunday. A slow day. Slow study counts too."],
    6: ["Saturday! Study if you like. I won't tell the weekend."]
  },
  start: [
    "Shall we get a little work done?",
    "Your books aren't going to read themselves, you know.",
    "One task at a time. Even foxes have limits.",
    "Ready when you are!",
    "Let's make this little session count.",
    "Focus now, daydream later. Or perhaps both."
  ],
  during: [
    "Steady paws. You're doing well.",
    "One page closer.",
    "I shall guard the tea while you work.",
    "Still here? Admirable dedication.",
    "Don't mind me. I'm supervising.",
    "A quiet mind makes room for clever things."
  ],
  complete: [
    "And that's another little victory!",
    "Well done! Even the smallest progress deserves a tail wag.",
    "Look at that. You actually did the thing.",
    "Another chapter conquered!",
    "Rest those paws. You've earned a moment.",
    "I'll mark that as a successful expedition."
  ],
  breakTime: [
    "Even foxes need to stretch their legs.",
    "Tea break? I thought you'd never ask.",
    "Step away from the books for a moment.",
    "Go on. The world won't collapse without you for five minutes.",
    "A rested mind is a rather clever thing.",
    "I've been saving the good tea."
  ],
  away: [
    "It's been a little quiet around here.",
    "Welcome back. Your place is still here.",
    "No need to rush. We can begin again.",
    "A little progress is still progress.",
    "The bookshelf has missed you.",
    "Today is another chance, not a punishment for yesterday."
  ],
  lastThought: [
    "What little thing did you accomplish today?",
    "Tell me where you left off. I'll keep your place.",
    "Let's leave a little note for your future self.",
    "A thought worth keeping, wouldn't you say?",
    "What were you working on before our little interruption?"
  ],
  bookshelf: [
    "This book is collecting a little dust...",
    "Shall we pay this subject a visit?",
    "Your old friend is waiting on the shelf.",
    "A little revision never hurt anyone.",
    "I believe we have some unfinished business here."
  ],
  remarks: [
    "I saw a butterfly outside. It looked terribly busy.",
    "Do you think foxes can learn calligraphy?",
    "I've misplaced my favourite leaf. Again.",
    "I wasn't sleeping. I was contemplating.",
    "The moon looks lovely tonight.",
    "I wonder what's beyond the torii gate.",
    "I've decided that matcha tastes better when nobody is watching.",
    "A secret? My ears are excellent listeners.",
    "I have absolutely not been eating the dango.",
    "You may proceed. I shall continue being handsome."
  ],
  // Short interface messages
  status: {
    timerReady: "Shall we begin?",
    timerPaused: "Taking five, are we?",
    timerComplete: "Session complete!",
    diarySaved: "Safely tucked away.",
    diaryNew: "A fresh page awaits.",
    moodSelected: "A feeling worth acknowledging.",
    progress: "One more little victory!",
    letterReceived: "A message from yesterday...",
    searchEmpty: "Nothing here, curious...",
    loading: "Fetching a little wisdom..."
  }
};

const Kitsu = (function () {
  const textEl = document.getElementById("kitsu-text");
  const nextBtn = document.getElementById("kitsu-next");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let typer = null;
  let lastLine = "";

  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  function timeSlot(hour) {
    if (hour >= 5 && hour < 12) return "morning";
    if (hour >= 12 && hour < 17) return "afternoon";
    if (hour >= 17 && hour < 21) return "evening";
    return "night";
  }

  // Pick a greeting that fits the visitor's local time and weekday
  function greetingLine() {
    const now = new Date();
    const dayLines = KITSU_LINES.weekday[now.getDay()];
    if (dayLines && Math.random() < 0.5) return pick(dayLines);
    if (Math.random() < 0.4) return pick(KITSU_LINES.timeOfDay[timeSlot(now.getHours())]);
    return pick(KITSU_LINES.greetings);
  }

  // Typewriter effect (instant if the visitor prefers reduced motion)
  function show(line) {
    clearInterval(typer);
    lastLine = line;
    if (reduceMotion) { textEl.textContent = line; return; }
    textEl.textContent = "";
    let i = 0;
    typer = setInterval(() => {
      textEl.textContent = line.slice(0, ++i);
      if (i >= line.length) clearInterval(typer);
    }, 24);
  }

  // Say a random line from a category (avoids repeating the last line)
  function say(category) {
    const pool = KITSU_LINES[category];
    let line = pick(pool);
    if (pool.length > 1) while (line === lastLine) line = pick(pool);
    show(line);
  }

  function sayStatus(key) { show(KITSU_LINES.status[key]); }

  // Opening greeting + click for a random remark
  show(greetingLine());
  nextBtn.addEventListener("click", () => say("remarks"));

  // "Online" tag next to his name: changes while you study
  const presenceEl = document.getElementById("kitsu-presence");
  const presenceText = document.getElementById("kitsu-presence-text");
  const PRESENCE = {
    online:   "online",
    studying: "studying with you",
    tea:      "on a tea break",
    paused:   "waiting for you",
    done:     "proud of you"
  };
  function presence(key) {
    const k = PRESENCE[key] ? key : "online";
    presenceText.textContent = PRESENCE[k];
    presenceEl.dataset.state = k;
  }

  return { say, sayStatus, show, presence };
})();

// ---- Step 4: Pomodoro + Little Accomplishment Bar ----

// Change these to adjust the timer (minutes)
const DURATIONS = { focus: 25, short: 5, long: 15 };
// The student can set their own focus length (saved between visits)
const savedFocus = Storage.get("focusMinutes", 25);
if (Number.isInteger(savedFocus) && savedFocus >= 1 && savedFocus <= 180) DURATIONS.focus = savedFocus;

// Local-date key like "2026-11-17" (uses the visitor's own timezone)
function todayKey() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + mm + "-" + dd;
}

// History: { "2026-11-17": 3, ... }  Old days are kept; a new day simply starts at 0.
const SessionLog = {
  all() { return Storage.get("sessionHistory", {}); },
  today() { return this.all()[todayKey()] || 0; },
  add() {
    const h = this.all();
    h[todayKey()] = (h[todayKey()] || 0) + 1;
    Storage.set("sessionHistory", h);
  }
};

// Study time per day (seconds). The fluid bar fills from this, so even a 1-minute session counts.
const STUDY_REFERENCE_MIN = 120;   // the bar looks "full" at this many minutes; it's only a scale, not a target
const StudyLog = {
  all() { return Storage.get("studySeconds", {}); },
  today() { return this.all()[todayKey()] || 0; },
  add(sec) {
    if (!(sec > 0)) return;
    const h = this.all();
    h[todayKey()] = (h[todayKey()] || 0) + Math.round(sec);
    Storage.set("studySeconds", h);
  }
};

const Timer = (function () {
  const displayEl = document.getElementById("timer-display");
  const startBtn  = document.getElementById("timer-start");
  const resetBtn  = document.getElementById("timer-reset");
  const modeBtns  = document.querySelectorAll(".mode-btn");
  const barEl     = document.getElementById("progress-bar");
  const countEl   = document.getElementById("progress-count");
  const focusInput = document.getElementById("focus-minutes");
  const skipBtn = document.getElementById("timer-skip");
  const MODE_LABEL = { focus: "Focus", short: "Short break", long: "Long break" };
  const fillEl = document.getElementById("progress-fill");
  const BASE_TITLE = document.title;

  const state = { mode: "focus", total: DURATIONS.focus * 60, remaining: DURATIONS.focus * 60,
                  running: false, endAt: 0, halfSaid: false, tick: null, barDay: todayKey() };

  const fmt = s => String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");

  function render() {
    displayEl.textContent = fmt(state.remaining);
    startBtn.textContent = state.running ? "Pause" : (state.remaining < state.total ? "Resume" : "Start");
    modeBtns.forEach(b => {
      b.textContent = MODE_LABEL[b.dataset.mode] + " (" + DURATIONS[b.dataset.mode] + " min)";
      b.setAttribute("aria-pressed", String(b.dataset.mode === state.mode));
      b.disabled = state.running;
    });
    focusInput.disabled = state.running || (state.mode === "focus" && state.remaining < state.total);
    document.title = state.running ? fmt(state.remaining) + " · " + BASE_TITLE : BASE_TITLE;
    Kitsu.presence(state.running ? (state.mode === "focus" ? "studying" : "tea")
                  : (state.mode === "focus" && state.remaining < state.total ? "paused" : "online"));
  }

  // Little Accomplishment Bar: one pixel segment per completed focus session today
  function renderBar() {
    const sessions = SessionLog.today(), secs = StudyLog.today();
    state.barDay = todayKey();
    const pct = Math.min(100, secs / (STUDY_REFERENCE_MIN * 60) * 100);
    fillEl.style.width = pct + "%";
    fillEl.style.minWidth = pct > 0 ? "10px" : "0";
    barEl.setAttribute("aria-valuenow", String(Math.round(pct)));
    const mins = Math.floor(secs / 60);
    const studied = secs === 0 ? "" : mins === 0 ? "under a minute" : mins >= 60 ? Math.floor(mins / 60) + " h " + (mins % 60) + " min" : mins + " min";
    const parts = [];
    if (studied) parts.push(studied + " studied today");
    if (sessions) parts.push(sessions + (sessions === 1 ? " session" : " sessions"));
    countEl.textContent = parts.length ? parts.join(" \u00B7 ") : "No sessions yet. No rush.";
    barEl.setAttribute("aria-label", countEl.textContent);
  }

  // Study time counts when a session ends (finished, reset or skipped), even if it was short
  function bankElapsed() {
    if (state.mode === "focus" && state.remaining < state.total) {
      StudyLog.add(state.total - state.remaining);
      renderBar();
    }
  }

  function setMode(mode) {
    state.mode = mode;
    state.total = state.remaining = DURATIONS[mode] * 60;
    state.halfSaid = false;
    render();
  }

  function startTicking() {
    state.endAt = Date.now() + state.remaining * 1000;
    state.running = true;
    state.tick = setInterval(onTick, 250);
    render();
  }
  function stopTicking() {
    clearInterval(state.tick);
    state.running = false;
  }

  function onTick() {
    state.remaining = Math.max(0, Math.ceil((state.endAt - Date.now()) / 1000));
    if (state.mode === "focus" && !state.halfSaid && state.remaining <= state.total / 2) {
      state.halfSaid = true;
      Kitsu.say("during");
    }
    if (state.remaining <= 0) { complete(); return; }
    render();
  }

  function complete() {
    stopTicking();
    if (state.mode === "focus") {
      SessionLog.add();
      StudyLog.add(state.total);
      renderBar();
      Kitsu.say("complete");
      document.dispatchEvent(new CustomEvent("kitsune:sessionComplete")); // Step 5 listens here
      setMode(SessionLog.today() % 4 === 0 ? "long" : "short");
      Kitsu.presence("done");
    } else {
      Kitsu.say("start");
      setMode("focus");
    }
  }

  function toggle() {
    if (state.running) {
      state.remaining = Math.max(0, Math.ceil((state.endAt - Date.now()) / 1000));
      stopTicking();
      Kitsu.sayStatus("timerPaused");
      if (state.mode === "focus") document.dispatchEvent(new CustomEvent("kitsune:sessionInterrupted")); // Step 5
      render();
    } else {
      const fresh = state.remaining === state.total;
      startTicking();
      if (fresh) {
        if (state.mode === "focus") {
          const recall = LastThought.recallLine();           // Step 5
          if (recall) Kitsu.show(recall); else Kitsu.say("start");
        } else {
          Kitsu.say("breakTime");
        }
      }
      document.dispatchEvent(new CustomEvent("kitsune:sessionStart"));
    }
  }

  function reset() {
    const wasStarted = state.remaining < state.total;
    stopTicking();
    bankElapsed();
    if (state.mode === "focus" && wasStarted) document.dispatchEvent(new CustomEvent("kitsune:sessionInterrupted")); // Step 5
    setMode(state.mode);
  }

  // Custom focus length (1 to 180 minutes)
  focusInput.value = DURATIONS.focus;
  focusInput.addEventListener("change", () => {
    let v = Math.round(Number(focusInput.value));
    if (!Number.isFinite(v) || v < 1) v = DURATIONS.focus;
    v = Math.min(v, 180);
    focusInput.value = v;
    DURATIONS.focus = v;
    Storage.set("focusMinutes", v);
    if (state.mode === "focus" && !state.running && state.remaining === state.total) setMode("focus");
  });

  // Skip: jump to the next phase (a skipped focus session is not counted)
  function skip() {
    const wasStarted = state.remaining < state.total;
    stopTicking();
    bankElapsed();
    if (state.mode === "focus") {
      if (wasStarted) document.dispatchEvent(new CustomEvent("kitsune:sessionInterrupted"));
      setMode(SessionLog.today() > 0 && SessionLog.today() % 4 === 0 ? "long" : "short");
    } else {
      setMode("focus");
    }
  }
  skipBtn.addEventListener("click", skip);

  startBtn.addEventListener("click", toggle);
  resetBtn.addEventListener("click", reset);
  modeBtns.forEach(b => b.addEventListener("click", () => { if (!state.running) { bankElapsed(); setMode(b.dataset.mode); } }));

  // New day while the page stays open: bar starts fresh, history is kept
  setInterval(() => { if (todayKey() !== state.barDay) renderBar(); }, 60000);

  render();
  renderBar();
  return { state };
})();


// ---- Step 5: The Last Thought ----
// Notes: [{ text, type: "complete" | "interrupted", at: ISO date }]
const LastThought = (function () {
  const card     = document.getElementById("last-thought");
  const recallEl = document.getElementById("thought-recall");
  const form     = document.getElementById("thought-form");
  const label    = document.getElementById("thought-label");
  const input    = document.getElementById("thought-input");
  const skipBtn  = document.getElementById("thought-skip");

  let pendingType = null;     // "complete" | "interrupted" while the box is open
  let promptedThisRun = false; // stops a second prompt for the same session (pause, then reset)

  const all = () => Storage.get("lastThoughts", []);
  const latest = () => { const n = all(); return n.length ? n[n.length - 1] : null; };

  function dateLabel(iso) {
    return new Date(iso).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
  }

  // The line Kitsu says when the next focus session begins
  function recallLine() {
    const n = latest();
    if (!n) return null;
    const end = /[.!?]$/.test(n.text) ? "" : ".";
    return n.type === "interrupted"
      ? "Previously, you were working on: " + n.text + end + " Ready to continue?"
      : "Last time, you accomplished: " + n.text + end + " Ready to continue?";
  }

  // Small strip showing the most recent note
  function renderRecall() {
    const n = latest();
    if (n) {
      recallEl.textContent = (n.type === "interrupted" ? "Where you left off" : "Last progress") +
                             " (" + dateLabel(n.at) + "): " + n.text;
    }
    recallEl.hidden = !n;
    card.hidden = !n && form.hidden;
  }

  function openForm(type) {
    pendingType = type;
    promptedThisRun = true;
    if (type === "complete") {
      Kitsu.show("Well done, little fox! What did you accomplish during this session?");
      label.textContent = "What did you accomplish?";
      input.placeholder = "I managed to...";
    } else {
      Kitsu.show("Taking a little break? Where did you leave off? Let's make it easier to pick up where you stopped.");
      label.textContent = "Where did you leave off?";
      input.placeholder = "I was working on...";
    }
    form.hidden = false;
    card.hidden = false;
    input.value = "";
    input.focus();
  }

  function closeForm() {
    form.hidden = true;
    pendingType = null;
    renderRecall();
  }

  form.addEventListener("submit", e => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) { input.focus(); return; }
    const notes = all();
    notes.push({ text, type: pendingType, at: new Date().toISOString() });
    Storage.set("lastThoughts", notes.slice(-50));
    closeForm();
    Kitsu.sayStatus("diarySaved");
  });
  skipBtn.addEventListener("click", closeForm);

  document.addEventListener("kitsune:sessionComplete", () => openForm("complete"));
  document.addEventListener("kitsune:sessionInterrupted", () => { if (!promptedThisRun) openForm("interrupted"); });
  document.addEventListener("kitsune:sessionStart", () => {
    promptedThisRun = false;
    if (!form.hidden) closeForm();   // resumed without saving: tuck the box away
  });

  renderRecall();
  return { recallLine, latest };
})();

// ---- Step 6: Diary window ----
// Entries: [{ id, date: "YYYY-MM-DD", title, text, createdAt, updatedAt }]
const Diary = (function () {
  const $ = id => document.getElementById(id);
  const win = $("diary"), closedBar = $("diary-closed");
  const titleBtn = $("diary-title"), titleInput = $("diary-title-input");
  const titleEl = $("diary-entry-title"), textEl = $("diary-text");
  const listEl = $("diary-list"), dateEl = $("diary-entry-date"), statusEl = $("diary-status");
  const saveBtn = $("diary-save"), deleteBtn = $("diary-delete"), confirmBox = $("diary-confirm");
  const calGrid = $("cal-grid"), calTitle = $("cal-title"), clearFilterBtn = $("diary-clear-filter");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let entries = Storage.get("diaryEntries", []);
  let current = blank();
  let dirty = false;
  let filter = "";

  function blank() { return { id: null, date: todayKey(), title: "", text: "" }; }
  function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function persist() { Storage.set("diaryEntries", entries); }

  function fmtDate(key) {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  }
  function fmtTime(iso) {
    return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }
  function setStatus(msg) { statusEl.textContent = msg; }

  function renderMeta() {
    dateEl.max = todayKey();
    dateEl.value = current.date;
  }

  // Month calendar: dots mark days with entries, tap a day to see its entries
  const calNow = new Date();
  let viewY = calNow.getFullYear(), viewM = calNow.getMonth();
  function renderCalendar() {
    calTitle.textContent = new Date(viewY, viewM, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
    const first = new Date(viewY, viewM, 1).getDay();
    const days = new Date(viewY, viewM + 1, 0).getDate();
    const withEntries = new Set(entries.map(e => e.date));
    const cells = [];
    ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].forEach(w => {
      const h = document.createElement("span");
      h.className = "cal-dow";
      h.textContent = w;
      cells.push(h);
    });
    for (let i = 0; i < first; i++) cells.push(document.createElement("span"));
    for (let d = 1; d <= days; d++) {
      const key = viewY + "-" + String(viewM + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
      const b = document.createElement("button");
      b.type = "button";
      b.className = "cal-day" + (withEntries.has(key) ? " has-entry" : "") + (key === todayKey() ? " is-today" : "") + (key === filter ? " is-selected" : "");
      b.textContent = d;
      b.setAttribute("aria-label", fmtDate(key) + (withEntries.has(key) ? ", has entries" : ""));
      b.setAttribute("aria-pressed", String(key === filter));
      b.addEventListener("click", () => { filter = key === filter ? "" : key; clearFilterBtn.hidden = !filter; renderList(); });
      cells.push(b);
    }
    calGrid.replaceChildren(...cells);
  }

  function renderList() {
    renderCalendar();
    listEl.replaceChildren();
    const shown = entries
      .filter(e => !filter || e.date === filter)
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    if (!shown.length) {
      const li = document.createElement("li");
      li.className = "diary-empty";
      li.textContent = filter ? "No entries on that date." : "No entries yet. A fresh page awaits.";
      listEl.appendChild(li);
      return;
    }
    shown.forEach(e => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "diary-item";
      if (e.id === current.id) btn.setAttribute("aria-current", "true");
      const d = document.createElement("span");
      d.className = "diary-item-date";
      d.textContent = fmtDate(e.date);
      const t = document.createElement("span");
      t.className = "diary-item-title";
      t.textContent = e.title || e.text.slice(0, 32) || "Untitled";
      btn.append(d, t);
      btn.addEventListener("click", () => switchTo(e));
      li.appendChild(btn);
      listEl.appendChild(li);
    });
  }

  function load(entry) {
    current = entry ? { ...entry } : blank();
    titleEl.value = current.title;
    textEl.value = current.text;
    dirty = false;
    confirmBox.hidden = true;
    deleteBtn.disabled = !current.id;
    setStatus("");
    renderMeta();
    renderList();
  }

  function hasContent() { return titleEl.value.trim() || textEl.value.trim(); }

  function save(quiet) {
    if (!hasContent()) { if (!quiet) setStatus("Write a little something first."); return false; }
    const now = new Date().toISOString();
    const fields = { title: titleEl.value.trim(), text: textEl.value.replace(/\s+$/, ""), date: (dateEl.value && dateEl.value <= todayKey()) ? dateEl.value : current.date };
    if (current.id) {
      const i = entries.findIndex(e => e.id === current.id);
      entries[i] = { ...entries[i], ...fields, updatedAt: now };
      current = { ...entries[i] };
    } else {
      current = { ...current, ...fields, id: newId(), createdAt: now, updatedAt: now };
      entries.push({ ...current });
    }
    persist();
    dirty = false;
    deleteBtn.disabled = false;
    renderMeta();
    renderList();
    if (!quiet) { setStatus("Saved"); Kitsu.sayStatus("diarySaved"); }
    return true;
  }

  function switchTo(entry) {
    if (dirty) save(true);       // never lose unsaved writing
    load(entry);
  }

  function markDirty() {
    dirty = true;
    confirmBox.hidden = true;
    setStatus("Unsaved changes");
  }

  // ---- Delete with confirmation ----
  deleteBtn.addEventListener("click", () => { if (current.id) confirmBox.hidden = false; });
  $("diary-confirm-no").addEventListener("click", () => { confirmBox.hidden = true; });
  $("diary-confirm-yes").addEventListener("click", () => {
    entries = entries.filter(e => e.id !== current.id);
    persist();
    load(null);
    setStatus("Entry deleted");
  });

  // ---- Entries, filter, save ----
  $("diary-new").addEventListener("click", () => { switchTo(null); textEl.focus(); Kitsu.sayStatus("diaryNew"); });
  saveBtn.addEventListener("click", () => save(false));
  titleEl.addEventListener("input", markDirty);
  dateEl.addEventListener("change", () => {            // pick a different day for this entry
    if (dateEl.value && dateEl.value <= todayKey()) { current.date = dateEl.value; markDirty(); }
    else renderMeta();
  });
  textEl.addEventListener("input", markDirty);
  clearFilterBtn.addEventListener("click", () => { filter = ""; clearFilterBtn.hidden = true; renderList(); });
  $("cal-prev").addEventListener("click", () => { viewM--; if (viewM < 0) { viewM = 11; viewY--; } renderCalendar(); });
  $("cal-next").addEventListener("click", () => { viewM++; if (viewM > 11) { viewM = 0; viewY++; } renderCalendar(); });
  window.addEventListener("pagehide", () => { if (dirty) save(true); });
  document.addEventListener("visibilitychange", () => { if (document.hidden && dirty) save(true); });

  // ---- Renameable window title ----
  function showTitle() { titleBtn.textContent = Storage.get("diaryTitle", "My Diary"); }
  titleBtn.addEventListener("click", () => {
    titleInput.value = titleBtn.textContent;
    titleBtn.hidden = true;
    titleInput.hidden = false;
    titleInput.focus();
    titleInput.select();
  });
  function endRename(keep) {
    if (keep && titleInput.value.trim()) Storage.set("diaryTitle", titleInput.value.trim());
    titleInput.hidden = true;
    titleBtn.hidden = false;
    showTitle();
    titleBtn.focus();
  }
  titleInput.addEventListener("keydown", e => {
    if (e.key === "Enter") endRename(true);
    if (e.key === "Escape") { e.stopPropagation(); endRename(false); }
  });
  titleInput.addEventListener("blur", () => { if (!titleInput.hidden) endRename(true); });

  // ---- Window controls ----
  const minBtn = $("win-min"), maxBtn = $("win-max");
  function setMin(on) {
    win.classList.toggle("is-min", on);
    minBtn.setAttribute("aria-label", on ? "Restore diary" : "Minimise diary");
    if (on) setMax(false);
  }
  function setMax(on) {
    win.classList.toggle("is-max", on);
    maxBtn.setAttribute("aria-label", on ? "Restore diary size" : "Maximise diary");
    if (on) win.classList.remove("is-min");
  }
  function closeWin() {
    if (dirty) save(true);
    setMax(false);
    win.hidden = true;
    closedBar.hidden = false;
  }
  function openWin() {
    win.hidden = false;
    closedBar.hidden = true;
    win.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }
  minBtn.addEventListener("click", () => setMin(!win.classList.contains("is-min")));
  maxBtn.addEventListener("click", () => setMax(!win.classList.contains("is-max")));
  $("win-close").addEventListener("click", closeWin);
  $("diary-reopen").addEventListener("click", openWin);
  document.addEventListener("keydown", e => {
    const noteOpen = !document.getElementById("note-modal").hidden;
    if (e.key === "Escape" && win.classList.contains("is-max") && !noteOpen) setMax(false);
  });

  // The "Diary" nav link opens the window if it was closed (or minimised)
  document.querySelectorAll('a[href="#diary"]').forEach(a => a.addEventListener("click", e => {
    e.preventDefault();
    setMin(false);
    openWin();
  }));

  showTitle();
  load(null);
  return { open: openWin };
})();

// ---- Step 7: Sidebar (mood, clock, quote) ----

// Mood board faces: mood-board.png (1536 x 1024), saved in the same folder as index.html.
// One mask per family. Each window is a 490 x 490 square: [x, y] of its top-left corner.
const MASK_SHEET = {
  w: 1536, h: 1024, cell: 490,
  win: { tender: [20, 16], calm: [528, 16], bright: [1046, 16], thinking: [22, 520], heavy: [531, 520], intense: [1039, 520] }
};
const MOODS = [
  { id: "melancholic",   name: "Melancholic",   text: "A soft, quiet sadness with a little beauty in it." },
  { id: "nostalgic",     name: "Nostalgic",     text: "Warm longing for a time or place that has passed." },
  { id: "whimsical",     name: "Whimsical",     text: "Playful and dreamy, in the mood for small delights." },
  { id: "contemplative", name: "Contemplative", text: "Turning big thoughts over slowly and calmly." },
  { id: "restless",      name: "Restless",      text: "Unsettled and itching for something to change." },
  { id: "serene",        name: "Serene",        text: "Peaceful and clear, like still water." },
  { id: "sentimental",   name: "Sentimental",   text: "Tender-hearted, holding memories close." },
  { id: "bewildered",    name: "Bewildered",    text: "Puzzled and a little lost for words." },
  { id: "hopeful",       name: "Hopeful",       text: "Quietly expecting something good ahead." },
  { id: "enamoured",     name: "Enamoured",     text: "Charmed and completely taken with something." },
  { id: "disenchanted",  name: "Disenchanted",  text: "The sparkle has faded, and you're unimpressed." },
  { id: "pensive",       name: "Pensive",       text: "Lost in thought, thinking something through." },
  { id: "tranquil",      name: "Tranquil",      text: "Calm all the way through, with nothing pressing." },
  { id: "overstimulated",name: "Overstimulated",text: "Too much at once, and your mind needs space." },
  { id: "yearning",      name: "Yearning",      text: "A gentle ache for something just out of reach." },
  { id: "content",       name: "Content",       text: "Quietly satisfied. Nothing more is needed right now." },
  { id: "curious",       name: "Curious",       text: "Eager to poke at something and find out more." },
  { id: "uninspired",    name: "Uninspired",    text: "Ideas are hiding and motivation is on a tea break." }
];

// Mood families: each shares one kimono-fox sprite (fox-moods.png) and one colour.
// The small family masks (mood-board.png) are used on the mood board.
const FAMILIES = [
  { id: "tender",   name: "Tender & Wistful", moods: ["nostalgic", "sentimental", "yearning"] },
  { id: "calm",     name: "Calm & Still",     moods: ["serene", "tranquil", "content"] },
  { id: "bright",   name: "Bright & Playful", moods: ["whimsical", "hopeful", "curious"] },
  { id: "thinking", name: "Thinking",         moods: ["contemplative", "pensive", "bewildered"] },
  { id: "heavy",    name: "Heavy & Low",      moods: ["melancholic", "disenchanted", "uninspired"] },
  { id: "intense",  name: "Intense",          moods: ["restless", "overstimulated", "enamoured"] }
];
// Where each fox sits in fox-moods.png (1536 x 1024): [x, y, width, height]
const FOX_SHEET = {
  w: 1536, h: 1024,
  win: { tender: [18, 3, 498, 505], calm: [537, 4, 501, 504], bright: [1054, 1, 475, 504],
         thinking: [18, 512, 498, 495], heavy: [537, 518, 501, 489], intense: [1054, 513, 475, 493] }
};

// Mood log: { "2026-11-17": [{ mood: "serene", at: ISO }, ...] }  (last entry of the day = that day's mood)
const Mood = (function () {
  const $ = id => document.getElementById(id);
  const card = $("mood"), foxEl = $("mood-fox-img"), foxBtn = $("mood-fox"), famEl = $("mood-family");
  const nameEl = $("mood-name"), textEl = $("mood-text"), countEl = $("mood-count");
  const saveBtn = $("mood-save"), savedEl = $("mood-saved"), grid = $("mood-board-grid");
  const byId = Object.fromEntries(MOODS.map(m => [m.id, m]));
  const CYCLE = FAMILIES.flatMap(f => f.moods.map(id => ({ id, family: f })));

  // The family's kimono fox, cut from fox-moods.png (the art is never recoloured)
  function paintFox(el, familyId) {
    const [x, y, w, h] = FOX_SHEET.win[familyId];
    el.style.aspectRatio = w + " / " + h;
    el.style.backgroundSize = (FOX_SHEET.w / w * 100) + "% auto";
    el.style.backgroundPosition = (x / (FOX_SHEET.w - w) * 100) + "% " + (y / (FOX_SHEET.h - h) * 100) + "%";
  }
  // A small family mask from mood-board.png, used on the mood board
  function paintMask(el, familyId) {
    const [x0, y0] = MASK_SHEET.win[familyId], c = MASK_SHEET.cell;
    el.style.backgroundImage = 'url("mood-board.png")';
    el.style.backgroundSize = (MASK_SHEET.w / c * 100) + "% " + (MASK_SHEET.h / c * 100) + "%";
    el.style.backgroundPosition = (x0 / (MASK_SHEET.w - c) * 100) + "% " + (y0 / (MASK_SHEET.h - c) * 100) + "%";
  }

  const getLog = () => Storage.get("moodLog", {});
  function keyFor(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function savedOn(key) {
    const day = getLog()[key] || [];
    return day.length ? day[day.length - 1].mood : null;
  }
  const savedToday = () => savedOn(todayKey());

  let idx = Math.max(0, CYCLE.findIndex(c => c.id === savedToday()));

  function render() {
    const c = CYCLE[idx], m = byId[c.id], saved = savedToday();
    paintFox(foxEl, c.family.id);
    card.dataset.family = c.family.id;
    famEl.textContent = c.family.name;
    nameEl.textContent = m.name;
    textEl.textContent = m.text;
    countEl.textContent = (idx + 1) + " / " + CYCLE.length;
    foxBtn.setAttribute("aria-label", "Next mood (now " + m.name + ")");
    saveBtn.disabled = saved === c.id;
    saveBtn.textContent = saved === c.id ? "Saved" : "Save mood";
    savedEl.textContent = saved
      ? "Today: " + byId[saved].name + " \u2665" + (saved !== c.id ? " (save to update)" : "")
      : "Tap the fox until one fits, then save it.";
  }

  // Mood board: the last 8 days, one small mask face per saved day
  function renderBoard() {
    const now = new Date();
    const cells = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const id = savedOn(keyFor(d));
      const li = document.createElement("li");
      li.className = "board-cell" + (i === 0 ? " today" : "");
      const icon = document.createElement("span");
      icon.className = "board-icon" + (id ? "" : " empty");
      const label = i === 0 ? "Today" : d.toLocaleDateString(undefined, { weekday: "short" });
      if (id) { paintMask(icon, CYCLE.find(c => c.id === id).family.id); li.title = label + ": " + byId[id].name; }
      const day = document.createElement("span");
      day.className = "board-day";
      day.textContent = label;
      li.append(icon, day);
      cells.push(li);
    }
    grid.replaceChildren(...cells);
    grid.scrollLeft = grid.scrollWidth;   // show today at the end of the row
  }

  function step(dir) {
    idx = (idx + dir + CYCLE.length) % CYCLE.length;
    render();
    foxEl.classList.remove("pop");
    void foxEl.offsetWidth;
    foxEl.classList.add("pop");
  }

  function save() {
    const log = getLog();
    (log[todayKey()] = log[todayKey()] || []).push({ mood: CYCLE[idx].id, at: new Date().toISOString() });
    Storage.set("moodLog", log);
    render();
    renderBoard();
    Kitsu.sayStatus("moodSelected");
  }

  foxBtn.addEventListener("click", () => step(1));
  $("mood-next").addEventListener("click", () => step(1));
  $("mood-prev").addEventListener("click", () => step(-1));
  saveBtn.addEventListener("click", save);
  // New day (or coming back to the tab): today's mood starts unsaved again
  document.addEventListener("visibilitychange", () => { if (!document.hidden) { render(); renderBoard(); } });

  render();
  renderBoard();
  return { currentId: savedToday };
})();

// Digital clock: always the visitor's own timezone (never hardcoded)
(function initClock() {
  const timeEl = document.getElementById("clock-time");
  const dateEl = document.getElementById("clock-date");
  const zoneEl = document.getElementById("clock-zone");
  zoneEl.textContent = (Intl.DateTimeFormat().resolvedOptions().timeZone || "").replace(/_/g, " ");
  function tick() {
    const now = new Date();
    timeEl.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    dateEl.textContent = now.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }
  tick();
  setInterval(tick, 1000);
})();

// Message from Kitsu: tap the bubble for an affirmation, "Another one" to rotate, X to remove it for today
const AFFIRMATIONS = [
  "You showed up. That is already half the work.",
  "Small steps still leave footprints.",
  "Even foxes nap between adventures. Rest counts.",
  "You are allowed to learn slowly. I'll keep the tea warm.",
  "Today's little effort will thank you tomorrow.",
  "Not every day needs to be your best. Some just need you.",
  "Confusion is only understanding on its way.",
  "I believe in you. I'm also terribly good at belief.",
  "One page. One thought. One breath. Begin there.",
  "Your pace is a perfectly good pace.",
  "What you revisit, you remember. Visit often.",
  "Proud of you? Obviously. Carry on."
];
(function initKitsuMessage() {
  const card = document.getElementById("kmsg"), bubble = document.getElementById("kmsg-bubble");
  const nextBtn = document.getElementById("kmsg-next");
  const now = new Date();
  let i = Math.floor(new Date(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000) % AFFIRMATIONS.length;
  let opened = false;

  const hiddenToday = () => Storage.get("kmsgHidden", "") === todayKey();
  function render() {
    card.hidden = hiddenToday();
    nextBtn.hidden = !opened;
    bubble.textContent = opened ? AFFIRMATIONS[i] : "A message from Kitsu";
    bubble.classList.toggle("is-open", opened);
  }
  function next() { i = (i + 1) % AFFIRMATIONS.length; render(); }

  bubble.addEventListener("click", () => { if (opened) next(); else { opened = true; render(); } });
  nextBtn.addEventListener("click", next);
  document.getElementById("kmsg-restore").addEventListener("click", () => {
    Storage.set("kmsgHidden", "");
    opened = false;
    render();
    card.scrollIntoView({ behavior: "smooth", block: "center" });
  });
  document.getElementById("kmsg-x").addEventListener("click", () => { Storage.set("kmsgHidden", todayKey()); render(); });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) render(); });   // returns the next day
  render();
})();

// ---- Step 8: A Letter to Tomorrow ----
// Letters: [{ id, writtenOn: "YYYY-MM-DD", text, createdAt, openedAt: ISO | null }]
const Letters = (function () {
  const $ = id => document.getElementById(id);
  const banner = $("letter-banner"), bannerText = $("letter-banner-text");
  const readBox = $("letter-read"), readDate = $("letter-read-date"), readText = $("letter-read-text");
  const form = $("letter-form"), input = $("letter-input"), sealBtn = $("letter-seal"), statusEl = $("letter-status");
  const historyBox = $("letter-history"), historyList = $("letter-history-list");

  let dirty = false;

  const all = () => Storage.get("letters", []);
  const save = list => Storage.set("letters", list);
  const todays = () => all().find(l => l.writtenOn === todayKey());

  // Letters from earlier days that haven't been opened yet
  const pending = () => all()
    .filter(l => l.writtenOn < todayKey() && !l.openedAt)
    .sort((a, b) => a.writtenOn.localeCompare(b.writtenOn));

  function fmtDate(key) {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }

  function renderBanner() {
    const n = pending().length;
    banner.hidden = n === 0;
    bannerText.textContent = "Hello, future fox! You have a message from past you." + (n > 1 ? " (" + n + " waiting)" : "");
  }

  function renderHistory() {
    const opened = all().filter(l => l.openedAt && l.writtenOn < todayKey())
      .sort((a, b) => b.writtenOn.localeCompare(a.writtenOn));
    historyBox.hidden = opened.length === 0;
    historyList.replaceChildren();
    opened.forEach(l => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "diary-item";
      const d = document.createElement("span");
      d.className = "diary-item-date";
      d.textContent = fmtDate(l.writtenOn);
      const t = document.createElement("span");
      t.className = "diary-item-title";
      t.textContent = l.text.slice(0, 40);
      btn.append(d, t);
      btn.addEventListener("click", () => showLetter(l));
      li.appendChild(btn);
      historyList.appendChild(li);
    });
  }

  function showLetter(l) {
    readDate.textContent = "From you, on " + fmtDate(l.writtenOn);
    readText.textContent = l.text;
    readBox.hidden = false;
  }

  // Open the oldest waiting letter and keep it in history
  function openNext() {
    const next = pending()[0];
    if (!next) return;
    const list = all();
    list.find(l => l.id === next.id).openedAt = new Date().toISOString();
    save(list);
    showLetter(next);
    renderBanner();
    renderHistory();
  }

  function sealToday(quiet) {
    const text = input.value.trim();
    if (!text) { if (!quiet) statusEl.textContent = "Write a few words first."; return false; }
    const list = all();
    const existing = list.find(l => l.writtenOn === todayKey());
    if (existing) existing.text = text;
    else list.push({ id: Date.now().toString(36), writtenOn: todayKey(), text, createdAt: new Date().toISOString(), openedAt: null });
    save(list);
    dirty = false;
    sealBtn.textContent = "Update letter";
    if (!quiet) {
      statusEl.textContent = "Sealed. It will be waiting for you tomorrow.";
      Kitsu.show("Sealed and tucked away. I'll deliver it tomorrow.");
    }
    return true;
  }

  form.addEventListener("submit", e => { e.preventDefault(); sealToday(false); });
  input.addEventListener("input", () => { dirty = true; statusEl.textContent = "Not sealed yet"; });
  $("letter-open").addEventListener("click", openNext);
  $("letter-read-close").addEventListener("click", () => { readBox.hidden = true; });
  window.addEventListener("pagehide", () => { if (dirty) sealToday(true); });
  document.addEventListener("visibilitychange", () => { if (document.hidden && dirty) sealToday(true); });

  // Today's letter (if already written) is shown so it can be edited until the day ends
  const t = todays();
  if (t) { input.value = t.text; sealBtn.textContent = "Update letter"; }

  renderBanner();
  renderHistory();
  if (pending().length) Kitsu.sayStatus("letterReceived");

  // A new day arrives while the page stays open
  let lastDay = todayKey();
  setInterval(() => {
    if (todayKey() !== lastDay) {
      lastDay = todayKey();
      input.value = ""; sealBtn.textContent = "Seal letter"; statusEl.textContent = "";
      renderBanner(); renderHistory();
      if (pending().length) Kitsu.sayStatus("letterReceived");
    }
  }, 60000);

  return { pending };
})();

// ---- Step 9: The Forgotten Bookshelf ----
// Books: [{ id, name, addedOn: "YYYY-MM-DD", lastVisited: "YYYY-MM-DD" }]
// Dust depends on real days since lastVisited (not on how often the page is opened).
const DUST_DAYS = { little: 3, quite: 7, forgotten: 14 };   // change these to tune the dust
const DUST_LABELS = ["Nice and tidy", "A little dust", "Quite dusty", "Forgotten"];

const Shelf = (function () {
  const $ = id => document.getElementById(id);
  const grid = $("shelf-grid"), emptyMsg = $("shelf-empty"), form = $("shelf-form"), input = $("shelf-input");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const all = () => Storage.get("bookshelf", []);
  const save = list => Storage.set("bookshelf", list);

  function daysSince(key) {
    const [y, m, d] = key.split("-").map(Number);
    const now = new Date();
    const then = new Date(y, m - 1, d);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.max(0, Math.round((today - then) / 86400000));
  }
  function levelFor(days) {
    if (days >= DUST_DAYS.forgotten) return 3;
    if (days >= DUST_DAYS.quite) return 2;
    if (days >= DUST_DAYS.little) return 1;
    return 0;
  }
  const dayWord = n => n === 0 ? "today" : n === 1 ? "1 day" : n + " days";

  $("shelf-legend").textContent =
    DUST_LABELS[1] + ": " + DUST_DAYS.little + "+ days | " +
    DUST_LABELS[2] + ": " + DUST_DAYS.quite + "+ | " +
    DUST_LABELS[3] + ": " + DUST_DAYS.forgotten + "+";

  function render() {
    const list = all()
      .map((b, i) => ({ b, i, days: daysSince(b.lastVisited) }))
      .sort((x, y) => y.days - x.days || x.i - y.i);      // dustiest books first
    emptyMsg.hidden = list.length > 0;
    grid.replaceChildren();
    list.forEach(({ b, i, days }) => {
      const level = levelFor(days);
      const li = document.createElement("li");
      li.className = "shelf-item dust-" + level;

      const book = document.createElement("div");
      book.className = "book book--c" + (i % 4);
      const title = document.createElement("span");
      title.className = "book-title";
      title.textContent = b.name;
      const dust = document.createElement("span");
      dust.className = "book-dust";
      dust.setAttribute("aria-hidden", "true");
      book.append(title, dust);

      const meta = document.createElement("p");
      meta.className = "book-meta";
      const lv = document.createElement("span");
      lv.className = "book-level";
      lv.textContent = DUST_LABELS[level];
      const dd = document.createElement("span");
      dd.className = "book-days";
      dd.textContent = dayWord(days);
      meta.append(lv, dd);

      const actions = document.createElement("div");
      actions.className = "book-actions";
      const dustBtn = document.createElement("button");
      dustBtn.type = "button";
      dustBtn.className = "btn btn-small";
      dustBtn.textContent = "Dust off";
      dustBtn.addEventListener("click", () => dustOff(b.id, book, dustBtn, days));

      const rmBtn = document.createElement("button");
      rmBtn.type = "button";
      rmBtn.className = "btn btn-quiet btn-small";
      rmBtn.textContent = "Delete";
      let armed = null;
      rmBtn.addEventListener("click", () => {            // two taps to remove, so no accidents
        if (armed) { clearTimeout(armed); remove(b.id); return; }
        rmBtn.textContent = "Sure?";
        armed = setTimeout(() => { armed = null; rmBtn.textContent = "Delete"; }, 3000);
      });

      actions.append(dustBtn, rmBtn);
      li.append(book, meta, actions);
      grid.appendChild(li);
    });
  }

  function dustOff(id, bookEl, btn, days) {
    if (days === 0) { Kitsu.show("Already spotless! Come back when it gathers a little dust."); return; }
    btn.disabled = true;
    bookEl.classList.add("dusting");
    const finish = () => {
      const list = all();
      const b = list.find(x => x.id === id);
      if (b) { b.lastVisited = todayKey(); save(list); }
      render();
      Kitsu.show("Spotless! A little revision never hurt anyone.");
    };
    reduceMotion ? finish() : setTimeout(finish, 650);
  }

  function remove(id) {
    save(all().filter(b => b.id !== id));
    render();
  }

  form.addEventListener("submit", e => {
    e.preventDefault();
    const name = input.value.trim();
    if (!name) { input.focus(); return; }
    const list = all();
    list.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), name, addedOn: todayKey(), lastVisited: todayKey() });
    save(list);
    input.value = "";
    render();
    Kitsu.show("A new book on the shelf. How exciting.");
  });

  // Dust keeps growing in real time: refresh when you come back to the tab and every hour
  document.addEventListener("visibilitychange", () => { if (!document.hidden) render(); });
  setInterval(render, 3600000);

  render();
  return { render };
})();

// ---- Step 10: Shrine of Sources (searchable list of genuine research sites) ----
// access: "Free" = free to use. "Free with limits" = free to start, but some content/features may be restricted.
const SHRINE_SOURCES = [
  { cat: "Papers & journals", name: "Google Scholar", url: "https://scholar.google.com", access: "Free with limits",
    text: "Search scholarly articles, theses and books. Use \"Cited by\" to follow a source's trail. Some full texts sit behind paywalls.", tags: "articles research citations" },
  { cat: "Papers & journals", name: "DOAJ", url: "https://doaj.org", access: "Free",
    text: "Directory of Open Access Journals: peer-reviewed journals you can read in full.", tags: "peer reviewed open access" },
  { cat: "Papers & journals", name: "CORE", url: "https://core.ac.uk", access: "Free",
    text: "A huge collection of open access research papers from repositories around the world.", tags: "open access articles" },
  { cat: "Papers & journals", name: "Semantic Scholar", url: "https://www.semanticscholar.org", access: "Free",
    text: "Paper search with short summaries and citation details.", tags: "articles summaries" },
  { cat: "Papers & journals", name: "African Journals Online", url: "https://www.ajol.info", access: "Free with limits",
    text: "Peer-reviewed journals published in Africa. Many articles are open; some may need access.", tags: "africa nigeria kenya journals" },
  { cat: "Papers & journals", name: "SSRN", url: "https://www.ssrn.com", access: "Free with limits",
    text: "Early-stage papers in the social sciences and humanities. Some downloads may need a free account.", tags: "preprints social science policy" },
  { cat: "Papers & journals", name: "BASE", url: "https://www.base-search.net", access: "Free",
    text: "A search engine for academic open access documents.", tags: "search open access" },
  { cat: "Papers & journals", name: "Unpaywall", url: "https://unpaywall.org", access: "Free",
    text: "Finds legal free copies of paywalled papers.", tags: "paywall free articles" },
  { cat: "Papers & journals", name: "Internet Archive Scholar", url: "https://scholar.archive.org", access: "Free",
    text: "A searchable archive of scholarly papers preserved online.", tags: "articles archive" },

  { cat: "Books & learning", name: "OpenStax", url: "https://openstax.org", access: "Free",
    text: "Free, peer-reviewed textbooks.", tags: "textbooks study guides" },
  { cat: "Books & learning", name: "Directory of Open Access Books", url: "https://www.doabooks.org", access: "Free",
    text: "Academic books you can read for free.", tags: "books open access" },
  { cat: "Books & learning", name: "Open Library", url: "https://openlibrary.org", access: "Free with limits",
    text: "Borrow digital books free with an account. Availability varies by title.", tags: "books borrow library" },
  { cat: "Books & learning", name: "Project Gutenberg", url: "https://www.gutenberg.org", access: "Free",
    text: "Public-domain classics and older books.", tags: "books classics" },
  { cat: "Books & learning", name: "MIT OpenCourseWare", url: "https://ocw.mit.edu", access: "Free",
    text: "Free lecture notes, readings and course materials from MIT.", tags: "courses study guides lectures" },
  { cat: "Books & learning", name: "Khan Academy", url: "https://www.khanacademy.org", access: "Free",
    text: "Free lessons and practice on many subjects.", tags: "lessons study learning" },

  { cat: "Data & facts", name: "World Bank Open Data", url: "https://data.worldbank.org", access: "Free",
    text: "Country-level development statistics.", tags: "statistics economics countries" },
  { cat: "Data & facts", name: "UN Data", url: "https://data.un.org", access: "Free",
    text: "Statistics from across the United Nations system.", tags: "statistics countries" },
  { cat: "Data & facts", name: "Our World in Data", url: "https://ourworldindata.org", access: "Free",
    text: "Charts and explainers with their data sources shown.", tags: "statistics charts" },
  { cat: "Data & facts", name: "Wikipedia", url: "https://www.wikipedia.org", access: "Free",
    text: "Handy for background reading. Don't cite it directly; follow the sources it lists instead.", tags: "background reference encyclopedia" },

  { cat: "Citations & writing", name: "Purdue OWL", url: "https://owl.purdue.edu", access: "Free",
    text: "Clear guides to APA, MLA and Chicago, plus writing help.", tags: "apa referencing citations writing" },
  { cat: "Citations & writing", name: "Zotero", url: "https://www.zotero.org", access: "Free with limits",
    text: "A reference manager that builds citations for you. Extra cloud storage costs extra.", tags: "references citations bibliography apa" },
  { cat: "Citations & writing", name: "Crossref DOI Search", url: "https://search.crossref.org", access: "Free",
    text: "Look up a source's DOI so you can cite it properly.", tags: "doi citations references" },
  { cat: "Citations & writing", name: "Wayback Machine", url: "https://web.archive.org", access: "Free",
    text: "See saved versions of web pages. Useful when a link dies.", tags: "archive links citations" }
];

const Shrine = (function () {
  const $ = id => document.getElementById(id);
  const root = $("shrine"), input = $("shrine-input"), panel = $("shrine-panel");
  const listEl = $("shrine-list"), countEl = $("shrine-count");
  let wasEmpty = false;

  function matches(src, q) {
    const hay = (src.name + " " + src.cat + " " + src.text + " " + src.tags + " " + src.access).toLowerCase();
    return q.toLowerCase().split(/\s+/).filter(Boolean).every(w => hay.includes(w));
  }

  function render() {
    const found = SHRINE_SOURCES.filter(s => matches(s, input.value));
    listEl.replaceChildren();
    countEl.textContent = found.length === 1 ? "1 source" : found.length + " sources";
    if (!found.length) {
      const p = document.createElement("p");
      p.className = "shrine-empty";
      p.textContent = KITSU_LINES.status.searchEmpty + " Try another word, like \"citations\" or \"journals\".";
      listEl.appendChild(p);
      if (!wasEmpty) Kitsu.sayStatus("searchEmpty");
      wasEmpty = true;
      return;
    }
    wasEmpty = false;
    let lastCat = "";
    found.forEach(s => {
      if (s.cat !== lastCat) {
        const h = document.createElement("h3");
        h.className = "shrine-cat";
        h.textContent = s.cat;
        listEl.appendChild(h);
        lastCat = s.cat;
      }
      const item = document.createElement("div");
      item.className = "shrine-item";
      const top = document.createElement("div");
      top.className = "shrine-top";
      const a = document.createElement("a");
      a.className = "shrine-link";
      a.href = s.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = s.name;
      const tag = document.createElement("span");
      tag.className = "shrine-tag " + (s.access === "Free" ? "free" : "limits");
      tag.textContent = s.access;
      top.append(a, tag);
      const p = document.createElement("p");
      p.className = "shrine-text";
      p.textContent = s.text;
      item.append(top, p);
      listEl.appendChild(item);
    });
  }

  function open() { render(); panel.hidden = false; }
  function close() { panel.hidden = true; }

  input.addEventListener("focus", open);
  input.addEventListener("input", () => { if (panel.hidden) panel.hidden = false; render(); });
  $("shrine-form").addEventListener("submit", e => { e.preventDefault(); open(); });
  $("shrine-close").addEventListener("click", () => { close(); input.blur(); });
  document.addEventListener("click", e => { if (!panel.hidden && !root.contains(e.target)) close(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !panel.hidden) close(); });
  return { render };
})();

// ---- Step 11: Credits, welcome note, About Me and Contact Me (one small modal) ----
const CONTACT_EMAIL = "missnee04@gmail.com";

// Block types: h = heading, p = paragraph, quote = italic line, small = small print,
// asset = placeholder for an image you'll supply, mail = email button + copy button
const INFO = {
  credits: { title: "Credits & Acknowledgements", blocks: [
    { t: "p", text: "Most of the artwork and visual resources in The Kitsuné Nook were created with the assistance of AI." },
    { t: "p", text: "I take no credit for the original AI-generated assets or third-party resources. My contribution lies in the concept, colour palettes, creative direction and coding that brought this little nook to life." },
    { t: "quote", text: "A little vision, a little AI, and a lot of tinkering!" },
    { t: "small", text: "Still tinkering tho! Haha ;)" }
  ]},
  welcome: { title: "A little note to visitors", blocks: [
    { t: "h", text: "Welcome to The Kitsuné Nook!" },
    { t: "p", text: "A little corner for curious minds, quiet moments and small accomplishments. Wander around, explore what's here and make yourself at home." },
    { t: "p", text: "And don't forget to say hello to Kitsu!" },
    { t: "asset", label: "Kitsu" }   // ASSET PLACEHOLDER: Kelly's Kitsu image goes here later
  ]},
  about: { title: "About Me", blocks: [
    { t: "h", text: "The Person Behind the Nook" },
    { t: "p", text: "Hello, I'm Nee!" },
    { t: "p", text: "I'm a student, graphic designer and curious soul with a fondness for art, storytelling, folklore and all things a little whimsical." },
    { t: "p", text: "I enjoy bringing ideas to life, experimenting with colours and creating little things that make everyday life more interesting." },
    { t: "p", text: "The Kitsuné Nook is one of those creations: a personal project where my love for design, learning and a little Japanese-inspired magic could meet." },
    { t: "p", text: "I'm still learning, still creating and occasionally fighting with my code. But that's part of the fun." }
  ]},
  contact: { title: "Contact Me", blocks: [
    { t: "h", text: "Send a letter to the Nook" },
    { t: "p", text: "Want to say hello, share an idea or tell me what you think? I'd love to hear from you." },
    { t: "mail" },
    { t: "small", text: "The button opens your email app. If nothing happens, copy the address and write from any email you like." }
  ]}
};

const Info = (function () {
  const modal = document.getElementById("info-modal");
  const titleEl = document.getElementById("info-title");
  const body = document.getElementById("info-body");
  const closeBtn = document.getElementById("info-x");
  let current = null, opener = null;

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch { /* try the fallback */ }
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch { return false; }
  }

  function mailBlock() {
    const wrap = document.createElement("div");
    wrap.className = "info-actions";
    const a = document.createElement("a");
    a.className = "btn";
    a.href = "mailto:" + CONTACT_EMAIL + "?subject=" + encodeURIComponent("A Letter for the Nook");
    a.textContent = "Send a letter";
    const copy = document.createElement("button");
    copy.type = "button";
    copy.className = "btn btn-quiet";
    copy.textContent = "Copy email address";
    const msg = document.createElement("p");
    msg.className = "info-small";
    msg.setAttribute("role", "status");
    msg.textContent = CONTACT_EMAIL;
    copy.addEventListener("click", async () => {
      msg.textContent = (await copyText(CONTACT_EMAIL)) ? "Copied! " + CONTACT_EMAIL : "Couldn't copy. Please copy it by hand: " + CONTACT_EMAIL;
    });
    wrap.append(a, copy);
    const frag = document.createDocumentFragment();
    frag.append(wrap, msg);
    return frag;
  }

  function build(block) {
    if (block.t === "mail") return mailBlock();
    if (block.t === "asset") {
      const img = document.createElement("img");
      img.className = "info-kitsu";
      img.src = "kitsu.png";
      img.alt = block.label;
      return img;
    }
    const el = document.createElement(block.t === "h" ? "h3" : "p");
    el.className = { h: "info-h", quote: "info-quote", small: "info-small" }[block.t] || "";
    el.textContent = block.text;
    return el;
  }

  function open(key, from) {
    const data = INFO[key];
    if (!data) return;
    current = key;
    opener = from || null;
    titleEl.textContent = data.title;
    body.replaceChildren(...data.blocks.map(build));
    modal.hidden = false;
    closeBtn.focus();
  }

  function close() {
    modal.hidden = true;
    if (current === "welcome") Storage.set("welcomeSeen", true);
    current = null;
    if (opener) opener.focus();
  }

  closeBtn.addEventListener("click", close);
  modal.addEventListener("click", e => { if (e.target === modal) close(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !modal.hidden) close(); });

  // Footer links
  document.querySelectorAll("[data-info]").forEach(b => b.addEventListener("click", () => open(b.dataset.info, b)));
  // Nav links: About Me and Contact Me open their windows
  [["#about", "about"], ["#contact", "contact"]].forEach(([href, key]) => {
    document.querySelectorAll('a[href="' + href + '"]').forEach(a => a.addEventListener("click", e => { e.preventDefault(); open(key, a); }));
  });

  // First visit: a gentle welcome
  if (!Storage.get("welcomeSeen", false)) open("welcome", null);

  return { open, close };
})();

// ---- Pomodoro Room window controls (minimise, maximise, close) ----
(function initTimerWindow() {
  const win = document.getElementById("timer"), body = document.getElementById("timer-body");
  const minBtn = document.getElementById("tw-min"), maxBtn = document.getElementById("tw-max");
  const closedBar = document.getElementById("timer-closed");
  function setMin(on) {
    win.classList.toggle("is-min", on);
    minBtn.setAttribute("aria-label", on ? "Restore Pomodoro Room" : "Minimise Pomodoro Room");
    if (on) setMax(false);
  }
  function setMax(on) {
    win.classList.toggle("is-max", on);
    maxBtn.setAttribute("aria-label", on ? "Restore Pomodoro Room size" : "Maximise Pomodoro Room");
    if (on) win.classList.remove("is-min");
  }
  minBtn.addEventListener("click", () => setMin(!win.classList.contains("is-min")));
  maxBtn.addEventListener("click", () => setMax(!win.classList.contains("is-max")));
  document.getElementById("tw-close").addEventListener("click", () => { setMax(false); win.hidden = true; closedBar.hidden = false; });
  document.getElementById("timer-reopen").addEventListener("click", () => { win.hidden = false; closedBar.hidden = true; });
  document.addEventListener("keydown", e => {
    const noteOpen = !document.getElementById("note-modal").hidden || !document.getElementById("info-modal").hidden;
    if (e.key === "Escape" && win.classList.contains("is-max") && !noteOpen) setMax(false);
  });
})();

// Optional: bar-icon.png replaces the little heart at the start of the Little Accomplishment Bar
(function loadBarIcon() {
  if (typeof Image === "undefined") return;
  const img = new Image();
  img.onload = () => {
    img.alt = "";
    img.className = "bar-icon-img";
    document.getElementById("bar-icon").replaceChildren(img);
  };
  img.src = "bar-icon.png";   // if the file is missing, nothing happens
})();

// ---- Themes (Kitsu's Themes) ----
// "colors" are the little preview chips in the menu. petals: true = the Falling petals option is offered.
const THEMES = [
  { id: "teahouse",   name: "Tea House",        text: "warm parchment and burgundy",       color: "#642D3B" },
  { id: "sakura",     name: "Sakura",           text: "soft pink and white, with petals",  color: "#DFA1A5", petals: true },
  { id: "peach",      name: "Peach Blossom",    text: "a warm spring morning",             color: "#E69A8D", petals: true },
  { id: "plum",       name: "Plum Blossom",     text: "elegant, romantic, a little mysterious", color: "#B17A91", petals: true },
  { id: "wisteria",   name: "Wisteria Moon",    text: "a quiet, dreamy evening in the garden", color: "#A18CB8" },
  { id: "mossgarden", name: "Moss Garden",      text: "a peaceful garden after the rain",  color: "#87977A" },
  { id: "snowfox",    name: "Snow Fox",         text: "frosted windows and a little fox warmth", color: "#B5C2CA" },
  { id: "bluehour",   name: "Blue Hour",        text: "cool and dreamy, just before nightfall", color: "#6D8999" },
  { id: "shrine",     name: "Shrine",           text: "vermilion and gold",                color: "#C74736" },
  { id: "lantern",    name: "Lantern",          text: "a cozy night mode",                 color: "#E7B77A" },
  { id: "midnight",   name: "Midnight Kitsune", text: "a lantern-lit study room after dark", color: "#C58B86" }
];

const Themes = (function () {
  const $ = id => document.getElementById(id);
  const btn = $("theme-btn"), panel = $("theme-panel"), list = $("theme-list");
  const petalsRow = $("theme-petals-row"), petalsBox = $("theme-petals"), petalsEl = $("petals");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;
  const optButtons = {};
  let current = "teahouse";

  function stopPetals() { petalsEl.replaceChildren(); }
  function startPetals() {
    stopPetals();
    if (reduceMotion) return;
    for (let i = 0; i < 16; i++) {
      const p = document.createElement("span");
      const size = 10 + Math.random() * 8;
      p.className = "petal " + (i % 2 ? "petal-b" : "petal-a");
      p.style.left = (Math.random() * 100) + "%";
      p.style.width = p.style.height = size + "px";
      p.style.setProperty("--dur", (12 + Math.random() * 12) + "s");
      p.style.setProperty("--drift", (Math.random() * 120 - 60) + "px");
      p.style.setProperty("--spin", (Math.random() * 360 - 180) + "deg");
      p.style.animationDelay = (-Math.random() * 20) + "s";
      petalsEl.appendChild(p);
    }
  }

  function syncPetals() {
    const t = THEMES.find(x => x.id === current);
    const on = Storage.get("petals", true);
    petalsRow.hidden = !(t && t.petals);
    petalsBox.checked = on;
    if (t && t.petals && on) startPetals(); else stopPetals();
  }

  function apply(id, remember) {
    if (!THEMES.some(t => t.id === id)) id = "teahouse";
    current = id;
    root.setAttribute("data-theme", id);
    if (remember) Storage.set("theme", id);
    THEMES.forEach(t => optButtons[t.id].setAttribute("aria-pressed", String(t.id === id)));
    syncPetals();
  }

  function open() { panel.hidden = false; btn.setAttribute("aria-expanded", "true"); }
  function close() { panel.hidden = true; btn.setAttribute("aria-expanded", "false"); }

  THEMES.forEach(t => {
    const li = document.createElement("li");
    const b = document.createElement("button");
    b.type = "button";
    b.className = "theme-opt";
    b.setAttribute("aria-pressed", "false");
    const thumb = document.createElement("span");
    thumb.className = "theme-flower-wrap";
    thumb.setAttribute("aria-hidden", "true");
    thumb.style.color = t.color;                       // a little sakura flower in the theme's colour
    thumb.innerHTML = '<svg class="theme-flower" focusable="false"><use href="#px-flower"/></svg>';
    const label = document.createElement("span");
    const name = document.createElement("span");
    name.className = "theme-name";
    name.textContent = t.name;
    const desc = document.createElement("span");
    desc.className = "theme-desc";
    desc.textContent = t.text;
    label.append(name, desc);
    b.append(thumb, label);
    b.addEventListener("click", () => apply(t.id, true));
    optButtons[t.id] = b;
    li.appendChild(b);
    list.appendChild(li);
  });

  btn.addEventListener("click", e => { e.stopPropagation(); panel.hidden ? open() : close(); });
  $("theme-close").addEventListener("click", close);
  petalsBox.addEventListener("change", () => { Storage.set("petals", petalsBox.checked); syncPetals(); });
  document.addEventListener("click", e => { if (!panel.hidden && !panel.contains(e.target) && !btn.contains(e.target)) close(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !panel.hidden) close(); });

  apply(Storage.get("theme", "teahouse"), false);
  return { apply };
})();
