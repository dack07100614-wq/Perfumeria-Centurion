const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = '/home/user/Perfumeria-Centurion';
const data = JSON.parse(fs.readFileSync(ROOT + '/data/products.json', 'utf8')).products;
const cfg = JSON.parse(fs.readFileSync(ROOT + '/data/config.json', 'utf8'));
const fmt = (n) => '$ ' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const offers = data.filter((p) => p.oldPrice && p.oldPrice > p.price && fs.existsSync(`${ROOT}/public/img/products/${p.id}.webp`));
const F = (f) => 'file://' + ROOT + '/src/fonts/' + f;
const css = `
@font-face{font-family:IS;font-weight:400;src:url(${F('InstrumentSans-400-latin.woff2')})}
@font-face{font-family:IS;font-weight:600;src:url(${F('InstrumentSans-600-latin.woff2')})}
@font-face{font-family:IS;font-weight:700;src:url(${F('InstrumentSans-700-latin.woff2')})}
@font-face{font-family:CG;font-style:italic;font-weight:500;src:url(${F('CormorantGaramond-500i-latin.woff2')})}
*{box-sizing:border-box;margin:0}
body{width:1080px;height:1350px;font-family:IS,sans-serif;color:#111;background:#efeae1;position:relative;overflow:hidden}
.top{position:absolute;left:0;right:0;top:0;height:96px;background:#111;color:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 56px}
.brand{display:flex;align-items:center;gap:18px}.brand img{width:56px;height:56px;object-fit:contain}
.brand b{display:block;font-weight:600;font-size:34px;letter-spacing:.16em}.brand small{display:block;font-size:12px;letter-spacing:.42em;color:#aaa;margin-bottom:6px}
.tag{font-size:20px;letter-spacing:.24em;text-transform:uppercase;font-weight:600}
.photo{position:absolute;left:0;right:0;top:96px;height:850px;background:#e7e0d4}
.photo img{width:100%;height:100%;object-fit:cover;object-position:center 45%}
.badge{position:absolute;left:56px;top:150px;background:#d63a2f;color:#fff;padding:18px 30px;font-weight:700;font-size:56px;letter-spacing:.04em}
.info{position:absolute;left:56px;right:56px;top:966px}
.brandn{font-size:20px;letter-spacing:.32em;text-transform:uppercase;color:#666;font-weight:600;margin-bottom:6px}
.name{font-weight:700;font-size:44px;line-height:1.08;letter-spacing:.04em;text-transform:uppercase;margin-bottom:10px;max-height:96px;overflow:hidden}
.meta{font-size:24px;color:#555;margin-bottom:26px}
.prices{display:flex;align-items:baseline;gap:24px}
.now{font-size:84px;line-height:1;font-weight:700;color:#d63a2f;letter-spacing:-.01em}.old{font-size:38px;color:#777;text-decoration:line-through}
.save{font-family:CG,serif;font-style:italic;font-size:36px;color:#333;margin-left:auto}
.foot{position:absolute;left:0;right:0;bottom:0;height:92px;background:#111;color:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 56px;font-size:22px;letter-spacing:.14em;text-transform:uppercase}
.foot b{font-weight:600}`;
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const pg = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  for (const p of offers) {
    const pct = Math.round((p.oldPrice - p.price) / p.oldPrice * 100);
    const html = `<style>${css}</style>
<div class="top"><div class="brand"><img src="file://${ROOT}/src/img/logo-emblem.png"><div><small>PERFUMERÍA</small><b>CENTURIÓN</b></div></div><div class="tag">Oferta</div></div>
<div class="photo"><img src="file://${ROOT}/public/img/products/${p.id}.webp"></div><div class="badge">-${pct}%</div>
<div class="info"><div class="brandn">${p.brand}</div><div class="name">${p.name}</div><div class="prices"><span class="now">${fmt(p.price)}</span><span class="old">${fmt(p.oldPrice)}</span><span class="save">Ahorrás ${fmt(p.oldPrice - p.price)}</span></div></div>
<div class="foot"><span>Originales · Envíos a todo Uruguay</span><b>@${cfg.contact.instagram}</b></div>`;
    const hf = `${ROOT}/promo-instagram/.tmp-${p.id}.html`; fs.writeFileSync(hf, html); await pg.goto('file://' + hf, { waitUntil: 'load' });
    await pg.evaluate(() => document.fonts.ready);
    await pg.waitForTimeout(300);
    await pg.screenshot({ path: `${ROOT}/promo-instagram/${p.id}.png` }); fs.unlinkSync(hf);
  }
  await b.close();
  console.log(offers.length, 'imágenes');
})();
