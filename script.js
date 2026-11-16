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
