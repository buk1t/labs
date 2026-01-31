// ui.js — knobs + theme + audio glue + storage + credits + modal GUI
(() => {
  // =========================
  // THEME
  // =========================
  const THEME_KEY = "soundscapes_theme"; // "light" | "dark" | "system"
  const btnTheme = document.getElementById("btn-theme");
  const systemQuery = window.matchMedia?.("(prefers-color-scheme: dark)");

  function getSystemTheme() {
    return systemQuery?.matches ? "dark" : "light";
  }
  function getStoredTheme() {
    return localStorage.getItem(THEME_KEY) || "system";
  }
  function applyTheme(mode) {
    const finalTheme = mode === "system" ? getSystemTheme() : mode;
    document.body.dataset.theme = finalTheme;

    if (btnTheme) {
      btnTheme.title =
        mode === "system" ? `Theme: system (${finalTheme})` : `Theme: ${mode}`;
    }
  }
  function setTheme(mode) {
    localStorage.setItem(THEME_KEY, mode);
    applyTheme(mode);
  }

  applyTheme(getStoredTheme());

  if (systemQuery?.addEventListener) {
    systemQuery.addEventListener("change", () => {
      if (getStoredTheme() === "system") applyTheme("system");
    });
  } else if (systemQuery?.addListener) {
    systemQuery.addListener(() => {
      if (getStoredTheme() === "system") applyTheme("system");
    });
  }

  // Cycle: system -> dark -> light -> system
  btnTheme?.addEventListener("click", () => {
    const cur = getStoredTheme();
    const next = cur === "system" ? "dark" : cur === "dark" ? "light" : "system";
    setTheme(next);
  });

  // =========================
  // Helpers
  // =========================
  const statusText = document.getElementById("status-text");
  function setStatus(msg) {
    if (statusText) statusText.textContent = msg;
  }

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  // remember last-loaded mix so refresh is sane
  const LAST_MIX_KEY = "soundscapes_last_mix_id";

  // =========================
  // MODAL GUI (name / rename / delete)
  // =========================
  const actionModal = document.getElementById("action-modal");
  const actionClose = document.getElementById("action-close");
  const actionBody = document.getElementById("action-body");
  const actionTitle = document.getElementById("action-title");
  const actionActions = document.getElementById("action-actions");

  function openActionModal() {
    if (!actionModal) return;
    actionModal.setAttribute("aria-hidden", "false");
  }
  function closeActionModal() {
    if (!actionModal) return;
    actionModal.setAttribute("aria-hidden", "true");
  }

  actionClose?.addEventListener("click", closeActionModal);
  actionModal?.querySelectorAll("[data-close]")?.forEach((el) => {
    el.addEventListener("click", closeActionModal);
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeActionModal();
  });

  function escapeHtml(str) {
    return String(str || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function setModalContent({ title, bodyHTML, actionsHTML }) {
    if (actionTitle) actionTitle.textContent = title || "";
    if (actionBody) actionBody.innerHTML = bodyHTML || "";
    if (actionActions) actionActions.innerHTML = actionsHTML || "";
  }

  function showNameModal({
    title = "Name mix",
    initial = "",
    confirmText = "Save",
    onConfirm,
  }) {
    setModalContent({
      title,
      bodyHTML: `
        <input class="modal-input" id="mix-name-input" type="text" maxlength="48"
          value="${escapeHtml(initial)}" placeholder="Untitled" />
        <div class="modal-help">Enter to confirm • Esc to cancel</div>
      `,
      actionsHTML: `
        <button class="pill subtle" id="modal-cancel" type="button">Cancel</button>
        <button class="pill" id="modal-ok" type="button">${escapeHtml(
          confirmText
        )}</button>
      `,
    });

    openActionModal();

    const input = document.getElementById("mix-name-input");
    const cancel = document.getElementById("modal-cancel");
    const ok = document.getElementById("modal-ok");

    requestAnimationFrame(() => {
      input?.focus();
      input?.select();
    });

    cancel?.addEventListener("click", closeActionModal);

    function submit() {
      const name = (input?.value || "").trim().slice(0, 48) || "Untitled";
      closeActionModal();
      onConfirm?.(name);
    }

    ok?.addEventListener("click", submit);
    input?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") submit();
    });
  }

  function showConfirmModal({
    title = "Delete mix",
    message = "",
    confirmText = "Delete",
    onConfirm,
  }) {
    setModalContent({
      title,
      bodyHTML: `
        <div style="font-size:13px; line-height:1.5; color: var(--text);">
          ${escapeHtml(message)}
        </div>
      `,
      actionsHTML: `
        <button class="pill subtle" id="modal-cancel" type="button">Cancel</button>
        <button class="pill" id="modal-ok" type="button">${escapeHtml(
          confirmText
        )}</button>
      `,
    });

    openActionModal();

    const cancel = document.getElementById("modal-cancel");
    const ok = document.getElementById("modal-ok");

    cancel?.addEventListener("click", closeActionModal);
    ok?.addEventListener("click", () => {
      closeActionModal();
      onConfirm?.();
    });
  }

  // =========================
  // KNOBS (UI)
  // =========================
  const KNOB_MIN_DEG = -135;
  const KNOB_MAX_DEG = 135;
  const KNOB_RANGE = KNOB_MAX_DEG - KNOB_MIN_DEG;

  function wrapAngleDeg(deg) {
    return ((deg + 180) % 360 + 360) % 360 - 180;
  }

  function angleFromCenterDeg(knobEl, clientX, clientY) {
    const rect = knobEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;

    let deg = Math.atan2(dy, dx) * (180 / Math.PI);
    deg = deg + 90; // top=0
    return wrapAngleDeg(deg);
  }

  function degFromValue(val) {
    const t = clamp(val, 0, 100) / 100;
    return KNOB_MIN_DEG + t * KNOB_RANGE;
  }

  function getKnobVal(knobEl) {
    const aria = knobEl.getAttribute("aria-valuenow");
    const n = aria ? parseInt(aria, 10) : NaN;
    if (!Number.isNaN(n)) return clamp(n, 0, 100);
    return 0;
  }

  function setKnob(knobEl, val, { silent = false } = {}) {
    val = clamp(Math.round(val), 0, 100);
    const deg = degFromValue(val);

    knobEl.style.setProperty("--val", val);
    knobEl.style.setProperty("--deg", `${deg}deg`);
    knobEl.setAttribute("aria-valuenow", String(val));

    const card =
      knobEl.closest(".knobcard") || knobEl.closest(".masterknobwrap");
    const valueEl = card?.querySelector(".knobvalue, .masterpct");
    if (valueEl) valueEl.textContent = `${val}%`;

    if (!silent) {
      knobEl.dispatchEvent(
        new CustomEvent("knobchange", { detail: { value: val } })
      );
    }
  }

  const knobEls = Array.from(document.querySelectorAll(".knob[role='slider']"));
  knobEls.forEach((k) => setKnob(k, getKnobVal(k), { silent: true }));

  // =========================
  // AUDIO wiring
  // =========================
  const audio = window.SoundscapesAudio;
  let unlocking = null;

  async function ensureAudio() {
    if (!audio) {
      setStatus("audio missing");
      return false;
    }
    if (audio.unlocked) return true;

    if (!unlocking) {
      unlocking = (async () => {
        try {
          await audio.unlock();
          setStatus("ready — turn the room");
          return true;
        } catch (e) {
          console.error(e);
          setStatus("audio unavailable");
          return false;
        } finally {
          if (!audio.unlocked) unlocking = null;
        }
      })();
    }
    return unlocking;
  }

  // unlock on first gesture
  window.addEventListener("pointerdown", () => ensureAudio(), { once: true });

  function knobValue01(knobEl) {
    return getKnobVal(knobEl) / 100;
  }

  // per-sound knobs
  document.querySelectorAll(".knobcard[data-sound]").forEach((card) => {
    const sound = card.getAttribute("data-sound");
    const knob = card.querySelector(".knob[role='slider']");
    if (!sound || !knob) return;

    knob.addEventListener("knobchange", () => {
      if (!audio?.unlocked) return;
      audio.setLayer(sound, knobValue01(knob));
      setStatus("playing");
    });
  });

  // master knob
  const masterKnob = document.querySelector(".knob.master[role='slider']");
  if (masterKnob) {
    masterKnob.addEventListener("knobchange", () => {
      if (!audio?.unlocked) return;
      audio.setMaster(knobValue01(masterKnob));
    });
  }

  // =========================
  // Pointer drag (anchored)
  // =========================
  let activeKnob = null;
  let pointerId = null;
  let startVal = 0;
  let startAngle = 0;

  function onPointerDown(e) {
    const knobEl = e.currentTarget;
    activeKnob = knobEl;
    pointerId = e.pointerId;

    knobEl.setPointerCapture(pointerId);
    knobEl.classList.add("dragging");

    startVal = getKnobVal(knobEl);
    startAngle = angleFromCenterDeg(knobEl, e.clientX, e.clientY);

    ensureAudio();
  }

  function onPointerMove(e) {
    if (!activeKnob || e.pointerId !== pointerId) return;

    const angleNow = angleFromCenterDeg(activeKnob, e.clientX, e.clientY);
    const delta = wrapAngleDeg(angleNow - startAngle);

    const valDelta = (delta / KNOB_RANGE) * 100;
    const nextVal = clamp(startVal + valDelta, 0, 100);

    setKnob(activeKnob, nextVal);
  }

  function endDrag() {
    if (!activeKnob) return;
    activeKnob.classList.remove("dragging");
    activeKnob = null;
    pointerId = null;
  }

  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", (e) => {
    if (e.pointerId !== pointerId) return;
    endDrag();
  });
  window.addEventListener("pointercancel", (e) => {
    if (e.pointerId !== pointerId) return;
    endDrag();
  });

  knobEls.forEach((knobEl) =>
    knobEl.addEventListener("pointerdown", onPointerDown)
  );

  // keyboard
  function onKnobKey(e) {
    const knobEl = e.currentTarget;
    let val = getKnobVal(knobEl);

    const step = e.shiftKey ? 10 : 2;
    let handled = true;

    switch (e.key) {
      case "ArrowUp":
      case "ArrowRight":
        val += step;
        break;
      case "ArrowDown":
      case "ArrowLeft":
        val -= step;
        break;
      case "Home":
        val = 0;
        break;
      case "End":
        val = 100;
        break;
      default:
        handled = false;
    }

    if (!handled) return;
    e.preventDefault();
    ensureAudio();
    setKnob(knobEl, val);
  }
  knobEls.forEach((k) => k.addEventListener("keydown", onKnobKey));

  // =========================
  // Fade buttons (status ends)
  // =========================
  const btnFadeIn = document.getElementById("btn-fadein");
  const btnFadeOut = document.getElementById("btn-fadeout");

  function animateKnobTo(knobEl, targetVal, ms = 900, onDone) {
    const start = getKnobVal(knobEl);
    const end = clamp(targetVal, 0, 100);
    const t0 = performance.now();

    function tick(t) {
      const p = clamp((t - t0) / ms, 0, 1);
      const s = p * p * (3 - 2 * p);
      const v = start + (end - start) * s;
      setKnob(knobEl, v);
      if (p < 1) requestAnimationFrame(tick);
      else onDone?.();
    }
    requestAnimationFrame(tick);
  }

  btnFadeIn?.addEventListener("click", async () => {
    const ok = await ensureAudio();
    if (!ok || !masterKnob) return;

    setStatus("fading in…");
    animateKnobTo(masterKnob, 80, 1100, () => {
      setStatus("ready — turn the room");
    });
  });

  btnFadeOut?.addEventListener("click", async () => {
    const ok = await ensureAudio();
    if (!ok || !masterKnob) return;

    setStatus("fading out…");
    animateKnobTo(masterKnob, 0, 900, () => {
      setStatus("quiet and ready");
    });
  });

  // =========================
  // STORAGE: Save / load mixes
  // =========================
  const storage = window.SoundscapesStorage;
  const savedList = document.querySelector(".saved-list");
  const btnSave = document.getElementById("btn-save");

  function currentLevels() {
    const levels = {};
    document.querySelectorAll(".knobcard[data-sound]").forEach((card) => {
      const sound = card.getAttribute("data-sound");
      const knob = card.querySelector(".knob[role='slider']");
      if (!sound || !knob) return;
      levels[sound] = getKnobVal(knob);
    });
    const master = masterKnob ? getKnobVal(masterKnob) : 80;
    return { levels, master };
  }

  function applyMix(mix) {
    if (mix?.id) localStorage.setItem(LAST_MIX_KEY, mix.id);

    // set knobs silently
    document.querySelectorAll(".knobcard[data-sound]").forEach((card) => {
      const sound = card.getAttribute("data-sound");
      const knob = card.querySelector(".knob[role='slider']");
      if (!sound || !knob) return;
      const v = mix.levels?.[sound] ?? 0;
      setKnob(knob, v, { silent: true });
    });
    if (masterKnob) setKnob(masterKnob, mix.master ?? 80, { silent: true });

    // apply to audio only if unlocked
    if (audio?.unlocked) {
      Object.entries(mix.levels || {}).forEach(([name, v]) => {
        audio.setLayer(name, (v || 0) / 100);
      });
      audio.setMaster((mix.master ?? 80) / 100);
    }

    // refresh UI labels
    document.querySelectorAll(".knobcard[data-sound]").forEach((card) => {
      const knob = card.querySelector(".knob[role='slider']");
      if (!knob) return;
      knob.dispatchEvent(
        new CustomEvent("knobchange", { detail: { value: getKnobVal(knob) } })
      );
    });
    if (masterKnob) {
      masterKnob.dispatchEvent(
        new CustomEvent("knobchange", {
          detail: { value: getKnobVal(masterKnob) },
        })
      );
    }

    setStatus("loaded mix");
  }

  function refreshSaved({ autoLoadLast = true } = {}) {
    if (!storage || !savedList) return;

    const mixes = storage.loadAll();

    storage.render(savedList, mixes, {
      onLoadMix: async (mix) => {
        await ensureAudio();
        applyMix(mix);
      },

      onRenameMix: (mix) => {
        showNameModal({
          title: "Rename mix",
          initial: mix.name || "Untitled",
          confirmText: "Rename",
          onConfirm: (name) => {
            storage.updateName(mix.id, name);
            refreshSaved({ autoLoadLast: false });
            setStatus("renamed");
          },
        });
      },

      onDeleteMix: (mix) => {
        showConfirmModal({
          title: "Delete mix",
          message: `Delete “${mix.name || "Untitled"}”? This can’t be undone.`,
          confirmText: "Delete",
          onConfirm: () => {
            const lastId = localStorage.getItem(LAST_MIX_KEY);
            storage.remove(mix.id);
            if (lastId && lastId === mix.id) {
              localStorage.removeItem(LAST_MIX_KEY);
            }
            refreshSaved({ autoLoadLast: true });
            setStatus("deleted");
          },
        });
      },
    });

    // auto-load last mix into UI (even before audio unlock)
    if (autoLoadLast && mixes.length) {
      const lastId = localStorage.getItem(LAST_MIX_KEY);
      const toLoad = (lastId && mixes.find((m) => m.id === lastId)) || mixes[0];
      applyMix(toLoad);
    }
  }

  btnSave?.addEventListener("click", () => {
    if (!storage) return;

    const { levels, master } = currentLevels();
    const mix = storage.createMix(levels, master);

    showNameModal({
      title: "Name this mix",
      initial: mix.name || "New mix",
      confirmText: "Save",
      onConfirm: (name) => {
        mix.name = name;
        storage.addMix(mix);
        localStorage.setItem(LAST_MIX_KEY, mix.id);
        refreshSaved({ autoLoadLast: false });
        setStatus("saved");
      },
    });
  });

  // IMPORTANT: render real saved mixes immediately (replaces HTML defaults)
  refreshSaved({ autoLoadLast: true });

  // =========================
  // Credits modal (optional — keeps your existing IDs)
  // =========================
  const btnCredits = document.getElementById("btn-credits");
  const creditsModal = document.getElementById("credits-modal");
  const btnCreditsClose = document.getElementById("btn-credits-close");

  function openCredits() {
    if (!creditsModal) return;
    creditsModal.setAttribute("aria-hidden", "false");
  }
  function closeCredits() {
    if (!creditsModal) return;
    creditsModal.setAttribute("aria-hidden", "true");
  }

  btnCredits?.addEventListener("click", openCredits);
  btnCreditsClose?.addEventListener("click", closeCredits);
  creditsModal?.querySelectorAll("[data-close]")?.forEach((el) => {
    el.addEventListener("click", closeCredits);
  });
})();