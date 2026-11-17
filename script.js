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

  return { say, sayStatus, show };
})();

// ---- Step 4: Pomodoro + Little Accomplishment Bar ----

// Change these to adjust the timer (minutes)
const DURATIONS = { focus: 25, short: 5, long: 15 };

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

const Timer = (function () {
  const displayEl = document.getElementById("timer-display");
  const startBtn  = document.getElementById("timer-start");
  const resetBtn  = document.getElementById("timer-reset");
  const modeBtns  = document.querySelectorAll(".mode-btn");
  const barEl     = document.getElementById("progress-bar");
  const countEl   = document.getElementById("progress-count");
  const BASE_TITLE = document.title;

  const state = { mode: "focus", total: DURATIONS.focus * 60, remaining: DURATIONS.focus * 60,
                  running: false, endAt: 0, halfSaid: false, tick: null, barDay: todayKey() };

  const fmt = s => String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");

  function render() {
    displayEl.textContent = fmt(state.remaining);
    startBtn.textContent = state.running ? "Pause" : (state.remaining < state.total ? "Resume" : "Start");
    modeBtns.forEach(b => {
      b.setAttribute("aria-pressed", String(b.dataset.mode === state.mode));
      b.disabled = state.running;
    });
    document.title = state.running ? fmt(state.remaining) + " · " + BASE_TITLE : BASE_TITLE;
  }

  // Little Accomplishment Bar: one pixel segment per completed focus session today
  function renderBar() {
    const n = SessionLog.today();
    state.barDay = todayKey();
    barEl.replaceChildren();
    for (let i = 0; i < n; i++) {
      const seg = document.createElement("span");
      seg.className = "progress-seg";
      barEl.appendChild(seg);
    }
    barEl.setAttribute("aria-label", n + (n === 1 ? " session" : " sessions") + " completed today");
    countEl.textContent = n === 0 ? "No sessions yet. No rush."
                                  : n + (n === 1 ? " session" : " sessions") + " today";
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
      renderBar();
      Kitsu.say("complete");
      document.dispatchEvent(new CustomEvent("kitsune:sessionComplete")); // Step 5 listens here
      setMode(SessionLog.today() % 4 === 0 ? "long" : "short");
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
    if (state.mode === "focus" && wasStarted) document.dispatchEvent(new CustomEvent("kitsune:sessionInterrupted")); // Step 5
    setMode(state.mode);
  }

  startBtn.addEventListener("click", toggle);
  resetBtn.addEventListener("click", reset);
  modeBtns.forEach(b => b.addEventListener("click", () => { if (!state.running) setMode(b.dataset.mode); }));

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
  const listEl = $("diary-list"), metaEl = $("diary-meta"), statusEl = $("diary-status");
  const saveBtn = $("diary-save"), deleteBtn = $("diary-delete"), confirmBox = $("diary-confirm");
  const filterEl = $("diary-date-filter"), clearFilterBtn = $("diary-clear-filter");
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
    if (!current.id) { metaEl.textContent = "New entry \u00B7 " + fmtDate(current.date); return; }
    const edited = current.updatedAt && current.updatedAt !== current.createdAt;
    metaEl.textContent = fmtDate(current.date) + (edited ? " \u00B7 edited " + fmtTime(current.updatedAt) : "");
  }

  function renderList() {
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
    const fields = { title: titleEl.value.trim(), text: textEl.value.replace(/\s+$/, "") };
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
  textEl.addEventListener("input", markDirty);
  filterEl.addEventListener("change", () => { filter = filterEl.value; clearFilterBtn.hidden = !filter; renderList(); });
  clearFilterBtn.addEventListener("click", () => { filter = ""; filterEl.value = ""; clearFilterBtn.hidden = true; renderList(); });
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
