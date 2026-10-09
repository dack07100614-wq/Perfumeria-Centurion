// POV con el perro de la plantilla de CapCut sobre un fondo nuevo de la tienda (1080x1920).
// Uso: DOG=/ruta/preview-verde.mp4 AUDIO=/ruta/video-original.mp4 node tools/pov-perro.js  -> tiktok/POV-Perro.mp4
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');
const ROOT = path.resolve(__dirname, '..');
const DOG = process.env.DOG, AUDIO = process.env.AUDIO;
const DUR = 8.12, FPS = 30, DOG_OFFSET = 0.08; // el perro de la muestra va 0,08 s adelantado respecto del video original
const data = JSON.parse(fs.readFileSync(ROOT + '/data/products.json', 'utf8')).products;
const cfg = JSON.parse(fs.readFileSync(ROOT + '/data/config.json', 'utf8'));
const P = data.find((p) => p.id === 'pack-khamrah-duo');
const fmt = (n) => '$ ' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const F = (f) => 'file://' + ROOT + '/src/fonts/' + f;
const img = 'file://' + ROOT + '/public/img/products/pack-khamrah-duo.webp';
const logo = 'file://' + ROOT + '/src/img/logo-emblem.png';
// Cada texto vive entre t0 y t1 (segundos), siguiendo las poses del perro: tranquilo, olfateando, sorprendido, ladrando.
const caps = [
  { t0: 0.0, t1: 2.8, html: '<span class="tag">POV</span><br>Tu ex te cruza<br>por la calle' },
  { t0: 2.8, t1: 5.0, html: 'y te siente el perfume<br>que compraste en<br><em>Perfumería Centurión</em>', small: true },
  { t0: 5.0, t1: 6.7, html: '¿¿QUÉ PERFUME<br>USÁS??', shake: true },
  { t0: 6.7, t1: DUR + 1, html: 'Pedilo por<br><em>WhatsApp</em>', big: true },
];
const html = `<style>
@font-face{font-family:IS;font-weight:600;src:url(${F('InstrumentSans-600-latin.woff2')})}
@font-face{font-family:IS;font-weight:700;src:url(${F('InstrumentSans-700-latin.woff2')})}
*{box-sizing:border-box;margin:0}body{width:1080px;height:1920px;font-family:IS,sans-serif;color:#fff;position:relative;overflow:hidden;background:#111}
.bg{position:absolute;inset:-120px;background:url('${img}') center/cover;filter:blur(50px) brightness(.5) saturate(1.2)}
.sh{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.55),rgba(0,0,0,0) 30%,rgba(0,0,0,0) 60%,rgba(0,0,0,.6))}
.logo{position:absolute;left:56px;top:96px;display:flex;align-items:center;gap:16px}.logo img{width:70px}.logo b{font-size:34px;letter-spacing:.16em;font-weight:600}.logo small{display:block;font-size:12px;letter-spacing:.42em;color:#ccc;margin-bottom:5px}
.photo{position:absolute;left:40px;top:480px;width:1000px;height:1000px;box-shadow:0 40px 90px rgba(0,0,0,.55);background:#e7e0d4}.photo img{width:100%;height:100%;object-fit:cover;display:block}
.deal{position:absolute;right:60px;top:500px;background:#d63a2f;padding:14px 30px;text-align:center;transform:rotate(4deg);box-shadow:0 10px 30px rgba(0,0,0,.4)}
.deal b{display:block;font-size:30px;letter-spacing:.18em}.deal span{font-size:84px;font-weight:700;line-height:1}.deal s{display:block;font-size:34px;color:#ffd0cb}
.cap{position:absolute;left:40px;right:40px;top:210px;text-align:center;font-weight:700;text-transform:uppercase;font-size:86px;line-height:1.03;opacity:0;animation:io linear both;text-shadow:-4px -4px 0 #000,4px -4px 0 #000,-4px 4px 0 #000,4px 4px 0 #000,0 8px 30px rgba(0,0,0,.6)}
.cap.big{font-size:100px}.cap.small{font-size:68px}.cap em{font-style:normal;color:#25d366}
.tag{display:inline-block;background:#d63a2f;padding:2px 30px;font-size:70px;margin-bottom:10px;text-shadow:none}
@keyframes io{0%{opacity:0;transform:translateY(40px) scale(.9)}8%{opacity:1;transform:none}92%{opacity:1;transform:none}100%{opacity:0;transform:none}}
@keyframes shk{0%,100%{translate:0 0}25%{translate:-10px 6px}50%{translate:10px -6px}75%{translate:-8px -4px}}
.foot{position:absolute;right:30px;bottom:110px;width:270px;text-align:right}.foot .u{font-size:34px;line-height:1.1;word-break:break-all;font-weight:600;letter-spacing:.04em;text-shadow:0 3px 14px #000}.foot .e{font-size:24px;letter-spacing:.18em;text-transform:uppercase;color:#ddd;margin-top:8px;text-shadow:0 3px 14px #000}
</style><div class="bg"></div><div class="sh"></div>
<div class="logo"><img src="${logo}"><div><small>PERFUMERÍA</small><b>CENTURIÓN</b></div></div>
<div class="photo"><img src="${img}"></div>
<div class="deal"><b>PACK DÚO</b><span>${fmt(P.price)}</span><s>${fmt(P.oldPrice)}</s></div>
${caps.map((c) => `<div class="cap${c.big ? ' big' : ''}${c.small ? ' small' : ''}" style="animation-duration:${(c.t1 - c.t0).toFixed(2)}s;animation-delay:${c.t0}s;${c.shake ? 'animation-name:io,shk;animation-duration:' + (c.t1 - c.t0).toFixed(2) + 's,.3s;animation-iteration-count:1,infinite;animation-timing-function:linear' : ''}">${c.html}</div>`).join('')}
<div class="foot"><div class="u">@${cfg.contact.instagram}</div><div class="u" style="color:#25d366;margin-top:12px">${cfg.contact.whatsappDisplay}</div><div class="e">Envíos a todo Uruguay</div></div>`;
(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pd-'));
  const hf = path.join(tmp, 'bg.html'); fs.writeFileSync(hf, html);
  const b = await chromium.launch({ args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await pg.goto('file://' + hf); await pg.evaluate(() => document.fonts.ready);
  const n = Math.round(DUR * FPS);
  for (let f = 0; f < n; f++) {
    await pg.evaluate((ms) => document.getAnimations().forEach((a) => { a.pause(); a.currentTime = ms; }), (f / FPS) * 1000);
    await pg.screenshot({ path: path.join(tmp, `f${String(f).padStart(4, '0')}.png`) });
  }
  await b.close();
  const out = ROOT + '/tiktok/POV-Perro.mp4';
  fs.mkdirSync(ROOT + '/tiktok', { recursive: true });
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-framerate', String(FPS), '-i', path.join(tmp, 'f%04d.png'), '-ss', String(DOG_OFFSET), '-i', DOG, '-i', AUDIO,
    '-filter_complex', `[1:v]fps=${FPS},scale=1080:1920:flags=lanczos,chromakey=0x00ff00:0.22:0.08,despill=type=green[d];[0:v][d]overlay=0:0:shortest=1,format=yuv420p[v]`,
    '-map', '[v]', '-map', '2:a', '-t', String(DUR), '-c:v', 'libx264', '-profile:v', 'high', '-crf', '18', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', out], { stdio: 'inherit' });
  console.log('listo', out);
})();
