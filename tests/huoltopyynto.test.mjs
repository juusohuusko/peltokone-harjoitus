/**
 * Testaa huoltopyyntöpalvelun oikeassa selaimessa (Chromium / Playwright):
 * lähettää kolme testipyyntöä, tarkistaa työnjohdon listan ja tilojen vaihdon
 * ja ottaa kuvakaappaukset kaikista kolmesta näkymästä.
 * Ajo: node tests/huoltopyynto.test.mjs
 */
import { chromium } from "playwright";
import { fileURLToPath, pathToFileURL } from "node:url";
import { mkdirSync } from "node:fs";
import path from "node:path";

const juuri = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "huoltopyynto");
const sivu = pathToFileURL(path.join(juuri, "index.html")).href;
const kuvat = path.join(juuri, "kuvakaappaukset");
mkdirSync(kuvat, { recursive: true });

const PYYNNOT = [
  { kone: "traktori", malli: "Valtra N175", tunnit: "2450", huolto: "maaraaikais",
    viikkoIndeksi: 1, toimitus: "tuonti", puhelin: "040 123 4567", odotettuNumero: "0401234567" },
  { kone: "puimuri", malli: "Sampo Rosenlew C6", tunnit: "830", huolto: "kausi",
    viikkoIndeksi: 3, toimitus: "nouto", puhelin: "+358 50 765 4321", odotettuNumero: "0507654321" },
  { kone: "paalain", malli: "Krone Comprima V150", tunnit: "15200", huolto: "korjaus",
    viikkoIndeksi: 2, toimitus: "nouto", puhelin: "044-555 0101", odotettuNumero: "0445550101" }
];

let virheita = 0;
const ok = (nimi, ehto, lisa = "") => {
  console.log(`${ehto ? "  ok  " : "FAIL  "}${nimi}${ehto ? "" : "  → " + lisa}`);
  if (!ehto) virheita++;
};

const selain = await chromium.launch();
const konteksti = await selain.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await konteksti.newPage();
const konsoliVirheet = [];
page.on("pageerror", e => konsoliVirheet.push(String(e)));
page.on("console", m => { if (m.type() === "error") konsoliVirheet.push(m.text()); });
await page.goto(sivu);
await page.evaluate(() => localStorage.clear());
await page.reload();

/* 1. Lomake ja kuvakaappaus siitä */
ok("sivun otsikko", (await page.title()).includes("Huoltopyyntö"));
ok("viikkovalikossa 12 viikkoa + ohje",
   (await page.locator("#viikko option").count()) === 13);
await page.screenshot({ path: path.join(kuvat, "1-lomake.png"), fullPage: true });

/* 2. Tyhjä lähetys näyttää virheet eikä tallenna mitään */
await page.click("#laheta");
ok("tyhjä lomake: 7 virheilmoitusta",
   (await page.locator(".err:not(:empty)").count()) === 7,
   String(await page.locator(".err:not(:empty)").count()));
ok("tyhjä lomake ei tallenna",
   (await page.evaluate(() => localStorage.getItem("peltokone.huoltopyynnot.v1"))) === null);

/* 3. Kolme testipyyntöä */
const viikot = await page.locator("#viikko option").evaluateAll(o => o.map(x => x.value));
for (const [i, p] of PYYNNOT.entries()) {
  await page.goto(sivu + "#/");
  await page.click(`label.choice:has(input[name=kone][value=${p.kone}])`);
  await page.fill("#malli", p.malli);
  await page.fill("#tunnit", p.tunnit);
  await page.click(`label.choice:has(input[name=huolto][value=${p.huolto}])`);
  await page.selectOption("#viikko", viikot[p.viikkoIndeksi]);
  await page.click(`label.choice:has(input[name=toimitus][value=${p.toimitus}])`);
  await page.fill("#puhelin", p.puhelin);
  await page.click("#laheta");
  await page.waitForSelector("#pyyntonumero");

  const odotettuId = "HP-" + String(i + 1).padStart(4, "0");
  ok(`pyyntö ${i + 1}: kuittaus näyttää numeron ${odotettuId}`,
     (await page.textContent("#pyyntonumero")) === odotettuId);
  const kuittaus = await page.textContent("main");
  ok(`pyyntö ${i + 1}: kuittauksessa malli ja tunnit`,
     kuittaus.includes(p.malli) && kuittaus.replace(/\s/g, "").includes(p.tunnit + "h"),
     kuittaus);
  if (i === 0) await page.screenshot({ path: path.join(kuvat, "2-kuittaus.png"), fullPage: true });
}

const tallennetut = await page.evaluate(() => JSON.parse(localStorage.getItem("peltokone.huoltopyynnot.v1")));
ok("localStoragessa 3 pyyntöä", tallennetut.length === 3, String(tallennetut.length));
ok("puhelinnumerot normalisoitu",
   PYYNNOT.every((p, i) => tallennetut[i].puhelin === p.odotettuNumero),
   tallennetut.map(t => t.puhelin).join(", "));
ok("kaikkien tila on uusi", tallennetut.every(t => t.tila === "uusi"));

/* 4. Työnjohdon lista */
await page.setViewportSize({ width: 1024, height: 900 });
await page.goto(sivu + "#/tyonjohto");
ok("listassa 3 pyyntöä", (await page.locator("#lista > li").count()) === 3);
for (const p of PYYNNOT) {
  ok(`listassa näkyy ${p.malli}`, (await page.locator("#lista").textContent()).includes(p.malli));
}
ok("uusin pyyntö ensimmäisenä",
   (await page.locator("#lista > li").first().getAttribute("data-id")) === "HP-0003");

/* 5. Tilan vaihdot: HP-0001 valmis, HP-0002 vahvistettu, HP-0003 jää uudeksi */
await page.locator('li[data-id="HP-0001"] button', { hasText: "Vahvista" }).click();
await page.locator('li[data-id="HP-0001"] button', { hasText: "Merkitse valmiiksi" }).click();
await page.locator('li[data-id="HP-0002"] button', { hasText: "Vahvista" }).click();
const tilat = Object.fromEntries(await page.locator("#lista > li").evaluateAll(
  l => l.map(x => [x.dataset.id, x.dataset.tila])));
ok("tilat vaihtuivat oikein",
   tilat["HP-0001"] === "valmis" && tilat["HP-0002"] === "vahvistettu" && tilat["HP-0003"] === "uusi",
   JSON.stringify(tilat));
await page.reload();
ok("tilat säilyvät uudelleenlatauksessa",
   (await page.locator('li[data-id="HP-0001"]').getAttribute("data-tila")) === "valmis");
await page.screenshot({ path: path.join(kuvat, "3-tyonjohto.png"), fullPage: true });

for (const [suodatin, odotus] of [["uusi", 1], ["vahvistettu", 1], ["valmis", 1], ["kaikki", 3]]) {
  await page.click(`[data-suodatin=${suodatin}]`);
  ok(`suodatin "${suodatin}" näyttää ${odotus}`,
     (await page.locator("#lista > li").count()) === odotus);
}

/* 6. Puhelinleveydet: ei vaakavieritystä missään näkymässä */
for (const leveys of [360, 390]) {
  await page.setViewportSize({ width: leveys, height: 780 });
  for (const h of ["#/", "#/kuittaus/HP-0002", "#/tyonjohto"]) {
    await page.goto(sivu + h);
    const l = await page.evaluate(() => ({ doc: document.documentElement.scrollWidth, ikkuna: window.innerWidth }));
    ok(`ei vaakavieritystä ${leveys} px: ${h}`, l.doc <= l.ikkuna + 1, `${l.doc} > ${l.ikkuna}`);
  }
}

ok("ei js-virheitä konsolissa", konsoliVirheet.length === 0, konsoliVirheet.join(" | "));

await selain.close();
console.log(virheita === 0 ? "\nKaikki testit läpi." : `\n${virheita} testiä epäonnistui.`);
process.exit(virheita === 0 ? 0 : 1);
