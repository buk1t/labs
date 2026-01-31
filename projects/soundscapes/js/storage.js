// storage.js — save/load mixes in localStorage
// Exposes: window.SoundscapesStorage

(() => {
  const KEY = "soundscapes_mixes_v1";

  function nowStamp() {
    const d = new Date();
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  function safeParse(raw) {
    try {
      const x = JSON.parse(raw);
      return Array.isArray(x) ? x : [];
    } catch {
      return [];
    }
  }

  function loadAll() {
    return safeParse(localStorage.getItem(KEY) || "[]");
  }

  function saveAll(arr) {
    localStorage.setItem(KEY, JSON.stringify(arr));
  }

  function countNonZero(levels) {
    return Object.values(levels || {}).filter((v) => (v || 0) > 0).length;
  }

  function createMix(levels, master) {
    return {
      id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
      name: "New mix",
      dateLabel: nowStamp(),
      levels,
      master,
      createdAt: Date.now(),
    };
  }

  function addMix(mix) {
    const all = loadAll();
    all.unshift(mix);
    saveAll(all.slice(0, 60));
    return mix;
  }

  function updateName(id, name) {
    const all = loadAll();
    const m = all.find((x) => x.id === id);
    if (m) {
      const trimmed = String(name || "").trim();
      m.name = trimmed ? trimmed.slice(0, 48) : "Untitled";
      saveAll(all);
    }
  }

  function remove(id) {
    const all = loadAll().filter((x) => x.id !== id);
    saveAll(all);
  }

  function render(listEl, mixes, { onLoadMix, onRenameMix, onDeleteMix } = {}) {
    if (!listEl) return;

    listEl.innerHTML = "";

    if (!mixes.length) {
      const empty = document.createElement("div");
      empty.style.padding = "14px";
      empty.style.color = "var(--muted)";
      empty.style.fontSize = "13px";
      empty.textContent = "No saved mixes yet.";
      listEl.appendChild(empty);
      return;
    }

    mixes.forEach((mix) => {
      const row = document.createElement("div");
      row.className = "savedrow";

      const btn = document.createElement("button");
      btn.className = "saved";
      btn.type = "button";

      const title = document.createElement("div");
      title.className = "saved-title";
      title.textContent = mix.name || "Untitled";

      const meta = document.createElement("div");
      meta.className = "saved-meta";
      meta.textContent = `${mix.dateLabel} • ${countNonZero(mix.levels)} sounds`;

      btn.appendChild(title);
      btn.appendChild(meta);

      btn.addEventListener("click", () => onLoadMix?.(mix));

      const actions = document.createElement("div");
      actions.className = "saved-actions";

      const rename = document.createElement("button");
      rename.className = "smallbtn ghost";
      rename.type = "button";
      rename.textContent = "Rename";
      rename.addEventListener("click", (e) => {
        e.stopPropagation();
        onRenameMix?.(mix);
      });

      const del = document.createElement("button");
      del.className = "smallbtn ghost";
      del.type = "button";
      del.textContent = "Delete";
      del.addEventListener("click", (e) => {
        e.stopPropagation();
        onDeleteMix?.(mix);
      });

      actions.appendChild(rename);
      actions.appendChild(del);

      row.appendChild(btn);
      row.appendChild(actions);

      listEl.appendChild(row);
    });
  }

  window.SoundscapesStorage = {
    loadAll,
    addMix,
    createMix,
    updateName,
    remove,
    render,
  };
})();