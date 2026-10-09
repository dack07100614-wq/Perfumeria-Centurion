// Portada para TikTok (1080x1920) -> tiktok/Portada-TikTok.png
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), os = require('os');
const ROOT = path.resolve(__dirname, '..');
const F = (f) => 'file://' + ROOT + '/src/fonts/' + f;
const img = (id) => 'file://' + ROOT + '/public/img/products/' + id + '.webp';
const logo = 'file://' + ROOT + '/src/img/logo-emblem.png';
const tiles = [['yara', 600, 1130, 7], ['club-de-nuit-intense', 60, 1190, -6], ['afnan-9pm', 560, 1360, 4], ['asad-edp', 110, 1390, -3], ['khamrah', 340, 1260, 2]];
const html = `<style>
@font-face{font-family:IS;font-weight:700;src:url(${F('InstrumentSans-700-latin.woff2')})}
@font-face{font-family:IS;font-weight:600;src:url(${F('InstrumentSans-600-latin.woff2')})}
*{box-sizing:border-box;margin:0}body{width:1080px;height:1920px;font-family:IS,sans-serif;color:#fff;position:relative;overflow:hidden;background:#111}
.bg{position:absolute;inset:-120px;background:url('${img('khamrah')}') center/cover;filter:blur(46px) brightness(.6) saturate(1.15)}
.sh{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.5),rgba(0,0,0,0) 30%,rgba(0,0,0,0) 55%,rgba(0,0,0,.85))}
.logo{position:absolute;left:56px;top:150px;display:flex;align-items:center;gap:16px}.logo img{width:70px}.logo b{font-size:34px;letter-spacing:.16em;font-weight:600}
.hk{position:absolute;left:56px;right:56px;top:240px}.t{display:inline-block;background:#d63a2f;font-weight:700;font-size:70px;padding:8px 32px;letter-spacing:.06em}
h1{font-size:140px;line-height:.95;margin-top:28px;text-shadow:0 8px 40px rgba(0,0,0,.6)}h1 em{font-style:normal;color:#ff5a4d}
.tile{position:absolute;width:430px;height:430px;border:6px solid #fff;background:#e7e0d4;box-shadow:0 30px 60px rgba(0,0,0,.55)}.tile img{width:100%;height:100%;object-fit:cover}
</style><div class="bg"></div><div class="sh"></div>
<div class="logo"><img src="${logo}"><b>CENTURIÓN</b></div>
<div class="hk"><span class="t">TOP 5</span><h1>PERFUMES<br><em>ÁRABES</em><br>QUE TENÉS<br>QUE PROBAR</h1></div>
${tiles.map(([id, x, y, r]) => `<div class="tile" style="left:${x}px;top:${y}px;transform:rotate(${r}deg)"><img src="${img(id)}"></div>`).join('')}`;
(async () => {
  const f = path.join(os.tmpdir(), 'portada-tt.html'); fs.writeFileSync(f, html);
  const b = await chromium.launch({ args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('file://' + f); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
  await p.screenshot({ path: ROOT + '/tiktok/Portada-TikTok.png' }); await b.close(); console.log('ok');
})();
