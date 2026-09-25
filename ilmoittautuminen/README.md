# Asiakaspäivän ilmoittautuminen – Peltokone Oy (harjoitus)

Ilmoittautumissivu Peltokoneen asiakaspäivään **ke 11.11. klo 9–14, Kangasala**.
Cloudflare Worker `peltokone-ilmoittautuminen`, tallennus Supabase-projektiin `peltokone-demo`.

**Osoite:** https://peltokone-ilmoittautuminen.juusohuusko.workers.dev/  
**Järjestäjä:** https://peltokone-ilmoittautuminen.juusohuusko.workers.dev/jarjestaja

> Peltokone Oy on kuvitteellinen harjoitusyritys. Harjoitusdatan nimet, tilat ja
> yhteystiedot ovat keksittyjä.

## Sivut

| Osoite | Kenelle | Sisältö |
|---|---|---|
| `/` | osallistujat | Tapahtuman tiedot, lomake (nimi, tila, kunta, sähköposti, henkimäärä), ohjelma, julkinen lista (vain tila + kunta) |
| `/jarjestaja` | järjestäjä (salasana) | Henkiä yhteensä, ilmoittautumiset, puhelimitse tulleet, koko lista, puhelinilmoittautumisen kirjaus, poisto, sähköpostien kopiointi, tulostus |
| `/tapahtuma.ics` | osallistujat | Kalenterimerkintä |

## Tietoturva

- Supabasen palveluavain on vain Workerin salaisuutena (`SUPABASE_KEY`); selain ei näe sitä.
- Taulussa on RLS päällä ilman julkisia sääntöjä → julkinen anon-avain ei pääse tauluun.
- Järjestäjän näkymä: salasana (`JARJESTAJA_SALASANA`) → HMAC-allekirjoitettu HttpOnly-eväste (30 pv).
  API palauttaa ilman sitä 401. Salasanan vaihto kirjaa kaikki ulos.
- Syötteet tarkistetaan palvelimella; ristiinsivustopyynnöt torjutaan; sama sähköposti vain kerran.

## Kehitys

```bash
npm install            # repon juuressa: playwright (kertaluonteinen)
cd ilmoittautuminen
npm run dev            # http://localhost:8787, muistinvarainen tallennus, salasana "demo"
npm test               # selaintestit puhelinnäytöllä
npm run esikatselu     # yhden tiedoston esikatselu ilman palvelinta
```

## Julkaisu

```bash
cd ilmoittautuminen
NODE_USE_ENV_PROXY=1 npm run julkaise
```

Skripti luo taulun (`supabase/taulu.sql`), lisää harjoitusdatan vain tyhjään tauluun,
hakee Supabasen palveluavaimen hallinta-API:sta suoraan Workerin salaisuudeksi
(ei tulostu) ja julkaisee Workerin workers.dev-osoitteeseen. Ensijulkaisussa se luo
järjestäjän salasanan tiedostoon `SALASANA_TIEDOSTO`; myöhemmissä julkaisuissa vanha
salasana säilyy, ellei uutta anneta muuttujassa `JARJESTAJA_SALASANA`.
Skripti koskee vain Workeriin `peltokone-ilmoittautuminen`.

## Tiedostot

| Tiedosto | Sisältö |
|---|---|
| `src/worker.js` | Reititys, tarkistukset, kirjautuminen, Supabase-kutsut |
| `src/sivut.js` | Sivujen HTML, tyylit ja selainskriptit |
| `supabase/taulu.sql` | Taulu, uniikki sähköposti, RLS |
| `scripts/harjoitusdata.mjs` | Keksityt esimerkki-ilmoittautumiset |
| `scripts/paikallinen.mjs`, `scripts/mock-supabase.mjs` | Paikallinen ajo ilman pilvipalveluja |
| `scripts/esikatselu.mjs` | Esikatselun rakennus |
| `scripts/julkaise.mjs` | Julkaisu Supabaseen ja Cloudflareen |
| `tests/ilmoittautuminen.test.mjs` | Testit |
