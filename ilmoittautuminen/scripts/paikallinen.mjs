// Ajaa Workerin paikallisesti Node.js:llä ilman Cloudflarea ja Supabasea.
// Tallennus on muistissa (harjoitusdata), järjestäjän salasana on "demo".
//   node scripts/paikallinen.mjs            -> http://localhost:8787
import http from 'node:http';
import worker from '../src/worker.js';
import { kaynnistaMockSupabase } from './mock-supabase.mjs';

export async function kaynnista({ port = 8787, salasana = 'demo' } = {}) {
  const supa = await kaynnistaMockSupabase();
  const env = { SUPABASE_URL: supa.url, SUPABASE_KEY: 'paikallinen-testiavain', JARJESTAJA_SALASANA: salasana };
  const palvelin = http.createServer(async (req, res) => {
    const chunks = []; for await (const c of req) chunks.push(c);
    const body = chunks.length ? Buffer.concat(chunks) : undefined;
    const request = new Request(`http://${req.headers.host}${req.url}`, {
      method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : body,
    });
    const vastaus = await worker.fetch(request, env);
    const otsakkeet = {};
    vastaus.headers.forEach((v, k) => { otsakkeet[k] = v; });
    const setCookie = vastaus.headers.getSetCookie?.() || [];
    if (setCookie.length) otsakkeet['set-cookie'] = setCookie;
    res.writeHead(vastaus.status, otsakkeet);
    res.end(Buffer.from(await vastaus.arrayBuffer()));
  });
  await new Promise((ok) => palvelin.listen(port, '127.0.0.1', ok));
  const url = `http://localhost:${palvelin.address().port}`;
  return { url, supa, sulje: () => { palvelin.close(); supa.palvelin.close(); } };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { url } = await kaynnista({ port: Number(process.env.PORT) || 8787 });
  console.log(`Ilmoittautumissivu:  ${url}/\nJärjestäjän näkymä:  ${url}/jarjestaja  (salasana: demo)`);
}
