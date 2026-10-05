# Huoltopyyntö – Peltokone Oy (harjoitus, versio 1)

Asiakas jättää konehuollon pyynnön puhelimella, saa kuittauksen ja pyyntönumeron,
ja työnjohtaja näkee pyynnöt listana tiloilla **uusi / vahvistettu / valmis**.

> Peltokone Oy on kuvitteellinen harjoitusyritys.

## Käyttö

Avaa `index.html` selaimessa. Ei asennusta, ei riippuvuuksia, ei verkkoyhteyttä.

| Näkymä | Osoite | Sisältö |
|---|---|---|
| Lomake | `index.html#/` | kone, merkki ja malli, käyttötunnit, huollon tyyppi, toivottu viikko, tuonti/nouto, puhelinnumero |
| Kuittaus | `index.html#/kuittaus/HP-0001` | pyyntönumero ja yhteenveto |
| Työnjohto | `index.html#/tyonjohto` | lista, suodatus tilan mukaan, tilan vaihto |

- Toivottu viikko valitaan pudotusvalikosta (seuraavat 12 viikkoa ensi viikosta alkaen). Kalenteria ei ole.
- Puhelinnumero hyväksytään muodoissa `040 123 4567`, `040-1234567` ja `+358 40 123 4567`, ja se tallennetaan muotoon `0401234567`.
- Tilan vaihto: Uusi → *Vahvista* → Vahvistettu → *Merkitse valmiiksi* → Valmis. Jokaisessa tilassa voi palata yhden askeleen taaksepäin.
- Konetyypit, huoltotyypit ja tilat ovat `<script>`-lohkon alussa olevissa taulukoissa. Uusi vaihtoehto on yksi rivi.

## Tärkeä rajoitus: tallennus on selainkohtainen

Ensimmäinen versio tallentaa pyynnöt selaimen **localStorageen** (avain
`peltokone.huoltopyynnot.v1`). Työnjohtaja näkee siis vain pyynnöt, jotka on jätetty
**samalla laitteella ja samalla selaimella**. Asiakkaan omalla puhelimella jättämä
pyyntö ei näy työnjohtajan koneella. Version 1 avulla voi kokeilla lomaketta ja
työnkulkua. Oikeaan käyttöön tarvitaan yhteinen palvelintallennus.

Ei kirjautumista: työnjohdon näkymä on kenen tahansa avattavissa samassa selaimessa.
Ei maksuja.

## Testit

```bash
npm install
npm test        # ajaa myös huoltosopimuslaskurin testit
# tai pelkästään tämä:
node tests/huoltopyynto.test.mjs
```

Testi ajaa sivua oikeassa Chromiumissa. Se lähettää ensin tyhjän lomakkeen
(7 virheilmoitusta, ei tallennusta) ja sitten **kolme testipyyntöä**. Lisäksi se tarkistaa
kuittaukset ja puhelinnumeroiden siistimisen. Työnjohdon listasta tarkistetaan, että
kaikki kolme näkyvät uusin ensin, että tilan vaihto toimii ja säilyy uudelleenlatauksessa
ja että suodattimet toimivat. Lopuksi varmistetaan, ettei 360 ja 390 px leveydellä tule
vaakavieritystä eikä konsoliin tule virheitä.

Ajo tallentaa kuvakaappaukset kansioon `kuvakaappaukset/`:

| Tiedosto | Näkymä |
|---|---|
| `1-lomake.png` | Lomake puhelimella (390 px) |
| `2-kuittaus.png` | Kuittaus ensimmäisestä pyynnöstä (390 px) |
| `3-tyonjohto.png` | Työnjohdon lista, jossa kolme pyyntöä eri tiloissa (1024 px) |
