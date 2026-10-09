// Video para TikTok a pantalla completa con animaciones (1080x1920, ~16,6 s, sin audio)
// -> tiktok/Video-TikTok.mp4  y  tiktok/Video-TikTok-audio.mp4 (con pista silenciosa)
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');
const ROOT = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(ROOT + '/data/products.json', 'utf8')).products;
const cfg = JSON.parse(fs.readFileSync(ROOT + '/data/config.json', 'utf8'));
const fmt = (n) => '$ ' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
// Uso: node tools/promo-tiktok.js [top5|promos|dulces]
const THEMES = {
  top5: { file: 'Video-TikTok', picks: ['yara', 'club-de-nuit-intense', 'afnan-9pm', 'asad-edp', 'khamrah'], rank: true, tag: 'TOP 5', h1: 'PERFUMES<br><em>ÁRABES</em><br>QUE TENÉS<br>QUE PROBAR', cta: '¿CUÁL ES<br>TU FAVORITO?', cta2: 'Comentá el número', bg: 'khamrah', ctaBg: 'afnan-9pm' },
  promos: { file: 'Video-TikTok-Promos', picks: ['pack-khamrah-duo', 'pack-yara-duo', 'mandarin-sky', 'badee-al-oud'], rank: false, tag: 'PROMOS', h1: 'PERFUMES<br><em>EN OFERTA</em><br>AHORA', cta: '¿CUÁL TE<br>LLEVÁS?', cta2: 'Escribinos por WhatsApp', bg: 'pack-khamrah-duo', ctaBg: 'mandarin-sky', short: { 'pack-khamrah-duo': 'Dúo Khamrah + Qahwa', 'pack-yara-duo': 'Dúo Yara + Yara Moi', 'mandarin-sky': 'Mandarin Sky' } },
  dulces: { file: 'Video-TikTok-Dulces', picks: ['yara-candy', 'odyssey-toffee-coffee', 'odyssey-dubai-chocolat', 'khamrah-qahwa', 'khamrah'], rank: true, tag: 'TOP 5', h1: 'PERFUMES<br><em>DULCES</em><br>QUE ENAMORAN', cta: '¿CUÁL ES<br>TU FAVORITO?', cta2: 'Comentá el número', bg: 'odyssey-toffee-coffee', ctaBg: 'khamrah-qahwa' },
};
const T = THEMES[process.argv[2] || 'top5'];
const items = T.picks.map((id) => data.find((p) => p.id === id)).filter(Boolean).map((p) => ({ ...p, name: (T.short && T.short[p.id]) || p.name }));
const F = (f) => 'file://' + ROOT + '/src/fonts/' + f;
const img = (id) => 'file://' + ROOT + '/public/img/products/' + id + '.webp';
const logo = 'file://' + ROOT + '/src/img/logo-emblem.png';
const FPS = 30;
const css = `
@font-face{font-family:IS;font-weight:400;src:url(${F('InstrumentSans-400-latin.woff2')})}
@font-face{font-family:IS;font-weight:600;src:url(${F('InstrumentSans-600-latin.woff2')})}
@font-face{font-family:IS;font-weight:700;src:url(${F('InstrumentSans-700-latin.woff2')})}
@font-face{font-family:CG;font-style:italic;font-weight:500;src:url(${F('CormorantGaramond-500i-latin.woff2')})}
*{box-sizing:border-box;margin:0}
body{width:1080px;height:1920px;font-family:IS,sans-serif;background:#111;color:#fff;position:relative;overflow:hidden}
.bg{position:absolute;inset:-120px;background-size:cover;background-position:center;filter:blur(46px) brightness(.62) saturate(1.15)}
.shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.55) 0%,rgba(0,0,0,0) 22%,rgba(0,0,0,0) 55%,rgba(0,0,0,.88) 78%,rgba(0,0,0,.95) 100%)}
.A{animation-fill-mode:both;animation-timing-function:cubic-bezier(.2,.9,.25,1.15)}
@keyframes slideR{from{transform:translateX(160px);opacity:0}to{transform:none;opacity:1}}
@keyframes pop{0%{transform:scale(2.2);opacity:0}60%{transform:scale(.92);opacity:1}100%{transform:scale(1)}}
@keyframes up{from{transform:translateY(60px);opacity:0}to{transform:none;opacity:1}}
@keyframes fade{from{opacity:0}to{opacity:1}}
@keyframes wob{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg)}}
@keyframes drop{from{transform:translateY(-400px) rotate(-12deg);opacity:0}to{transform:translateY(0) rotate(var(--r));opacity:1}}
.logo{position:absolute;left:56px;top:96px;display:flex;align-items:center;gap:16px}.logo img{width:70px}.logo b{font-size:34px;letter-spacing:.16em;font-weight:600}.logo small{display:block;font-size:12px;letter-spacing:.42em;color:#ccc;margin-bottom:5px}
.rank{position:absolute;right:56px;top:84px;font-size:230px;font-weight:700;line-height:1;color:transparent;-webkit-text-stroke:5px #fff;letter-spacing:-.02em}
.photo{position:absolute;left:40px;top:330px;width:1000px;height:1000px;box-shadow:0 40px 90px rgba(0,0,0,.55);background:#e7e0d4}.photo img{width:100%;height:100%;object-fit:cover;display:block}
.disc{position:absolute;left:70px;top:360px;background:#d63a2f;font-weight:700;font-size:78px;padding:10px 30px}
.info{position:absolute;left:56px;right:170px;top:1370px}
.br{font-size:28px;letter-spacing:.32em;text-transform:uppercase;color:#ddd;font-weight:600;margin-bottom:8px}
.nm{font-size:72px;font-weight:700;line-height:1.04;letter-spacing:.03em;text-transform:uppercase;margin-bottom:14px}
.pr{display:flex;align-items:baseline;gap:24px}.now{display:inline-block;font-size:150px;font-weight:700;color:#ff5a4d;line-height:1;text-shadow:0 6px 30px rgba(0,0,0,.5)}.old{font-size:52px;color:#bbb;text-decoration:line-through}
.hk{position:absolute;left:56px;right:56px;top:180px}
.hk .t{display:inline-block;background:#d63a2f;font-weight:700;font-size:64px;padding:8px 30px;letter-spacing:.06em}
.hk h1{font-size:158px;line-height:.95;font-weight:700;margin-top:26px;text-shadow:0 8px 40px rgba(0,0,0,.6)}.hk h1 em{font-style:normal;color:#ff5a4d}
.tile{position:absolute;width:420px;height:420px;box-shadow:0 30px 60px rgba(0,0,0,.55);border:6px solid #fff;background:#e7e0d4}.tile img{width:100%;height:100%;object-fit:cover;display:block}
.sub{position:absolute;left:56px;right:56px;top:1560px;font-family:CG,serif;font-style:italic;font-size:64px;color:#eee}
.cta{position:absolute;left:0;right:0;top:300px;text-align:center;padding:0 60px}.cta .logo2{width:150px;margin:0 auto 34px;display:block}
.cta h2{font-size:132px;line-height:1;font-weight:700}.cta h3{font-size:64px;font-weight:600;color:#ddd;margin:30px 0 56px}
.pill{display:inline-block;background:#25d366;color:#05301a;font-weight:700;font-size:62px;padding:26px 56px;margin-bottom:26px}
.cta .u{font-size:50px;font-weight:600;letter-spacing:.05em}.cta .e{font-size:38px;letter-spacing:.2em;text-transform:uppercase;color:#ccc;margin-top:34px}`;
const bgImg = (id) => `<div class="bg" style="background-image:url('${img(id)}')"></div>`;
const scenes = [
  { dur: 2.0, html: `${bgImg(T.bg)}<div class="shade"></div>
    <div class="hk"><span class="t A" style="animation:pop .35s both">${T.tag}</span><h1 class="A" style="animation:up .45s .1s both">${T.h1}</h1></div>
    ${[[640, 1010, 7], [70, 1080, -6], [560, 1260, 4], [110, 1290, -3], [400, 1180, 2]].slice(0, items.length).map(([x, y, r], i) => [items[i].id, x, y, r]).map(([id, x, y, r], i) => `<div class="tile A" style="left:${x}px;top:${y}px;--r:${r}deg;animation:drop .4s ${0.55 + i * 0.15}s both"><img src="${img(id)}"></div>`).join('')}
    <div class="sub A" style="animation:fade .4s 1.4s both;top:1760px;font-size:54px">originales · envíos a todo Uruguay</div>` },
  ...items.map((p, i) => ({ dur: 2.4, html: `${bgImg(p.id)}<div class="shade"></div>
    <div class="logo A" style="animation:fade .3s both"><img src="${logo}"><div><small>PERFUMERÍA</small><b>CENTURIÓN</b></div></div>
    ${T.rank ? `<div class="rank A" style="animation:pop .4s both">#${items.length - i}</div>` : ''}
    <div class="photo A" style="animation:slideR .35s .05s both"><img src="${img(p.id)}"></div>
    ${p.oldPrice ? `<div class="disc A" style="animation:pop .35s .55s both"><span style="display:inline-block;animation:wob .5s .9s infinite alternate">-${Math.round((p.oldPrice - p.price) / p.oldPrice * 100)}%</span></div>` : ''}
    <div class="info"><div class="br A" style="animation:up .3s .25s both">${[p.brand, p.concentration, p.ml ? p.ml + ' ml' : ''].filter(Boolean).join(' · ')}</div>
    <div class="nm A" style="animation:up .35s .35s both">${p.name}</div>
    <div class="pr"><span class="now A" style="animation:pop .4s .6s both">${fmt(p.price)}</span>${p.oldPrice ? `<span class="old A" style="animation:fade .3s .9s both">${fmt(p.oldPrice)}</span>` : ''}</div></div>` })),
  { dur: 2.6, html: `${bgImg(T.ctaBg)}<div class="shade" style="background:rgba(0,0,0,.72)"></div>
    <div class="cta"><img class="logo2 A" src="${logo}" style="animation:pop .4s both"><h2 class="A" style="animation:up .4s .1s both">${T.cta}</h2><h3 class="A" style="animation:up .4s .3s both">${T.cta2}</h3>
    <div class="pill A" style="animation:pop .4s .6s both">WhatsApp ${cfg.contact.whatsappDisplay}</div><br><div class="u A" style="animation:fade .4s .9s both">@${cfg.contact.instagram}</div>
    <div class="e A" style="animation:fade .4s 1.1s both">Envíos a todo Uruguay</div></div>` },
];
(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tt-'));
  const b = await chromium.launch({ args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  let n = 0;
  for (let s = 0; s < scenes.length; s++) {
    const hf = path.join(tmp, `s${s}.html`);
    fs.writeFileSync(hf, `<style>${css}</style>${scenes[s].html}`);
    await pg.goto('file://' + hf, { waitUntil: 'load' });
    await pg.evaluate(() => document.fonts.ready);
    const frames = Math.round(scenes[s].dur * FPS);
    for (let f = 0; f < frames; f++) {
      await pg.evaluate((ms) => document.getAnimations().forEach((a) => { a.pause(); a.currentTime = ms; }), (f / FPS) * 1000);
      await pg.screenshot({ path: path.join(tmp, `f${String(n++).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 88 });
    }
  }
  await b.close();
  fs.mkdirSync(ROOT + '/tiktok', { recursive: true });
  const out = ROOT + '/tiktok/' + T.file + '.mp4', out2 = ROOT + '/tiktok/' + T.file + '-audio.mp4';
  execFileSync('ffmpeg', ['-y', '-framerate', String(FPS), '-i', path.join(tmp, 'f%05d.jpg'), '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-crf', '19', '-r', String(FPS), '-movflags', '+faststart', out], { stdio: 'ignore' });
  execFileSync('ffmpeg', ['-y', '-i', out, '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', out2], { stdio: 'ignore' });
  console.log('video listo', n, 'cuadros');
})();
