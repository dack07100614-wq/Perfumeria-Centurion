// Reel de ofertas (1080x1920, ~10 s) -> reel/Reel-Ofertas.mp4. Requiere playwright y ffmpeg.
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');
const ROOT = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(ROOT + '/data/products.json', 'utf8')).products;
const cfg = JSON.parse(fs.readFileSync(ROOT + '/data/config.json', 'utf8'));
const fmt = (n) => '$ ' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const offers = data.filter((p) => p.oldPrice && p.oldPrice > p.price && fs.existsSync(`${ROOT}/public/img/products/${p.id}.webp`)).slice(0, 6);
const pct = (p) => Math.round((p.oldPrice - p.price) / p.oldPrice * 100);
const F = (f) => 'file://' + ROOT + '/src/fonts/' + f;
const img = (id) => 'file://' + ROOT + '/public/img/products/' + id + '.webp';
const logo = 'file://' + ROOT + '/src/img/logo-emblem.png';
const css = `
@font-face{font-family:IS;font-weight:400;src:url(${F('InstrumentSans-400-latin.woff2')})}
@font-face{font-family:IS;font-weight:600;src:url(${F('InstrumentSans-600-latin.woff2')})}
@font-face{font-family:IS;font-weight:700;src:url(${F('InstrumentSans-700-latin.woff2')})}
@font-face{font-family:CG;font-style:italic;font-weight:500;src:url(${F('CormorantGaramond-500i-latin.woff2')})}
*{box-sizing:border-box;margin:0}
body{width:1080px;height:1920px;font-family:IS,sans-serif;background:#111;color:#fff;position:relative;overflow:hidden}
.top{position:absolute;top:130px;left:56px;right:56px;display:flex;align-items:center;justify-content:space-between}
.brand{display:flex;align-items:center;gap:18px}.brand img{width:64px;height:64px;object-fit:contain}
.brand b{display:block;font-weight:600;font-size:38px;letter-spacing:.16em}.brand small{display:block;font-size:13px;letter-spacing:.42em;color:#aaa;margin-bottom:6px}
.tag{background:#d63a2f;font-weight:700;font-size:28px;letter-spacing:.2em;padding:10px 20px}
.ph{position:absolute;left:0;right:0;top:290px;height:900px;background:#e7e0d4;overflow:hidden}
.ph img{width:100%;height:100%;object-fit:cover;object-position:center 45%}
.badge{position:absolute;left:56px;top:330px;background:#d63a2f;font-weight:700;font-size:64px;padding:14px 30px}
.info{position:absolute;left:56px;right:56px;top:1230px}
.br{font-size:24px;letter-spacing:.34em;text-transform:uppercase;color:#aaa;font-weight:600;margin-bottom:10px}
.nm{font-size:52px;font-weight:700;line-height:1.08;letter-spacing:.04em;text-transform:uppercase;margin-bottom:18px;max-height:112px;overflow:hidden}
.pr{display:flex;align-items:baseline;gap:26px}.now{font-size:112px;font-weight:700;color:#ff5a4d;line-height:1}.old{font-size:44px;color:#999;text-decoration:line-through}
.sv{font-family:CG,serif;font-style:italic;font-size:42px;color:#ddd;margin-top:10px}
.foot{position:absolute;left:0;right:0;top:1650px;text-align:center;font-size:22px;letter-spacing:.18em;text-transform:uppercase;color:#bbb}
.foot b{color:#fff;display:block;margin-top:8px;font-size:26px}
.c{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;text-align:center}
.kick{font-size:28px;letter-spacing:.4em;color:#bbb;text-transform:uppercase;margin-bottom:8px}
h1{font-size:196px;font-weight:700;letter-spacing:.02em;line-height:.95}
.row{display:flex;align-items:center;gap:26px;margin:26px 0 60px}.pc{background:#d63a2f;font-weight:700;font-size:60px;padding:12px 30px}.sb{font-family:CG,serif;font-style:italic;font-size:48px;color:#ddd}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;width:968px}.t{aspect-ratio:1;background:#e7e0d4;overflow:hidden}.t img{width:100%;height:100%;object-fit:cover;display:block}
.end h2{font-size:112px;font-weight:600;letter-spacing:.12em;margin-bottom:30px}.end p{font-family:CG,serif;font-style:italic;font-size:50px;color:#ccc;margin-bottom:70px;max-width:840px}
.ct{display:flex;flex-direction:column;gap:22px;width:760px}.ct div{border:1px solid #444;padding:26px 30px;font-size:40px}.ct b{display:block;font-size:20px;letter-spacing:.3em;color:#aaa;margin-bottom:8px;font-weight:600}
.end img{width:130px;margin-bottom:44px}`;
const topbar = (t) => `<div class="top"><div class="brand"><img src="${logo}"><div><small>PERFUMERÍA</small><b>CENTURIÓN</b></div></div><div class="tag">${t}</div></div>`;
const maxPct = Math.max(...offers.map(pct));
const frames = [
  `<div class="c">${topbar('OFERTAS').replace('class="top"', 'class="top" style="top:130px"')}<div class="kick" style="margin-top:120px">Perfumes árabes originales</div><h1>OFERTAS</h1><div class="row"><div class="pc">HASTA -${maxPct}%</div><div class="sb">y packs especiales</div></div><div class="grid">${offers.map((p) => `<div class="t"><img src="${img(p.id)}"></div>`).join('')}</div></div>`,
  ...offers.map((p) => `${topbar('OFERTA')}<div class="ph"><img src="${img(p.id)}"></div><div class="badge">-${pct(p)}%</div><div class="info"><div class="br">${p.brand}</div><div class="nm">${p.name}</div><div class="pr"><span class="now">${fmt(p.price)}</span><span class="old">${fmt(p.oldPrice)}</span></div><div class="sv">Ahorrás ${fmt(p.oldPrice - p.price)}</div></div><div class="foot">Originales y sellados · Envíos a todo Uruguay<b>@${cfg.contact.instagram}</b></div>`),
  `<div class="c end"><img src="${logo}"><h2>¿LO QUERÉS?</h2><p>Pedilo por WhatsApp. Envíos a todo Uruguay por DAC.</p><div class="ct"><div><b>WHATSAPP</b>${cfg.contact.whatsappDisplay}</div><div><b>INSTAGRAM</b>@${cfg.contact.instagram}</div></div></div>`,
];
const durs = [1.75, ...offers.map(() => 1.3), 2.2]; // con 7 fundidos de 0.25 s => 10 s
(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'reel-'));
  const b = await chromium.launch({ args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  for (let i = 0; i < frames.length; i++) {
    const hf = path.join(tmp, `f${i}.html`);
    fs.writeFileSync(hf, `<style>${css}</style>${frames[i]}`);
    await pg.goto('file://' + hf, { waitUntil: 'load' });
    await pg.evaluate(() => document.fonts.ready);
    await pg.waitForTimeout(250);
    await pg.screenshot({ path: path.join(tmp, `f${i}.png`) });
  }
  await b.close();
  const fps = 30, X = 0.25, n = frames.length;
  const args = ['-y'];
  durs.forEach((d, i) => args.push('-i', path.join(tmp, `f${i}.png`)));
  let f = '', last = '[v0]';
  for (let i = 0; i < n; i++) f += `[${i}:v]loop=loop=${Math.round(durs[i] * fps) - 1}:size=1:start=0,fps=${fps},setsar=1[v${i}];`;
  let off = durs[0] - X;
  for (let i = 1; i < n; i++) { f += `${last}[v${i}]xfade=transition=fade:duration=${X}:offset=${off.toFixed(2)}[x${i}];`; last = `[x${i}]`; off += durs[i] - X; }
  fs.mkdirSync(ROOT + '/reel', { recursive: true });
  args.push('-filter_complex', f.replace(/;$/, ''), '-map', last, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-r', String(fps), '-movflags', '+faststart', ROOT + '/reel/Reel-Ofertas.mp4');
  execFileSync('ffmpeg', args, { stdio: 'ignore' });
  console.log('reel listo');
})();
