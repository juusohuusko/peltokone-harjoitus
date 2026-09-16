/**
 * Testaa huoltosopimuslaskurin oikeassa selaimessa (Chromium / Playwright).
 * Ajo: node tests/laskuri.test.mjs
 */
import { chromium } from "playwright";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const sivu = pathToFileURL(
  path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "index.html")
).href;

/* Odotetut arvot on laskettu käsin hinnastosta:
   vuosierä = round(perushinta × kerroin × (1 − kausialennus)) */
const TAPAUKSET = [
  { malli: "pk120", vali: "500",  kausi: "1", vuosiera: 890,  yhteensa: 890,   huollot: 1 },
  { malli: "pk240", vali: "500",  kausi: "3", vuosiera: 1349, yhteensa: 4047,  huollot: 3 },
  { malli: "pk360", vali: "250",  kausi: "5", vuosiera: 2680, yhteensa: 13400, huollot: 10 },
  { malli: "pk500", vali: "1000", kausi: "1", vuosiera: 2380, yhteensa: 2380,  huollot: 0.5 },
  { malli: "pk90",  vali: "250",  kausi: "5", vuosiera: 791,  yhteensa: 3955,  huollot: 10 }
];

let virheita = 0;
const ok = (nimi, ehto, lisa = "") => {
  console.log(`${ehto ? "  ok  " : "FAIL  "}${nimi}${ehto ? "" : "  → " + lisa}`);
  if (!ehto) virheita++;
};

/** Poimii tekstin ensimmäisen euromäärän: "1 349 € sis. alv 25,5 %" -> 1349.
    Sitovat välilyönnit ja tuhaterottimet siivotaan pois. */
const luku = t => {
  const osuma = String(t).replace(/[\s\u00a0\u202f]/g, "").match(/-?\d+(?:[.,]\d+)?/);
  return osuma ? Number(osuma[0].replace(",", ".")) : NaN;
};

const selain = await chromium.launch();
const page = await selain.newPage();
const konsoliVirheet = [];
page.on("pageerror", e => konsoliVirheet.push(String(e)));
page.on("console", m => { if (m.type() === "error") konsoliVirheet.push(m.text()); });
await page.goto(sivu);

/* 1. Sivu latautuu ja näyttää oletusarvot ilman virheitä */
ok("sivun otsikko", (await page.title()).includes("Huoltosopimuslaskuri"));
ok("valikoissa on kaikki 5 mallia", (await page.locator("#malli option").count()) === 5);
ok("huoltovälin oletus on 500 h", (await page.locator("#vali").inputValue()) === "500");
ok("kauden oletus on 3 vuotta", (await page.locator("#kausi").inputValue()) === "3");
ok("vuosierä näkyy heti latauksessa",
   luku(await page.locator("#vuosiera").textContent()) === 828,
   await page.locator("#vuosiera").textContent());

/* 2. Hinnoittelu jokaisella testitapauksella */
for (const t of TAPAUKSET) {
  await page.selectOption("#malli", t.malli);
  await page.selectOption("#vali", t.vali);
  await page.selectOption("#kausi", t.kausi);

  const v = luku(await page.locator("#vuosiera").textContent());
  const y = luku(await page.locator("#r-yht").textContent());
  const vAlv = luku(await page.locator("#vuosiera-alv").textContent());
  const yAlv = luku(await page.locator("#r-yht-alv").textContent());
  const nimi = `${t.malli}/${t.vali}h/${t.kausi}v`;

  ok(`${nimi} vuosierä ${t.vuosiera} €`, v === t.vuosiera, `sai ${v}`);
  ok(`${nimi} kokonaishinta ${t.yhteensa} €`, y === t.yhteensa, `sai ${y}`);
  ok(`${nimi} alv-hinnat oikein`,
     vAlv === Math.round(t.vuosiera * 1.255) && yAlv === Math.round(t.yhteensa * 1.255),
     `sai ${vAlv} / ${yAlv}`);
  ok(`${nimi} huoltojen määrä mainitaan`,
     (await page.locator("#huollot").textContent()).includes(
       new Intl.NumberFormat("fi-FI", { maximumFractionDigits: 1 }).format(t.huollot)));
}

/* 3. Vuosierä × vuodet = kokonaishinta kaikilla yhdistelmillä */
let ristiinOk = true, ristiinViesti = "";
for (const m of ["pk120", "pk240", "pk360", "pk500", "pk90"]) {
  for (const hv of ["250", "500", "1000"]) {
    for (const [k, vuodet] of [["1", 1], ["3", 3], ["5", 5]]) {
      await page.selectOption("#malli", m);
      await page.selectOption("#vali", hv);
      await page.selectOption("#kausi", k);
      const v = luku(await page.locator("#vuosiera").textContent());
      const y = luku(await page.locator("#r-yht").textContent());
      if (v <= 0 || v * vuodet !== y) {
        ristiinOk = false;
        ristiinViesti = `${m}/${hv}/${k}: ${v} × ${vuodet} ≠ ${y}`;
      }
    }
  }
}
ok("kaikki 45 yhdistelmää: vuosierä × vuodet = kokonaishinta", ristiinOk, ristiinViesti);

/* 4. Pidempi kausi ei saa olla vuositasolla kalliimpi */
await page.selectOption("#malli", "pk360");
await page.selectOption("#vali", "500");
await page.selectOption("#kausi", "1");
const yksiVuosi = luku(await page.locator("#vuosiera").textContent());
await page.selectOption("#kausi", "5");
const viisiVuotta = luku(await page.locator("#vuosiera").textContent());
ok("5 vuoden kausi on vuositasolla halvempi kuin 1 vuoden",
   viisiVuotta < yksiVuosi, `${viisiVuotta} vs ${yksiVuosi}`);

/* 5. Mobiilileveys: ei vaakavieritystä */
await page.setViewportSize({ width: 390, height: 780 });
const leveys = await page.evaluate(() =>
  ({ doc: document.documentElement.scrollWidth, ikkuna: window.innerWidth }));
ok("ei vaakavieritystä 390 px leveydellä", leveys.doc <= leveys.ikkuna + 1,
   `${leveys.doc} > ${leveys.ikkuna}`);

ok("ei js-virheitä konsolissa", konsoliVirheet.length === 0, konsoliVirheet.join(" | "));

await selain.close();
console.log(virheita === 0 ? "\nKaikki testit läpi." : `\n${virheita} testiä epäonnistui.`);
process.exit(virheita === 0 ? 0 : 1);
