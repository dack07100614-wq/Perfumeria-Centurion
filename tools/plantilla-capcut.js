// Imágenes verticales 1080x1920 de perfumes para cargar en plantillas de CapCut -> tiktok/plantilla-capcut/NN-<id>.png
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(ROOT + '/data/products.json', 'utf8')).products;
const fmt = (n) => '$ ' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const F = (f) => 'file://' + ROOT + '/src/fonts/' + f;
const img = (id) => 'file://' + ROOT + '/public/img/products/' + id + '.webp';
const logo = 'file://' + ROOT + '/src/img/logo-emblem.png';
const IDS = (process.argv[2] || 'odyssey-dubai-chocolat,badee-al-oud-sublime,yara-candy,hawas-for-him').split(',');
const page = (p) => `<style>
@font-face{font-family:IS;font-weight:600;src:url(${F('InstrumentSans-600-latin.woff2')})}
@font-face{font-family:IS;font-weight:700;src:url(${F('InstrumentSans-700-latin.woff2')})}
*{box-sizing:border-box;margin:0}body{width:1080px;height:1920px;font-family:IS,sans-serif;color:#fff;position:relative;overflow:hidden;background:#111}
.bg{position:absolute;inset:-120px;background:url('${img(p.id)}') center/cover;filter:blur(46px) brightness(.55) saturate(1.15)}
.sh{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.45),rgba(0,0,0,0) 30%,rgba(0,0,0,0) 55%,rgba(0,0,0,.88) 80%)}
.logo{position:absolute;left:56px;top:150px;display:flex;align-items:center;gap:16px}.logo img{width:70px}.logo b{font-size:34px;letter-spacing:.16em;font-weight:600}
.photo{position:absolute;left:40px;top:330px;width:1000px;height:1000px;box-shadow:0 40px 90px rgba(0,0,0,.55);background:#e7e0d4}.photo img{width:100%;height:100%;object-fit:cover;display:block}
.info{position:absolute;left:56px;right:56px;top:1390px}.br{font-size:28px;letter-spacing:.32em;text-transform:uppercase;color:#ddd;font-weight:600;margin-bottom:8px}
.nm{font-size:70px;font-weight:700;line-height:1.04;letter-spacing:.03em;text-transform:uppercase;margin-bottom:12px}
.now{font-size:140px;font-weight:700;color:#ff5a4d;line-height:1}.old{font-size:50px;color:#bbb;text-decoration:line-through;margin-left:24px}
</style><div class="bg"></div><div class="sh"></div><div class="logo"><img src="${logo}"><b>CENTURIÓN</b></div>
<div class="photo"><img src="${img(p.id)}"></div>
<div class="info"><div class="br">${[p.brand, p.concentration, p.ml ? p.ml + ' ml' : ''].filter(Boolean).join(' · ')}</div><div class="nm">${p.name}</div>
<span class="now">${fmt(p.price)}</span>${p.oldPrice ? `<span class="old">${fmt(p.oldPrice)}</span>` : ''}</div>`;
(async () => {
  const out = ROOT + '/tiktok/plantilla-capcut'; fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  for (const [i, id] of IDS.entries()) {
    const p = data.find((x) => x.id === id); if (!p) { console.error('no existe', id); continue; }
    const f = path.join(require('os').tmpdir(), 'pl-' + id + '.html'); fs.writeFileSync(f, page(p));
    await pg.goto('file://' + f); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(300);
    await pg.screenshot({ path: `${out}/${String(i + 1).padStart(2, '0')}-${id}.png` });
  }
  await b.close(); console.log('listo', IDS.length);
})();
