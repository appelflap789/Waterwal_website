/* Waterwal — ontwerppaneel (Tweakpane). Wordt alleen geladen met ?tune in de adresbalk.
   Draai aan de knoppen, klik "Exporteer tokens" en plak het resultaat in assets/css/tokens.css
   (tussen TUNE:START en TUNE:END). Gewone bezoekers laden dit bestand nooit.
   Snel een richting bekijken: ?tune=polder, ?tune=diep of ?tune=signaal. */
(function () {
  'use strict';

  var STORE = 'waterwal-tune';
  var root = document.documentElement;

  var FONTS = {
    'Bricolage Grotesque': 'Bricolage+Grotesque:opsz,wght@12..96,400..800',
    'Instrument Sans': 'Instrument+Sans:wght@400..700',
    'Inter': 'Inter:wght@400..800',
    'Manrope': 'Manrope:wght@400..800',
    'Space Grotesk': 'Space+Grotesk:wght@400..700',
    'Geist': 'Geist:wght@400..800',
    'Fraunces': 'Fraunces:opsz,wght@9..144,400..800',
    'DM Serif Display': 'DM+Serif+Display',
  };

  var PRESETS = {
    polder: {
      hue: 198, sat: 82, light: 22, onPrimary: '#ffffff',
      bg: '#f2efe8', bg2: '#e9e5db', surface: '#fffdf9', ink: '#0e1f27', ink2: '#41545d', ink3: '#74858c', line: '#d9d3c6',
      water: '#2f9fd0',
      fontHead: 'Bricolage Grotesque', fontBody: 'Instrument Sans', base: 17, ratio: 1.3, track: -0.03, weight: 650,
      radius: 18, shadow: 0.1, density: 1,
      waveAmp: 1, waveSpeed: 5, rise: 1400,
    },
    diep: {
      hue: 190, sat: 72, light: 62, onPrimary: '#04222c',
      bg: '#06171f', bg2: '#0a212b', surface: '#0f2a36', ink: '#eaf5f8', ink2: '#a9c2cb', ink3: '#7393a0', line: '#1d3d4b',
      water: '#45c2e8',
      fontHead: 'Bricolage Grotesque', fontBody: 'Instrument Sans', base: 17, ratio: 1.3, track: -0.03, weight: 600,
      radius: 22, shadow: 0, density: 1,
      waveAmp: 1.3, waveSpeed: 6, rise: 1600,
    },
    signaal: {
      hue: 232, sat: 90, light: 54, onPrimary: '#ffffff',
      bg: '#ffffff', bg2: '#f2f3f7', surface: '#ffffff', ink: '#0b0b10', ink2: '#44464f', ink3: '#7b7e89', line: '#e1e3ea',
      water: '#2b6bff',
      fontHead: 'Space Grotesk', fontBody: 'Inter', base: 16, ratio: 1.32, track: -0.04, weight: 700,
      radius: 8, shadow: 0.06, density: 1.1,
      waveAmp: 0.7, waveSpeed: 3.5, rise: 900,
    },
  };

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  var P = clone(PRESETS.polder);
  var meta = { preset: 'polder', depth: 30 };

  function tokens() {
    return {
      '--p-h': String(Math.round(P.hue)),
      '--p-s': Math.round(P.sat) + '%',
      '--p-l': Math.round(P.light) + '%',
      '--on-primary': P.onPrimary,
      '--bg': P.bg, '--bg-2': P.bg2, '--surface': P.surface,
      '--ink': P.ink, '--ink-2': P.ink2, '--ink-3': P.ink3, '--line': P.line,
      '--water': P.water,
      '--font-head': '"' + P.fontHead + '", system-ui, sans-serif',
      '--font-body': '"' + P.fontBody + '", system-ui, -apple-system, "Segoe UI", sans-serif',
      '--fs-base': P.base + 'px',
      '--ratio': String(P.ratio),
      '--track-head': P.track + 'em',
      '--weight-head': String(Math.round(P.weight)),
      '--r': P.radius + 'px',
      '--shadow-a': String(P.shadow),
      '--density': String(P.density),
      '--wave-amp': String(P.waveAmp),
      '--wave-speed': P.waveSpeed + 's',
      '--rise-ms': Math.round(P.rise) + 'ms',
    };
  }

  var loadedFonts = {};
  function loadFont(name) {
    if (loadedFonts[name] || !FONTS[name]) return;
    loadedFonts[name] = true;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=' + FONTS[name] + '&display=swap';
    document.head.appendChild(l);
  }

  function apply() {
    var t = tokens();
    Object.keys(t).forEach(function (k) { root.style.setProperty(k, t[k]); });
    loadFont(P.fontHead); loadFont(P.fontBody);
    try { localStorage.setItem(STORE, JSON.stringify(P)); } catch (e) { /* privévenster */ }
  }

  function exportCss() {
    var t = tokens();
    var out = '/* TUNE:START */\n:root {\n';
    Object.keys(t).forEach(function (k) { out += '  ' + k + ': ' + t[k] + ';\n'; });
    out += '}\n/* TUNE:END */\n';
    var fonts = [P.fontHead, P.fontBody].filter(function (f, i, a) { return a.indexOf(f) === i; });
    out += '\n/* Fonts voor in de <head> van index.html en privacy.html:\n   https://fonts.googleapis.com/css2?' +
      fonts.map(function (f) { return 'family=' + FONTS[f]; }).join('&') + '&display=swap */\n';
    return out;
  }

  function showExport(text) {
    var old = document.getElementById('tuneExport');
    if (old) old.remove();
    var box = document.createElement('div');
    box.id = 'tuneExport';
    box.style.cssText = 'position:fixed;inset:0;z-index:9999;display:grid;place-items:center;background:rgb(0 0 0 / .55);padding:16px';
    var card = document.createElement('div');
    card.style.cssText = 'background:#fff;color:#111;border-radius:14px;padding:20px;width:min(640px,100%);font:14px/1.5 system-ui,sans-serif;box-shadow:0 30px 80px rgb(0 0 0 / .4)';
    var h = document.createElement('p');
    h.style.cssText = 'margin:0 0 8px;font-weight:700';
    h.textContent = 'Plak dit in assets/css/tokens.css, over het blok tussen TUNE:START en TUNE:END.';
    var ta = document.createElement('textarea');
    ta.value = text; ta.readOnly = true;
    ta.style.cssText = 'width:100%;height:320px;font:12px/1.5 ui-monospace,Consolas,monospace;border:1px solid #ccc;border-radius:8px;padding:10px;box-sizing:border-box';
    var row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;margin-top:12px';
    var copy = document.createElement('button');
    copy.textContent = 'Kopieer';
    var close = document.createElement('button');
    close.textContent = 'Sluiten';
    [copy, close].forEach(function (b) { b.style.cssText = 'padding:8px 16px;border-radius:999px;border:1px solid #111;background:#fff;cursor:pointer;font:inherit;font-weight:600'; });
    copy.style.background = '#111'; copy.style.color = '#fff';
    copy.onclick = function () {
      ta.select();
      var done = function () { copy.textContent = 'Gekopieerd'; setTimeout(function () { copy.textContent = 'Kopieer'; }, 1500); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { document.execCommand('copy'); done(); });
      else { document.execCommand('copy'); done(); }
    };
    close.onclick = function () { box.remove(); };
    box.onclick = function (e) { if (e.target === box) box.remove(); };
    row.appendChild(close); row.appendChild(copy);
    card.appendChild(h); card.appendChild(ta); card.appendChild(row);
    box.appendChild(card);
    document.body.appendChild(box);
  }

  // Startwaarden: ?tune=<preset> wint, anders wat je vorige keer had staan.
  var wanted = new URLSearchParams(location.search).get('tune');
  if (wanted && PRESETS[wanted]) { P = clone(PRESETS[wanted]); meta.preset = wanted; }
  else {
    try {
      var saved = JSON.parse(localStorage.getItem(STORE) || 'null');
      if (saved) Object.keys(P).forEach(function (k) { if (saved[k] != null) P[k] = saved[k]; });
    } catch (e) { /* niets opgeslagen */ }
  }
  apply();

  import('https://cdn.jsdelivr.net/npm/tweakpane@4.0.5/dist/tweakpane.min.js').then(function (m) {
    var holder = document.createElement('div');
    holder.style.cssText = 'position:fixed;right:12px;top:80px;z-index:9000;width:300px;max-height:calc(100vh - 96px);overflow:auto;border-radius:8px';
    document.body.appendChild(holder);
    var pane = new m.Pane({ title: 'Waterwal ontwerp', container: holder });
    var fontOptions = {};
    Object.keys(FONTS).forEach(function (f) { fontOptions[f] = f; });

    pane.addBinding(meta, 'preset', { label: 'richting', options: { Polder: 'polder', Diep: 'diep', Signaal: 'signaal' } })
      .on('change', function (ev) {
        var src = PRESETS[ev.value];
        Object.keys(src).forEach(function (k) { P[k] = src[k]; });
        pane.refresh();
        apply();
      });

    var kleur = pane.addFolder({ title: 'Kleur' });
    kleur.addBinding(P, 'hue', { label: 'merk: tint', min: 0, max: 360, step: 1 });
    kleur.addBinding(P, 'sat', { label: 'merk: verzadiging', min: 0, max: 100, step: 1 });
    kleur.addBinding(P, 'light', { label: 'merk: lichtheid', min: 8, max: 80, step: 1 });
    kleur.addBinding(P, 'onPrimary', { label: 'tekst op merk' });
    kleur.addBinding(P, 'water', { label: 'water' });
    kleur.addBinding(P, 'bg', { label: 'achtergrond' });
    kleur.addBinding(P, 'bg2', { label: 'achtergrond 2' });
    kleur.addBinding(P, 'surface', { label: 'kaartvlak' });
    kleur.addBinding(P, 'ink', { label: 'tekst' });
    kleur.addBinding(P, 'ink2', { label: 'tekst 2' });
    kleur.addBinding(P, 'ink3', { label: 'tekst 3' });
    kleur.addBinding(P, 'line', { label: 'lijnen' });

    var type = pane.addFolder({ title: 'Typografie' });
    type.addBinding(P, 'fontHead', { label: 'koppen', options: fontOptions });
    type.addBinding(P, 'fontBody', { label: 'tekst', options: fontOptions });
    type.addBinding(P, 'base', { label: 'basisgrootte', min: 14, max: 20, step: 0.5 });
    type.addBinding(P, 'ratio', { label: 'schaal', min: 1.15, max: 1.45, step: 0.01 });
    type.addBinding(P, 'track', { label: 'kop: spatiëring', min: -0.06, max: 0.02, step: 0.005 });
    type.addBinding(P, 'weight', { label: 'kop: gewicht', min: 400, max: 800, step: 10 });

    var vorm = pane.addFolder({ title: 'Vorm' });
    vorm.addBinding(P, 'radius', { label: 'afronding', min: 0, max: 32, step: 1 });
    vorm.addBinding(P, 'shadow', { label: 'schaduw', min: 0, max: 0.3, step: 0.01 });
    vorm.addBinding(P, 'density', { label: 'witruimte', min: 0.6, max: 1.5, step: 0.05 });

    var water = pane.addFolder({ title: 'Waterlijn' });
    water.addBinding(P, 'waveAmp', { label: 'golfhoogte', min: 0, max: 3, step: 0.1 });
    water.addBinding(P, 'waveSpeed', { label: 'golftempo (s)', min: 1.5, max: 12, step: 0.5 });
    water.addBinding(P, 'rise', { label: 'stijgtijd (ms)', min: 200, max: 4000, step: 100 });
    water.addBinding(meta, 'depth', { label: 'test: water (cm)', min: 0, max: 240, step: 1 })
      .on('change', function (ev) { if (window.WATERWAL && window.WATERWAL.api) window.WATERWAL.api.simulate(ev.value / 100); });
    water.addButton({ title: 'Zakken opnieuw laten vallen' }).on('click', function () { window.WATERWAL.api.replayBags(); });

    pane.addButton({ title: 'Exporteer tokens' }).on('click', function () { showExport(exportCss()); });
    pane.addButton({ title: 'Terug naar deze richting' }).on('click', function () {
      var src = PRESETS[meta.preset];
      Object.keys(src).forEach(function (k) { P[k] = src[k]; });
      pane.refresh();
      apply();
    });

    pane.on('change', apply);
  }).catch(function (err) {
    console.error('Tweakpane kon niet laden', err);
  });
})();
