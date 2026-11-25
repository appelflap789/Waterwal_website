/* Waterwal — gedrag van de pagina. Geen libraries, behalve Leaflet (pas geladen als er een kaart nodig is).
   Indeling: 1 hulpjes · 2 rekenregel · 3 tekening · 4 adres zoeken · 5 resultaat · 6 advies · 7 kaart
             8 wachtlijst · 9 pagina-algemeen */
(function () {
  'use strict';

  var C = window.WATERWAL;
  var B = C.BAG;
  document.documentElement.classList.add('js');

  /* ───────── 1. hulpjes ───────── */
  function $(sel, el) { return (el || document).querySelector(sel); }
  function $$(sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); }
  function el(tag, attrs, text) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (text != null) n.textContent = text;
    return n;
  }
  var SVG_NS = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs) {
    var n = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }
  function fmtDepth(m) {
    var cm = Math.round(m * 100);
    if (cm < 100) return cm + ' cm';
    return (cm / 100).toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' m';
  }
  function fmtEUR(n) { return '€ ' + n.toLocaleString('nl-NL'); }
  function ceil(x) { return Math.ceil(x - 1e-9); } // 0.6 / 0.12 is in JavaScript net iets meer dan 5
  function fetchJSON(url, opts, timeoutMs) {
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, timeoutMs || 15000);
    opts = opts || {};
    opts.signal = ctrl.signal;
    return fetch(url, opts).then(function (res) {
      clearTimeout(timer);
      return res.json().catch(function () { return {}; }).then(function (body) {
        if (!res.ok) { var e = new Error(body.error || ('HTTP ' + res.status)); e.status = res.status; e.body = body; throw e; }
        return body;
      });
    }, function (err) { clearTimeout(timer); throw err; });
  }
  function scenarioById(id) { return C.SCENARIOS.filter(function (s) { return s.id === id; })[0]; }

  var MAX_HOLD_CM = Math.round((B.maxStackM - B.freeboardM) * 100); // hoogste water dat een stapel nog keert
  var MAX_LAYERS = ceil(B.maxStackM / B.layerHeightM);

  var state = {
    mode: 'idle',        // idle | result | manual
    address: null,
    postcode: null,
    coords: null,
    risk: null,          // { r70: 0.23 | null, r90: ... } waterdiepte tegen de gevel in meter
    klasse: null,        // { r70: 1..7, r90: 1..7 } FCAB-klasse (zie config KLASSEN)
    fcabOfficial: false, // true = klasse bij 70 mm komt uit de FCAB-kaart zelf
    scenario: null,
    custom: false,       // true = bezoeker heeft zelf aan de schuif gezeten
    tooDeep: false,
    viewDepthM: 0.12,    // waterstand in de tekening
    adviceCm: 12,        // waterhoogte waarmee het advies rekent
    openings: [{ type: 'voordeur', w: 90 }],
    color: 'zwart',
  };


  /* ───────── 2. rekenregel ───────── */
  function layersFor(cm) {
    return Math.min(MAX_LAYERS, Math.max(1, ceil((cm / 100 + B.freeboardM) / B.layerHeightM)));
  }
  function computeAdvice(cm, openings) {
    var eff = B.lengthM - B.overlapM;
    var layers = layersFor(cm);
    var sum = 0;
    var lines = openings.map(function (o) {
      var perLayer = ceil((o.w / 100) / eff) + 1; // +1 voor de aansluiting op de muur
      var bags = perLayer * layers;
      sum += bags;
      return { type: o.type, w: o.w, perLayer: perLayer, bags: bags };
    });
    var withReserve = ceil(sum * (1 + B.reserve));
    var total = Math.max(B.minBags, withReserve);
    return { layers: layers, lines: lines, sum: sum, reserve: withReserve - sum, total: total, minApplied: total > withReserve, price: total * B.priceEUR };
  }

  /* ───────── 3. tekening ───────── */
  var sceneEl = $('#scene');
  var PX_PER_CM = 1.2;
  var GROUND_Y = 330;
  var DOOR_X = 341;
  var bagsKey = '';

  function drawSceneBags(layers) {
    var key = layers + state.color;
    if (key === bagsKey) return;
    bagsKey = key;
    var g = $('#scBags');
    while (g.firstChild) g.removeChild(g.firstChild);
    g.setAttribute('data-bag', state.color);
    var h = B.layerHeightM * 100 * PX_PER_CM;
    var w = 50;
    for (var i = 0; i < layers; i++) {
      var x = DOOR_X - 1 - w - (i % 2 ? 7 : 0);
      var y = GROUND_Y - h * (i + 1);
      var r = svg('rect', { class: 'sc-bag', x: x, y: y + 0.6, width: w, height: h - 1.2, rx: h / 2.4, style: '--i:' + i });
      var seam = svg('path', { class: 'sc-bag__seam', d: 'M' + (x + 9) + ' ' + (y + h / 2) + 'h' + (w - 18), style: '--i:' + i });
      g.appendChild(r);
      g.appendChild(seam);
    }
  }

  function renderScene() {
    var depthM = state.viewDepthM;
    var layers = state.mode === 'idle' ? 2 : (state.tooDeep ? MAX_LAYERS : layersFor(state.adviceCm));
    var flooded = depthM > layers * B.layerHeightM + 1e-9;
    var levelPx = Math.min(depthM * 100 * PX_PER_CM, 292);
    sceneEl.style.setProperty('--level', levelPx.toFixed(1));
    sceneEl.classList.toggle('is-flooded', flooded);
    sceneEl.classList.toggle('is-dry', depthM <= 0.004);
    drawSceneBags(layers);
    $('#scDepth').textContent = depthM > 0.004 ? fmtDepth(depthM) : 'droog';

    var cap;
    var lagen = layers + (layers === 1 ? ' laag' : ' lagen');
    var sc = state.scenario && scenarioById(state.scenario);
    if (state.mode === 'idle') cap = 'Voorbeeld: 12 cm water buiten, binnen blijft het droog.';
    else if (flooded || (state.tooDeep && !state.custom)) cap = fmtDepth(depthM) + ' water: hoger dan een stapel zakken veilig kan keren.';
    else if (state.custom || !sc) cap = 'Eigen waterhoogte: ' + fmtDepth(depthM) + '. ' + lagen + ' zakken houden het buiten.';
    else if (depthM <= 0.004) cap = sc.name + ': je adres blijft droog.';
    else cap = sc.name + ': ' + fmtDepth(depthM) + ' water. ' + lagen + ' zakken houden het buiten.';
    $('#sceneCap').textContent = cap;
  }

  /* ───────── 4. adres zoeken (PDOK Locatieserver) ───────── */
  var form = $('#checkForm');
  var input = $('#addr');
  var list = $('#addrList');
  var msg = $('#checkMsg');
  var btn = $('#checkBtn');
  var DEFAULT_MSG = msg.textContent;
  var suggestions = [];
  var active = -1;
  var chosen = null;     // {id, name}
  var suggestSeq = 0;
  var debounce;

  function setMsg(text, isError) {
    msg.textContent = text || DEFAULT_MSG;
    form.classList.toggle('is-error', !!isError);
    if (isError) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
  }
  function closeList() {
    list.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    active = -1;
  }
  function setActive(i) {
    active = i;
    $$('li', list).forEach(function (li, n) { li.setAttribute('aria-selected', n === i ? 'true' : 'false'); });
    if (i >= 0) { input.setAttribute('aria-activedescendant', 'addrOpt' + i); $('#addrOpt' + i).scrollIntoView({ block: 'nearest' }); }
    else input.removeAttribute('aria-activedescendant');
  }
  function renderList() {
    while (list.firstChild) list.removeChild(list.firstChild);
    suggestions.forEach(function (s, i) {
      var li = el('li', { role: 'option', id: 'addrOpt' + i, 'aria-selected': 'false' }, s.weergavenaam);
      li.addEventListener('mousedown', function (e) { e.preventDefault(); choose(i); });
      list.appendChild(li);
    });
    list.hidden = suggestions.length === 0;
    input.setAttribute('aria-expanded', suggestions.length ? 'true' : 'false');
    active = -1;
  }
  function suggest(q) {
    var seq = ++suggestSeq;
    fetchJSON(C.PDOK_SEARCH + '/suggest?q=' + encodeURIComponent(q) + '&fq=type:adres&rows=6', null, 8000).then(function (data) {
      if (seq !== suggestSeq) return;
      suggestions = (data.response && data.response.docs) || [];
      renderList();
    }).catch(function () { /* suggesties zijn een extraatje; zoeken werkt ook zonder */ });
  }
  function choose(i) {
    var s = suggestions[i];
    if (!s) return;
    chosen = { id: s.id, name: s.weergavenaam };
    input.value = s.weergavenaam;
    closeList();
    runCheck();
  }
  input.addEventListener('input', function () {
    chosen = null;
    setMsg('');
    clearTimeout(debounce);
    var q = input.value.trim();
    if (q.length < 3) { suggestSeq++; suggestions = []; renderList(); return; }
    debounce = setTimeout(function () { suggest(q); }, 200);
  });
  input.addEventListener('keydown', function (e) {
    if (list.hidden) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((active + 1) % suggestions.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active <= 0 ? suggestions.length - 1 : active - 1); }
    else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); choose(active); }
    else if (e.key === 'Escape') closeList();
  });
  input.addEventListener('blur', function () { setTimeout(closeList, 120); });
  form.addEventListener('submit', function (e) { e.preventDefault(); clearTimeout(debounce); suggestSeq++; closeList(); runCheck(); });

  function parsePoint(wkt) {
    var m = /POINT\(([-\d.]+) ([-\d.]+)\)/.exec(wkt || '');
    return m ? { lon: parseFloat(m[1]), lat: parseFloat(m[2]) } : null;
  }
  function geocode() {
    var fl = '&fl=id,weergavenaam,centroide_ll,postcode,type,adresseerbaarobject_id,gemeentecode';
    var url = chosen
      ? C.PDOK_SEARCH + '/lookup?id=' + encodeURIComponent(chosen.id) + fl
      : C.PDOK_SEARCH + '/free?q=' + encodeURIComponent(input.value.trim()) + '&fq=type:(adres OR postcode OR weg)&rows=1' + fl;
    return fetchJSON(url, null, 10000).then(function (data) {
      var doc = data.response && data.response.docs && data.response.docs[0];
      var pt = doc && parsePoint(doc.centroide_ll);
      if (!pt) { var e = new Error('notfound'); e.notFound = true; throw e; }
      return { name: doc.weergavenaam, postcode: doc.postcode || null, coords: pt,
               vbo: doc.type === 'adres' ? doc.adresseerbaarobject_id || null : null, gemeente: doc.gemeentecode || null };
    });
  }

  // Adresdata: per postcodegebied één .js-bestand dat WATERWAL_ADRES(pc4, {...}) aanroept.
  // Een <script> (geen fetch) zodat het ook werkt als index.html direct van schijf wordt geopend.
  var shards = {};
  window.WATERWAL_ADRES = function (pc4, recs) {
    if (shards[pc4] && shards[pc4].resolve) shards[pc4].resolve(recs);
  };
  function loadShard(pc4) {
    if (shards[pc4]) return shards[pc4].promise;
    var entry = {};
    entry.promise = new Promise(function (resolve, reject) {
      entry.resolve = resolve;
      var s = el('script', { src: C.ADRES_URL.replace('{pc4}', pc4) });
      s.onerror = function () {
        delete shards[pc4];
        var e = new Error('nodata'); e.noData = true; reject(e);
      };
      document.head.appendChild(s);
    });
    shards[pc4] = entry;
    return entry.promise;
  }
  function fail(flag) { var e = new Error(flag); e[flag] = true; return e; }

  var checking = false;
  function runCheck() {
    var q = input.value.trim();
    if (checking) return;
    if (q.length < 3) { setMsg('Vul eerst je adres in, bijvoorbeeld postcode en huisnummer.', true); input.focus(); return; }
    checking = true;
    btn.classList.add('is-loading'); btn.disabled = true;
    setMsg('We zoeken je gebouw op…');

    geocode().then(function (place) {
      if (!place.vbo || !place.postcode) throw fail('noAddr');
      state.address = place.name; state.postcode = place.postcode; state.coords = place.coords;
      input.value = place.name;
      showResultLoading();
      return loadShard(place.postcode.slice(0, 4)).then(function (recs) {
        var rec = recs[String(place.vbo)];
        if (!rec) throw fail('noData');
        return rec;
      });
    }).then(function (rec) {
      // "k70,k90,d70,d90,f": FCAB-klasse per bui, waterdiepte tegen de gevel (cm), f = officieel FCAB
      var p = rec.split(',').map(Number);
      state.klasse = { r70: p[0], r90: p[1] };
      state.risk = { r70: p[2] >= 2 ? p[2] / 100 : null, r90: p[3] >= 2 ? p[3] / 100 : null };
      state.fcabOfficial = p[4] === 1;
      state.mode = 'result';
      setMsg('');
      showResult();
    }).catch(function (err) {
      resultEl.hidden = true;
      $('#uitkomst').hidden = true;
      if (err && err.notFound) setMsg('We vinden dit adres niet. Probeer postcode en huisnummer, bijvoorbeeld 3512 JE 29.', true);
      else if (err && err.noAddr) setMsg('Kies een adres met huisnummer, dan zoeken we je gebouw op.', true);
      else if (err && err.noData) setMsg('Voor dit adres hebben we nog geen gegevens. De check werkt nu alleen in ' + C.AREA_NAME + '. Je kunt wel zelf een waterhoogte kiezen.', true);
      else setMsg('Adressen zoeken lukt nu even niet. Probeer het zo opnieuw, of kies zelf een waterhoogte.', true);
    }).then(function () {
      checking = false;
      btn.classList.remove('is-loading'); btn.disabled = false;
    });
  }

  /* ───────── 5. resultaat en buien ───────── */
  var resultEl = $('#result');
  var chipsEl = $('#chips');

  function levelOf(d) { return d == null ? 'droog' : d < 0.2 ? 'laag' : d <= MAX_HOLD_CM / 100 ? 'midden' : 'hoog'; }
  function klasseOf(id) { return C.KLASSEN[(state.klasse && state.klasse[id]) || 1]; }

  function renderChips() {
    while (chipsEl.firstChild) chipsEl.removeChild(chipsEl.firstChild);
    C.SCENARIOS.forEach(function (s) {
      var d = state.risk ? state.risk[s.id] : null;
      var b = el('button', { type: 'button', class: 'chip', role: 'radio', 'data-id': s.id, 'data-level': levelOf(d), 'aria-checked': s.id === state.scenario ? 'true' : 'false', tabindex: s.id === state.scenario ? '0' : '-1' });
      var dot = el('i', { class: 'chip__dot chip__dot--fcab', 'aria-hidden': 'true' });
      if (state.klasse) dot.style.background = klasseOf(s.id).color;
      b.appendChild(dot);
      var name = el('span', { class: 'chip__name' }, s.name);
      name.appendChild(el('small', null, s.freq));
      b.appendChild(name);
      b.appendChild(el('span', { class: 'chip__depth' }, d == null ? 'droog' : fmtDepth(d)));
      b.addEventListener('click', function () { selectScenario(s.id, true); });
      chipsEl.appendChild(b);
    });
  }
  chipsEl.addEventListener('keydown', function (e) {
    var keys = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
    if (!keys[e.key]) return;
    e.preventDefault();
    var ids = C.SCENARIOS.map(function (s) { return s.id; });
    var next = ids[(ids.indexOf(state.scenario) + keys[e.key] + ids.length) % ids.length];
    selectScenario(next, true);
    $('.chip[data-id="' + next + '"]').focus();
  });

  function showResultLoading() {
    $('#resAddr').textContent = state.address;
    $('#resPre').textContent = ''; $('#resValue').textContent = '00 cm'; $('#resPost').textContent = '';
    $('#resSub').textContent = 'We zoeken je gebouw op…';
    state.risk = null; state.klasse = null; state.scenario = null;
    $('#resRisk').hidden = true;
    renderChips();
    resultEl.hidden = false;
    $('#uitkomst').hidden = false;
    resultEl.classList.add('is-loading');
  }

  // Oordeel voor het gekozen gebouw en de gekozen bui, in de FCAB-kleur van de kaart.
  var COLOR_WORD = { 1: 'grijs', 2: 'wit', 3: 'lichtroze', 4: 'roze', 5: 'rood', 6: 'donkerrood', 7: 'donkerrood' };
  function renderVerdict() {
    var sc = scenarioById(state.scenario);
    var k = state.klasse[sc.id] || 1;
    var K = C.KLASSEN[k];
    var d = state.risk[sc.id];
    var box = $('#resRisk');
    box.setAttribute('data-level', K.level);
    $('#resRiskDot').style.background = K.color;
    var label;
    if (k === 1) label = 'Geen gegevens voor je gebouw';
    else if (k === 2) label = 'Geen hinderlijk water tegen je gebouw';
    else label = K.name + ': ' + K.range + ' water tegen je gebouw';
    $('#resRiskLabel').textContent = label;
    var bron = sc.id === 'r70' && !state.fcabOfficial
      ? 'berekend volgens de FCAB-methode (dit gebouw staat niet in de FCAB-kaart)' : sc.bron;
    $('#resRiskText').textContent = k === 1
      ? 'Voor dit gebouw is geen waterdiepte bekend.'
      : 'Bij ' + sc.when + ' (' + sc.freq + '). Op de kaart kleurt je gebouw ' + COLOR_WORD[k] + '. Bron: ' + bron + '.';
    var fit = null;
    if (d != null && d * 100 <= B.helpLimitCm) fit = { f: 'ja', t: 'Zakken kunnen helpen: water van ' + fmtDepth(d) + ' houd je met een stapel zakken voor de deur buiten.' };
    else if (d != null) fit = { f: 'nee', t: 'Zo hoog keren zakken het water niet meer volledig. Lees het advies hieronder.' };
    $('#resFit').hidden = !fit;
    if (fit) { $('#resFit').setAttribute('data-fit', fit.f); $('#resFitText').textContent = fit.t; }
    box.hidden = false;
  }

  function showResult() {
    resultEl.classList.remove('is-loading');
    resultEl.hidden = false;
    state.scenario = C.SCENARIOS[0].id;
    renderChips();
    selectScenario(state.scenario, false);
    $('#advies').hidden = false;
    renderOpenings();
    renderAdvice();
    initMap();
    $('#uitkomst').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function selectScenario(id, fromUser) {
    var d = state.risk[id];
    state.scenario = id;
    state.custom = false;
    if (d == null) { state.tooDeep = false; state.viewDepthM = 0; state.adviceCm = 0; }
    else if (d * 100 > MAX_HOLD_CM) { state.tooDeep = true; state.viewDepthM = d; state.adviceCm = B.rainDefaultCm; }
    else { state.tooDeep = false; state.viewDepthM = d; state.adviceCm = Math.round(d * 100); }

    $$('.chip', chipsEl).forEach(function (c) {
      var on = c.getAttribute('data-id') === id;
      c.setAttribute('aria-checked', on ? 'true' : 'false');
      c.setAttribute('tabindex', on ? '0' : '-1');
    });
    renderVerdict();
    renderHeadline();
    renderScene();
    if (!$('#advies').hidden) renderAdvice();
    updateMapLayer();
  }

  function renderHeadline() {
    var sc = scenarioById(state.scenario);
    var d = state.risk[state.scenario];
    $('#resAddr').textContent = state.address;
    if (d == null) {
      $('#resPre').textContent = ''; $('#resValue').textContent = 'Droog'; $('#resPost').textContent = '';
      $('#resSub').textContent = 'Bij ' + sc.when + ' staat er geen hinderlijk water tegen je gevel.';
    } else {
      $('#resPre').textContent = 'Tot'; $('#resValue').textContent = fmtDepth(d); $('#resPost').textContent = 'water';
      $('#resSub').textContent = 'Tegen je gevel bij ' + sc.when + ', ' + sc.freq + '.';
    }
  }

  $('#resChange').addEventListener('click', function () { input.focus(); input.select(); });

  $('#manualBtn').addEventListener('click', function () {
    if (state.mode === 'idle') { state.mode = 'manual'; state.custom = true; state.adviceCm = B.rainDefaultCm; state.viewDepthM = B.rainDefaultCm / 100; }
    $('#advies').hidden = false;
    renderOpenings();
    renderAdvice();
    renderScene();
    $('#advies').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  /* ───────── 6. zakkenadvies ───────── */
  var range = $('#depthRange');
  range.max = MAX_HOLD_CM;
  var lastTotal = null;

  function openingLabel(type) {
    var o = C.OPENINGS.filter(function (x) { return x.type === type; })[0];
    return o ? o.label : 'Opening';
  }

  function renderOpenings() {
    var ul = $('#openings');
    while (ul.firstChild) ul.removeChild(ul.firstChild);
    state.openings.forEach(function (o, i) {
      var li = el('li', { class: 'opening' });
      var sel = el('select', { 'aria-label': 'Soort opening ' + (i + 1) });
      C.OPENINGS.forEach(function (t) {
        var opt = el('option', { value: t.type }, t.label);
        if (t.type === o.type) opt.selected = true;
        sel.appendChild(opt);
      });
      sel.addEventListener('change', function () {
        o.type = sel.value;
        var def = C.OPENINGS.filter(function (x) { return x.type === o.type; })[0];
        if (def && o.type !== 'eigen') { o.w = def.w; num.value = def.w; }
        renderAdvice();
      });
      var wrap = el('div', { class: 'opening__w' });
      var num = el('input', { type: 'number', min: '30', max: '600', step: '5', inputmode: 'numeric', value: o.w, 'aria-label': 'Breedte in centimeters' });
      num.addEventListener('input', function () {
        var v = parseInt(num.value, 10);
        if (isFinite(v)) { o.w = Math.min(600, Math.max(30, v)); renderAdvice(); }
      });
      num.addEventListener('blur', function () { num.value = o.w; });
      wrap.appendChild(num); wrap.appendChild(el('span', null, 'cm'));
      var rm = el('button', { type: 'button', class: 'opening__rm', 'aria-label': 'Opening verwijderen' });
      rm.innerHTML = '<svg viewBox="0 0 18 18" aria-hidden="true"><path d="M4 4l10 10M14 4L4 14"/></svg>';
      rm.disabled = state.openings.length === 1;
      rm.addEventListener('click', function () { state.openings.splice(i, 1); renderOpenings(); renderAdvice(); });
      li.appendChild(sel); li.appendChild(wrap); li.appendChild(rm);
      ul.appendChild(li);
    });
  }
  (function buildAddButtons() {
    var box = $('#addOpening');
    C.OPENINGS.forEach(function (t) {
      var b = el('button', { type: 'button' }, t.label);
      b.addEventListener('click', function () {
        if (state.openings.length >= 8) return;
        state.openings.push({ type: t.type, w: t.w });
        renderOpenings(); renderAdvice();
      });
      box.appendChild(b);
    });
  })();

  function drawStack(advice) {
    var box = $('#stackVisual');
    var S = 0.8; // px per cm
    var widest = advice.lines.slice().sort(function (a, b) { return b.w - a.w; })[0];
    var eff = (B.lengthM - B.overlapM) * 100 * S;
    var bagW = B.lengthM * 100 * S;
    var bagH = B.layerHeightM * 100 * S;
    var shift = eff / 2;
    var stackW = (widest.perLayer - 1) * eff + bagW + shift;
    var doorW = widest.w * S;
    var W = Math.max(stackW, doorW) + 40;
    var H = 96;
    var floor = H - 8;
    var s = svg('svg', { viewBox: '0 0 ' + W.toFixed(0) + ' ' + H, 'data-bag': state.color });
    s.appendChild(svg('rect', { class: 'sv-door', x: (W - doorW) / 2, y: -10, width: doorW, height: floor + 10 }));
    var waterY = floor - state.adviceCm * S;
    if (state.adviceCm > 0) {
      s.appendChild(svg('rect', { class: 'sv-water', x: 0, y: waterY, width: W, height: floor - waterY }));
    }
    var x0 = (W - stackW) / 2;
    for (var i = 0; i < advice.layers; i++) {
      for (var j = 0; j < widest.perLayer; j++) {
        s.appendChild(svg('rect', { class: 'sv-bag', x: x0 + j * eff + (i % 2 ? shift : 0), y: floor - bagH * (i + 1) + 0.5, width: bagW, height: bagH - 1, rx: bagH / 2.4 }));
      }
    }
    if (state.adviceCm > 0) s.appendChild(svg('path', { class: 'sv-waterline', d: 'M0 ' + waterY + 'H' + W }));
    s.appendChild(svg('path', { class: 'sv-floor', d: 'M0 ' + floor + 'H' + W }));
    while (box.firstChild) box.removeChild(box.firstChild);
    box.appendChild(s);
  }

  function renderAdvice() {
    var advice = computeAdvice(state.adviceCm, state.openings);
    var sc = state.scenario && scenarioById(state.scenario);
    var d = sc && state.risk ? state.risk[state.scenario] : null;

    // schuif
    range.value = state.adviceCm;
    range.style.setProperty('--fill', (state.adviceCm / MAX_HOLD_CM * 100) + '%');
    $('#depthOut').textContent = state.adviceCm + ' cm';
    var hint;
    if (state.custom || !sc) hint = 'Eigen waterhoogte. Zakken keren water tot ongeveer ' + MAX_HOLD_CM + ' cm.';
    else if (state.tooDeep) hint = 'We rekenen met ' + B.rainDefaultCm + ' cm: een waterhoogte waarbij zakken wél helpen. Schuif om aan te passen.';
    else if (d == null) hint = 'Bij deze bui blijft het droog tegen je gevel. Schuif als je toch met water wilt rekenen.';
    else hint = 'Waterdiepte tegen je gevel bij de ' + sc.name.toLowerCase() + '. Schuif om met een andere hoogte te rekenen.';
    $('#depthHint').textContent = hint;

    // eerlijke melding als het water te hoog komt
    var deep = $('#deepNotice');
    deep.hidden = !(state.tooDeep && !state.custom);
    if (!deep.hidden) {
      $('#deepTitle').textContent = fmtDepth(d) + ' water houden zakken niet tegen.';
      $('#deepText').textContent = 'Bij deze bui komt het water tegen je gevel hoger dan een stapel zakken kan keren (ongeveer ' + MAX_HOLD_CM + ' cm). Zorg dat je naar een droge verdieping kunt en volg de aanwijzingen van je gemeente. Zakken helpen wél bij minder water; hieronder rekenen we met ' + B.rainDefaultCm + ' cm.';
    }

    // samenvatting
    var count = $('#sumBags');
    count.textContent = advice.total;
    if (lastTotal !== null && lastTotal !== advice.total) { count.classList.remove('bump'); void count.offsetWidth; count.classList.add('bump'); }
    lastTotal = advice.total;
    $('#sumMeta').textContent = advice.layers + (advice.layers === 1 ? ' laag' : ' lagen') + ' hoog, in verband gestapeld zoals bakstenen.';
    var lines = $('#sumLines');
    while (lines.firstChild) lines.removeChild(lines.firstChild);
    advice.lines.forEach(function (l) {
      var li = el('li');
      li.appendChild(el('span', null, openingLabel(l.type) + ' (' + l.w + ' cm)'));
      li.appendChild(el('span', null, l.perLayer + ' per laag × ' + advice.layers + ' = ' + l.bags));
      lines.appendChild(li);
    });
    var extra = el('li');
    extra.appendChild(el('span', null, advice.minApplied ? 'Kleinste advies' : 'Reserve (' + Math.round(B.reserve * 100) + '%)'));
    extra.appendChild(el('span', null, advice.minApplied ? advice.total + ' zakken' : '+ ' + advice.reserve));
    lines.appendChild(extra);
    $('#sumPrice').textContent = fmtEUR(advice.price);
    $('#sumPriceHint').textContent = fmtEUR(B.priceEUR) + ' per zak';
    drawStack(advice);
    updateWaitAdvice(advice);
  }

  range.addEventListener('input', function () {
    state.custom = true;
    state.tooDeep = false;
    if (state.mode === 'idle') state.mode = 'manual';
    state.adviceCm = parseInt(range.value, 10) || 0;
    state.viewDepthM = state.adviceCm / 100;
    renderAdvice();
    renderScene();
  });

  $$('input[name="color"]').forEach(function (r) {
    r.addEventListener('change', function () {
      state.color = r.value;
      renderAdvice();
      renderScene();
    });
  });

  /* ───────── 7. kaart (Leaflet, pas geladen na een adrescheck) ───────── */
  // Lagen per bui: water op straat (blauw) en de panden in FCAB-kleur (rood). Beide zijn eigen
  // tegels uit de Klimaateffectatlas-data; lege tegels bestaan niet, Leaflet toont daar niets.
  var map, pin, leafletPromise, waterLayer, gebouwLayer, waterUrl, gebouwUrl;
  var BLANK = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  function loadLeaflet() {
    if (leafletPromise) return leafletPromise;
    leafletPromise = new Promise(function (resolve, reject) {
      var css = el('link', { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css' });
      document.head.appendChild(css);
      var js = el('script', { src: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js' });
      js.onload = resolve; js.onerror = function () { leafletPromise = null; reject(); };
      document.head.appendChild(js);
    });
    return leafletPromise;
  }
  function dataLayer(url, z, attribution) {
    var T = C.TILES;
    return window.L.tileLayer(url, { minZoom: 8, maxZoom: 19, minNativeZoom: T.minNative, maxNativeZoom: T.maxNative,
      bounds: T.bounds, zIndex: z, errorTileUrl: BLANK, attribution: attribution });
  }
  function initMap() {
    if (!state.coords) return;
    $('#mapCard').hidden = false;
    loadLeaflet().then(function () {
      var L = window.L;
      var ll = [state.coords.lat, state.coords.lon];
      if (!map) {
        var touch = window.matchMedia('(pointer: coarse)').matches;
        map = L.map('map', { scrollWheelZoom: false, dragging: !touch, zoomControl: true, attributionControl: true }).setView(ll, 17);
        map.attributionControl.setPrefix(false);
        L.tileLayer(C.BASEMAP, { minZoom: 8, maxZoom: 19, maxNativeZoom: 18, attribution: 'Kaart: <a href="https://www.pdok.nl" target="_blank" rel="noopener">PDOK / Kadaster</a>' }).addTo(map);
        pin = L.marker(ll, { icon: L.divIcon({ className: '', html: '<div class="map__pin"></div>', iconSize: [18, 18], iconAnchor: [9, 9] }), keyboard: false, zIndexOffset: 1000 }).addTo(map);
        if (touch) map.once('click', function () { map.dragging.enable(); });
      } else {
        map.setView(ll, 17);
        pin.setLatLng(ll);
      }
      updateMapLayer();
      setTimeout(function () { map.invalidateSize(); }, 60);
    }).catch(function () { $('#mapCard').hidden = true; });
  }
  function updateMapLayer() {
    var sc = scenarioById(state.scenario) || C.SCENARIOS[0];
    $('#mapScenario').textContent = sc.name + ' · ' + sc.freq;
    if (!map) return;
    var src = '<a href="https://www.klimaateffectatlas.nl" target="_blank" rel="noopener">Klimaateffectatlas</a>';
    var wantWater = $('#mapWater').checked, wantGeb = $('#mapGebouwen').checked;
    if (waterLayer && (waterUrl !== sc.water || !wantWater)) { map.removeLayer(waterLayer); waterLayer = null; }
    if (gebouwLayer && (gebouwUrl !== sc.gebouwen || !wantGeb)) { map.removeLayer(gebouwLayer); gebouwLayer = null; }
    if (wantWater && !waterLayer) { waterLayer = dataLayer(sc.water, 2, 'Water: ' + src).setOpacity(0.85).addTo(map); waterUrl = sc.water; }
    if (wantGeb && !gebouwLayer) { gebouwLayer = dataLayer(sc.gebouwen, 3, 'Gebouwen: FCAB, ' + src).addTo(map); gebouwUrl = sc.gebouwen; }
  }
  $('#mapWater').addEventListener('change', updateMapLayer);
  $('#mapGebouwen').addEventListener('change', updateMapLayer);
  (function buildLegends() {
    var g = $('#legendGebouwen'), w = $('#legendWater');
    [2, 3, 4, 5, 6, 7].forEach(function (k) {
      var K = C.KLASSEN[k], li = el('li');
      var sw = el('i'); sw.style.background = K.color; li.appendChild(sw);
      li.appendChild(document.createTextNode(K.range));
      g.appendChild(li);
    });
    C.WATER_LEGEND.forEach(function (x) {
      var li = el('li'), sw = el('i'); sw.style.background = x.color; li.appendChild(sw);
      li.appendChild(document.createTextNode(x.label));
      w.appendChild(li);
    });
  })();

  /* ───────── 8. wachtlijst ───────── */
  var waitForm = $('#waitForm');
  var waitMsg = $('#waitMsg');
  var currentAdvice = null;

  function updateWaitAdvice(advice) {
    currentAdvice = advice;
    var text = advice.total + ' zakken, ' + (state.color === 'zwart' ? 'met handvatten' : 'zonder handvatten');
    if (state.postcode) text += ', postcode ' + state.postcode;
    $('#waitAdviceText').textContent = text;
    $('#waitAdvice').hidden = false;
  }

  function showWaitDone(title, text) {
    waitForm.hidden = true;
    $('#waitDoneTitle').textContent = title;
    $('#waitDoneText').textContent = text;
    $('#waitDone').hidden = false;
  }

  waitForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = $('#email');
    var consent = $('#consent');
    var wbtn = $('#waitBtn');
    var okMail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim());
    email.parentNode.classList.toggle('is-error', !okMail);
    consent.parentNode.classList.toggle('is-error', okMail && !consent.checked);
    if (!okMail) { waitMsg.textContent = 'Vul een geldig e-mailadres in.'; email.focus(); return; }
    if (!consent.checked) { waitMsg.textContent = 'Vink aan dat we je mogen mailen.'; consent.focus(); return; }
    waitMsg.textContent = '';

    var payload = { email: email.value.trim(), consent: true, website: waitForm.elements.website.value };
    if (currentAdvice && $('#waitIncl').checked) {
      payload.bags = currentAdvice.total;
      payload.color = state.color;
      if (state.postcode) payload.postcode = state.postcode;
      if (state.scenario && !state.custom) payload.scenario = scenarioById(state.scenario).name;
    }
    wbtn.classList.add('is-loading'); wbtn.disabled = true;
    fetchJSON(C.WORKER_URL + '/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }, 15000).then(function (res) {
      if (res.doi) showWaitDone('Bijna klaar.', 'Klik op de link in de mail die we je net stuurden. Daarna sta je op de wachtlijst.');
      else showWaitDone('Je staat erop.', 'We mailen je zodra de verkoop start.');
    }).catch(function (err) {
      if (err && err.body && err.body.error === 'not_configured') waitMsg.textContent = 'De wachtlijst staat nog niet aan. Probeer het later nog eens.';
      else if (err && err.status === 400) waitMsg.textContent = 'Dat e-mailadres lijkt niet te kloppen. Kijk het nog even na.';
      else waitMsg.textContent = 'Inschrijven lukt nu niet. Probeer het zo nog eens.';
    }).then(function () { wbtn.classList.remove('is-loading'); wbtn.disabled = false; });
  });

  /* ───────── 9. pagina-algemeen ───────── */
  var header = $('#siteHeader');
  function onScroll() { header.classList.toggle('is-stuck', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (r, i) { r.style.transitionDelay = (i % 3) * 80 + 'ms'; io.observe(r); });
  } else {
    reveals.forEach(function (r) { r.classList.add('in'); });
  }

  // Eén vraag tegelijk open.
  $$('.faq details').forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (d.open) $$('.faq details').forEach(function (o) { if (o !== d) o.open = false; });
    });
  });

  renderScene();

  var params = new URLSearchParams(location.search);
  if (params.get('adres')) { input.value = params.get('adres'); runCheck(); }
  if (params.get('bevestigd')) {
    showWaitDone('Je inschrijving is bevestigd.', 'We mailen je zodra de verkoop start.');
    $('#wachtlijst').scrollIntoView();
  }

  // Ontwerppaneel: alleen met ?tune in de adresbalk.
  C.api = {
    simulate: function (depthM) {
      state.mode = 'manual'; state.custom = true; state.tooDeep = depthM * 100 > MAX_HOLD_CM;
      state.viewDepthM = depthM; state.adviceCm = Math.min(MAX_HOLD_CM, Math.round(depthM * 100));
      renderScene();
    },
    replayBags: function () { bagsKey = ''; renderScene(); },
  };
  if (params.has('tune')) document.body.appendChild(el('script', { src: 'assets/js/tune.js' }));
})();
