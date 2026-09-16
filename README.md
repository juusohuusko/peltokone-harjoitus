# Huoltosopimuslaskuri – Peltokone Oy (harjoitus)

Yhden sivun työkalu, jolla myyjä laskee koneen huoltosopimuksen hinnan.
Syötteinä **konemalli**, **huoltoväli** ja **sopimuskausi**; ulos tulee
**vuosierä** ja **sopimuksen kokonaishinta** sekä alv 0 % että alv 25,5 %.

> Peltokone Oy on kuvitteellinen harjoitusyritys. Kaikki mallit ja hinnat ovat
> keksittyjä eivätkä vastaa minkään todellisen yrityksen hinnoittelua.

## Käyttö

Avaa `index.html` selaimessa. Ei asennusta, ei riippuvuuksia, ei verkkoyhteyttä —
yksi tiedosto, jonka voi lähettää myyjälle sellaisenaan tai laittaa jakoon
verkkolevylle. *Tulosta tarjous* -painike tekee sivusta tulostusystävällisen
(syöttövalikot jäävät näkyviin, painike ei).

## Hinnoittelumalli

```
vuosierä        = pyöristä( perushinta × huoltovälin kerroin × (1 − kausialennus) )
kokonaishinta   = vuosierä × sopimusvuodet
```

Perushinnat mallikohtaisesti (alv 0 %, € / vuosi):

| Malli | Kuvaus | Perushinta |
|---|---|---:|
| PK-120 Pientraktori | alle 80 hv, pienet tilat | 890 |
| PK-240 Yleistraktori | 80–140 hv, yleiskone | 1 450 |
| PK-360 Suurtraktori | yli 140 hv, urakointi | 2 100 |
| PK-500 Puimuri | leikkuupuimuri, sesonkikäyttö | 3 400 |
| PK-90 Kylvölannoitin | hinattava työkone | 620 |

Huoltovälin kerroin:

| Huoltoväli | Huoltoja | Kerroin |
|---|---|---:|
| 250 h | 2 / vuosi | ×1,45 |
| 500 h | 1 / vuosi | ×1,00 |
| 1000 h | joka 2. vuosi | ×0,70 |

Sopimuskauden alennus: 1 vuosi 0 %, 3 vuotta 7 %, 5 vuotta 12 %.

Esimerkki: PK-240, huoltoväli 500 h, 3 vuoden kausi
→ 1 450 × 1,00 × 0,93 = **1 349 € / vuosi**, kokonaishinta **4 047 €** (alv 0 %).

Hinnaston muuttaminen: taulukot `MALLIT`, `VALIT` ja `KAUDET` ovat `index.html`:n
`<script>`-lohkon alussa. Uusi malli on yksi rivi taulukkoon — muuhun koodiin ei
tarvitse koskea.

## Testit

Testit ajavat sivun oikeassa Chromium-selaimessa Playwrightilla ja tarkistavat
hinnat käsin lasketuista odotusarvoista, kaikkien 45 yhdistelmän sisäisen
johdonmukaisuuden (vuosierä × vuodet = kokonaishinta), mobiilileveyden ja sen,
ettei konsoliin tule virheitä.

```bash
npm install     # asentaa playwrightin (kertaluonteinen)
npm test
```

Tuloste päättyy riviin `Kaikki testit läpi.`, ja epäonnistuessaan paluuarvo on 1.

## Tiedostot

| Tiedosto | Sisältö |
|---|---|
| `index.html` | Koko työkalu: hinnasto, laskenta ja käyttöliittymä |
| `tests/laskuri.test.mjs` | Selaintestit |
| `package.json` | `npm test` -skripti ja testien riippuvuus |
