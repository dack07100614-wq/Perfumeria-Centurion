// Portada para el carrusel de ofertas de Instagram -> promo-instagram/00-portada.png (1080x1350)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(ROOT + '/data/products.json', 'utf8')).products;
const cfg = JSON.parse(fs.readFileSync(ROOT + '/data/config.json', 'utf8'));
const offers = data.filter((p) => p.oldPrice && p.oldPrice > p.price && fs.existsSync(`${ROOT}/public/img/products/${p.id}.webp`)).slice(0, 6);
const maxPct = Math.max(...offers.map((p) => Math.round((p.oldPrice - p.price) / p.oldPrice * 100)));
const F = (f) => 'file://' + ROOT + '/src/fonts/' + f;
const html = `<style>
@font-face{font-family:IS;font-weight:400;src:url(${F('InstrumentSans-400-latin.woff2')})}
@font-face{font-family:IS;font-weight:600;src:url(${F('InstrumentSans-600-latin.woff2')})}
@font-face{font-family:IS;font-weight:700;src:url(${F('InstrumentSans-700-latin.woff2')})}
@font-face{font-family:CG;font-style:italic;font-weight:500;src:url(${F('CormorantGaramond-500i-latin.woff2')})}
*{box-sizing:border-box;margin:0}
body{width:1080px;height:1350px;font-family:IS,sans-serif;background:#111;color:#fff;position:relative;overflow:hidden}
.top{height:96px;display:flex;align-items:center;justify-content:space-between;padding:0 56px;border-bottom:1px solid #333}
.brand{display:flex;align-items:center;gap:18px}.brand img{width:56px;height:56px;object-fit:contain}
.brand b{display:block;font-weight:600;font-size:34px;letter-spacing:.16em}.brand small{display:block;font-size:12px;letter-spacing:.42em;color:#aaa;margin-bottom:6px}
.handle{font-size:20px;letter-spacing:.16em;font-weight:600}
.hero{padding:44px 56px 0}
.kick{font-size:24px;letter-spacing:.4em;color:#bbb;text-transform:uppercase;margin-bottom:6px}
h1{font-size:196px;font-weight:700;letter-spacing:.03em;line-height:.95}
.row{display:flex;align-items:center;gap:30px;margin-top:22px}
.pct{background:#d63a2f;font-weight:700;font-size:54px;padding:12px 28px;letter-spacing:.02em}
.sub{font-family:CG,serif;font-style:italic;font-size:46px;color:#ddd}
.grid{position:absolute;left:56px;right:56px;top:516px;display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.t{aspect-ratio:1;overflow:hidden;background:#e7e0d4;position:relative}.t img{width:100%;height:100%;object-fit:cover;display:block}
.t span{position:absolute;left:0;top:0;background:#d63a2f;font-weight:700;font-size:26px;padding:6px 12px}
.foot{position:absolute;left:0;right:0;bottom:0;height:150px;background:#d63a2f;display:flex;align-items:center;justify-content:space-between;padding:0 56px}
.foot b{font-size:44px;font-weight:700;letter-spacing:.12em;text-transform:uppercase}.foot small{font-size:22px;letter-spacing:.18em;text-transform:uppercase;display:block;margin-top:6px}
.arrow{font-size:80px;font-weight:300}
</style>
<div class="top"><div class="brand"><img src="file://${ROOT}/src/img/logo-emblem.png"><div><small>PERFUMERÍA</small><b>CENTURIÓN</b></div></div><div class="handle">@${cfg.contact.instagram}</div></div>
<div class="hero"><div class="kick">Perfumes árabes originales</div><h1>OFERTAS</h1>
<div class="row"><div class="pct">HASTA -${maxPct}%</div><div class="sub">y packs a precio especial</div></div></div>
<div class="grid">${offers.map((p) => `<div class="t"><img src="file://${ROOT}/public/img/products/${p.id}.webp"><span>-${Math.round((p.oldPrice - p.price) / p.oldPrice * 100)}%</span></div>`).join('')}</div>
<div class="foot"><div><b>Deslizá para verlas</b><small>Originales y sellados · Envíos a todo Uruguay</small></div><div class="arrow">→</div></div>`;
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const pg = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  const hf = ROOT + '/promo-instagram/.tmp-portada.html';
  fs.writeFileSync(hf, html);
  await pg.goto('file://' + hf, { waitUntil: 'load' });
  await pg.evaluate(() => document.fonts.ready);
  await pg.waitForTimeout(400);
  await pg.screenshot({ path: ROOT + '/promo-instagram/00-portada.png' });
  fs.unlinkSync(hf);
  await b.close();
  console.log('portada lista');
})();
