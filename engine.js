/* engine.js — Shared breathing engine
   Exposes window.BreathingEngine
   Usage: BreathingEngine.init(config) — see README/plan for config shape */
(function (global) {
  'use strict';

  const THEME_KEY = 'breathingTheme';

  /* ── Screen Wake Lock ───────────────────────────────────── */
  let _wakeLock = null;
  async function acquireWakeLock() {
    if (!('wakeLock' in navigator)) return;
    try { _wakeLock = await navigator.wakeLock.request('screen'); } catch (_) {}
  }
  function releaseWakeLock() {
    if (_wakeLock) { _wakeLock.release(); _wakeLock = null; }
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && _s?.playing) acquireWakeLock();
  });
  const THEME_ARC = {
    sand:  { active: '#74C365',               hold: 'rgba(145,129,81,0.85)' },
    dark:  { active: 'rgba(96,165,250,0.85)', hold: 'rgba(251,191,36,0.85)' },
    light: { active: '#5b9ef5',               hold: 'rgba(145,129,81,0.7)'  },
  };
  const ARC_R = 105;
  const ARC_C = 2 * Math.PI * ARC_R;

  /* ── state ─────────────────────────────────────────────── */
  let _cfg = null;
  let _s = {
    playing: false,
    phaseIdx: 0,
    phaseStart: 0,
    phaseDur: 0,
    raf: null,
    sessionStart: 0,
    vol: 0.5,
    base: 4,
    cycleCount: 0,
    theme: 'dark',
    // count-based
    roundIdx: 0,
    breathCount: 0,
    cMode: 'cycle',   // 'cycle' | 'end' | 'rest'
    endIdx: 0,
  };
  let _ctx = null;
  let _snd = null;
  let _hum = null;   // oscillator ref for hum-out
  let $ = {};        // DOM refs

  /* ── audio context ──────────────────────────────────────── */
  function getCtx() {
    if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
    return _ctx;
  }

  function stopSnd() {
    if (_snd) { try { _snd.stop(0); } catch (_) {} _snd = null; }
    if (_hum) { try { _hum.stop(0); } catch (_) {} _hum = null; }
  }

  /* ── pink-noise buffer ──────────────────────────────────── */
  function pinkNoise(ctx, dur) {
    const len  = Math.ceil(ctx.sampleRate * dur);
    const buf  = ctx.createBuffer(1, len, ctx.sampleRate);
    const d    = buf.getChannelData(0);
    let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0=0.99886*b0+w*0.0555179; b1=0.99332*b1+w*0.0750759;
      b2=0.96900*b2+w*0.1538520; b3=0.86650*b3+w*0.3104856;
      b4=0.55000*b4+w*0.5329522; b5=-0.7616*b5-w*0.0168980;
      d[i] = (b0+b1+b2+b3+b4+b5+b6+w*0.5362) * 0.11;
      b6 = w * 0.115926;
    }
    return buf;
  }

  /* ── bandpass breath helper ─────────────────────────────── */
  function bpBreath(ctx, dur, vol, fFrom, fTo, peakG, Q) {
    const src = ctx.createBufferSource();
    src.buffer = pinkNoise(ctx, dur);
    const bpf = ctx.createBiquadFilter();
    bpf.type = 'bandpass'; bpf.Q.value = Q || 1.4;
    const gain = ctx.createGain();
    const now = ctx.currentTime, end = now + dur, ramp = dur * 0.12;
    bpf.frequency.setValueAtTime(fFrom, now);
    bpf.frequency.exponentialRampToValueAtTime(fTo, Math.max(now + 0.01, end - ramp));
    const pk = peakG * vol;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(pk, now + ramp * 1.5);
    gain.gain.setValueAtTime(pk * 0.94, Math.max(now + ramp * 1.5 + 0.01, end - ramp * 2));
    gain.gain.linearRampToValueAtTime(0, end);
    src.connect(bpf); bpf.connect(gain); gain.connect(ctx.destination);
    src.start(now);
    return src;
  }

  /* ── audio dispatcher ───────────────────────────────────── */
  function playAudio(type, dur, vol) {
    if (type === 'silent' || !type) return;
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();
    stopSnd();

    switch (type) {
      case 'nasal-in':
        _snd = bpBreath(ctx, dur, vol, 350, 1100, 0.32, 1.4); break;
      case 'nasal-out':
        _snd = bpBreath(ctx, dur, vol, 1100, 300, 0.32, 1.4); break;
      case 'nasal-in-muted':
        _snd = bpBreath(ctx, dur, vol, 350, 1100, 0.16, 1.4); break;
      case 'nasal-out-muted':
        _snd = bpBreath(ctx, dur, vol, 1100, 300, 0.16, 1.4); break;
      case 'mouth-out':
        _snd = bpBreath(ctx, dur, vol, 200, 600, 0.38, 0.8); break;
      case 'mouth-in':
        _snd = bpBreath(ctx, dur, vol, 250, 700, 0.30, 0.9); break;

      case 'sigh-in': {
        const mainDur = Math.max(0.5, dur * 0.70);
        const topDur  = Math.max(0.3, dur - mainDur - 0.25);
        _snd = bpBreath(ctx, mainDur, vol, 350, 1000, 0.32, 1.4);
        // second burst
        const ctx2 = ctx;
        const s2 = ctx2.createBufferSource();
        s2.buffer = pinkNoise(ctx2, topDur);
        const f2 = ctx2.createBiquadFilter(); f2.type = 'bandpass'; f2.Q.value = 1.4;
        const g2 = ctx2.createGain();
        const t2 = ctx2.currentTime + mainDur + 0.25;
        f2.frequency.setValueAtTime(700, t2);
        f2.frequency.exponentialRampToValueAtTime(1100, t2 + Math.max(0.05, topDur - 0.05));
        const pk2 = 0.28 * vol;
        g2.gain.setValueAtTime(0, t2);
        g2.gain.linearRampToValueAtTime(pk2, t2 + 0.08);
        g2.gain.setValueAtTime(pk2 * 0.9, t2 + Math.max(0.09, topDur - 0.05));
        g2.gain.linearRampToValueAtTime(0, t2 + topDur);
        s2.connect(f2); f2.connect(g2); g2.connect(ctx2.destination);
        s2.start(t2);
        break;
      }

      case 'hum-out': {
        const osc = ctx.createOscillator();
        osc.type = 'sine'; osc.frequency.value = 180;
        const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 5;
        const lfoG = ctx.createGain(); lfoG.gain.value = 4;
        lfo.connect(lfoG); lfoG.connect(osc.frequency);
        const noiseS = ctx.createBufferSource(); noiseS.buffer = pinkNoise(ctx, dur);
        const noiseF = ctx.createBiquadFilter(); noiseF.type = 'bandpass';
        noiseF.frequency.value = 180; noiseF.Q.value = 2;
        const noiseG = ctx.createGain(); noiseG.gain.value = 0.08 * vol;
        const mainG = ctx.createGain();
        const now = ctx.currentTime, end = now + dur, ramp = dur * 0.1;
        mainG.gain.setValueAtTime(0, now);
        mainG.gain.linearRampToValueAtTime(0.28 * vol, now + ramp);
        mainG.gain.setValueAtTime(0.28 * vol, Math.max(now + ramp + 0.01, end - ramp));
        mainG.gain.linearRampToValueAtTime(0, end);
        osc.connect(mainG); mainG.connect(ctx.destination);
        noiseS.connect(noiseF); noiseF.connect(noiseG); noiseG.connect(ctx.destination);
        osc.start(now); lfo.start(now); osc.stop(end); lfo.stop(end); noiseS.start(now);
        _hum = osc; _snd = noiseS;
        break;
      }

      case 'power': {
        const src = ctx.createBufferSource(); src.buffer = pinkNoise(ctx, dur);
        const bpf = ctx.createBiquadFilter(); bpf.type = 'bandpass'; bpf.Q.value = 0.6;
        bpf.frequency.value = 800;
        const gain = ctx.createGain();
        const now = ctx.currentTime, end = now + dur, ramp = Math.min(0.05, dur * 0.2);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.45 * vol, now + ramp);
        gain.gain.setValueAtTime(0.45 * vol * 0.8, Math.max(now + ramp + 0.01, end - ramp));
        gain.gain.linearRampToValueAtTime(0, end);
        src.connect(bpf); bpf.connect(gain); gain.connect(ctx.destination);
        src.start(now); _snd = src;
        break;
      }
    }
  }

  /* ── current phase ──────────────────────────────────────── */
  function curPhase() {
    if (!_cfg) return null;
    if (_cfg.mode === 'count-based') return curCountPhase();
    return _cfg.phases[_s.phaseIdx];
  }

  function curCountPhase() {
    const round = _cfg.rounds[_s.roundIdx];
    if (!round) return null;
    if (_s.cMode === 'cycle')  return round.phases[_s.phaseIdx % round.phases.length];
    if (_s.cMode === 'end')    return round.endPhases[_s.endIdx];
    if (_s.cMode === 'rest')   return round.restPhase;
    return null;
  }

  function phaseDur(phase) {
    if (phase.durationFn) return phase.durationFn(_s.base);
    return phase.duration !== undefined ? phase.duration : _s.base;
  }

  /* ── airway indicator ───────────────────────────────────── */
  function renderIndicator(phase) {
    if (!_cfg || _cfg.indicator === 'nadi' || _cfg.indicator === 'none') return;
    const active = phase && !phase.isHold ? (phase.indicator?.active || null) : null;
    const hold   = phase?.isHold || false;
    if (_cfg.indicator === 'nose-only') {
      const el = document.getElementById('noseOrb');
      if (!el) return;
      el.className = 'airway-orb' + (hold ? ' is-hold' : active === 'nose' ? ' is-active' : '');
    } else if (_cfg.indicator === 'nose-mouth') {
      const nose  = document.getElementById('noseOrb');
      const mouth = document.getElementById('mouthOrb');
      if (nose)  nose.className  = 'airway-orb' + (hold ? ' is-hold' : (active === 'nose'  || active === 'both') ? ' is-active' : '');
      if (mouth) mouth.className = 'airway-orb' + (hold ? ' is-hold' : (active === 'mouth' || active === 'both') ? ' is-active' : '');
    }
  }

  function resetIndicator() {
    ['noseOrb','mouthOrb'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.className = 'airway-orb';
    });
  }

  /* ── visuals ────────────────────────────────────────────── */
  function applyVisuals(phase) {
    if ($.phaseLabel)     $.phaseLabel.textContent  = phase.label;
    if ($.phaseIdle)      $.phaseIdle.style.display = 'none';
    if ($.arcFill) {
      $.arcFill.style.stroke = phase.isHold
        ? THEME_ARC[_s.theme].hold
        : THEME_ARC[_s.theme].active;
    }
    if (phase.openEnded && $.phaseCountdown) $.phaseCountdown.textContent = phase.hint || '';
    renderIndicator(phase);
    if (_cfg.onPhaseStart) _cfg.onPhaseStart(phase, _api);
  }

  function resetVisuals() {
    if ($.phaseLabel)     $.phaseLabel.textContent  = '';
    if ($.phaseCountdown) $.phaseCountdown.textContent = '';
    if ($.phaseIdle)      $.phaseIdle.style.display  = '';
    if ($.arcFill) {
      $.arcFill.style.strokeDashoffset = ARC_C;
      $.arcFill.style.stroke = THEME_ARC[_s.theme].active;
    }
    if ($.breathOrb) $.breathOrb.style.transform = '';
    resetIndicator();
    updateCountDisplay();
    if (_cfg?.onStop) _cfg.onStop(_api);
  }

  function updateCountDisplay() {
    if (!$.roundInfo) return;
    if (_cfg?.mode === 'count-based' && _s.playing) {
      const round = _cfg.rounds[_s.roundIdx];
      if (!round) return;
      $.roundInfo.style.display = '';
      if ($.roundLabel) {
        $.roundLabel.textContent = _cfg.rounds.length > 1
          ? `Round ${_s.roundIdx + 1} / ${_cfg.rounds.length}`
          : '';
      }
      if ($.breathLabel) {
        if (_s.cMode === 'cycle') {
          $.breathLabel.textContent = `${_s.breathCount + 1} / ${round.count}`;
        } else if (_s.cMode === 'rest') {
          $.breathLabel.textContent = 'Rest';
        } else {
          $.breathLabel.textContent = '';
        }
      }
    } else if ($.roundInfo) {
      $.roundInfo.style.display = 'none';
    }
  }

  /* ── phase start ────────────────────────────────────────── */
  function startPhase() {
    if (!_s.playing) return;
    const phase = curPhase();
    if (!phase) return;
    _s.phaseStart = performance.now();
    _s.phaseDur   = phaseDur(phase);
    applyVisuals(phase);
    updateCountDisplay();
    if (!phase.isHold && phase.audioType !== 'silent') {
      playAudio(phase.audioType, _s.phaseDur, _s.vol);
    }
  }

  /* ── phase advance ──────────────────────────────────────── */
  function advancePhase() {
    if (!_cfg || !_s.playing) return;
    if (_cfg.mode === 'fixed-cycle' || _cfg.mode === 'free') {
      const next = (_s.phaseIdx + 1) % _cfg.phases.length;
      if (next === 0) {
        _s.cycleCount++;
        if (_cfg.controls?.maxCycles && _s.cycleCount >= _cfg.controls.maxCycles) {
          stop(); return;
        }
      }
      _s.phaseIdx = next;
      startPhase();
    } else if (_cfg.mode === 'count-based') {
      advanceCountPhase();
    }
  }

  function advanceCountPhase() {
    const round = _cfg.rounds[_s.roundIdx];
    if (!round) { stop(); return; }

    if (_s.cMode === 'cycle') {
      const cycLen = round.phases.length;
      const nextIn = (_s.phaseIdx + 1) % cycLen;
      if (nextIn === 0) {
        _s.breathCount++;
        if (_s.breathCount >= round.count) {
          _s.breathCount = 0;
          if (round.endPhases?.length) { _s.cMode = 'end'; _s.endIdx = 0; }
          else nextRound(); return;
        }
        _s.phaseIdx = 0;
      } else {
        _s.phaseIdx = nextIn;
      }
    } else if (_s.cMode === 'end') {
      const nextE = _s.endIdx + 1;
      if (nextE >= round.endPhases.length) { nextRound(); return; }
      _s.endIdx = nextE;
    } else if (_s.cMode === 'rest') {
      _s.roundIdx++;
      if (_s.roundIdx >= _cfg.rounds.length) { stop(); return; }
      _s.cMode = 'cycle'; _s.phaseIdx = 0; _s.breathCount = 0;
    }
    startPhase();
  }

  function nextRound() {
    const round = _cfg.rounds[_s.roundIdx];
    if (round?.restPhase) {
      _s.cMode = 'rest'; startPhase();
    } else {
      _s.roundIdx++;
      if (_s.roundIdx >= _cfg.rounds.length) { stop(); return; }
      _s.cMode = 'cycle'; _s.phaseIdx = 0; _s.breathCount = 0; startPhase();
    }
  }

  /* ── tick ───────────────────────────────────────────────── */
  function tick(now) {
    if (!_s.playing) return;
    const elapsed  = (now - _s.phaseStart) / 1000;
    const progress = Math.min(1, elapsed / _s.phaseDur);
    const phase    = curPhase();

    // Session timer
    const tot = Math.floor((now - _s.sessionStart) / 1000);
    if ($.sessionTimer) $.sessionTimer.textContent = `${Math.floor(tot/60)}:${String(tot%60).padStart(2,'0')}`;

    // Countdown — show breath count in cycle mode, normal countdown otherwise
    if ($.phaseCountdown && !phase?.openEnded) {
      if (_cfg.mode === 'count-based' && _s.cMode === 'cycle') {
        const round = _cfg.rounds[_s.roundIdx];
        $.phaseCountdown.textContent = round ? `${_s.breathCount + 1} / ${round.count}` : '';
      } else {
        $.phaseCountdown.textContent = Math.ceil(Math.max(0, _s.phaseDur - elapsed));
      }
    }

    // Arc
    if ($.arcFill) $.arcFill.style.strokeDashoffset = ARC_C * (1 - progress);

    // Orb scale
    if ($.breathOrb && phase) {
      const ease = progress < 0.5 ? 2*progress*progress : -1+(4-2*progress)*progress;
      let sc;
      if      (phase.orbScale === 'inhale') sc = 0.84 + 0.16 * ease;
      else if (phase.orbScale === 'exhale') sc = 1.00 - 0.16 * ease;
      else if (phase.orbScale === 'power')  sc = 0.88 + 0.12 * Math.sin(progress * Math.PI);
      else                                  sc = 1.00;
      $.breathOrb.style.transform = `scale(${sc.toFixed(4)})`;
    }

    // Auto-advance
    if (!phase?.openEnded && elapsed >= _s.phaseDur) advancePhase();

    if (_s.playing) _s.raf = requestAnimationFrame(tick);
  }

  /* ── play / pause / stop ────────────────────────────────── */
  function play() {
    _s.playing = true; _s.sessionStart = performance.now();
    _s.cycleCount = 0; _s.phaseIdx = 0;
    _s.roundIdx = 0; _s.breathCount = 0; _s.cMode = 'cycle'; _s.endIdx = 0;
    if ($.playBtn) $.playBtn.textContent = '⏸';
    if ($.sessionTimer) $.sessionTimer.textContent = '0:00';
    acquireWakeLock();
    startPhase();
    _s.raf = requestAnimationFrame(tick);
  }

  function pause() {
    _s.playing = false;
    if ($.playBtn) $.playBtn.textContent = '▶';
    if (_s.raf) cancelAnimationFrame(_s.raf);
    stopSnd();
    releaseWakeLock();
  }

  function stop() {
    pause();
    resetVisuals();
    _s.phaseIdx = 0;
  }

  /* ── theme ──────────────────────────────────────────────── */
  function applyTheme(t) {
    _s.theme = t;
    document.body.className = document.body.className.replace(/theme-\S+/, '').trim() + ' theme-' + t;
    localStorage.setItem(THEME_KEY, t);
    document.querySelectorAll('.theme-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.theme === t));
    if ($.arcFill) {
      const ph = _s.playing ? curPhase() : null;
      $.arcFill.style.stroke = ph?.isHold ? THEME_ARC[t].hold : THEME_ARC[t].active;
    }
  }

  /* ── about modal ────────────────────────────────────────── */
  function injectAbout(about) {
    if (!about) return;
    const overlay = document.createElement('div');
    overlay.className = 'about-overlay'; overlay.id = 'aboutOverlay'; overlay.hidden = true;
    const bens = (about.benefits || []).map(b => `<li>${b}</li>`).join('');
    const caus = (about.cautions || []).map(c => `<li>${c}</li>`).join('');
    overlay.innerHTML = `<div class="about-modal" role="dialog">
      <button class="about-close" id="aboutClose" aria-label="Close">×</button>
      <h2 class="about-title">${about.title || _cfg.title}</h2>
      <p class="about-desc">${about.description || ''}</p>
      ${bens ? `<div class="about-section"><h3>Benefits</h3><ul>${bens}</ul></div>` : ''}
      ${caus ? `<div class="about-section about-cautions"><h3>Cautions</h3><ul>${caus}</ul></div>` : ''}
    </div>`;
    document.body.appendChild(overlay);
    document.getElementById('aboutClose').addEventListener('click', closeAbout);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeAbout(); });
    const btn = document.getElementById('aboutBtn');
    if (btn) btn.addEventListener('click', openAbout);
  }

  function openAbout()  { const el = document.getElementById('aboutOverlay'); if (el) el.hidden = false; }
  function closeAbout() { const el = document.getElementById('aboutOverlay'); if (el) el.hidden = true;  }

  /* ── indicator injection ────────────────────────────────── */
  function injectIndicator(type) {
    if (type === 'nadi' || type === 'none') return;
    const stage = document.getElementById('stage');
    if (!stage) return;
    const wrap = stage.querySelector('.breath-wrap');
    const div  = document.createElement('div');
    div.className = 'airway-indicator'; div.id = 'airwayIndicator';
    if (type === 'nose-mouth') {
      div.innerHTML = `
        <div class="airway-orb" id="noseOrb">
          <span class="airway-icon">👃</span>
          <span class="airway-label">nose</span>
        </div>
        <div class="airway-line"></div>
        <div class="airway-orb" id="mouthOrb">
          <span class="airway-icon">👄</span>
          <span class="airway-label">mouth</span>
        </div>`;
    } else if (type === 'nose-only') {
      div.innerHTML = `
        <div class="airway-orb" id="noseOrb">
          <span class="airway-icon">👃</span>
          <span class="airway-label">nose</span>
        </div>`;
    }
    if (wrap) stage.insertBefore(div, wrap);
    else stage.appendChild(div);
  }

  /* ── length controls ────────────────────────────────────── */
  function injectControls(controls) {
    const container = document.getElementById('engineControls');
    if (!container || !controls?.lengths) return;
    const grp = document.createElement('div'); grp.className = 'length-group';
    const lbl = document.createElement('span'); lbl.className = 'length-label'; lbl.textContent = 'Length';
    grp.appendChild(lbl);
    controls.lengths.forEach(s => {
      const btn = document.createElement('button');
      btn.className = 'len-btn' + (s === (_s.base) ? ' active' : '');
      btn.dataset.s = s; btn.textContent = `${s} s`;
      btn.addEventListener('click', () => {
        if (btn.classList.contains('active')) return;
        const was = _s.playing; if (was) pause();
        container.querySelectorAll('.len-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        _s.base = parseInt(btn.dataset.s, 10);
        _s.phaseIdx = 0;
        if (was) play(); else resetVisuals();
      });
      grp.appendChild(btn);
    });
    container.appendChild(grp);
  }

  /* ── round/count display for count-based ───────────────── */
  function injectCountDisplay() {
    const stage = document.getElementById('stage');
    if (!stage) return;
    const info = document.createElement('div'); info.className = 'round-info'; info.id = 'roundInfo';
    info.style.display = 'none';
    info.innerHTML = `<div class="round-label" id="roundLabel"></div>
                      <div class="breath-label" id="breathLabel"></div>`;
    stage.insertBefore(info, stage.firstChild);
    $.roundInfo   = info;
    $.roundLabel  = document.getElementById('roundLabel');
    $.breathLabel = document.getElementById('breathLabel');
  }

  /* ── safety screen (advanced exercises) ────────────────── */
  function maybeInjectSafety(safety) {
    if (!safety) return;
    const key = 'ack_' + (safety.key || 'adv');
    if (localStorage.getItem(key)) return;
    const overlay = document.createElement('div');
    overlay.className = 'safety-overlay'; overlay.id = 'safetyOverlay';
    overlay.innerHTML = `<div class="safety-modal">
      <div class="safety-icon">⚠</div>
      <h2>${safety.title || 'Safety Notice'}</h2>
      <p>${safety.body || ''}</p>
      <button class="safety-btn" id="safetyOk">I understand — continue</button>
    </div>`;
    document.body.appendChild(overlay);
    document.getElementById('safetyOk').addEventListener('click', () => {
      localStorage.setItem(key, '1');
      overlay.remove();
    });
  }

  /* ── init ───────────────────────────────────────────────── */
  function init(cfg) {
    _cfg = cfg;
    _s.base  = cfg.controls?.defaultLength || 4;
    _s.theme = localStorage.getItem(THEME_KEY) || 'dark';

    // Apply theme
    const cls = document.body.className.replace(/theme-\S+/g, '').trim();
    document.body.className = (cls ? cls + ' ' : '') + 'theme-' + _s.theme;

    // Cache DOM refs
    $ = {
      arcFill:      document.getElementById('arcFill'),
      breathOrb:    document.getElementById('breathOrb'),
      phaseLabel:   document.getElementById('phaseLabel'),
      phaseCountdown: document.getElementById('phaseCountdown'),
      phaseIdle:    document.getElementById('phaseIdle'),
      playBtn:      document.getElementById('playBtn'),
      sessionTimer: document.getElementById('sessionTimer'),
    };

    // Init arc
    if ($.arcFill) {
      $.arcFill.style.strokeDasharray  = ARC_C;
      $.arcFill.style.strokeDashoffset = ARC_C;
      $.arcFill.style.stroke = THEME_ARC[_s.theme].active;
    }

    // Play button
    if ($.playBtn) $.playBtn.addEventListener('click', () => {
      if (_s.playing) stop(); else play();
    });

    // Orb click — tap-to-continue for open-ended, otherwise toggle play
    if ($.breathOrb) $.breathOrb.addEventListener('click', () => {
      if (_s.playing && curPhase()?.openEnded) advancePhase();
      else if ($.playBtn) $.playBtn.click();
    });

    // Volume
    const vol = document.getElementById('volSlider');
    if (vol) {
      _s.vol = parseFloat(vol.value) || 0.5;
      vol.addEventListener('input', e => { _s.vol = parseFloat(e.target.value); });
    }

    // Theme buttons
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === _s.theme);
      btn.addEventListener('click', () => applyTheme(btn.dataset.theme));
    });

    // Keyboard: space = play/pause
    document.addEventListener('keydown', e => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        if ($.playBtn) $.playBtn.click();
      }
    });

    // Build DOM
    injectIndicator(cfg.indicator);
    injectControls(cfg.controls);
    if (cfg.mode === 'count-based') injectCountDisplay();
    injectAbout(cfg.about);
    maybeInjectSafety(cfg.safety);
  }

  const _api = { play, pause, stop, advancePhase, get state() { return _s; } };
  global.BreathingEngine = { init };

})(window);
