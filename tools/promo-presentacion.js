// Genera presentacion/Promos-Centurion.pdf (16:9) con las ofertas vigentes de data/products.json
const { chromium } = require('playwright');
const fs = require('fs');
const ROOT = __dirname + '/..';
const data = JSON.parse(fs.readFileSync(ROOT + '/data/products.json', 'utf8')).products;
const cfg = JSON.parse(fs.readFileSync(ROOT + '/data/config.json', 'utf8'));
const fmt = (n) => '$ ' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const offers = data.filter((p) => p.oldPrice && p.oldPrice > p.price && fs.existsSync(`${ROOT}/public/img/products/${p.id}.webp`));
const F = (f) => 'file://' + require('path').resolve(ROOT, 'src/fonts', f);
const logo = 'file://' + require('path').resolve(ROOT, 'src/img/logo-emblem.png');
const img = (id) => 'file://' + require('path').resolve(ROOT, 'public/img/products', id + '.webp');
const wa = cfg.contact.whatsappDisplay, ig = '@' + cfg.contact.instagram, web = cfg.site.url.replace('https://', '');
const css = `
@font-face{font-family:IS;font-weight:400;src:url(${F('InstrumentSans-400-latin.woff2')})}
@font-face{font-family:IS;font-weight:600;src:url(${F('InstrumentSans-600-latin.woff2')})}
@font-face{font-family:IS;font-weight:700;src:url(${F('InstrumentSans-700-latin.woff2')})}
@font-face{font-family:CG;font-style:italic;font-weight:500;src:url(${F('CormorantGaramond-500i-latin.woff2')})}
@page{size:1920px 1080px;margin:0}
*{box-sizing:border-box;margin:0}
body{font-family:IS,sans-serif;color:#111}
.s{width:1920px;height:1080px;position:relative;overflow:hidden;page-break-after:always;background:#efeae1}
.dark{background:#111;color:#fff}
.bar{position:absolute;left:0;right:0;bottom:0;height:70px;background:#111;color:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 80px;font-size:20px;letter-spacing:.16em;text-transform:uppercase}
.dark .bar{background:#000;border-top:1px solid #333}
.cover{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.cover img{width:150px;margin-bottom:40px}.cover small{font-size:24px;letter-spacing:.6em;color:#aaa;margin-bottom:14px;padding-left:.6em}
.cover h1{font-size:120px;font-weight:600;letter-spacing:.14em;padding-left:.14em;margin-bottom:60px}
.cover h2{font-size:44px;font-weight:600;letter-spacing:.3em;text-transform:uppercase;border-top:2px solid #d63a2f;border-bottom:2px solid #d63a2f;padding:26px 50px}
.cover p{font-family:CG,serif;font-style:italic;font-size:44px;color:#ccc;margin-top:50px}
.item{display:grid;grid-template-columns:1080px 1fr}
.item .ph{height:1080px;background:#e7e0d4}.item .ph img{width:1080px;height:1080px;object-fit:cover;display:block}
.item .tx{padding:110px 90px 120px 90px;display:flex;flex-direction:column;justify-content:center}
.badge{align-self:flex-start;background:#d63a2f;color:#fff;font-weight:700;font-size:64px;padding:16px 34px;margin-bottom:50px}
.br{font-size:26px;letter-spacing:.34em;text-transform:uppercase;color:#666;font-weight:600;margin-bottom:16px}
.nm{font-size:66px;font-weight:700;line-height:1.08;letter-spacing:.04em;text-transform:uppercase;margin-bottom:26px}
.ds{font-family:CG,serif;font-style:italic;font-size:38px;color:#444;margin-bottom:46px;line-height:1.25}
.now{font-size:140px;font-weight:700;color:#d63a2f;line-height:1}
.old{font-size:50px;color:#777;text-decoration:line-through;margin-top:12px}
.sv{font-family:CG,serif;font-style:italic;font-size:46px;margin-top:18px}
.end{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.end h2{font-size:80px;font-weight:600;letter-spacing:.14em;margin-bottom:30px}.end p{font-family:CG,serif;font-style:italic;font-size:48px;color:#ccc;margin-bottom:70px}
.ct{display:flex;gap:60px;font-size:34px}.ct div{border:1px solid #444;padding:34px 50px}.ct b{display:block;font-size:20px;letter-spacing:.3em;color:#aaa;margin-bottom:12px;font-weight:600}
.end img{width:110px;margin-bottom:40px}`;
const bar = `<div class="bar"><span>Originales y sellados · Envíos a todo Uruguay</span><b>${ig}</b></div>`;
const slides = [
  `<div class="s dark cover"><img src="${logo}"><small>PERFUMERÍA</small><h1>CENTURIÓN</h1><h2>Ofertas y oportunidades</h2><p>Perfumes árabes originales e importados</p></div>`,
  ...offers.map((p) => { const pct = Math.round((p.oldPrice - p.price) / p.oldPrice * 100);
    return `<div class="s item"><div class="ph"><img src="${img(p.id)}"></div><div class="tx"><div class="badge">-${pct}%</div><div class="br">${p.brand}</div><div class="nm">${p.name}</div><div class="ds">${(p.short || '').replace(/</g, '&lt;')}</div><div class="now">${fmt(p.price)}</div><div class="old">${fmt(p.oldPrice)}</div><div class="sv">Ahorrás ${fmt(p.oldPrice - p.price)}</div></div>${bar}</div>`; }),
  `<div class="s dark end"><img src="${logo}"><h2>¿LO QUERÉS?</h2><p>Pedilo por WhatsApp o desde la web. Envíos a todo Uruguay por DAC.</p><div class="ct"><div><b>WHATSAPP</b>${wa}</div><div><b>INSTAGRAM</b>${ig}</div><div><b>WEB</b>${web}</div></div></div>`,
];
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const pg = await b.newPage();
  const hf = ROOT + '/presentacion/.tmp.html';
  fs.writeFileSync(hf, `<style>${css}</style>${slides.join('')}`);
  await pg.goto('file://' + require('path').resolve(hf), { waitUntil: 'load' });
  await pg.evaluate(() => document.fonts.ready);
  await pg.waitForTimeout(500);
  await pg.pdf({ path: ROOT + '/presentacion/Promos-Centurion.pdf', width: '1920px', height: '1080px', printBackground: true });
  fs.unlinkSync(hf);
  await b.close();
  console.log(slides.length, 'láminas');
})();
