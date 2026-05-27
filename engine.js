/* engine.js — Shared breathing engine. Exposes window.BreathingEngine */
(function (global) {
  'use strict';

  const THEME_KEY = 'breathingTheme';

  /* ── Wake Lock ──────────────────────────────────────────── */
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

  /* ── State ──────────────────────────────────────────────── */
  let _cfg = null;
  let _s = {
    playing: false, phaseIdx: 0, phaseStart: 0, phaseDur: 0,
    raf: null, sessionStart: 0, vol: 0.5, base: 4, cycleCount: 0, theme: 'dark',
    roundIdx: 0, breathCount: 0, cMode: 'cycle', endIdx: 0,
  };
  let _ctx = null, _snd = null, _hum = null;
  let $ = {};

  /* ── Audio context ──────────────────────────────────────── */
  function getCtx() {
    if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
    return _ctx;
  }
  function stopSnd() {
    if (_snd) { try { _snd.stop(0); } catch (_) {} _snd = null; }
    if (_hum) { try { _hum.stop(0); } catch (_) {} _hum = null; }
  }

  /* ── Pink-noise buffer ──────────────────────────────────── */
  function pinkNoise(ctx, dur) {
    const len = Math.ceil(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d   = buf.getChannelData(0);
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

  /* ── Bandpass breath helper — softer gains + longer ramps ── */
  function bpBreath(ctx, dur, vol, fFrom, fTo, peakG, Q) {
    const src = ctx.createBufferSource();
    src.buffer = pinkNoise(ctx, dur);
    const bpf  = ctx.createBiquadFilter();
    bpf.type = 'bandpass'; bpf.Q.value = Q || 1.0;
    const gain = ctx.createGain();
    const now  = ctx.currentTime, end = now + dur, ramp = dur * 0.20;
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

  /* ── Audio dispatcher ───────────────────────────────────── */
  function playAudio(type, dur, vol) {
    if (type === 'silent' || !type) return;
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();
    stopSnd();
    switch (type) {
      /* inhales sweep UP in frequency */
      case 'nasal-in':       _snd = bpBreath(ctx, dur, vol,  350, 1100, 0.20, 1.0); break;
      case 'nasal-in-muted': _snd = bpBreath(ctx, dur, vol,  350, 1100, 0.12, 1.0); break;
      /* exhales sweep DOWN in frequency */
      case 'nasal-out':      _snd = bpBreath(ctx, dur, vol, 1100,  300, 0.20, 1.0); break;
      case 'nasal-out-muted':_snd = bpBreath(ctx, dur, vol, 1100,  300, 0.12, 1.0); break;
      /* mouth exhale: lower freq range, airier Q */
      case 'mouth-out':      _snd = bpBreath(ctx, dur, vol,  600,  150, 0.28, 0.65); break;
      case 'mouth-in':       _snd = bpBreath(ctx, dur, vol,  250,  700, 0.20, 0.9);  break;

      /* sharp top-up inhale (Physiological Sigh second burst) */
      case 'nasal-in-sharp': {
        const src = ctx.createBufferSource(); src.buffer = pinkNoise(ctx, dur);
        const bpf = ctx.createBiquadFilter(); bpf.type = 'bandpass'; bpf.Q.value = 1.2;
        const g   = ctx.createGain();
        const now = ctx.currentTime, end = now + dur;
        bpf.frequency.setValueAtTime(600, now);
        bpf.frequency.exponentialRampToValueAtTime(1100, Math.max(now + 0.01, end - 0.08));
        const pk = 0.22 * vol;
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(pk, now + 0.04);
        g.gain.setValueAtTime(pk * 0.9, Math.max(now + 0.05, end - 0.08));
        g.gain.linearRampToValueAtTime(0, end);
        src.connect(bpf); bpf.connect(g); g.connect(ctx.destination);
        src.start(now); _snd = src;
        break;
      }

      case 'sigh-in': {
        const mainDur = Math.max(0.5, dur * 0.70);
        const topDur  = Math.max(0.3, dur - mainDur - 0.25);
        _snd = bpBreath(ctx, mainDur, vol, 350, 1000, 0.20, 1.0);
        const s2 = ctx.createBufferSource(); s2.buffer = pinkNoise(ctx, topDur);
        const f2 = ctx.createBiquadFilter(); f2.type = 'bandpass'; f2.Q.value = 1.2;
        const g2 = ctx.createGain();
        const t2 = ctx.currentTime + mainDur + 0.25;
        f2.frequency.setValueAtTime(700, t2);
        f2.frequency.exponentialRampToValueAtTime(1100, t2 + Math.max(0.05, topDur - 0.05));
        const pk2 = 0.18 * vol;
        g2.gain.setValueAtTime(0, t2);
        g2.gain.linearRampToValueAtTime(pk2, t2 + 0.08);
        g2.gain.setValueAtTime(pk2 * 0.9, t2 + Math.max(0.09, topDur - 0.05));
        g2.gain.linearRampToValueAtTime(0, t2 + topDur);
        s2.connect(f2); f2.connect(g2); g2.connect(ctx.destination);
        s2.start(t2);
        break;
      }

      case 'hum-out': {
        const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = 180;
        const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 5;
        const lfoG = ctx.createGain(); lfoG.gain.value = 4;
        lfo.connect(lfoG); lfoG.connect(osc.frequency);
        const noiseS = ctx.createBufferSource(); noiseS.buffer = pinkNoise(ctx, dur);
        const noiseF = ctx.createBiquadFilter(); noiseF.type = 'bandpass';
        noiseF.frequency.value = 180; noiseF.Q.value = 2;
        const noiseG = ctx.createGain(); noiseG.gain.value = 0.06 * vol;
        const mainG  = ctx.createGain();
        const now = ctx.currentTime, end = now + dur, ramp = dur * 0.1;
        mainG.gain.setValueAtTime(0, now);
        mainG.gain.linearRampToValueAtTime(0.22 * vol, now + ramp);
        mainG.gain.setValueAtTime(0.22 * vol, Math.max(now + ramp + 0.01, end - ramp));
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
        gain.gain.linearRampToValueAtTime(0.38 * vol, now + ramp);
        gain.gain.setValueAtTime(0.38 * vol * 0.8, Math.max(now + ramp + 0.01, end - ramp));
        gain.gain.linearRampToValueAtTime(0, end);
        src.connect(bpf); bpf.connect(gain); gain.connect(ctx.destination);
        src.start(now); _snd = src;
        break;
      }
    }
  }

  /* ── Phase normalization (short aliases → canonical fields) ─ */
  function normPhase(p) {
    if (!p) return p;
    const scale  = p.scale  || p.orbScale  || 'hold';
    const isHold = p.isHold !== undefined ? p.isHold : (scale === 'hold');
    return {
      ...p,
      durationFn: p.fn || p.durationFn,
      audioType:  p.audio || p.audioType || 'silent',
      orbScale:   scale,
      isHold,
    };
  }

  /* ── Current phase ──────────────────────────────────────── */
  function curPhase() {
    if (!_cfg) return null;
    if (_cfg.mode === 'count-based') return normPhase(curCountPhase());
    return normPhase(_cfg.phases[_s.phaseIdx]);
  }

  function curCountPhase() {
    const round = _cfg.rounds[_s.roundIdx];
    if (!round) return null;
    if (_s.cMode === 'cycle') return round.phases[_s.phaseIdx % round.phases.length];
    if (_s.cMode === 'end')   return round.endPhases[_s.endIdx];
    if (_s.cMode === 'rest')  return round.restPhase;
    return null;
  }

  function phaseDur(phase) {
    if (!phase) return 0;
    const fn = phase.fn || phase.durationFn;
    if (fn) return fn(_s.base);
    return phase.duration !== undefined ? phase.duration : _s.base;
  }

  /* ── Indicator type inference ───────────────────────────── */
  function inferIndicator(cfg) {
    if (cfg.indicator) return cfg.indicator;
    const allPhases = cfg.phases ||
      (cfg.rounds || []).flatMap(r =>
        [...(r.phases||[]), ...(r.endPhases||[]), r.restPhase].filter(Boolean));
    const vias = allPhases.map(p => p.via || p.indicator?.active).filter(Boolean);
    if (vias.some(v => v === 'mouth' || v === 'tongue')) return 'nose-mouth';
    if (vias.some(v => v === 'nose'  || v === 'throat' || v === 'nose-sharp')) return 'nose-only';
    return 'none';
  }

  /* ── Airway indicator rendering ─────────────────────────── */
  function renderIndicator(phase) {
    const indType = _cfg?._indicatorType;
    if (!indType || indType === 'nadi' || indType === 'none') return;
    /* support both new via field and old indicator.active */
    const via  = phase?.via || phase?.indicator?.active;
    const hold = phase?.isHold || false;
    const noseActive  = !hold && (via === 'nose' || via === 'throat' || via === 'nose-sharp');
    const mouthActive = !hold && (via === 'mouth' || via === 'tongue');

    const noseEl  = document.getElementById('noseOrb');
    const mouthEl = document.getElementById('mouthOrb');

    if (noseEl) {
      noseEl.className = 'airway-orb' + (hold ? ' is-hold' : noseActive ? ' is-active' : '');
      const note = noseEl.querySelector('.airway-note');
      if (note) note.textContent = (noseActive && via === 'throat') ? 'throat'
        : (noseActive && via === 'nose-sharp') ? '+' : '';
    }
    if (mouthEl) {
      mouthEl.className = 'airway-orb' + (hold ? ' is-hold' : mouthActive ? ' is-active' : '');
      const note = mouthEl.querySelector('.airway-note');
      if (note) note.textContent = (mouthActive && via === 'tongue') ? 'tongue' : '';
    }
  }

  function resetIndicator() {
    ['noseOrb','mouthOrb'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.className = 'airway-orb';
        const note = el.querySelector('.airway-note');
        if (note) note.textContent = '';
      }
    });
  }

  /* ── Nadi Shodhana orb injection ────────────────────────── */
  function injectNadiOrbs() {
    const stage  = document.getElementById('stage');
    const center = document.getElementById('stageCenter');
    if (!stage || !center) return;

    const mkSide = (id, statusId, name) => {
      const d = document.createElement('div');
      d.className = 'nostril'; d.id = id;
      d.innerHTML = `<div class="nostril-orb">🌬</div>
                     <div class="nostril-name">${name}</div>
                     <div class="nostril-status" id="${statusId}"></div>`;
      return d;
    };
    stage.insertBefore(mkSide('nostrilLeft',  'leftStatus',  'Left'),  center);
    stage.appendChild (mkSide('nostrilRight', 'rightStatus', 'Right'));

    const guide = document.createElement('div');
    guide.className = 'finger-guide';
    guide.textContent = 'thumb → right · ring → left';
    center.appendChild(guide);
  }

  function setNostrilState(side, state, txt) {
    const el = document.getElementById(side === 'left' ? 'nostrilLeft'  : 'nostrilRight');
    const st = document.getElementById(side === 'left' ? 'leftStatus'   : 'rightStatus');
    if (el) el.className = 'nostril' + (state ? ' is-' + state : '');
    if (st) st.textContent = txt;
  }

  function applyNadiPhase(phase) {
    if (phase.close === 'both') {
      setNostrilState('left',  'hold', 'hold');
      setNostrilState('right', 'hold', 'hold');
    } else {
      const ls = phase.nostril === 'left'  ? 'active' : (phase.close === 'left'  ? 'closed' : '');
      const rs = phase.nostril === 'right' ? 'active' : (phase.close === 'right' ? 'closed' : '');
      setNostrilState('left',  ls, ls === 'active' ? phase.label.toLowerCase() : ls === 'closed' ? 'closed' : '');
      setNostrilState('right', rs, rs === 'active' ? phase.label.toLowerCase() : rs === 'closed' ? 'closed' : '');
    }
  }

  /* ── Next-phase preview ─────────────────────────────────── */
  function updateNextPhase() {
    const el = document.getElementById('nextPhase');
    if (!el) return;
    if (!_s.playing || _cfg?.mode === 'count-based' || _cfg?._indicatorType === 'nadi') {
      el.textContent = ''; return;
    }
    const phases = _cfg?.phases;
    if (!phases || phases.length < 2) { el.textContent = ''; return; }
    const next = normPhase(phases[(_s.phaseIdx + 1) % phases.length]);
    const dur  = Math.round(phaseDur(next));
    el.textContent = `Next: ${next.label} · ${dur} s`;
  }

  /* ── Visuals ────────────────────────────────────────────── */
  function applyVisuals(phase) {
    if ($.phaseLabel)    $.phaseLabel.textContent  = phase.label;
    if ($.phaseIdle)     $.phaseIdle.style.display = 'none';
    if ($.arcFill) $.arcFill.style.stroke = phase.isHold ? THEME_ARC[_s.theme].hold : THEME_ARC[_s.theme].active;
    if (phase.openEnded && $.phaseCountdown) $.phaseCountdown.textContent = phase.hint || '';
    if (_cfg._indicatorType === 'nadi') applyNadiPhase(phase);
    else renderIndicator(phase);
    updateNextPhase();
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
    if (_cfg._indicatorType === 'nadi') { setNostrilState('left','',''); setNostrilState('right','',''); }
    else resetIndicator();
    const el = document.getElementById('nextPhase');
    if (el) el.textContent = '';
    updateCountDisplay();
    if (_cfg?.onStop) _cfg.onStop(_api);
  }

  function updateCountDisplay() {
    if (!$.roundInfo) return;
    if (_cfg?.mode === 'count-based' && _s.playing) {
      const round = _cfg.rounds[_s.roundIdx];
      if (!round) return;
      $.roundInfo.style.display = '';
      if ($.roundLabel) $.roundLabel.textContent = _cfg.rounds.length > 1 ? `Round ${_s.roundIdx + 1} / ${_cfg.rounds.length}` : '';
      if ($.breathLabel) {
        if (_s.cMode === 'cycle') $.breathLabel.textContent = `${_s.breathCount + 1} / ${round.count}`;
        else if (_s.cMode === 'rest') $.breathLabel.textContent = 'Rest';
        else $.breathLabel.textContent = '';
      }
    } else if ($.roundInfo) {
      $.roundInfo.style.display = 'none';
    }
  }

  /* ── Phase start ────────────────────────────────────────── */
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

  /* ── Phase advance ──────────────────────────────────────── */
  function advancePhase() {
    if (!_cfg || !_s.playing) return;
    if (_cfg.mode === 'fixed-cycle' || _cfg.mode === 'free') {
      const next = (_s.phaseIdx + 1) % _cfg.phases.length;
      if (next === 0) {
        _s.cycleCount++;
        if (_cfg.controls?.maxCycles && _s.cycleCount >= _cfg.controls.maxCycles) { stop(); return; }
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
      } else { _s.phaseIdx = nextIn; }
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
    if (round?.restPhase) { _s.cMode = 'rest'; startPhase(); }
    else {
      _s.roundIdx++;
      if (_s.roundIdx >= _cfg.rounds.length) { stop(); return; }
      _s.cMode = 'cycle'; _s.phaseIdx = 0; _s.breathCount = 0; startPhase();
    }
  }

  /* ── Tick ───────────────────────────────────────────────── */
  function tick(now) {
    if (!_s.playing) return;
    const elapsed  = (now - _s.phaseStart) / 1000;
    const progress = Math.min(1, elapsed / _s.phaseDur);
    const phase    = curPhase();

    const tot = Math.floor((now - _s.sessionStart) / 1000);
    if ($.sessionTimer) $.sessionTimer.textContent = `${Math.floor(tot/60)}:${String(tot%60).padStart(2,'0')}`;

    if ($.phaseCountdown && !phase?.openEnded) {
      if (_cfg.mode === 'count-based' && _s.cMode === 'cycle') {
        const round = _cfg.rounds[_s.roundIdx];
        $.phaseCountdown.textContent = round ? `${_s.breathCount + 1} / ${round.count}` : '';
      } else {
        $.phaseCountdown.textContent = Math.ceil(Math.max(0, _s.phaseDur - elapsed));
      }
    }

    if ($.arcFill) $.arcFill.style.strokeDashoffset = ARC_C * (1 - progress);

    if ($.breathOrb && phase) {
      const ease = progress < 0.5 ? 2*progress*progress : -1+(4-2*progress)*progress;
      let sc;
      if      (phase.orbScale === 'inhale') sc = 0.84 + 0.16 * ease;
      else if (phase.orbScale === 'exhale') sc = 1.00 - 0.16 * ease;
      else if (phase.orbScale === 'power')  sc = 0.88 + 0.12 * Math.sin(progress * Math.PI);
      else                                  sc = 1.00;
      $.breathOrb.style.transform = `scale(${sc.toFixed(4)})`;
    }

    if (!phase?.openEnded && elapsed >= _s.phaseDur) advancePhase();
    if (_s.playing) _s.raf = requestAnimationFrame(tick);
  }

  /* ── Play / Pause / Stop ────────────────────────────────── */
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
    stopSnd(); releaseWakeLock();
  }

  function stop() { pause(); resetVisuals(); _s.phaseIdx = 0; }

  /* ── Theme ──────────────────────────────────────────────── */
  function applyTheme(t) {
    _s.theme = t;
    document.body.className = document.body.className.replace(/theme-\S+/, '').trim() + ' theme-' + t;
    localStorage.setItem(THEME_KEY, t);
    document.querySelectorAll('.theme-btn').forEach(b => b.classList.toggle('active', b.dataset.theme === t));
    if ($.arcFill) {
      const ph = _s.playing ? curPhase() : null;
      $.arcFill.style.stroke = ph?.isHold ? THEME_ARC[t].hold : THEME_ARC[t].active;
    }
  }

  /* ── buildPage — generates all structural HTML ──────────── */
  function buildPage(cfg) {
    const icons    = cfg.safety?.icons || [];
    const bookSVG  = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`;
    const pregSVG  = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><circle cx="12" cy="4.5" r="2.2"/><path d="M9.5 7.5 C8 8.5 7.5 10.5 7.5 12.5 C7.5 16 9.5 18.5 12 19 C14.5 18.5 16.5 16 16.5 12.5 C16.5 10.5 16 8.5 14.5 7.5Z"/><path d="M7.5 12.5 C5.5 12.5 5 14.5 6.5 15.5"/><line x1="4" y1="4" x2="20" y2="20" stroke-width="1.6"/></svg>`;
    const cardSVG  = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.6z"/><line x1="12" y1="9" x2="12" y2="13.5"/><circle cx="12" cy="15.5" r="0.6" fill="currentColor"/></svg>`;
    const pregBtn  = icons.includes('pregnant')
      ? `<button class="warn-btn warn-pregnant" data-tip="Not safe during pregnancy">${pregSVG}</button>` : '';
    const cardBtn  = icons.includes('cardiac')
      ? `<button class="warn-btn warn-cardiac"  data-tip="Caution: heart or BP conditions">${cardSVG}</button>` : '';

    document.body.insertAdjacentHTML('afterbegin', `
<div class="sky-layer"><svg viewBox="0 0 1440 420" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#4d8fe8"/><stop offset="100%" stop-color="#7fb5fa"/></linearGradient></defs><path fill="url(#skyGrad)" d="M0,0 L1440,0 L1440,260 C1360,235 1280,272 1160,248 C1040,224 940,268 800,245 C660,222 560,262 400,238 C280,220 160,255 0,235 Z"/></svg></div>
<div class="header" id="pageHeader">
  <a class="back-btn" href="../" title="Back">←</a>
  <div class="title" id="pageTitle">${cfg.title}</div>
  <div class="header-warns" id="headerWarns">${pregBtn}${cardBtn}</div>
  <button class="about-btn" id="aboutBtn" title="About">${bookSVG}</button>
</div>
<!-- NEVER move stage-center out of stage — the orb is ALWAYS centered here -->
<div class="stage" id="stage">
  <div class="stage-center" id="stageCenter">
    <div class="breath-wrap">
      <svg class="progress-svg" viewBox="0 0 220 220" width="220" height="220">
        <circle class="arc-track" cx="110" cy="110" r="105"/>
        <circle class="arc-fill"  cx="110" cy="110" r="105" id="arcFill"/>
      </svg>
      <div class="breath-orb" id="breathOrb">
        <div class="phase-label"    id="phaseLabel"></div>
        <div class="phase-countdown" id="phaseCountdown"></div>
        <div class="phase-idle"     id="phaseIdle">press play</div>
      </div>
    </div>
    <div class="next-phase" id="nextPhase"></div>
  </div>
</div>
<div class="toolbar">
  <div id="engineControls"></div>
  <button class="play-btn" id="playBtn">▶</button>
  <div class="session-timer" id="sessionTimer">0:00</div>
  <div class="theme-group">
    <button class="theme-btn" data-theme="sand"  style="background:#FFEBCD;border-color:#c4b48a;"></button>
    <button class="theme-btn" data-theme="light" style="background:#ffffff;border-color:#cccccc;"></button>
    <button class="theme-btn" data-theme="dark"  style="background:#090e1a;border-color:#2a3a5e;"></button>
  </div>
</div>
<div class="footer">
  <label class="vol-row">
    <span class="vol-label">🔈</span>
    <input type="range" class="vol-slider" id="volSlider" min="0" max="1" step="0.05" value="0.5">
    <span class="vol-label">🔊</span>
  </label>
  <span>Made by <a href="https://www.linkedin.com/in/mor-yosef-185331196/" target="_blank" rel="noopener">Mor Yosef</a></span>
</div>`);
  }

  /* ── About modal ────────────────────────────────────────── */
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

  /* ── Indicator injection ────────────────────────────────── */
  function injectIndicator(type) {
    if (type === 'nadi' || type === 'none') return;
    const stage = document.getElementById('stage');
    if (!stage) return;
    const center = document.getElementById('stageCenter');
    const div = document.createElement('div');
    div.className = 'airway-indicator'; div.id = 'airwayIndicator';
    if (type === 'nose-mouth') {
      div.innerHTML = `
        <div class="airway-orb" id="noseOrb">
          <span class="airway-icon">👃</span>
          <span class="airway-label">nose</span>
          <span class="airway-note"></span>
        </div>
        <div class="airway-line"></div>
        <div class="airway-orb" id="mouthOrb">
          <span class="airway-icon">👄</span>
          <span class="airway-label">mouth</span>
          <span class="airway-note"></span>
        </div>`;
    } else {
      div.innerHTML = `
        <div class="airway-orb" id="noseOrb">
          <span class="airway-icon">👃</span>
          <span class="airway-label">nose</span>
          <span class="airway-note"></span>
        </div>`;
    }
    if (center) stage.insertBefore(div, center);
    else stage.appendChild(div);
  }

  /* ── Length controls ────────────────────────────────────── */
  function injectControls(controls) {
    const container = document.getElementById('engineControls');
    if (!container || !controls?.lengths) return;
    const grp = document.createElement('div'); grp.className = 'length-group';
    const lbl = document.createElement('span'); lbl.className = 'length-label'; lbl.textContent = 'Length';
    grp.appendChild(lbl);
    controls.lengths.forEach(s => {
      const btn = document.createElement('button');
      btn.className = 'len-btn' + (s === _s.base ? ' active' : '');
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

  /* ── Count display (count-based exercises) ──────────────── */
  function injectCountDisplay() {
    const stage = document.getElementById('stage');
    if (!stage) return;
    const info = document.createElement('div'); info.className = 'round-info'; info.id = 'roundInfo';
    info.style.display = 'none';
    info.innerHTML = `<div class="round-label" id="roundLabel"></div>
                      <div class="breath-label" id="breathLabel"></div>`;
    stage.appendChild(info);
    $.roundInfo   = info;
    $.roundLabel  = document.getElementById('roundLabel');
    $.breathLabel = document.getElementById('breathLabel');
  }

  /* ── Safety screen (advanced exercises) ─────────────────── */
  function maybeInjectSafety(safety) {
    if (!safety?.body) return;
    const key = 'ack_' + (safety.key || 'adv');
    if (localStorage.getItem(key)) return;
    const overlay = document.createElement('div');
    overlay.className = 'safety-overlay'; overlay.id = 'safetyOverlay';
    overlay.innerHTML = `<div class="safety-modal">
      <div class="safety-icon">⚠</div>
      <h2>${safety.title || 'Safety Notice'}</h2>
      <p>${safety.body}</p>
      <button class="safety-btn" id="safetyOk">I understand — continue</button>
    </div>`;
    document.body.appendChild(overlay);
    document.getElementById('safetyOk').addEventListener('click', () => {
      localStorage.setItem(key, '1'); overlay.remove();
    });
  }

  /* ── Init ───────────────────────────────────────────────── */
  function init(cfg) {
    _cfg = cfg;
    _s.base  = cfg.controls?.defaultLength || 4;
    _s.theme = localStorage.getItem(THEME_KEY) || 'dark';

    buildPage(cfg);

    function positionHeaderIcons() {
      const titleEl  = document.getElementById('pageTitle');
      const aboutBtn = document.getElementById('aboutBtn');
      const warnsEl  = document.getElementById('headerWarns');
      const headerEl = document.getElementById('pageHeader');
      if (!titleEl || !aboutBtn || !headerEl) return;
      const hRect = headerEl.getBoundingClientRect();
      const tRect = titleEl.getBoundingClientRect();
      const iconTop = tRect.bottom - hRect.top + 8;
      const halfTitle = tRect.width / 2;
      const titleCenterX = tRect.left - hRect.left + halfTitle;
      // use the larger icon's half-width so both centers sit the same distance from title center
      const iconHalf = Math.max(aboutBtn.offsetWidth, warnsEl ? warnsEl.offsetWidth : 0) / 2;
      const offset = halfTitle + iconHalf + 4;
      // book: center at titleCenterX + offset
      aboutBtn.style.left = (titleCenterX + offset - aboutBtn.offsetWidth / 2) + 'px';
      aboutBtn.style.top  = iconTop + 'px';
      // warns: center at titleCenterX - offset
      if (warnsEl && warnsEl.children.length > 0) {
        warnsEl.style.left = (titleCenterX - offset - warnsEl.offsetWidth / 2) + 'px';
        warnsEl.style.top  = iconTop + 'px';
      }
    }
    requestAnimationFrame(() => requestAnimationFrame(positionHeaderIcons));
    window.addEventListener('resize', positionHeaderIcons);

    const cls = document.body.className.replace(/theme-\S+/g, '').trim();
    document.body.className = (cls ? cls + ' ' : '') + 'theme-' + _s.theme;

    $ = {
      arcFill:        document.getElementById('arcFill'),
      breathOrb:      document.getElementById('breathOrb'),
      phaseLabel:     document.getElementById('phaseLabel'),
      phaseCountdown: document.getElementById('phaseCountdown'),
      phaseIdle:      document.getElementById('phaseIdle'),
      playBtn:        document.getElementById('playBtn'),
      sessionTimer:   document.getElementById('sessionTimer'),
    };

    if ($.arcFill) {
      $.arcFill.style.strokeDasharray  = ARC_C;
      $.arcFill.style.strokeDashoffset = ARC_C;
      $.arcFill.style.stroke = THEME_ARC[_s.theme].active;
    }

    if ($.playBtn) $.playBtn.addEventListener('click', () => { if (_s.playing) stop(); else play(); });

    if ($.breathOrb) $.breathOrb.addEventListener('click', () => {
      if (_s.playing && curPhase()?.openEnded) advancePhase();
      else if ($.playBtn) $.playBtn.click();
    });

    const vol = document.getElementById('volSlider');
    if (vol) {
      _s.vol = parseFloat(vol.value) || 0.5;
      vol.addEventListener('input', e => { _s.vol = parseFloat(e.target.value); });
    }

    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === _s.theme);
      btn.addEventListener('click', () => applyTheme(btn.dataset.theme));
    });

    /* warn-btn: instant tooltip on tap (mobile) */
    document.querySelectorAll('.warn-btn[data-tip]').forEach(btn => {
      btn.addEventListener('touchstart', e => {
        e.preventDefault();
        const open = btn.classList.toggle('tip-open');
        if (open) setTimeout(() => btn.classList.remove('tip-open'), 2500);
      }, { passive: false });
    });

    document.addEventListener('keydown', e => {
      if (e.code === 'Space' && e.target === document.body) { e.preventDefault(); if ($.playBtn) $.playBtn.click(); }
    });

    _cfg._indicatorType = inferIndicator(cfg);
    if (_cfg._indicatorType === 'nadi') injectNadiOrbs();
    else injectIndicator(_cfg._indicatorType);

    injectControls(cfg.controls);
    if (cfg.mode === 'count-based') injectCountDisplay();
    injectAbout(cfg.about);
    maybeInjectSafety(cfg.safety);
  }

  const _api = { play, pause, stop, advancePhase, get state() { return _s; } };
  global.BreathingEngine = { init };

})(window);
