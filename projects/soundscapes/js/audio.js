// audio.js — Web Audio engine for Soundscapes
// Exposes: window.SoundscapesAudio

(() => {
  const SOURCES = {
    rain: "sounds/rain.wav",
    wind: "sounds/wind.wav",
    traffic: "sounds/traffic.wav",
    room: "sounds/room.wav",
    hum: "sounds/hum.wav",
    noise: "sounds/noise.wav",
  };

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  // nicer curve: makes low knob values usable
  function curve(v01) {
    return Math.pow(clamp(v01, 0, 1), 1.8);
  }

  const SMOOTH = 0.06; // seconds

  // Start/stop hysteresis to prevent flapping near zero
  const START_AT = 0.006; // if knob > this -> ensure playing
  const STOP_AT = 0.003;  // if knob <= this -> eligible to stop
  const STOP_DELAY_MS = 700; // give it time + avoid accidental cutoffs

  class Engine {
    constructor() {
      this.ctx = null;
      this.master = null;
      this.layers = new Map(); // name -> { gain, buffer, src, playing }
      this.unlocked = false;
      this.loading = false;
      this.stopTimers = new Map(); // name -> timeoutId
    }

    _ensureCtx() {
      if (this.ctx) return this.ctx;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) throw new Error("Web Audio not supported");
      this.ctx = new AC();

      this.master = this.ctx.createGain();
      this.master.gain.value = 0.8;
      this.master.connect(this.ctx.destination);

      return this.ctx;
    }

    async _decode(url) {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Missing sound file: ${url}`);
      const arr = await res.arrayBuffer();
      return await this.ctx.decodeAudioData(arr);
    }

    async loadAll() {
      if (this.loading) return;
      this.loading = true;

      this._ensureCtx();

      // create gains first
      Object.keys(SOURCES).forEach((name) => {
        const g = this.ctx.createGain();
        g.gain.value = 0;
        g.connect(this.master);
        this.layers.set(name, { gain: g, buffer: null, src: null, playing: false });
      });

      // load buffers
      for (const [name, url] of Object.entries(SOURCES)) {
        try {
          const buf = await this._decode(url);
          this.layers.get(name).buffer = buf;
        } catch (e) {
          console.error(e);
        }
      }

      this.loading = false;
    }

    async unlock() {
      if (this.unlocked) return;

      this._ensureCtx();

      if (this.ctx.state === "suspended") {
        try {
          await this.ctx.resume();
        } catch (e) {
          console.warn("Audio resume failed", e);
        }
      }

      if (!this.layers.size) {
        await this.loadAll();
      }

      this.unlocked = true;
    }

    _clearStopTimer(name) {
      const id = this.stopTimers.get(name);
      if (id) {
        clearTimeout(id);
        this.stopTimers.delete(name);
      }
    }

    _start(name) {
      const layer = this.layers.get(name);
      if (!layer || layer.playing || !layer.buffer) return;

      this._clearStopTimer(name);

      const src = this.ctx.createBufferSource();
      src.buffer = layer.buffer;
      src.loop = true;

      // If you ever switch buffers or stop manually, keep state consistent
      src.onended = () => {
        if (layer.src === src) {
          layer.src = null;
          layer.playing = false;
        }
      };

      src.connect(layer.gain);
      src.start(0);

      layer.src = src;
      layer.playing = true;
    }

    _stop(name) {
      const layer = this.layers.get(name);
      if (!layer || !layer.playing) return;

      this._clearStopTimer(name);

      try {
        layer.src?.stop();
      } catch {}

      try {
        layer.src?.disconnect();
      } catch {}

      layer.src = null;
      layer.playing = false;
    }

    setLayer(name, v01) {
      if (!this.unlocked) return;
      const layer = this.layers.get(name);
      if (!layer) return;

      const v = clamp(v01, 0, 1);

      // start if we're meaningfully above zero (hysteresis)
      if (v > START_AT) this._start(name);

      const t = this.ctx.currentTime;
      const target = curve(v);

      layer.gain.gain.cancelScheduledValues(t);
      layer.gain.gain.setTargetAtTime(target, t, SMOOTH);

      // stop only if we're really at ~zero, and cancel if user raises again
      if (v <= STOP_AT) {
        this._clearStopTimer(name);
        const timer = setTimeout(() => {
          // stop only if still near zero when timer fires
          const currentGain = layer.gain.gain.value;
          if (currentGain <= curve(STOP_AT) + 0.0005) this._stop(name);
        }, STOP_DELAY_MS);
        this.stopTimers.set(name, timer);
      } else {
        this._clearStopTimer(name);
      }
    }

    setMaster(v01) {
      if (!this.unlocked) return;
      const v = clamp(v01, 0, 1);

      const t = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(t);
      this.master.gain.setTargetAtTime(v, t, SMOOTH);
    }
  }

  window.SoundscapesAudio = new Engine();
})();