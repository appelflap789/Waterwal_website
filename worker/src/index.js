/**
 * Waterwal Worker
 *
 *   GET  /risk?lat=..&lon=..   waterdiepte per overstromingsscenario (LIWO) + type gebied (PDOK)
 *   POST /subscribe            wachtlijst-inschrijving -> Brevo (alleen als BREVO_API_KEY is gezet)
 *
 * Geen geheimen in deze file. Secrets zet je met `npx wrangler secret put <NAAM>`:
 *   BREVO_API_KEY            (verplicht voor /subscribe)
 *   BREVO_LIST_ID            (verplicht voor /subscribe, getal)
 *   BREVO_DOI_TEMPLATE_ID    (optioneel: template voor double opt-in; zonder = direct op de lijst)
 *   BREVO_REDIRECT_URL       (optioneel, standaard https://waterwal.eu/?bevestigd=1)
 */

const LIWO_WMS = 'https://basisinformatie-overstromingen.nl/liwo/geoserver/wms';
const PDOK_ZONE_WMS = 'https://service.pdok.nl/rws/overstromingen-risicogebied/wms/v1_0';

// Kaart 1-5 = grote ... extreem kleine kans. Bron: Deltares, "Technische uitgangspunten
// en methode LIWO afgeleide kaarten" (nov 2025), tabel "Kaart / A B C D".
const LAYERS = [
  ['k1', 'LIWO_Basis:MaximaleWaterdiepteNederland_Kaart1'],
  ['k2', 'LIWO_Basis:MaximaleWaterdiepteNederland_Kaart2'],
  ['k3', 'LIWO_Basis:MaximaleWaterdiepteNederland_Kaart3'],
  ['k4', 'LIWO_Basis:MaximaleWaterdiepteNederland_Kaart4'],
  ['k5', 'LIWO_Basis:MaximaleWaterdiepteNederland_Kaart5'],
];

// Plaatsgebonden overstromingskans: kans per jaar dat het op deze plek nat wordt (0 cm),
// of dat het water hoger komt dan 20 / 50 cm. Klassen 1-5 volgens de LIWO-legenda:
// 1 extreem klein (<1/30.000), 2 zeer klein, 3 klein (1/300-1/3.000),
// 4 middelgroot (1/30-1/300), 5 groot (>1/30 per jaar). 0 of geen data = geen kans.
const CHANCE_LAYERS = [
  ['wet', 'LIWO_Basis:plaatsgebonden_kans_totaal_huidig_0'],
  ['over20', 'LIWO_Basis:plaatsgebonden_kans_totaal_huidig_20'],
  ['over50', 'LIWO_Basis:plaatsgebonden_kans_totaal_huidig_50'],
];

const ALLOWED_ORIGINS = [
  /^https:\/\/(www\.)?waterwal\.eu$/,
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/,
];

const UPSTREAM_TIMEOUT_MS = 8000;
const D = 0.0005; // halve zijde van het zoekvak in graden (~50 m)

function corsHeaders(request, { allowNull = false } = {}) {
  const origin = request.headers.get('Origin');
  const headers = { Vary: 'Origin' };
  if (!origin) return headers;
  // "null" = pagina geopend vanaf schijf (file://). Alleen toegestaan voor de openbare /risk-data.
  if ((allowNull && origin === 'null') || ALLOWED_ORIGINS.some((re) => re.test(origin))) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type';
    headers['Access-Control-Max-Age'] = '86400';
  }
  return headers;
}

function json(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  });
}

async function fetchWithTimeout(url, init = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

function featureInfoUrl(base, layer, lat, lon, format) {
  const p = new URLSearchParams({
    service: 'WMS',
    version: '1.1.1',
    request: 'GetFeatureInfo',
    layers: layer,
    query_layers: layer,
    srs: 'EPSG:4326',
    bbox: [lon - D, lat - D, lon + D, lat + D].join(','),
    width: '3',
    height: '3',
    x: '1',
    y: '1',
    info_format: format,
    feature_count: '10',
  });
  return `${base}?${p}`;
}

async function depthFor(layer, lat, lon) {
  const res = await fetchWithTimeout(featureInfoUrl(LIWO_WMS, layer, lat, lon, 'application/json'));
  if (!res.ok) throw new Error(`LIWO ${res.status}`);
  const data = await res.json();
  const v = data && data.features && data.features[0] && data.features[0].properties
    ? data.features[0].properties.GRAY_INDEX
    : null;
  // -9999 (of andere negatieve waarden) = droog / geen data
  if (typeof v !== 'number' || !isFinite(v) || v <= 0) return null;
  return Math.round(v * 100) / 100;
}

async function chanceFor(layer, lat, lon) {
  const res = await fetchWithTimeout(featureInfoUrl(LIWO_WMS, layer, lat, lon, 'application/json'));
  if (!res.ok) throw new Error(`LIWO ${res.status}`);
  const data = await res.json();
  const v = data && data.features && data.features[0] && data.features[0].properties
    ? data.features[0].properties.GRAY_INDEX
    : null;
  if (typeof v !== 'number' || !isFinite(v)) return null;
  const c = Math.round(v);
  return c >= 1 && c <= 5 ? c : null;
}

async function zonesFor(lat, lon) {
  // text/plain omdat de JSON-variant de volledige (MB's grote) polygonen meestuurt.
  const res = await fetchWithTimeout(featureInfoUrl(PDOK_ZONE_WMS, 'NZ.RiskZone', lat, lon, 'text/plain'));
  if (!res.ok) throw new Error(`PDOK ${res.status}`);
  const text = await res.text();
  const seen = new Set();
  const zones = [];
  for (const m of text.matchAll(/^\s*description = '([^']*)'/gm)) {
    const description = m[1].trim();
    if (!description || seen.has(description)) continue;
    seen.add(description);
    const code = (description.match(/type ([A-D])\b/) || [])[1] || null;
    zones.push({ code, description });
  }
  return zones;
}

async function handleRisk(request, ctx) {
  const cors = corsHeaders(request, { allowNull: true });
  const url = new URL(request.url);
  const lat = Number(url.searchParams.get('lat'));
  const lon = Number(url.searchParams.get('lon'));
  if (!isFinite(lat) || !isFinite(lon) || lat < 50.7 || lat > 53.7 || lon < 3.2 || lon > 7.3) {
    return json({ error: 'lat/lon ontbreekt of ligt buiten Nederland' }, 400, cors);
  }
  const rlat = Math.round(lat * 1e4) / 1e4;
  const rlon = Math.round(lon * 1e4) / 1e4;

  const cacheKey = new Request(`https://cache.waterwal/risk-v2/${rlat}/${rlon}`);
  const cache = caches.default;
  const hit = await cache.match(cacheKey);
  if (hit) {
    const res = new Response(hit.body, hit);
    for (const [k, v] of Object.entries(cors)) res.headers.set(k, v);
    res.headers.set('X-Cache', 'HIT');
    return res;
  }

  let depths;
  let chances;
  try {
    [depths, chances] = await Promise.all([
      Promise.all(LAYERS.map(([, layer]) => depthFor(layer, rlat, rlon))),
      Promise.all(CHANCE_LAYERS.map(([, layer]) => chanceFor(layer, rlat, rlon))),
    ]);
  } catch (err) {
    return json({ error: 'bron niet bereikbaar' }, 502, cors);
  }
  // Het gebiedstype is extra context; als PDOK hapert geven we de dieptes toch terug.
  let zones = [];
  let zonesOk = true;
  try {
    zones = await zonesFor(rlat, rlon);
  } catch (err) {
    zonesOk = false;
  }

  const body = {
    lat: rlat,
    lon: rlon,
    scenarios: LAYERS.map(([id], i) => ({ id, depth_m: depths[i] })),
    chance: Object.fromEntries(CHANCE_LAYERS.map(([id], i) => [id, chances[i]])),
    zones,
    source: 'LIWO (Rijkswaterstaat), PDOK',
  };
  const cacheable = json(body, 200, { 'Cache-Control': 'public, max-age=604800' });
  if (zonesOk) ctx.waitUntil(cache.put(cacheKey, cacheable.clone()));
  const res = new Response(cacheable.body, cacheable);
  for (const [k, v] of Object.entries(cors)) res.headers.set(k, v);
  res.headers.set('Cache-Control', 'public, max-age=86400');
  return res;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function handleSubscribe(request, env) {
  const cors = corsHeaders(request);
  if (!cors['Access-Control-Allow-Origin']) return json({ error: 'origin niet toegestaan' }, 403, cors);
  if (!env.BREVO_API_KEY || !env.BREVO_LIST_ID) {
    return json({ error: 'not_configured' }, 503, cors);
  }
  let data;
  try {
    data = await request.json();
  } catch (err) {
    return json({ error: 'ongeldige invoer' }, 400, cors);
  }
  // Honeypot: echte bezoekers laten dit veld leeg.
  if (data.website) return json({ ok: true, doi: false }, 200, cors);

  const email = String(data.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) return json({ error: 'ongeldig e-mailadres' }, 400, cors);
  if (data.consent !== true) return json({ error: 'toestemming ontbreekt' }, 400, cors);

  const attributes = {};
  const postcode = String(data.postcode || '').replace(/\s+/g, '').toUpperCase();
  if (/^\d{4}[A-Z]{2}$/.test(postcode)) attributes.POSTCODE = postcode;
  const bags = Number(data.bags);
  if (Number.isInteger(bags) && bags > 0 && bags < 1000) attributes.ADVIES_ZAKKEN = bags;
  if (data.color === 'zwart' || data.color === 'wit') attributes.KLEUR = data.color;
  if (typeof data.scenario === 'string' && data.scenario.length < 60) attributes.SCENARIO = data.scenario;

  const listId = Number(env.BREVO_LIST_ID);
  const doi = Boolean(env.BREVO_DOI_TEMPLATE_ID);
  const endpoint = doi
    ? 'https://api.brevo.com/v3/contacts/doubleOptinConfirmation'
    : 'https://api.brevo.com/v3/contacts';
  const payload = doi
    ? {
        email,
        attributes,
        includeListIds: [listId],
        templateId: Number(env.BREVO_DOI_TEMPLATE_ID),
        redirectionUrl: env.BREVO_REDIRECT_URL || 'https://waterwal.eu/?bevestigd=1',
      }
    : { email, attributes, listIds: [listId], updateEnabled: true };

  let res;
  try {
    res = await fetchWithTimeout(endpoint, {
      method: 'POST',
      headers: { 'api-key': env.BREVO_API_KEY, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    return json({ error: 'mailinglijst niet bereikbaar' }, 502, cors);
  }
  if (!res.ok) return json({ error: 'inschrijven mislukt' }, 502, cors);
  return json({ ok: true, doi }, 200, cors);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request, { allowNull: url.pathname === '/risk' }) });
    }
    if (url.pathname === '/risk' && request.method === 'GET') return handleRisk(request, ctx);
    if (url.pathname === '/subscribe' && request.method === 'POST') return handleSubscribe(request, env);
    return json({ error: 'niet gevonden' }, 404, corsHeaders(request));
  },
};
