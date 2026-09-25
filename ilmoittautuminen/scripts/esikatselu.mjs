// Rakentaa yhden tiedoston esikatselun, jota voi kokeilla ilman palvelinta.
// Käyttää täsmälleen samoja sivuja kuin Worker, mutta /api/-kutsut hoidetaan
// selaimessa (tiedot tallentuvat vain kokeilijan omaan selaimeen).
//   node scripts/esikatselu.mjs [tulostiedosto]
import { writeFileSync } from 'node:fs';
import { CSS, APU, etusivu, kirjautuminen, jarjestaja } from '../src/sivut.js';
import { tarkista } from '../src/worker.js';
import { HARJOITUSDATA } from './harjoitusdata.mjs';

const ulos = process.argv[2] || 'esikatselu.html';
const sivut = { etusivu, kirjautuminen, jarjestaja };
const json = (x) => JSON.stringify(x).replace(/</g, '\\u003c');

const html = `<title>Peltokone-ilmoittautuminen</title>
<meta name="theme-color" content="#2f6b43">
<style>${CSS}
.esikatselu {
  display: flex; flex-wrap: wrap; align-items: center; gap: 8px 10px; padding: 10px 16px;
  background: var(--accent-soft); border-bottom: 2px solid var(--accent); font-size: 15px;
}
.esikatselu strong { margin-right: auto; }
.esikatselu button {
  min-height: 40px; padding: 6px 12px; font: inherit; font-weight: 700; border-radius: 8px;
  border: 2px solid var(--brand); background: var(--card); color: var(--brand); cursor: pointer;
}
.esikatselu button[aria-pressed=true] { background: var(--brand); color: var(--brand-ink); }
.vain-julkaistu { display: none !important; }
</style>
<div class="esikatselu" role="region" aria-label="Esikatselun ohjaus">
  <strong>Esikatselu – tiedot jäävät vain tähän selaimeen</strong>
  <button type="button" data-polku="/">Osallistuja</button>
  <button type="button" data-polku="/jarjestaja">Järjestäjä</button>
  <button type="button" id="nollaa">Nollaa</button>
</div>
<div id="sivu"></div>
<script>
${APU}
(() => {
  const SIVUT = ${json(Object.fromEntries(Object.entries(sivut).map(([k, v]) => [k, { body: v.body, script: v.script }])))};
  const ALKU = ${json(HARJOITUSDATA)};
  const AVAIN = 'peltokone-esikatselu-v1';
  const tarkista = ${tarkista.toString()};

  // --- Tallennus: selaimen localStorage, tai muisti jos se ei ole käytössä ---
  let muisti = null;
  const alkutila = () => ({ rivit: ALKU.map((r, i) => ({ id: i + 1, ...r })), seuraava: ALKU.length + 1, kirjautunut: false });
  const lue = () => {
    if (muisti) return muisti;
    try { muisti = JSON.parse(localStorage.getItem(AVAIN)); } catch (_) {}
    return (muisti = muisti || alkutila());
  };
  const tallenna = () => { try { localStorage.setItem(AVAIN, JSON.stringify(muisti)); } catch (_) {} };

  // --- /api/-kutsut samoilla säännöillä kuin Workerissa ---
  const vastaus = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
  const lajitellut = () => [...lue().rivit].sort((a, b) => a.luotu.localeCompare(b.luotu));
  function lisaa(data, lahde) {
    const t = tarkista(data || {}, lahde === 'puhelin');
    if (t.virhe) return vastaus(t, 400);
    const tila = lue();
    if (t.rivi.sahkoposti && tila.rivit.some((r) => r.sahkoposti === t.rivi.sahkoposti)) {
      return vastaus({ virhe: 'Tällä sähköpostiosoitteella on jo ilmoittautuminen. Jos henkimäärä muuttui, soita myyjällesi.', kentta: 'sahkoposti' }, 409);
    }
    const rivi = { id: tila.seuraava++, luotu: new Date().toISOString(), ...t.rivi, lahde };
    tila.rivit.push(rivi); tallenna();
    return vastaus({ ok: true, nimi: rivi.nimi, tila: rivi.tila, henkia: rivi.henkia }, 201);
  }
  const alkuperainenFetch = window.fetch.bind(window);
  window.fetch = async (osoite, init = {}) => {
    const polku = String(osoite);
    if (!polku.startsWith('/api/')) return alkuperainenFetch(osoite, init);
    await new Promise((r) => setTimeout(r, 250)); // tuntuu verkkopyynnöltä
    const m = init.method || 'GET';
    const data = init.body ? JSON.parse(init.body) : null;
    const tila = lue();
    if (polku === '/api/osallistujat') return vastaus({ tilat: lajitellut().map(({ tila, kunta }) => ({ tila, kunta })) });
    if (polku === '/api/ilmoittaudu' && m === 'POST') return lisaa(data, 'verkko');
    if (polku === '/api/kirjaudu') {
      if (data.salasana !== 'demo') return vastaus({ virhe: 'Salasana ei kelpaa. Esikatselussa salasana on demo.' }, 401);
      tila.kirjautunut = true; tallenna(); return vastaus({ ok: true });
    }
    if (polku === '/api/kirjaudu-ulos') { tila.kirjautunut = false; tallenna(); return vastaus({ ok: true }); }
    if (polku.startsWith('/api/jarjestaja/')) {
      if (!tila.kirjautunut) return vastaus({ virhe: 'Kirjaudu ensin.' }, 401);
      if (m === 'GET') return vastaus({ ilmoittautumiset: lajitellut() });
      if (m === 'POST') return lisaa(data, 'puhelin');
      if (m === 'DELETE') {
        const id = Number(polku.split('/').pop());
        tila.rivit = tila.rivit.filter((r) => r.id !== id); tallenna();
        return vastaus({ ok: true });
      }
    }
    return vastaus({ virhe: 'Ei löytynyt' }, 404);
  };

  // --- Sivujen vaihto ilman palvelinta ---
  const ajastimet = [];
  const alkuperainenInterval = window.setInterval.bind(window);
  window.setInterval = (...a) => { const id = alkuperainenInterval(...a); ajastimet.push(id); return id; };
  window.siirry = (polku) => {
    ajastimet.splice(0).forEach(clearInterval);
    const nimi = polku === '/jarjestaja' ? (lue().kirjautunut ? 'jarjestaja' : 'kirjautuminen') : 'etusivu';
    document.getElementById('sivu').innerHTML = SIVUT[nimi].body;
    document.querySelectorAll('.esikatselu [data-polku]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.polku === (nimi === 'etusivu' ? '/' : '/jarjestaja'))));
    window.scrollTo(0, 0);
    new Function(SIVUT[nimi].script)();
  };
  document.addEventListener('click', (e) => {
    const kohde = e.target.closest('[data-polku], #sivu a[href^="/"]');
    if (!kohde) return;
    e.preventDefault();
    siirry(kohde.dataset.polku || kohde.getAttribute('href'));
  });
  document.getElementById('nollaa').addEventListener('click', () => {
    muisti = alkutila(); tallenna(); siirry('/');
  });
  siirry(location.hash === '#jarjestaja' ? '/jarjestaja' : '/');
})();
</script>
`;
writeFileSync(ulos, html);
console.log('Esikatselu kirjoitettu:', ulos);
