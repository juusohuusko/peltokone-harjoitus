// Selaintestit: ajetaan Worker paikallisesti (muistinvarainen Supabase-jäljitelmä)
// ja käytetään sivuja oikealla Chromiumilla puhelimen kokoisella näytöllä.
import { chromium } from 'playwright';
import { kaynnista } from '../scripts/paikallinen.mjs';
import { tarkista } from '../src/worker.js';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

// Pilviympäristön valmiiksi asennettu Chromium, jos sellainen on
const CHROMIUM = '/opt/pw-browsers/chromium';

const KUVAT = process.env.KUVAT; // kansio kuvakaappauksille (valinnainen)
let lapi = 0;
async function testi(nimi, fn) {
  try { await fn(); lapi++; console.log('  ✓', nimi); }
  catch (e) { console.error('  ✗', nimi, '\n   ', e.message); process.exitCode = 1; }
}

// --- Syötteiden tarkistus (ei selainta) ---
console.log('Syötteiden tarkistus');
const hyva = { nimi: 'Matti  Peltonen ', tila: 'Peltola', kunta: 'Kangasala', sahkoposti: 'Matti@Example.com', henkia: '2' };
await testi('kelvollinen syöte siistitään', () => {
  const { rivi } = tarkista(hyva, false);
  assert.equal(rivi.nimi, 'Matti Peltonen');
  assert.equal(rivi.sahkoposti, 'matti@example.com');
  assert.equal(rivi.henkia, 2);
  assert.equal(rivi.puhelin, null);
  assert.equal(rivi.ruokavalio, null);
  assert.equal(tarkista({ ...hyva, ruokavalio: ' gluteeniton ' }, false).rivi.ruokavalio, 'gluteeniton');
  assert.equal(tarkista({ ...hyva, ruokavalio: 'x'.repeat(201) }, false).kentta, 'ruokavalio');
});
await testi('pakolliset kentät ja rajat', () => {
  assert.equal(tarkista({ ...hyva, nimi: '' }, false).kentta, 'nimi');
  assert.equal(tarkista({ ...hyva, kunta: ' ' }, false).kentta, 'kunta');
  assert.equal(tarkista({ ...hyva, sahkoposti: 'ei-osoite' }, false).kentta, 'sahkoposti');
  assert.equal(tarkista({ ...hyva, sahkoposti: '' }, false).kentta, 'sahkoposti');
  assert.equal(tarkista({ ...hyva, henkia: 0 }, false).kentta, 'henkia');
  assert.equal(tarkista({ ...hyva, henkia: 11 }, false).kentta, 'henkia');
  assert.equal(tarkista({ ...hyva, henkia: 2.5 }, false).kentta, 'henkia');
});
await testi('puhelinilmoittautumisessa sähköposti on vapaaehtoinen', () => {
  const { rivi } = tarkista({ ...hyva, sahkoposti: '', puhelin: '040 123 4567' }, true);
  assert.equal(rivi.sahkoposti, null);
  assert.equal(rivi.puhelin, '040 123 4567');
});

// --- Selain ---
const { url, supa, sulje } = await kaynnista({ port: 0, salasana: 'testisalasana' });
const selain = await chromium.launch(existsSync(CHROMIUM) ? { executablePath: CHROMIUM } : {});
const puhelin = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'fi-FI' };
const konsolivirheet = [];
const uusiSivu = async (ctx) => {
  const s = await ctx.newPage();
  s.on('pageerror', (e) => konsolivirheet.push(e.message));
  s.on('console', (m) => m.type() === 'error' && !/40[19]/.test(m.text()) && konsolivirheet.push(m.text()));
  return s;
};
const kuva = async (s, nimi) => KUVAT && s.screenshot({ path: `${KUVAT}/${nimi}.png`, fullPage: true });
const eiVaakavieritysta = async (s) => assert.ok(await s.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'sivu vierii vaakasuunnassa');

console.log('Osallistujan sivu');
const osallistuja = await selain.newContext(puhelin);
const s = await uusiSivu(osallistuja);

await testi('sivu aukeaa, tapahtuman tiedot ja julkinen lista näkyvät', async () => {
  await s.goto(url + '/');
  assert.match(await s.textContent('h1'), /Asiakaspäivä Kangasalla/);
  assert.match(await s.textContent('.hero .aika'), /Keskiviikko 11\.11\..*klo 9–14/);
  await s.waitForSelector('#tulijat li');
  assert.equal(await s.textContent('#maara'), '8 tilaa ilmoittautunut');
  const lista = await s.textContent('#tulijat');
  assert.match(lista, /Peltolan tila/);
  assert.doesNotMatch(lista, /Matti|example\.com|vegaani/, 'julkisessa listassa ei saa näkyä nimiä, sähköposteja eikä ruokavalioita');
  await eiVaakavieritysta(s);
  await kuva(s, '1-etusivu');
});

await testi('napit ja kentät ovat sormelle riittävän isoja', async () => {
  const korkeudet = await s.$$eval('#lomake input:not([type=hidden]):not(#kotisivu), #lomake button', (els) => els.map((e) => e.getBoundingClientRect().height));
  assert.ok(korkeudet.every((h) => h >= 48), 'kaikki vähintään 48 px: ' + korkeudet.join(', '));
});

await testi('puuttuva tieto kerrotaan selvästi', async () => {
  await s.fill('#nimi', 'Kalle Koekäyttäjä');
  await s.click('button[type=submit]');
  assert.equal(await s.textContent('#lomake .virhe'), 'Kirjoita tilan nimi.');
  assert.equal(await s.getAttribute('#tila', 'aria-invalid'), 'true');
});

await testi('ilmoittautuminen tallentuu ja kiitos näkyy', async () => {
  await s.fill('#tila', 'Koekäytön tila');
  await s.fill('#kunta', 'Kangasala');
  await s.fill('#sahkoposti', 'kalle@example.com');
  await s.click('#henkia-laskuri button[aria-label*="lisää"]');
  await s.click('#henkia-laskuri button[aria-label*="lisää"]');
  assert.equal(await s.textContent('#henkia-laskuri output'), '3 henkeä');
  await s.fill('#ruokavalio', '1 kasvis');
  await s.click('button[type=submit]');
  await s.waitForSelector('#kiitos:not([hidden])');
  assert.equal(await s.textContent('#kiitos-otsikko'), 'Kiitos, Kalle!');
  assert.match(await s.textContent('#kiitos-teksti'), /3 henkeä tilalta Koekäytön tila/);
  await s.waitForFunction(() => document.getElementById('maara').textContent === '9 tilaa ilmoittautunut');
  const tallennettu = supa.rivit.find((r) => r.sahkoposti === 'kalle@example.com');
  assert.equal(tallennettu.henkia, 3);
  assert.equal(tallennettu.lahde, 'verkko');
  assert.equal(tallennettu.ruokavalio, '1 kasvis');
  await kuva(s, '2-kiitos');
});

await testi('samalla sähköpostilla ei voi ilmoittautua kahdesti', async () => {
  await s.click('#uusi');
  assert.equal(await s.inputValue('#tila'), 'Koekäytön tila', 'tila ja kunta jäävät valmiiksi');
  await s.fill('#nimi', 'Kalle Kopio');
  await s.fill('#sahkoposti', 'KALLE@example.com');
  await s.click('button[type=submit]');
  await s.waitForSelector('#lomake .virhe:not([hidden])');
  assert.match(await s.textContent('#lomake .virhe'), /jo ilmoittautuminen/);
});

await testi('kalenteritiedosto on saatavilla', async () => {
  const r = await s.request.get(url + '/tapahtuma.ics');
  assert.equal(r.status(), 200);
  const t = await r.text();
  assert.match(t, /DTSTART:20261111T070000Z/);
  assert.match(t, /DTEND:20261111T120000Z/);
});

console.log('Järjestäjän näkymän suojaus');
await testi('osallistuja ei näe järjestäjän tietoja', async () => {
  const r = await s.request.get(url + '/api/jarjestaja/ilmoittautumiset');
  assert.equal(r.status(), 401);
  await s.goto(url + '/jarjestaja');
  assert.ok(await s.isVisible('#salasana'), 'kirjautumislomake näkyy');
  const sisalto = await s.content();
  assert.doesNotMatch(sisalto, /example\.com|henkeä tulossa/);
  assert.equal(await s.getAttribute('meta[name=robots]', 'content'), 'noindex, nofollow');
});
await testi('väärä salasana ei kelpaa eikä väärennetty eväste', async () => {
  await s.fill('#salasana', 'arvaus');
  await s.click('button[type=submit]');
  await s.waitForSelector('#kirjaudu .virhe:not([hidden])');
  assert.equal(await s.textContent('#kirjaudu .virhe'), 'Salasana ei kelpaa.');
  const vaara = await s.request.get(url + '/api/jarjestaja/ilmoittautumiset', { headers: { Cookie: 'pk_jarjestaja=9999999999.vaarennos' } });
  assert.equal(vaara.status(), 401);
});
await testi('ristiinsivustopyyntö torjutaan', async () => {
  const r = await s.request.post(url + '/api/ilmoittaudu', { headers: { Origin: 'https://paha.example', 'Content-Type': 'application/json' }, data: hyva });
  assert.equal(r.status(), 403);
});
await testi('lomakkeen ohittava suora API-kutsu tarkistetaan palvelimella', async () => {
  const r = await s.request.post(url + '/api/ilmoittaudu', { data: { ...hyva, sahkoposti: 'uusi@example.com', henkia: 50 } });
  assert.equal(r.status(), 400);
  assert.equal((await r.json()).kentta, 'henkia');
});

console.log('Järjestäjän näkymä');
const jarj = await selain.newContext(puhelin);
const j = await uusiSivu(jarj);
await testi('kirjautuminen ja luvut yhdellä silmäyksellä', async () => {
  await j.goto(url + '/jarjestaja');
  await j.fill('#salasana', 'testisalasana');
  await j.click('button[type=submit]');
  await j.waitForSelector('#rivit .rivi');
  // harjoitusdata 16 henkeä + Kalle 3 = 19, ilmoittautumisia 9, puhelimitse 2
  assert.equal(await j.textContent('#luku-henkia'), '19');
  assert.equal(await j.textContent('#luku-ilm'), '9');
  assert.equal(await j.textContent('#luku-puh'), '2');
  assert.equal(await j.locator('#rivit .rivi').count(), 9);
  assert.match(await j.textContent('#rivit'), /matti\.peltonen@example\.com/);
  assert.equal(await j.textContent('.rivi:has-text("Aino Rantanen") .ruokavalio'), 'Ruokavalio: vegaani');
  assert.equal(await j.textContent('.rivi:has-text("Kalle Koekäyttäjä") .ruokavalio'), 'Ruokavalio: 1 kasvis');
  assert.equal(await j.textContent('#ruokavaliot'), 'Erityisruokavalio 3 ilmoittautumisessa – näkyy rivin alla.');
  const paaluku = await j.locator('.luku.paa').boundingBox();
  assert.ok(paaluku.y + paaluku.height < 300, 'henkimäärä näkyy heti ylhäällä');
  await eiVaakavieritysta(j);
  await kuva(j, '3-jarjestaja');
});
await testi('puhelinilmoittautumisen kirjaus päivittää luvut', async () => {
  await j.click('#lisaa-kortti summary');
  await j.fill('#l-nimi', 'Veikko Vasara');
  await j.fill('#l-tila', 'Vasaran tila');
  await j.fill('#l-kunta', 'Kangasala');
  await j.fill('#l-puhelin', '040 000 0003');
  await j.fill('#l-ruokavalio', 'laktoositon');
  await j.click('#l-henkia button[aria-label*="lisää"]');
  await kuva(j, '4-lisaa-puhelin');
  await j.click('#lisaa button[type=submit]');
  await j.waitForFunction(() => document.getElementById('luku-henkia').textContent === '21');
  assert.equal(await j.textContent('#luku-puh'), '3');
  assert.match(await j.textContent('#rivit'), /Veikko Vasara/);
  assert.equal(supa.rivit.find((r) => r.nimi === 'Veikko Vasara').lahde, 'puhelin');
  assert.equal(supa.rivit.find((r) => r.nimi === 'Veikko Vasara').ruokavalio, 'laktoositon');
});
await testi('poisto vahvistetaan ja päivittää luvut', async () => {
  const poistonappi = j.locator('.rivi', { hasText: 'Veikko Vasara' }).locator('.poista');
  await poistonappi.click();
  assert.equal(await poistonappi.textContent(), 'Vahvista poisto');
  assert.ok(supa.rivit.some((r) => r.nimi === 'Veikko Vasara'), 'ensimmäinen napautus ei vielä poista');
  await poistonappi.click();
  await j.waitForFunction(() => document.getElementById('luku-henkia').textContent === '19');
  assert.equal(supa.rivit.some((r) => r.nimi === 'Veikko Vasara'), false);
});
await testi('uloskirjautuminen sulkee näkymän', async () => {
  await j.click('#ulos');
  await j.waitForSelector('#salasana');
  const r = await j.request.get(url + '/api/jarjestaja/ilmoittautumiset');
  assert.equal(r.status(), 401);
});

await testi('ei selainvirheitä', () => assert.deepEqual(konsolivirheet, []));

await selain.close();
sulje();
console.log(process.exitCode ? '\nOsa testeistä epäonnistui.' : `\nKaikki testit läpi (${lapi}).`);
