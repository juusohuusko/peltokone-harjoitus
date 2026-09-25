// Julkaisee ilmoittautumissivun: Supabase-taulu (+ harjoitusdata tyhjään tauluun)
// ja Cloudflare Worker. Avaimia ei tulosteta: Supabasen palveluavain luetaan
// hallinta-API:sta ja viedään suoraan Workerin salaisuudeksi.
//
// Ympäristö:
//   CLOUDFLARE_ACCOUNT_ID, SUPABASE_PROJECT_REF       (pakolliset)
//   CLOUDFLARE_API_TOKEN, SUPABASE_ACCESS_TOKEN       (jos välityspalvelin ei lisää tunnuksia)
//   JARJESTAJA_SALASANA                               (valinnainen; muuten luodaan uusi
//                                                      ensijulkaisussa tai säilytetään vanha)
//   SALASANA_TIEDOSTO                                 (minne uusi salasana kirjoitetaan)
//
//   NODE_USE_ENV_PROXY=1 node scripts/julkaise.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { HARJOITUSDATA } from './harjoitusdata.mjs';

const WORKER = 'peltokone-ilmoittautuminen';
const { CLOUDFLARE_ACCOUNT_ID: TILI, SUPABASE_PROJECT_REF: REF } = process.env;
if (!TILI || !REF) throw new Error('CLOUDFLARE_ACCOUNT_ID ja SUPABASE_PROJECT_REF tarvitaan.');
const juuri = new URL('..', import.meta.url);
const lue = (p) => readFileSync(new URL(p, juuri), 'utf8');
const tunnus = (nimi) => (process.env[nimi] ? { Authorization: `Bearer ${process.env[nimi]}` } : {});

async function supabase(polku, init = {}) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}${polku}`, {
    ...init, headers: { 'Content-Type': 'application/json', ...tunnus('SUPABASE_ACCESS_TOKEN'), ...init.headers },
  });
  if (!r.ok) throw new Error(`Supabase ${polku}: ${r.status} ${(await r.text()).slice(0, 300)}`);
  return r.json();
}
const sql = (query) => supabase('/database/query', { method: 'POST', body: JSON.stringify({ query }) });

async function cloudflare(polku, init = {}) {
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${TILI}/workers${polku}`, {
    ...init, headers: { ...tunnus('CLOUDFLARE_API_TOKEN'), ...init.headers },
  });
  const j = await r.json();
  if (!j.success) throw new Error(`Cloudflare ${polku}: ${JSON.stringify(j.errors)}`);
  return j.result;
}

// 1) Supabase: taulu ja harjoitusdata
console.log('Supabase: taulu ja RLS…');
await sql(lue('supabase/taulu.sql'));
const [{ n }] = await sql('select count(*)::int as n from public.ilmoittautumiset');
if (n === 0) {
  const q = (v) => (v == null ? 'null' : `'${String(v).replace(/'/g, "''")}'`);
  const rivit = HARJOITUSDATA.map((r) => `(${[r.luotu, r.nimi, r.tila, r.kunta, r.sahkoposti, r.puhelin, r.ruokavalio].map(q).join(', ')}, ${Number(r.henkia)}, ${q(r.lahde)})`);
  await sql(`insert into public.ilmoittautumiset (luotu, nimi, tila, kunta, sahkoposti, puhelin, ruokavalio, henkia, lahde) values\n${rivit.join(',\n')}`);
  console.log(`Supabase: lisätty ${rivit.length} harjoitusriviä.`);
} else {
  console.log(`Supabase: taulussa on jo ${n} riviä – harjoitusdataa ei lisätä.`);
}

// 2) Palveluavain (ei tulosteta)
const avaimet = await supabase('/api-keys?reveal=true');
const palveluavain = (avaimet.find((a) => a.type === 'secret') || avaimet.find((a) => a.name === 'service_role'))?.api_key;
if (!palveluavain) throw new Error('Supabasen palveluavainta ei löytynyt.');

// 3) Järjestäjän salasana: annettu, olemassa oleva säilytetään, tai uusi
const olemassa = await fetch(`https://api.cloudflare.com/client/v4/accounts/${TILI}/workers/scripts/${WORKER}/secrets`, { headers: tunnus('CLOUDFLARE_API_TOKEN') })
  .then((r) => r.json()).then((j) => (j.success ? j.result.map((s) => s.name) : [])).catch(() => []);
let salasana = process.env.JARJESTAJA_SALASANA || null;
if (!salasana && !olemassa.includes('JARJESTAJA_SALASANA')) {
  const sanat = ['pelto', 'kylvo', 'puimuri', 'traktori', 'aura', 'karhi', 'vako', 'lato', 'olki', 'jyva', 'multa', 'sato', 'niitto', 'paali', 'aitta', 'hirsi'];
  const tavut = randomBytes(8);
  salasana = [0, 1, 2, 3].map((i) => sanat[tavut[i] % sanat.length]).join('-') + '-' + (1000 + (tavut.readUInt16BE(4) % 9000));
  const tiedosto = process.env.SALASANA_TIEDOSTO || 'jarjestajan-salasana.txt';
  writeFileSync(tiedosto, salasana + '\n', { mode: 0o600 });
  console.log(`Järjestäjän salasana luotu ja kirjoitettu tiedostoon ${tiedosto}`);
}

// 4) Worker
console.log(`Cloudflare: julkaistaan Worker ${WORKER}…`);
const bindings = [
  { type: 'plain_text', name: 'SUPABASE_URL', text: `https://${REF}.supabase.co` },
  { type: 'secret_text', name: 'SUPABASE_KEY', text: palveluavain },
  ...(salasana ? [{ type: 'secret_text', name: 'JARJESTAJA_SALASANA', text: salasana }] : []),
];
const lomake = new FormData();
lomake.append('metadata', new Blob([JSON.stringify({
  main_module: 'worker.js',
  compatibility_date: '2026-09-01',
  bindings,
  keep_bindings: salasana ? [] : ['secret_text'],
})], { type: 'application/json' }));
for (const t of ['worker.js', 'sivut.js']) {
  lomake.append(t, new Blob([lue(`src/${t}`)], { type: 'application/javascript+module' }), t);
}
await cloudflare(`/scripts/${WORKER}`, { method: 'PUT', body: lomake });
await cloudflare(`/scripts/${WORKER}/subdomain`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ enabled: true, previews_enabled: false }),
});
const { subdomain } = await cloudflare('/subdomain');
console.log(`Valmis: https://${WORKER}.${subdomain}.workers.dev/`);
