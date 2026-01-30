const wrap = document.getElementById("wrap");

const titleEl = document.getElementById("title");
const subtitleEl = document.getElementById("subtitle");
const statusEl = document.getElementById("status");

const todoEl = document.getElementById("todo");
const barFill = document.getElementById("barFill");
const progressText = document.getElementById("progressText");
const timestampEl = document.getElementById("timestamp");

const shipBtn = document.getElementById("ship");
const addChaosBtn = document.getElementById("addChaos");
const shuffleBtn = document.getElementById("shuffle");
const clearConsoleBtn = document.getElementById("clearConsole");
const tinyStopBtn = document.getElementById("tinyStop");

const consoleBox = document.getElementById("console");
const todoPanel = document.getElementById("todoPanel");
const consolePanel = document.getElementById("consolePanel");

const migrateControls = document.getElementById("migrateControls");
const toastHost = document.getElementById("toastHost");

const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

// Quiet escape hatch: Esc or ✶ toggles freeze.
// No warnings, no mode labels.

const statuses = [
  "compiling vibes…",
  "renaming variables to feel something…",
  "pretending this is intentional…",
  "fixing a bug i haven’t found yet…",
  "deploying regret…",
  "moving pixels 1px left (critical)…",
  "writing documentation (lying)…",
  "removing the thing that worked…",
  "optimizing the wrong thing…",
  "refactoring into vibes-based architecture…",
  "un-shipping yesterday’s ship…",
  "garbage collecting emotions…",
  "hydrating the UI…",
];

const subtitles = [
  "it is actively becoming something. loudly.",
  "please stop observing it. it gets shy.",
  "a living prototype with commitment issues.",
  "nothing is broken. everything is experimental.",
  "this page is on its third coffee.",
  "it’s not unstable. it’s expressive.",
  "it’s fine. it’s fine. it’s fine.",
];

const seedTodos = [
  { text: "make it look finished (optional)", tag: "delusion" },
  { text: "add a settings panel nobody asked for", tag: "feature creep" },
  { text: "make button 3% rounder", tag: "priority" },
  { text: "decide what this even is", tag: "existential" },
  { text: "add a fake loading screen", tag: "performance" },
  { text: "delete half of this code", tag: "healing" },
  { text: "add a second progress bar for “spiritual progress”", tag: "unhinged" },
  { text: "rename everything to “final_v2_realfinal”", tag: "tradition" },
  { text: "add animations for emotional support", tag: "coping" },
];

const chaosItems = [
  { text: "add a modal that cannot be closed", tag: "evil" },
  { text: "rewrite everything in a new framework (threat)", tag: "cope" },
  { text: "ship it anyway", tag: "denial" },
  { text: "remove the ship button (cowardice)", tag: "choices" },
  { text: "deploy and walk away", tag: "confidence" },
  { text: "add a warning banner that warns about the warning banner", tag: "meta" },
  { text: "turn the UI into a personality quiz", tag: "product" },
  { text: "introduce a bug on purpose", tag: "art" },
  { text: "replace the word ‘progress’ with ‘vibes’ everywhere", tag: "truth" },
];

const consoleLines = [
  ["warn", "⚠️  warning: scope expanding autonomously"],
  ["ok",   "✓  ok: vibes check passed"],
  ["err",  "✗  error: UI refusing to be perceived"],
  ["warn", "⚠️  warning: confidence detected"],
  ["ok",   "✓  ok: stability performance nominal"],
  ["err",  "✗  error: progress cannot be measured"],
  ["warn", "⚠️  warning: refactor approaching rapidly"],
  ["ok",   "✓  ok: lying successfully"],
];

const fonts = [
  `system-ui`,
  `ui-sans-serif`,
  `-apple-system`,
  `BlinkMacSystemFont`,
  `Segoe UI`,
  `Inter, system-ui`,
  `Georgia, serif`,
  `Times New Roman, serif`,
  `ui-monospace`,
];

let todos = seedTodos.map((t) => ({ ...t, done: Math.random() < 0.25 }));
let progress = 0;

let stopped = false;
let timers = [];
let driftPhase = Math.random() * 1000;

// button migration offsets
let btnOffsets = new Map();

// ---- helpers ----
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function setIntervalSafe(fn, ms) {
  const id = setInterval(() => {
    if (!stopped) fn();
  }, ms);
  timers.push(id);
}

function setTimeoutSafe(fn, ms) {
  const id = setTimeout(() => {
    if (!stopped) fn();
  }, ms);
  timers.push(id);
}

function clearAllTimers() {
  for (const id of timers) clearInterval(id);
  for (const id of timers) clearTimeout(id);
  timers = [];
}

function logLine(type, text) {
  const div = document.createElement("div");
  div.className = `consoleLine ${type}`;
  div.textContent = text;
  consoleBox.appendChild(div);
  consoleBox.scrollTop = consoleBox.scrollHeight;
}

function quickGlitch(el) {
  el.classList.add("glitch");
  if (!prefersReducedMotion) el.classList.add("shake");
  setTimeoutSafe(() => {
    el.classList.remove("glitch");
    el.classList.remove("shake");
  }, 320);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ---- toasts ----
function toast({ title, message, actions = [], ttl = 5200 }) {
  const el = document.createElement("div");
  el.className = "toast";

  const top = document.createElement("div");
  top.className = "topline";

  const t = document.createElement("div");
  t.className = "title";
  t.textContent = title;

  const close = document.createElement("button");
  close.className = "close";
  close.textContent = "×";
  close.addEventListener("click", () => el.remove());

  top.appendChild(t);
  top.appendChild(close);

  const msg = document.createElement("div");
  msg.className = "msg";
  msg.textContent = message;

  el.appendChild(top);
  el.appendChild(msg);

  if (actions.length) {
    const a = document.createElement("div");
    a.className = "actions";
    actions.forEach(({ label, onClick }) => {
      const b = document.createElement("button");
      b.className = "actionBtn";
      b.textContent = label;
      b.addEventListener("click", () => onClick?.(el));
      a.appendChild(b);
    });
    el.appendChild(a);
  }

  toastHost.appendChild(el);

  // auto-remove
  if (ttl > 0) {
    setTimeoutSafe(() => {
      if (el.isConnected) el.remove();
    }, ttl);
  }

  return el;
}

function fakeUpdateToast() {
  const versions = ["0.0.0", "0.0.1", "0.0.2", "1.0.0-rc???", "final_final_v7", "∞.∞.∞"];
  const v = pick(versions);

  toast({
    title: "Update available",
    message: `Version ${v} is ready. Changes: “stability”, “trust”, “vibes”.`,
    actions: [
      {
        label: "Update now",
        onClick: (el) => {
          el.remove();
          logLine("warn", "⚠️  update started (it didn’t)");
          setStatus("updating… please do not blink");
          quickGlitch(statusEl);

          // fake “update” outcome
          setTimeoutSafe(() => {
            const outcomes = [
              "update applied successfully (placebo)",
              "update failed (successfully)",
              "update postponed due to vibes",
              "update installed a new problem",
            ];
            toast({
              title: "Update",
              message: pick(outcomes),
              ttl: 4200
            });
            logLine("ok", "✓  update completed (emotionally)");
            setStatus(pick(statuses));
          }, 900 + Math.random() * 1200);
        },
      },
      {
        label: "Later",
        onClick: (el) => {
          el.remove();
          toast({
            title: "Reminder",
            message: "You will be reminded at the worst possible time.",
            ttl: 3500,
          });
        },
      },
    ],
    ttl: 0, // stays until closed
  });
}

// ---- render ----
function renderTodos() {
  todoEl.innerHTML = "";
  todos.forEach((t, i) => {
    const li = document.createElement("li");
    li.className = "item" + (t.done ? " done" : "");
    li.innerHTML = `
      <div class="left">
        <div class="dot"></div>
        <div>${escapeHtml(t.text)}</div>
      </div>
      <div class="tag">${escapeHtml(t.tag)}</div>
    `;

    li.addEventListener("click", () => {
      todos[i].done = !todos[i].done;

      // liar progress: sometimes punishes completion
      const delta = todos[i].done ? (Math.random() < 0.35 ? -6 : 7) : -3;
      setProgress(progress + delta);

      if (!prefersReducedMotion && Math.random() < 0.25) {
        li.classList.add("shake");
        setTimeoutSafe(() => li.classList.remove("shake"), 260);
      }

      if (Math.random() < 0.4) fakeConsoleBurst();
      if (Math.random() < 0.18) scrambleOneThing();
      if (Math.random() < 0.12) themeTintNudge();

      renderTodos();
    });

    todoEl.appendChild(li);
  });
}

function setProgress(value) {
  progress = clamp(value, 0, 99);
  if (progress > 93 && Math.random() < 0.85) progress = 93 + Math.floor(Math.random() * 3);
  barFill.style.width = `${progress}%`;
  progressText.textContent = `${progress}%`;
}

function setStatus(text) {
  statusEl.textContent = text;
}

function updateTimestamp() {
  const d = new Date();
  timestampEl.textContent = `last seen: ${d.toLocaleString()}`;
}

// ---- absurd engine (no strobe) ----
function applyDrift() {
  if (prefersReducedMotion) return;

  driftPhase += 0.09;

  const dx = Math.sin(driftPhase) * 14;
  const dy = Math.cos(driftPhase * 0.8) * 10;
  const rot = Math.sin(driftPhase * 0.55) * 0.9;

  wrap.style.transform = `translate(${dx}px, ${dy}px) rotate(${rot}deg)`;
}

function fakeConsoleBurst() {
  const count = 1 + Math.floor(Math.random() * 3);
  for (let i = 0; i < count; i++) {
    const [type, text] = pick(consoleLines);
    logLine(type, text);
  }
}

function addChaosItem() {
  todos.unshift({ ...pick(chaosItems), done: false });
  setProgress(progress + 2);
  renderTodos();
}

function reorderPanels() {
  const panels = Array.from(document.querySelectorAll(".panel"));
  if (panels.length < 2) return;
  const a = pick(panels);
  const b = pick(panels);
  if (a === b) return;
  const parent = a.parentElement;
  if (!parent) return;
  parent.insertBefore(a, b);
  fakeConsoleBurst();
}

function scrambleOneThing() {
  const targets = [titleEl, subtitleEl, statusEl];
  const t = pick(targets);
  if (!t) return;

  const swaps = [
    ["FINISHED", "ALLEGED"],
    ["NOT", "PROBABLY NOT"],
    ["SITE", "THING"],
    ["STATUS", "MOOD"],
    ["PROGRESS", "VIBES"],
    ["SHIP", "SUMMON"],
    ["LABS", "MATH CLASS"], // rude
  ];

  const [a, b] = pick(swaps);
  const text = t.textContent || "";

  if (text.toUpperCase().includes(a)) {
    t.textContent = text.replace(new RegExp(a, "ig"), b);
  } else if (text.toUpperCase().includes(b)) {
    t.textContent = text.replace(new RegExp(b, "ig"), a);
  } else {
    t.textContent = pick([text, pick(subtitles), pick(statuses)]);
  }

  quickGlitch(t);
}

function chaosEvent() {
  const roll = Math.random();

  if (roll < 0.18) {
    setStatus(pick([
      "🧪 experiment escaped containment",
      "🌀 UI is having a moment",
      "🧯 ship attempt pre-fired, just in case",
      "🫧 bubblewrap mode engaged",
      "🧷 pinning the wrong thing (successful)",
      "🧠 reality check failed (softly)",
    ]));
    quickGlitch(statusEl);
    fakeConsoleBurst();
    return;
  }

  if (roll < 0.36) {
    // todo instability
    if (Math.random() < 0.65) addChaosItem();
    todos = shuffle(todos);
    if (todos.length && Math.random() < 0.25) {
      const idx = Math.floor(Math.random() * todos.length);
      todos[idx].done = !todos[idx].done;
    }
    renderTodos();
    setProgress(progress + (Math.random() < 0.55 ? 1 : -2));
    if (Math.random() < 0.2) randomFontSwap();
    return;
  }

  if (roll < 0.54) {
    reorderPanels();
    if (!prefersReducedMotion && Math.random() < 0.6) {
      todoPanel.classList.add("shake");
      setTimeoutSafe(() => todoPanel.classList.remove("shake"), 260);
    }
    if (Math.random() < 0.25) migrateButtons();
    return;
  }

  if (roll < 0.72) {
    scrambleOneThing();
    if (Math.random() < 0.5) fakeConsoleBurst();
    if (Math.random() < 0.25) themeTintNudge();
    return;
  }

  // rare-ish: update toast
  if (Math.random() < 0.35) fakeUpdateToast();
}

// ---- button migration ----
function migrateButtons() {
  if (prefersReducedMotion) return;

  const btns = Array.from(migrateControls.querySelectorAll(".btn"));
  btns.forEach((b) => {
    // keep ✶ mostly near its place
    const isTiny = b.classList.contains("tiny");

    const max = isTiny ? 6 : 12;
    const dx = (Math.random() * 2 - 1) * max;
    const dy = (Math.random() * 2 - 1) * (max * 0.6);

    btnOffsets.set(b, { dx, dy });
    b.style.transform = `translate(${dx}px, ${dy}px)`;
  });

  // occasionally “snap back”
  if (Math.random() < 0.25) {
    setTimeoutSafe(() => {
      btns.forEach((b) => (b.style.transform = ""));
      btnOffsets.clear();
    }, 900 + Math.random() * 900);
  }
}

// ---- theme tint drift ----
let tint = 205;
let tint2 = 190;

function themeTintNudge() {
  tint = (tint + (Math.random() * 18 - 9) + 360) % 360;
  tint2 = (tint2 + (Math.random() * 18 - 9) + 360) % 360;

  document.documentElement.style.setProperty("--tint", String(Math.round(tint)));
  document.documentElement.style.setProperty("--tint2", String(Math.round(tint2)));
}

// ---- font swaps ----
function randomFontSwap() {
  const f = pick(fonts);
  document.documentElement.style.setProperty("--font", f);
  logLine("warn", `⚠️  warning: font changed to ${f}`);
}

// ---- controls / freeze ----
function freeze() {
  stopped = true;
  clearAllTimers();
  wrap.style.transform = "";
  setStatus("🧊 frozen.");

  // reset migrating buttons & keep page calm
  Array.from(migrateControls.querySelectorAll(".btn")).forEach((b) => (b.style.transform = ""));
  btnOffsets.clear();

  logLine("ok", "✓  freeze engaged");
}

function unfreeze() {
  if (!stopped) return;
  stopped = false;
  bootTimers();
  setStatus(pick(statuses));
  logLine("warn", "⚠️  thawed (unwise)");
}

function toggleFreeze() {
  stopped ? unfreeze() : freeze();
}

// keyboard escape hatch: Esc toggles freeze
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") toggleFreeze();
});

// ---- events ----
shipBtn.addEventListener("click", () => {
  const outcomes = [
    "✅ shipped (in my heart)",
    "⚠️ shipped to production (unfortunately)",
    "🧯 ship attempt caused a small fire",
    "🌀 the ship button is decorative",
    "📦 shipped as a concept, not as code",
    "🧾 shipped to the todo list",
    "🛳️ shipping label created (nothing shipped)",
  ];
  setStatus(pick(outcomes));
  setProgress(progress + (Math.random() < 0.55 ? 1 : -2));
  fakeConsoleBurst();
  quickGlitch(statusEl);

  if (Math.random() < 0.22) migrateButtons();
  if (Math.random() < 0.18) randomFontSwap();
  if (Math.random() < 0.18) themeTintNudge();
  if (Math.random() < 0.18) fakeUpdateToast();
  if (Math.random() < 0.25) chaosEvent();
});

addChaosBtn.addEventListener("click", () => {
  addChaosItem();
  if (Math.random() < 0.7) fakeConsoleBurst();
  if (Math.random() < 0.4) scrambleOneThing();
  if (Math.random() < 0.25) migrateButtons();
  if (Math.random() < 0.2) themeTintNudge();
});

shuffleBtn.addEventListener("click", () => {
  todos = shuffle(todos);
  renderTodos();
  if (Math.random() < 0.5) fakeConsoleBurst();
  if (Math.random() < 0.18) migrateButtons();
});

clearConsoleBtn.addEventListener("click", () => {
  consoleBox.innerHTML = "";
  logLine("ok", "✓  console cleared (memories erased)");
  if (Math.random() < 0.35) toast({ title: "Notice", message: "Logs cleared. Reality preserved.", ttl: 2600 });
});

tinyStopBtn.addEventListener("click", toggleFreeze);

// ---- init ----
function bootTimers() {
  // base stuff
  setIntervalSafe(() => setStatus(pick(statuses)), 2400);
  setIntervalSafe(() => setProgress(progress + (Math.random() < 0.6 ? 1 : 0)), 3900);
  setIntervalSafe(updateTimestamp, 10000);

  // drift
  setIntervalSafe(applyDrift, 45);

  // frequent-ish events
  setIntervalSafe(() => {
    if (Math.random() < 0.55) chaosEvent();
  }, 1400);

  // occasional subtitle changes
  setIntervalSafe(() => {
    if (Math.random() < 0.35) {
      subtitleEl.textContent = pick(subtitles);
      if (Math.random() < 0.45) quickGlitch(subtitleEl);
    }
  }, 5200);

  // button migration (gentle)
  setIntervalSafe(() => {
    if (!prefersReducedMotion && Math.random() < 0.22) migrateButtons();
  }, 2600);

  // theme tint drift
  setIntervalSafe(() => {
    if (Math.random() < 0.35) themeTintNudge();
  }, 2200);

  // font swap
  setIntervalSafe(() => {
    if (Math.random() < 0.12) randomFontSwap();
  }, 4500);

  // fake update toasts
  setIntervalSafe(() => {
    if (Math.random() < 0.08) fakeUpdateToast();
  }, 7000);
}

// first paint
renderTodos();
setProgress(12 + Math.floor(Math.random() * 20));
setStatus(pick(statuses));
subtitleEl.textContent = pick(subtitles);
updateTimestamp();
logLine("ok", "✓  boot: labs runtime loaded");
logLine("warn", "⚠️  warning: unfinished zone");

// initial vibe kick
themeTintNudge();
if (Math.random() < 0.35) toast({ title: "hello", message: "this page is alive (allegedly).", ttl: 3200 });
if (Math.random() < 0.18) fakeUpdateToast();

bootTimers();