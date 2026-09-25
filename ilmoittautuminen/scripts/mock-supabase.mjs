// Pieni muistinvarainen jäljitelmä Supabasen REST-rajapinnasta (PostgREST) paikallista
// kehitystä ja testejä varten. Tukee vain niitä kutsuja, joita Worker tekee.
import http from 'node:http';
import { HARJOITUSDATA } from './harjoitusdata.mjs';

export function kaynnistaMockSupabase({ port = 0, data = HARJOITUSDATA } = {}) {
  let seuraava = 1;
  const rivit = data.map((r) => ({ id: seuraava++, ...r }));
  const palvelin = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    const laheta = (status, body) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(body === undefined ? '' : JSON.stringify(body)); };
    if (!req.headers.apikey) return laheta(401, { message: 'No API key' });
    if (url.pathname !== '/rest/v1/ilmoittautumiset') return laheta(404, { message: 'not found' });
    if (req.method === 'GET') {
      const kentat = (url.searchParams.get('select') || '*').split(',');
      const lajiteltu = [...rivit].sort((a, b) => a.luotu.localeCompare(b.luotu));
      return laheta(200, lajiteltu.map((r) => (kentat[0] === '*' ? r : Object.fromEntries(kentat.map((k) => [k, r[k]])))));
    }
    if (req.method === 'POST') {
      let s = ''; for await (const c of req) s += c;
      const uusi = JSON.parse(s);
      if (uusi.sahkoposti && rivit.some((r) => (r.sahkoposti || '').toLowerCase() === uusi.sahkoposti.toLowerCase())) {
        return laheta(409, { code: '23505', message: 'duplicate key value violates unique constraint' });
      }
      const rivi = { id: seuraava++, luotu: new Date().toISOString(), puhelin: null, sahkoposti: null, ...uusi };
      rivit.push(rivi);
      return laheta(201, [rivi]);
    }
    if (req.method === 'DELETE') {
      const id = Number((url.searchParams.get('id') || '').replace('eq.', ''));
      const i = rivit.findIndex((r) => r.id === id);
      if (i >= 0) rivit.splice(i, 1);
      return laheta(204);
    }
    laheta(405, { message: 'method' });
  });
  return new Promise((ok) => palvelin.listen(port, '127.0.0.1', () => ok({ palvelin, rivit, url: `http://127.0.0.1:${palvelin.address().port}` })));
}
