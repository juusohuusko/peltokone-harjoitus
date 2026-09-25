// Sivujen HTML, tyylit ja selainpuolen skriptit.
// Worker kokoaa näistä sivut (sivu()), ja esikatselun rakennusskripti käyttää
// samoja palasia, jotta esikatselu näyttää täsmälleen samalta kuin julkaistu sivu.

export const TAPAHTUMA = {
  nimi: 'Peltokoneen asiakaspäivä',
  paiva: 'Keskiviikko 11.11.',
  aika: 'klo 9–14',
  paikka: 'Peltokoneen toimipiste, Kangasala',
  // 11.11.2026 klo 9–14 Suomen aikaa (UTC+2) kalenteritiedostoa varten
  alkuUtc: '20261111T070000Z',
  loppuUtc: '20261111T120000Z',
};

export const CSS = `
:root {
  --bg: #f3f1ea;
  --card: #ffffff;
  --ink: #1f2620;
  --muted: #5b675f;
  --line: #d9d6c8;
  --brand: #2f6b43;
  --brand-ink: #ffffff;
  --brand-dark: #234f32;
  --brand-soft: #e6efe8;
  --accent: #c8891f;
  --accent-soft: #f7ecd6;
  --danger: #a33a2c;
  --radius: 14px;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #131714; --card: #1b221d; --ink: #eef2ef; --muted: #a3b0a7;
    --line: #313c35; --brand: #6fb886; --brand-ink: #10160f; --brand-dark: #1d3a27;
    --brand-soft: #1f2c24; --accent: #e0a94a; --accent-soft: #2e2618; --danger: #e07a6a;
  }
}
:root[data-theme="dark"] {
  --bg: #131714; --card: #1b221d; --ink: #eef2ef; --muted: #a3b0a7;
  --line: #313c35; --brand: #6fb886; --brand-ink: #10160f; --brand-dark: #1d3a27;
  --brand-soft: #1f2c24; --accent: #e0a94a; --accent-soft: #2e2618; --danger: #e07a6a;
}
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0; background: var(--bg); color: var(--ink);
  font: 18px/1.5 "Segoe UI", system-ui, -apple-system, Roboto, Arial, sans-serif;
}
.wrap { max-width: 720px; margin: 0 auto; padding: 0 16px; }
a { color: var(--brand); }

/* Yläosa: vihreä kaista, jossa hienovarainen vakoraidoitus */
.hero {
  background:
    repeating-linear-gradient(-8deg, rgba(255,255,255,.05) 0 2px, transparent 2px 22px),
    #2f6b43;
  color: #fff; padding: 28px 0 32px; border-bottom: 6px solid #c8891f;
}
.merkki {
  display: inline-block; margin: 0 0 14px; font-weight: 800; letter-spacing: .12em;
  font-size: 14px; text-transform: uppercase; color: #f3d9a6;
}
.hero h1 { font-size: 32px; line-height: 1.15; margin: 0 0 12px; }
.hero .aika { font-size: 22px; margin: 0 0 4px; }
.hero .paikka { margin: 0 0 12px; font-size: 18px; opacity: .95; }
.hero .ingressi { margin: 0; opacity: .9; }

.palkki { background: #2f6b43; color: #fff; border-bottom: 5px solid #c8891f; }
.palkki .wrap { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-top: 14px; padding-bottom: 14px; }
.palkki .merkki { margin: 0; }
.palkki h1 { margin: 2px 0 0; font-size: 22px; }

main { padding: 20px 0 48px; }
.kortti {
  background: var(--card); border: 1px solid var(--line); border-radius: var(--radius);
  padding: 20px 18px; margin: 0 0 18px;
}
h2 { font-size: 22px; margin: 0 0 14px; }

.kentta { margin: 0 0 18px; }
label, .otsikko { display: block; font-weight: 700; margin: 0 0 6px; }
.apu { font-weight: 400; color: var(--muted); font-size: 15px; }
input[type=text], input[type=email], input[type=tel], input[type=password] {
  width: 100%; min-height: 56px; padding: 12px 14px; font: inherit; font-size: 19px;
  color: var(--ink); background: var(--bg); border: 2px solid var(--line); border-radius: 10px;
}
input:focus, button:focus-visible, a:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
input[aria-invalid=true] { border-color: var(--danger); }

.laskuri { display: flex; align-items: stretch; gap: 10px; }
.laskuri button {
  width: 72px; min-height: 64px; font-size: 34px; font-weight: 700; line-height: 1;
  border: 2px solid var(--brand); background: var(--card); color: var(--brand);
  border-radius: 12px; cursor: pointer;
}
.laskuri button:disabled { opacity: .35; cursor: default; }
.laskuri output {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;
  font-size: 30px; font-weight: 800; background: var(--brand-soft); border-radius: 12px;
}
.laskuri output small { font-size: 18px; font-weight: 600; color: var(--muted); }

.nappi, button.nappi {
  display: flex; align-items: center; justify-content: center; gap: 10px;
  width: 100%; min-height: 64px; padding: 14px 18px; font: inherit; font-size: 21px;
  font-weight: 800; text-decoration: none; color: var(--brand-ink); background: var(--brand);
  border: 0; border-radius: 12px; cursor: pointer;
}
.nappi:hover { filter: brightness(1.07); }
.nappi[disabled] { opacity: .6; cursor: progress; }
.nappi.toissijainen { background: transparent; color: var(--brand); border: 2px solid var(--brand); }
.nappi.pieni { width: auto; min-height: 48px; font-size: 17px; padding: 10px 16px; }
.napit { display: grid; gap: 12px; }

.virhe {
  background: #fbe9e6; color: #7d2519; border-left: 5px solid var(--danger);
  padding: 12px 14px; border-radius: 8px; margin: 0 0 16px; font-weight: 600;
}
:root[data-theme="dark"] .virhe { background: #3a211d; color: #ffd9d2; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) .virhe { background: #3a211d; color: #ffd9d2; } }

.kiitos { text-align: center; }
.kiitos .merkkipallo {
  width: 76px; height: 76px; margin: 4px auto 12px; border-radius: 50%;
  background: var(--brand); color: var(--brand-ink); display: grid; place-items: center;
  font-size: 44px; font-weight: 800;
}
.kiitos p { margin: 0 0 18px; }

.ohjelma { list-style: none; margin: 0; padding: 0; }
.ohjelma li { display: flex; gap: 14px; padding: 10px 0; border-bottom: 1px solid var(--line); }
.ohjelma li:last-child { border-bottom: 0; }
.ohjelma time { flex: 0 0 64px; font-weight: 800; color: var(--brand); font-variant-numeric: tabular-nums; }

.tulijat { list-style: none; margin: 0; padding: 0; }
.tulijat li { padding: 10px 0; border-bottom: 1px solid var(--line); }
.tulijat li:last-child { border-bottom: 0; }
.tulijat .kunta { color: var(--muted); }
.maara { font-size: 17px; color: var(--muted); margin: -6px 0 10px; }

.huom {
  background: var(--accent-soft); border-left: 5px solid var(--accent);
  padding: 14px 16px; border-radius: 10px; margin: 0 0 18px;
}
.alaviite { font-size: 14px; color: var(--muted); text-align: center; margin: 24px 0 0; }
.piilo { position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden; }

/* Järjestäjän näkymä */
.luvut { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 0 0 12px; }
.luku {
  background: var(--card); border: 1px solid var(--line); border-radius: var(--radius);
  padding: 16px; display: flex; flex-direction: column;
}
.luku.paa { grid-column: 1 / -1; background: var(--brand); color: var(--brand-ink); border: 0; }
.luku .arvo { font-size: 44px; font-weight: 800; line-height: 1.05; font-variant-numeric: tabular-nums; }
.luku.paa .arvo { font-size: 64px; }
.luku .selite { font-size: 17px; font-weight: 600; }
.luku:not(.paa) .selite { color: var(--muted); }
.tila-rivi { display: flex; align-items: center; justify-content: space-between; gap: 10px; color: var(--muted); font-size: 15px; margin: 0 0 18px; }

details.kortti > summary {
  list-style: none; cursor: pointer; font-size: 20px; font-weight: 800; color: var(--brand);
  min-height: 44px; display: flex; align-items: center; gap: 10px;
}
details.kortti > summary::-webkit-details-marker { display: none; }
details.kortti > summary::before { content: "+"; font-size: 30px; line-height: 1; }
details.kortti[open] > summary::before { content: "–"; }
details.kortti[open] > summary { margin-bottom: 14px; }

.rivit { list-style: none; margin: 0; padding: 0; }
.rivi {
  display: grid; grid-template-columns: 1fr auto; gap: 2px 12px;
  padding: 14px 0; border-bottom: 1px solid var(--line);
}
.rivi:last-child { border-bottom: 0; }
.rivi .nimi { font-weight: 800; font-size: 19px; }
.rivi .hlo {
  grid-row: 1 / span 2; grid-column: 2; align-self: center; text-align: center;
  min-width: 64px; padding: 6px 10px; border-radius: 10px; background: var(--brand-soft);
  font-weight: 800; font-size: 24px; line-height: 1.1;
}
.rivi .hlo small { display: block; font-size: 13px; font-weight: 600; color: var(--muted); }
.rivi .tiedot, .rivi .yhteys { color: var(--muted); font-size: 16px; overflow-wrap: anywhere; }
.rivi .alarivi { grid-column: 1 / -1; display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; margin-top: 6px; font-size: 14px; color: var(--muted); }
.merkinta { background: var(--accent-soft); color: var(--ink); border-radius: 999px; padding: 2px 10px; font-weight: 700; }
.poista {
  margin-left: auto; min-height: 40px; padding: 6px 14px; font: inherit; font-size: 15px; font-weight: 700;
  background: transparent; color: var(--danger); border: 2px solid currentColor; border-radius: 10px; cursor: pointer;
}
.vihje { font-size: 15px; color: var(--muted); margin: 6px 0 0; }
.rivi .ruokavalio {
  grid-column: 1 / -1; margin-top: 6px; padding: 6px 10px; border-radius: 8px;
  background: var(--accent-soft); border-left: 4px solid var(--accent); font-size: 16px; overflow-wrap: anywhere;
}
.poista.varmista { background: var(--danger); color: #fff; border-color: var(--danger); }
.tyhja { color: var(--muted); margin: 0; }
.osoitteet { width: 100%; margin-top: 12px; padding: 12px; font: inherit; font-size: 16px; color: var(--ink); background: var(--card); border: 2px solid var(--line); border-radius: 10px; }

@media (min-width: 600px) {
  .hero h1 { font-size: 40px; }
  .luvut { grid-template-columns: 2fr 1fr 1fr; }
  .luku.paa { grid-column: auto; }
  .napit.rinnakkain { grid-template-columns: 1fr 1fr; }
}
@media print {
  .palkki button, details, .napit, .poista, .tila-rivi button { display: none !important; }
  body { background: #fff; color: #000; }
  .kortti, .luku { border-color: #999; }
}
`;

// Yhteiset apufunktiot kaikille sivuille (selainpuoli).
export const APU = `
function el(tag, attrs, ...lapset) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v);
  }
  for (const l of lapset.flat()) if (l != null && l !== false) e.append(l.nodeType ? l : String(l));
  return e;
}
async function api(polku, asetukset) {
  const a = asetukset || {};
  try {
    const r = await fetch(polku, {
      method: a.method || 'GET',
      headers: a.body ? { 'Content-Type': 'application/json' } : {},
      body: a.body ? JSON.stringify(a.body) : undefined,
      credentials: 'same-origin',
    });
    let data = {};
    try { data = await r.json(); } catch (_) {}
    return { ok: r.ok, status: r.status, data };
  } catch (_) {
    return { ok: false, status: 0, data: { virhe: 'Yhteys ei toiminut. Tarkista verkkoyhteys ja yritä uudelleen.' } };
  }
}
function siirry(polku) { location.href = polku; }
function lomakkeenTiedot(lomake) { return Object.fromEntries(new FormData(lomake).entries()); }
function naytaVirhe(lomake, viesti, kentta) {
  const laatikko = lomake.querySelector('.virhe');
  lomake.querySelectorAll('[aria-invalid]').forEach(i => i.removeAttribute('aria-invalid'));
  if (!viesti) { laatikko.hidden = true; return; }
  laatikko.textContent = viesti; laatikko.hidden = false;
  const i = kentta && lomake.querySelector('[name="' + kentta + '"]');
  if (i) { i.setAttribute('aria-invalid', 'true'); i.focus(); } else laatikko.scrollIntoView({ block: 'center' });
}
function kytkeLaskuri(juuri) {
  const input = juuri.querySelector('input[type=hidden]');
  const naytto = juuri.querySelector('.luku-arvo');
  const [miinus, plus] = juuri.querySelectorAll('button');
  const aseta = n => {
    n = Math.max(1, Math.min(10, n));
    input.value = n; naytto.textContent = n;
    juuri.querySelector('small').textContent = n === 1 ? 'henkilö' : 'henkeä';
    miinus.disabled = n <= 1; plus.disabled = n >= 10;
  };
  miinus.addEventListener('click', () => aseta(Number(input.value) - 1));
  plus.addEventListener('click', () => aseta(Number(input.value) + 1));
  aseta(Number(input.value) || 1);
  return aseta;
}
`;

const laskuriHtml = (id) => `
  <div class="kentta">
    <span class="otsikko" id="${id}-otsikko">Montako henkeä tulee?</span>
    <div class="laskuri" id="${id}" role="group" aria-labelledby="${id}-otsikko">
      <button type="button" aria-label="Yksi henkilö vähemmän">−</button>
      <output aria-live="polite"><span class="luku-arvo">1</span> <small>henkilö</small></output>
      <button type="button" aria-label="Yksi henkilö lisää">+</button>
      <input type="hidden" name="henkia" value="1">
    </div>
  </div>`;

// ---------- Osallistujan sivu ----------

export const etusivu = {
  otsikko: 'Ilmoittaudu asiakaspäivään – Peltokone Oy',
  body: `
<header class="hero">
  <div class="wrap">
    <p class="merkki">Peltokone Oy</p>
    <h1>Asiakaspäivä Kangasalla</h1>
    <p class="aika"><strong>${TAPAHTUMA.paiva}</strong> ${TAPAHTUMA.aika}</p>
    <p class="paikka">${TAPAHTUMA.paikka}</p>
    <p class="ingressi">Uutuuskoneet, koeajot pihalla ja lounas. Tervetuloa koko tilan väen kanssa!</p>
  </div>
</header>
<main class="wrap">
  <section class="kortti" id="ilmoittautuminen">
    <h2>Ilmoittaudu</h2>
    <form id="lomake" novalidate>
      <div class="virhe" role="alert" hidden></div>
      <div class="kentta">
        <label for="nimi">Nimi</label>
        <input id="nimi" name="nimi" type="text" autocomplete="name" maxlength="100" required>
      </div>
      <div class="kentta">
        <label for="tila">Tila <span class="apu">– tai yritys</span></label>
        <input id="tila" name="tila" type="text" autocomplete="organization" maxlength="100" required>
      </div>
      <div class="kentta">
        <label for="kunta">Kunta</label>
        <input id="kunta" name="kunta" type="text" autocomplete="address-level2" maxlength="60" required>
      </div>
      <div class="kentta">
        <label for="sahkoposti">Sähköposti</label>
        <input id="sahkoposti" name="sahkoposti" type="email" inputmode="email" autocomplete="email" maxlength="120" required>
      </div>
      ${laskuriHtml('henkia-laskuri')}
      <div class="kentta">
        <label for="ruokavalio">Erityisruokavalio <span class="apu">– vapaaehtoinen</span></label>
        <input id="ruokavalio" name="ruokavalio" type="text" maxlength="200" autocomplete="off" placeholder="esim. 1 gluteeniton, 1 laktoositon">
        <p class="vihje">Kerro koko porukan puolesta.</p>
      </div>
      <div class="piilo" aria-hidden="true">
        <label for="kotisivu">Jätä tämä tyhjäksi</label>
        <input id="kotisivu" name="kotisivu" type="text" tabindex="-1" autocomplete="off">
      </div>
      <button class="nappi" type="submit">Ilmoittaudu</button>
    </form>
    <div class="kiitos" id="kiitos" hidden tabindex="-1">
      <div class="merkkipallo" aria-hidden="true">✓</div>
      <h2 id="kiitos-otsikko">Kiitos!</h2>
      <p id="kiitos-teksti"></p>
      <div class="napit">
        <a class="nappi vain-julkaistu" href="/tapahtuma.ics" download="peltokone-asiakaspaiva.ics">Lisää kalenteriin</a>
        <button class="nappi toissijainen" type="button" id="uusi">Ilmoita toinen henkilö tai tila</button>
      </div>
    </div>
  </section>

  <p class="huom"><strong>Mieluummin puhelimella?</strong> Soita tutulle Peltokoneen myyjälle, niin hän kirjaa ilmoittautumisen puolestasi.</p>

  <section class="kortti">
    <h2>Päivän ohjelma</h2>
    <ol class="ohjelma">
      <li><time>9.00</time><span>Aamukahvit ja tervetuloa</span></li>
      <li><time>9.30</time><span>Syksyn uutuuskoneet esittelyssä</span></li>
      <li><time>11.00</time><span>Lounas</span></li>
      <li><time>12.00</time><span>Koeajot pihalla ja huollon vinkit</span></li>
      <li><time>13.30</time><span>Arvonta ja päätöskahvit</span></li>
    </ol>
  </section>

  <section class="kortti">
    <h2>Ketä on tulossa</h2>
    <p class="maara" id="maara">Ladataan…</p>
    <ul class="tulijat" id="tulijat"></ul>
  </section>

  <p class="alaviite">Peltokone Oy on kuvitteellinen harjoitusyritys. Tietoja käytetään vain tämän tilaisuuden järjestämiseen.</p>
</main>`,
  script: `
const lomake = document.getElementById('lomake');
const asetaHenkia = kytkeLaskuri(document.getElementById('henkia-laskuri'));
const kiitos = document.getElementById('kiitos');

async function lataaTulijat() {
  const { ok, data } = await api('/api/osallistujat');
  const maara = document.getElementById('maara');
  const lista = document.getElementById('tulijat');
  if (!maara) return; // sivu vaihtui latauksen aikana
  if (!ok) { maara.textContent = 'Listaa ei juuri nyt saatu ladattua.'; return; }
  const n = data.tilat.length;
  maara.textContent = n === 0 ? 'Ole ensimmäinen!' : (n === 1 ? '1 tila ilmoittautunut' : n + ' tilaa ilmoittautunut');
  lista.replaceChildren(...data.tilat.map(t => el('li', {}, el('strong', {}, t.tila), el('span', { class: 'kunta' }, ', ' + t.kunta))));
}

lomake.addEventListener('submit', async (e) => {
  e.preventDefault();
  const tiedot = lomakkeenTiedot(lomake);
  for (const [k, nimi] of [['nimi', 'nimesi'], ['tila', 'tilan nimi'], ['kunta', 'kunta'], ['sahkoposti', 'sähköpostiosoite']]) {
    if (!tiedot[k].trim()) return naytaVirhe(lomake, 'Kirjoita ' + nimi + '.', k);
  }
  if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(tiedot.sahkoposti.trim())) return naytaVirhe(lomake, 'Tarkista sähköpostiosoite.', 'sahkoposti');
  naytaVirhe(lomake, null);
  const nappi = lomake.querySelector('button[type=submit]');
  nappi.disabled = true; nappi.textContent = 'Lähetetään…';
  const { ok, data } = await api('/api/ilmoittaudu', { method: 'POST', body: tiedot });
  nappi.disabled = false; nappi.textContent = 'Ilmoittaudu';
  if (!ok) return naytaVirhe(lomake, data.virhe || 'Ilmoittautuminen ei onnistunut. Yritä uudelleen.', data.kentta);
  const etunimi = data.nimi.split(' ')[0];
  document.getElementById('kiitos-otsikko').textContent = 'Kiitos, ' + etunimi + '!';
  document.getElementById('kiitos-teksti').textContent =
    'Ilmoittautuminen on vastaanotettu: ' + data.henkia + (data.henkia === 1 ? ' henkilö' : ' henkeä') + ' tilalta ' + data.tila + '. Nähdään ' + ${JSON.stringify(TAPAHTUMA.paiva.toLowerCase())} + ' ' + ${JSON.stringify(TAPAHTUMA.aika)} + '.';
  lomake.hidden = true; kiitos.hidden = false; kiitos.focus();
  kiitos.scrollIntoView({ block: 'start', behavior: 'smooth' });
  lataaTulijat();
});

document.getElementById('uusi').addEventListener('click', () => {
  const tila = lomake.tila.value, kunta = lomake.kunta.value;
  lomake.reset(); lomake.tila.value = tila; lomake.kunta.value = kunta; asetaHenkia(1);
  kiitos.hidden = true; lomake.hidden = false; lomake.nimi.focus();
});

lataaTulijat();
`,
};

// ---------- Järjestäjän kirjautuminen ----------

export const kirjautuminen = {
  otsikko: 'Järjestäjän kirjautuminen – Peltokone Oy',
  body: `
<header class="palkki"><div class="wrap"><div><p class="merkki">Peltokone Oy</p><h1>Järjestäjän näkymä</h1></div></div></header>
<main class="wrap">
  <section class="kortti">
    <h2>Kirjaudu</h2>
    <form id="kirjaudu" novalidate>
      <div class="virhe" role="alert" hidden></div>
      <div class="kentta">
        <label for="salasana">Järjestäjän salasana</label>
        <input id="salasana" name="salasana" type="password" autocomplete="current-password" required>
      </div>
      <button class="nappi" type="submit">Kirjaudu</button>
    </form>
  </section>
  <p class="alaviite"><a href="/">Takaisin ilmoittautumissivulle</a></p>
</main>`,
  script: `
const f = document.getElementById('kirjaudu');
f.addEventListener('submit', async (e) => {
  e.preventDefault();
  const { ok, data } = await api('/api/kirjaudu', { method: 'POST', body: lomakkeenTiedot(f) });
  if (!ok) return naytaVirhe(f, data.virhe || 'Kirjautuminen ei onnistunut.', 'salasana');
  siirry('/jarjestaja');
});
`,
};

// ---------- Järjestäjän näkymä ----------

export const jarjestaja = {
  otsikko: 'Ilmoittautuneet – Peltokone Oy',
  body: `
<header class="palkki"><div class="wrap">
  <div><p class="merkki">Järjestäjän näkymä</p><h1>Asiakaspäivä ${TAPAHTUMA.paiva.split(' ')[1]}</h1></div>
  <button class="nappi toissijainen pieni" id="ulos" type="button" style="color:#fff;border-color:#fff">Kirjaudu ulos</button>
</div></header>
<main class="wrap">
  <div class="luvut">
    <div class="luku paa"><span class="arvo" id="luku-henkia">–</span><span class="selite">henkeä tulossa</span></div>
    <div class="luku"><span class="arvo" id="luku-ilm">–</span><span class="selite">ilmoittautumista</span></div>
    <div class="luku"><span class="arvo" id="luku-puh">–</span><span class="selite">puhelimitse</span></div>
  </div>
  <div class="tila-rivi"><span id="paivitetty">Ladataan…</span><button class="nappi toissijainen pieni" id="paivita" type="button">Päivitä</button></div>

  <details class="kortti" id="lisaa-kortti">
    <summary>Kirjaa puhelimessa saatu ilmoittautuminen</summary>
    <form id="lisaa" novalidate>
      <div class="virhe" role="alert" hidden></div>
      <div class="kentta"><label for="l-nimi">Nimi</label><input id="l-nimi" name="nimi" type="text" maxlength="100" autocomplete="off"></div>
      <div class="kentta"><label for="l-tila">Tila</label><input id="l-tila" name="tila" type="text" maxlength="100" autocomplete="off"></div>
      <div class="kentta"><label for="l-kunta">Kunta</label><input id="l-kunta" name="kunta" type="text" maxlength="60" autocomplete="off"></div>
      <div class="kentta"><label for="l-puhelin">Puhelin <span class="apu">– vapaaehtoinen</span></label><input id="l-puhelin" name="puhelin" type="tel" inputmode="tel" maxlength="30" autocomplete="off"></div>
      <div class="kentta"><label for="l-sahkoposti">Sähköposti <span class="apu">– vapaaehtoinen</span></label><input id="l-sahkoposti" name="sahkoposti" type="email" inputmode="email" maxlength="120" autocomplete="off"></div>
      ${laskuriHtml('l-henkia')}
      <div class="kentta">
        <label for="l-ruokavalio">Erityisruokavalio <span class="apu">– vapaaehtoinen</span></label>
        <input id="l-ruokavalio" name="ruokavalio" type="text" maxlength="200" autocomplete="off" placeholder="esim. 1 gluteeniton, 1 laktoositon">
        <p class="vihje">Kerro koko porukan puolesta.</p>
      </div>
      <button class="nappi" type="submit">Tallenna ilmoittautuminen</button>
    </form>
  </details>

  <section class="kortti">
    <h2>Ilmoittautuneet</h2>
    <p class="maara" id="ruokavaliot"></p>
    <ul class="rivit" id="rivit"></ul>
  </section>

  <div class="napit rinnakkain">
    <button class="nappi toissijainen" id="kopioi" type="button">Kopioi sähköpostit</button>
    <button class="nappi toissijainen vain-julkaistu" id="tulosta" type="button">Tulosta nimilista</button>
  </div>
  <textarea id="osoitteet" class="osoitteet" rows="4" readonly hidden aria-label="Sähköpostiosoitteet"></textarea>
</main>`,
  script: `
let rivit = [];
const aikaMuoto = new Intl.DateTimeFormat('fi-FI', { timeZone: 'Europe/Helsinki', day: 'numeric', month: 'numeric', hour: 'numeric', minute: '2-digit' });
const kelloMuoto = new Intl.DateTimeFormat('fi-FI', { timeZone: 'Europe/Helsinki', hour: 'numeric', minute: '2-digit' });
const lisaa = document.getElementById('lisaa');
const asetaHenkia = kytkeLaskuri(document.getElementById('l-henkia'));

function piirra() {
  const henkia = rivit.reduce((s, r) => s + r.henkia, 0);
  document.getElementById('luku-henkia').textContent = henkia;
  document.getElementById('luku-ilm').textContent = rivit.length;
  document.getElementById('luku-puh').textContent = rivit.filter(r => r.lahde === 'puhelin').length;
  const erikois = rivit.filter(r => r.ruokavalio).length;
  document.getElementById('ruokavaliot').textContent = erikois === 0 ? 'Ei erityisruokavalioita.'
    : 'Erityisruokavalio ' + erikois + ' ilmoittautumisessa – näkyy rivin alla.';
  const lista = document.getElementById('rivit');
  if (!rivit.length) { lista.replaceChildren(el('li', {}, el('p', { class: 'tyhja' }, 'Ei vielä ilmoittautuneita.'))); return; }
  lista.replaceChildren(...rivit.map(r => el('li', { class: 'rivi' },
    el('span', { class: 'nimi' }, r.nimi),
    el('span', { class: 'hlo' }, r.henkia, el('small', {}, 'hlö')),
    el('span', { class: 'tiedot' }, r.tila + ', ' + r.kunta),
    (r.sahkoposti || r.puhelin) ? el('span', { class: 'yhteys' }, [r.puhelin, r.sahkoposti].filter(Boolean).join(' · ')) : null,
    r.ruokavalio ? el('span', { class: 'ruokavalio' }, el('strong', {}, 'Ruokavalio: '), r.ruokavalio) : null,
    el('span', { class: 'alarivi' },
      r.lahde === 'puhelin' ? el('span', { class: 'merkinta' }, 'puhelin') : el('span', {}, 'verkossa'),
      el('span', {}, aikaMuoto.format(new Date(r.luotu))),
      el('button', { class: 'poista', type: 'button', onclick: (e) => poista(r, e.currentTarget) }, 'Poista')),
  )));
}

async function lataa() {
  const { ok, status, data } = await api('/api/jarjestaja/ilmoittautumiset');
  if (status === 401) return siirry('/jarjestaja');
  if (!document.getElementById('rivit')) return; // sivu vaihtui latauksen aikana
  if (!ok) { document.getElementById('paivitetty').textContent = data.virhe || 'Lataus ei onnistunut.'; return; }
  rivit = data.ilmoittautumiset;
  piirra();
  document.getElementById('paivitetty').textContent = 'Päivitetty klo ' + kelloMuoto.format(new Date());
}

// Kaksivaiheinen poisto: ensimmäinen napautus kysyy vahvistuksen, toinen poistaa.
async function poista(r, nappi) {
  if (!nappi.dataset.varmistus) {
    nappi.dataset.varmistus = '1'; nappi.textContent = 'Vahvista poisto'; nappi.classList.add('varmista');
    setTimeout(() => { delete nappi.dataset.varmistus; nappi.textContent = 'Poista'; nappi.classList.remove('varmista'); }, 4000);
    return;
  }
  nappi.disabled = true;
  const { ok, data } = await api('/api/jarjestaja/ilmoittautumiset/' + r.id, { method: 'DELETE' });
  if (!ok) { nappi.disabled = false; document.getElementById('paivitetty').textContent = data.virhe || 'Poisto ei onnistunut.'; return; }
  lataa();
}

lisaa.addEventListener('submit', async (e) => {
  e.preventDefault();
  const tiedot = lomakkeenTiedot(lisaa);
  for (const [k, nimi] of [['nimi', 'nimi'], ['tila', 'tila'], ['kunta', 'kunta']]) {
    if (!tiedot[k].trim()) return naytaVirhe(lisaa, 'Kirjoita ' + nimi + '.', k);
  }
  naytaVirhe(lisaa, null);
  const { ok, data } = await api('/api/jarjestaja/ilmoittautumiset', { method: 'POST', body: tiedot });
  if (!ok) return naytaVirhe(lisaa, data.virhe || 'Tallennus ei onnistunut.', data.kentta);
  lisaa.reset(); asetaHenkia(1);
  document.getElementById('lisaa-kortti').open = false;
  await lataa();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

document.getElementById('paivita').addEventListener('click', lataa);
document.getElementById('tulosta').addEventListener('click', () => window.print());
document.getElementById('kopioi').addEventListener('click', async (e) => {
  const osoitteet = rivit.map(r => r.sahkoposti).filter(Boolean).join(', ');
  const nappi = e.currentTarget;
  try { await navigator.clipboard.writeText(osoitteet); nappi.textContent = 'Kopioitu (' + osoitteet.split(', ').filter(Boolean).length + ' osoitetta)'; }
  catch (_) {
    const alue = document.getElementById('osoitteet');
    alue.value = osoitteet; alue.hidden = false; alue.focus(); alue.select();
    nappi.textContent = 'Kopioi osoitteet alta';
  }
  setTimeout(() => { nappi.textContent = 'Kopioi sähköpostit'; }, 3000);
});
document.getElementById('ulos').addEventListener('click', async () => {
  await api('/api/kirjaudu-ulos', { method: 'POST', body: {} });
  siirry('/jarjestaja');
});

lataa();
setInterval(() => { if (document.visibilityState === 'visible') lataa(); }, 60000);
`,
};

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function sivu({ otsikko, body, script }, { noindex = false } = {}) {
  return `<!DOCTYPE html>
<html lang="fi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#2f6b43">
${noindex ? '<meta name="robots" content="noindex, nofollow">\n' : ''}<title>${esc(otsikko)}</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%232f6b43'/%3E%3Cpath d='M6 22h20M8 17h16M10 12h12' stroke='%23c8891f' stroke-width='3' stroke-linecap='round'/%3E%3C/svg%3E">
<style>${CSS}</style>
</head>
<body>
${body}
<script>
${APU}
${script}
</script>
</body>
</html>`;
}

export function kalenteritiedosto(osoite) {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Peltokone Oy//Asiakaspaiva//FI',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    'UID:asiakaspaiva-2026-11-11@peltokone-ilmoittautuminen',
    'DTSTAMP:20260925T000000Z',
    `DTSTART:${TAPAHTUMA.alkuUtc}`,
    `DTEND:${TAPAHTUMA.loppuUtc}`,
    `SUMMARY:${TAPAHTUMA.nimi}`,
    `LOCATION:${TAPAHTUMA.paikka.replace(/,/g, '\\,')}`,
    `DESCRIPTION:Uutuuskoneet\\, koeajot ja lounas. ${osoite}`,
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n');
}
