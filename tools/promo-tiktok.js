// Video para TikTok (1080x1920, ~15 s, cortes rápidos, sin audio) -> tiktok/Video-TikTok.mp4
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');
const ROOT = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(ROOT + '/data/products.json', 'utf8')).products;
const cfg = JSON.parse(fs.readFileSync(ROOT + '/data/config.json', 'utf8'));
const fmt = (n) => '$ ' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const PICKS = ['yara', 'club-de-nuit-intense', 'afnan-9pm', 'asad-edp', 'khamrah']; // de #5 a #1
const items = PICKS.map((id) => data.find((p) => p.id === id)).filter(Boolean);
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
.c{display:flex;flex-direction:column;align-items:flex-start;justify-content:center;height:1500px;padding:0 70px}
.logo{display:flex;align-items:center;gap:18px;margin-bottom:60px}.logo img{width:80px}.logo b{font-size:40px;letter-spacing:.16em;font-weight:600}.logo small{display:block;font-size:14px;letter-spacing:.42em;color:#aaa;margin-bottom:6px}
.k{font-size:36px;letter-spacing:.3em;color:#bbb;text-transform:uppercase;margin-bottom:18px}
h1{font-size:150px;line-height:.96;font-weight:700;letter-spacing:.01em}
h1 em{font-style:normal;color:#ff5a4d}
.sub{font-family:CG,serif;font-style:italic;font-size:62px;color:#ddd;margin-top:40px;line-height:1.15}
.rank{position:absolute;left:56px;top:150px;z-index:3;background:#d63a2f;font-weight:700;font-size:96px;padding:6px 36px;letter-spacing:.02em}
.ph{position:absolute;left:0;right:0;top:150px;height:900px;background:#e7e0d4;overflow:hidden}.ph img{width:100%;height:100%;object-fit:cover;object-position:center 45%}
.info{position:absolute;left:56px;right:150px;top:1090px}
.br{font-size:28px;letter-spacing:.34em;text-transform:uppercase;color:#aaa;font-weight:600;margin-bottom:10px}
.nm{font-size:64px;font-weight:700;line-height:1.05;letter-spacing:.03em;text-transform:uppercase;margin-bottom:22px}
.pr{display:flex;align-items:baseline;gap:26px}.now{font-size:130px;font-weight:700;color:#ff5a4d;line-height:1}.old{font-size:50px;color:#999;text-decoration:line-through}
.tag{position:absolute;left:56px;top:1370px;font-size:30px;letter-spacing:.16em;color:#bbb;text-transform:uppercase}
.cta{align-items:center;text-align:center}
.cta h2{font-size:120px;font-weight:700;line-height:1;margin-bottom:34px}.cta p{font-size:50px;color:#ddd;line-height:1.3;margin-bottom:50px}
.pill{background:#d63a2f;font-weight:700;font-size:56px;padding:22px 50px;margin-bottom:24px}.cta .u{font-size:46px;letter-spacing:.06em;font-weight:600}`;
const frames = [
  `<div class="c"><div class="logo"><img src="${logo}"><div><small>PERFUMERÍA</small><b>CENTURIÓN</b></div></div><div class="k">Top 5</div><h1>PERFUMES<br><em>ÁRABES</em><br>QUE TENÉS<br>QUE PROBAR</h1><div class="sub">originales, con envío a todo Uruguay</div></div>`,
  ...items.map((p, i) => `<div class="ph"><img src="${img(p.id)}"></div><div class="rank">#${items.length - i}</div><div class="info"><div class="br">${[p.brand, p.concentration, p.ml ? p.ml + ' ml' : ''].filter(Boolean).join(' · ')}</div><div class="nm">${p.name}</div><div class="pr"><span class="now">${fmt(p.price)}</span>${p.oldPrice ? `<span class="old">${fmt(p.oldPrice)}</span>` : ''}</div></div>`),
  `<div class="c cta"><div class="logo"><img src="${logo}"><div><small>PERFUMERÍA</small><b>CENTURIÓN</b></div></div><h2>PEDÍ EL<br>TUYO</h2><p>Por WhatsApp ${cfg.contact.whatsappDisplay}<br>o en el link de la bio</p><div class="pill">ENVÍOS A TODO URUGUAY</div><div class="u">@${cfg.contact.instagram}</div></div>`,
];
const durs = [2.2, 2.3, 2.3, 2.3, 2.3, 2.6, 2.4]; // 7 escenas, ~16,4 s
(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tt-'));
  const b = await chromium.launch({ args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  for (let i = 0; i < frames.length; i++) {
    const hf = path.join(tmp, `f${i}.html`);
    fs.writeFileSync(hf, `<style>${css}</style>${frames[i]}`);
    await pg.goto('file://' + hf, { waitUntil: 'load' });
    await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(250);
    await pg.screenshot({ path: path.join(tmp, `f${i}.png`) });
  }
  await b.close();
  const fps = 30, args = ['-y'];
  durs.forEach((d, i) => args.push('-framerate', String(fps), '-loop', '1', '-t', String(d), '-i', path.join(tmp, `f${i}.png`)));
  const f = durs.map((_, i) => `[${i}:v]fps=${fps},setsar=1[v${i}]`).join(';') + ';' + durs.map((_, i) => `[v${i}]`).join('') + `concat=n=${durs.length}:v=1:a=0[out]`;
  fs.mkdirSync(ROOT + '/tiktok', { recursive: true });
  args.push('-filter_complex', f, '-map', '[out]', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-r', String(fps), '-movflags', '+faststart', ROOT + '/tiktok/Video-TikTok.mp4');
  execFileSync('ffmpeg', args, { stdio: 'ignore' });
  console.log('video listo');
})();
