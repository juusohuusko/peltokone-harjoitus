// Peltokoneen asiakaspäivän ilmoittautuminen – Cloudflare Worker.
//
// Ympäristö (Workerin asetuksissa):
//   SUPABASE_URL         https://<projekti>.supabase.co          (tavallinen muuttuja)
//   SUPABASE_KEY         Supabasen palveluavain                  (salaisuus)
//   JARJESTAJA_SALASANA  järjestäjän näkymän salasana            (salaisuus)
//
// Supabasen avain on vain täällä palvelimella; selain ei koskaan näe sitä.
// Taulussa on RLS päällä ilman julkisia sääntöjä, joten suora pääsy on estetty.

import { sivu, etusivu, kirjautuminen, jarjestaja, kalenteritiedosto } from './sivut.js';

const TAULU = 'ilmoittautumiset';
const EVASTE = 'pk_jarjestaja';
const ISTUNTO_SEK = 60 * 60 * 24 * 30; // 30 päivää

export default {
  async fetch(request, env) {
    try {
      return await reitita(request, env);
    } catch (e) {
      console.error('Virhe:', e && e.stack || e);
      return json({ virhe: 'Palvelussa tapahtui virhe. Yritä hetken päästä uudelleen.' }, 500);
    }
  },
};

async function reitita(request, env) {
  const url = new URL(request.url);
  const { pathname: polku } = url;
  const m = request.method;

  if (m === 'POST' || m === 'DELETE') {
    // Ristiinsivustopyynnöt torjutaan: vaaditaan JSON ja sama alkuperä.
    const origin = request.headers.get('Origin');
    if (origin && origin !== url.origin) return json({ virhe: 'Kielletty.' }, 403);
    if (m === 'POST' && !(request.headers.get('Content-Type') || '').startsWith('application/json')) {
      return json({ virhe: 'Väärä sisältötyyppi.' }, 415);
    }
  }

  if (polku === '/' && m === 'GET') return html(sivu(etusivu));
  if (polku === '/tapahtuma.ics' && m === 'GET') {
    return new Response(kalenteritiedosto(url.origin), {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="peltokone-asiakaspaiva.ics"',
      },
    });
  }
  if (polku === '/api/osallistujat' && m === 'GET') return osallistujat(env);
  if (polku === '/api/ilmoittaudu' && m === 'POST') return ilmoittaudu(request, env, 'verkko');

  if (polku === '/jarjestaja' && m === 'GET') {
    const kirjautunut = await onKirjautunut(request, env);
    return html(sivu(kirjautunut ? jarjestaja : kirjautuminen, { noindex: true }), { yksityinen: true });
  }
  if (polku === '/api/kirjaudu' && m === 'POST') return kirjaudu(request, env);
  if (polku === '/api/kirjaudu-ulos' && m === 'POST') {
    return json({ ok: true }, 200, { 'Set-Cookie': `${EVASTE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0` });
  }

  if (polku.startsWith('/api/jarjestaja/')) {
    if (!(await onKirjautunut(request, env))) return json({ virhe: 'Kirjaudu ensin.' }, 401);
    if (polku === '/api/jarjestaja/ilmoittautumiset' && m === 'GET') return kaikki(env);
    if (polku === '/api/jarjestaja/ilmoittautumiset' && m === 'POST') return ilmoittaudu(request, env, 'puhelin');
    const poisto = polku.match(/^\/api\/jarjestaja\/ilmoittautumiset\/(\d{1,12})$/);
    if (poisto && m === 'DELETE') return poista(env, poisto[1]);
  }

  if (polku === '/robots.txt') return new Response('User-agent: *\nDisallow: /jarjestaja\nDisallow: /api/\n', { headers: { 'Content-Type': 'text/plain' } });
  return html(sivu({ otsikko: 'Sivua ei löytynyt', body: '<main class="wrap"><section class="kortti" style="margin-top:24px"><h2>Sivua ei löytynyt</h2><p><a class="nappi" href="/">Ilmoittautumissivulle</a></p></section></main>', script: '' }), { status: 404 });
}

// ---------- Toiminnot ----------

async function osallistujat(env) {
  // Julkinen lista: vain tila ja kunta – ei nimiä, sähköposteja eikä henkimääriä.
  const r = await db(env, `${TAULU}?select=tila,kunta&order=luotu.asc`);
  if (!r.ok) return dbVirhe(r);
  return json({ tilat: await r.json() }, 200, { 'Cache-Control': 'no-store' });
}

async function kaikki(env) {
  const r = await db(env, `${TAULU}?select=id,luotu,nimi,tila,kunta,sahkoposti,puhelin,henkia,lahde&order=luotu.asc`);
  if (!r.ok) return dbVirhe(r);
  return json({ ilmoittautumiset: await r.json() }, 200, { 'Cache-Control': 'no-store' });
}

async function ilmoittaudu(request, env, lahde) {
  let data;
  try { data = await request.json(); } catch { return json({ virhe: 'Lomakkeen tiedot puuttuvat.' }, 400); }
  if (data && data.kotisivu) return json({ virhe: 'Ilmoittautuminen hylättiin.' }, 400); // roskapostibotti

  const t = tarkista(data || {}, lahde === 'puhelin');
  if (t.virhe) return json(t, 400);

  const r = await db(env, TAULU, {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ ...t.rivi, lahde }),
  });
  if (r.status === 409) {
    return json({
      virhe: 'Tällä sähköpostiosoitteella on jo ilmoittautuminen. Jos henkimäärä muuttui, soita myyjällesi.',
      kentta: 'sahkoposti',
    }, 409);
  }
  if (!r.ok) return dbVirhe(r);
  const [rivi] = await r.json();
  return json({ ok: true, nimi: rivi.nimi, tila: rivi.tila, henkia: rivi.henkia }, 201);
}

async function poista(env, id) {
  const r = await db(env, `${TAULU}?id=eq.${id}`, { method: 'DELETE' });
  if (!r.ok) return dbVirhe(r);
  return json({ ok: true });
}

export function tarkista(d, jarjestajaKirjaa) {
  const s = (v) => (typeof v === 'string' || typeof v === 'number' ? String(v) : '').trim().replace(/\s+/g, ' ');
  const rivi = {
    nimi: s(d.nimi),
    tila: s(d.tila),
    kunta: s(d.kunta),
    sahkoposti: s(d.sahkoposti).toLowerCase() || null,
    puhelin: jarjestajaKirjaa ? (s(d.puhelin) || null) : null,
    henkia: Number(d.henkia),
  };
  const virhe = (viesti, kentta) => ({ virhe: viesti, kentta });
  if (rivi.nimi.length < 2) return virhe('Kirjoita nimi.', 'nimi');
  if (rivi.nimi.length > 100) return virhe('Nimi on liian pitkä.', 'nimi');
  if (!rivi.tila) return virhe('Kirjoita tilan nimi.', 'tila');
  if (rivi.tila.length > 100) return virhe('Tilan nimi on liian pitkä.', 'tila');
  if (!rivi.kunta) return virhe('Kirjoita kunta.', 'kunta');
  if (rivi.kunta.length > 60) return virhe('Kunnan nimi on liian pitkä.', 'kunta');
  if (!rivi.sahkoposti && !jarjestajaKirjaa) return virhe('Kirjoita sähköpostiosoite.', 'sahkoposti');
  if (rivi.sahkoposti && (rivi.sahkoposti.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rivi.sahkoposti))) {
    return virhe('Tarkista sähköpostiosoite.', 'sahkoposti');
  }
  if (rivi.puhelin && !/^[+0-9 ()-]{5,30}$/.test(rivi.puhelin)) return virhe('Tarkista puhelinnumero.', 'puhelin');
  if (!Number.isInteger(rivi.henkia) || rivi.henkia < 1 || rivi.henkia > 10) {
    return virhe('Henkimäärän pitää olla 1–10. Isommasta porukasta soita myyjällesi.', 'henkia');
  }
  return { rivi };
}

// ---------- Järjestäjän kirjautuminen ----------

async function kirjaudu(request, env) {
  if (!env.JARJESTAJA_SALASANA) return json({ virhe: 'Järjestäjän salasanaa ei ole asetettu.' }, 503);
  let data;
  try { data = await request.json(); } catch { data = {}; }
  const annettu = typeof data.salasana === 'string' ? data.salasana : '';
  if (!(await samat(annettu, env.JARJESTAJA_SALASANA))) {
    await new Promise((r) => setTimeout(r, 600)); // hidastaa arvailua
    return json({ virhe: 'Salasana ei kelpaa.' }, 401);
  }
  const vanhenee = Math.floor(Date.now() / 1000) + ISTUNTO_SEK;
  const arvo = `${vanhenee}.${await allekirjoita(env, String(vanhenee))}`;
  return json({ ok: true }, 200, {
    'Set-Cookie': `${EVASTE}=${arvo}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${ISTUNTO_SEK}`,
  });
}

async function onKirjautunut(request, env) {
  if (!env.JARJESTAJA_SALASANA) return false;
  const eva = (request.headers.get('Cookie') || '').split(/;\s*/).find((c) => c.startsWith(EVASTE + '='));
  if (!eva) return false;
  const [vanhenee, allekirjoitus] = eva.slice(EVASTE.length + 1).split('.');
  if (!vanhenee || !allekirjoitus || Number(vanhenee) < Date.now() / 1000) return false;
  return samat(allekirjoitus, await allekirjoita(env, vanhenee));
}

async function allekirjoita(env, viesti) {
  const avain = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode('istunto:' + env.JARJESTAJA_SALASANA),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', avain, new TextEncoder().encode(viesti)));
  return btoa(String.fromCharCode(...sig)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Vakioaikainen vertailu tiivisteiden kautta
async function samat(a, b) {
  const h = async (s) => new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
  const [x, y] = await Promise.all([h(a), h(b)]);
  let ero = 0;
  for (let i = 0; i < x.length; i++) ero |= x[i] ^ y[i];
  return ero === 0;
}

// ---------- Apurit ----------

function db(env, polku, init = {}) {
  const avain = env.SUPABASE_KEY;
  const headers = { apikey: avain, 'Content-Type': 'application/json', ...init.headers };
  if (avain && avain.startsWith('eyJ')) headers.Authorization = `Bearer ${avain}`; // vanha JWT-muotoinen avain
  return fetch(`${env.SUPABASE_URL}/rest/v1/${polku}`, { ...init, headers });
}

async function dbVirhe(r) {
  console.error('Supabase', r.status, (await r.text()).slice(0, 300));
  return json({ virhe: 'Tallennuspalvelu ei vastannut. Yritä hetken päästä uudelleen.' }, 502);
}

const TURVA = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'same-origin',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
};

function html(body, { status = 200, yksityinen = false } = {}) {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      ...(yksityinen ? { 'X-Robots-Tag': 'noindex, nofollow' } : {}),
      ...TURVA,
    },
  });
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...TURVA, ...headers },
  });
}
