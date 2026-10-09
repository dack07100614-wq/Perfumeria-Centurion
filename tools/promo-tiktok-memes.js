// Videos de TikTok con formato meme (1080x1920, sin audio)
// Uso: node tools/promo-tiktok-memes.js pov|flags  -> tiktok/Video-TikTok-POV.mp4 | Video-TikTok-Flags.mp4 (+ "-audio" con pista silenciosa)
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');
const ROOT = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(ROOT + '/data/products.json', 'utf8')).products;
const cfg = JSON.parse(fs.readFileSync(ROOT + '/data/config.json', 'utf8'));
const P = (id) => data.find((p) => p.id === id);
const fmt = (n) => '$ ' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const F = (f) => 'file://' + ROOT + '/src/fonts/' + f;
const img = (id) => 'file://' + ROOT + '/public/img/products/' + id + '.webp';
const logo = 'file://' + ROOT + '/src/img/logo-emblem.png';
const FPS = 30;
const css = `
@font-face{font-family:IS;font-weight:600;src:url(${F('InstrumentSans-600-latin.woff2')})}
@font-face{font-family:IS;font-weight:700;src:url(${F('InstrumentSans-700-latin.woff2')})}
@font-face{font-family:CG;font-style:italic;font-weight:500;src:url(${F('CormorantGaramond-500i-latin.woff2')})}
*{box-sizing:border-box;margin:0}
body{width:1080px;height:1920px;font-family:IS,sans-serif;background:#111;color:#fff;position:relative;overflow:hidden}
.bg{position:absolute;inset:-120px;background-size:cover;background-position:center;filter:blur(46px) brightness(.55) saturate(1.15)}
.shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.5),rgba(0,0,0,.1) 30%,rgba(0,0,0,.1) 55%,rgba(0,0,0,.88) 80%)}
.A{animation-fill-mode:both;animation-timing-function:cubic-bezier(.2,.9,.25,1.15)}
@keyframes pop{0%{transform:scale(2.4);opacity:0}60%{transform:scale(.92);opacity:1}100%{transform:scale(1)}}
@keyframes up{from{transform:translateY(60px);opacity:0}to{transform:none;opacity:1}}
@keyframes fade{from{opacity:0}to{opacity:1}}
@keyframes slideR{from{transform:translateX(200px);opacity:0}to{transform:none;opacity:1}}
@keyframes shake{0%,100%{transform:translate(0,0) rotate(0)}20%{transform:translate(-14px,6px) rotate(-2deg)}40%{transform:translate(12px,-8px) rotate(2deg)}60%{transform:translate(-10px,-6px) rotate(-1.5deg)}80%{transform:translate(10px,8px) rotate(1.5deg)}}
@keyframes wob{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg)}}
.m{position:absolute;left:50px;right:50px;text-align:center;font-weight:700;text-transform:uppercase;line-height:1.02;-webkit-text-stroke:0;text-shadow:-4px -4px 0 #000,4px -4px 0 #000,-4px 4px 0 #000,4px 4px 0 #000,0 8px 30px rgba(0,0,0,.6)}
.tag{position:absolute;left:50px;font-weight:700;padding:8px 34px;letter-spacing:.06em;font-size:76px}
.red{background:#d63a2f}.green{background:#1faa59}
.photo{position:absolute;left:40px;top:360px;width:1000px;height:1000px;box-shadow:0 40px 90px rgba(0,0,0,.55);background:#e7e0d4}.photo img{width:100%;height:100%;object-fit:cover;display:block}
.sticker{position:absolute;left:70px;top:390px;font-weight:700;font-size:70px;padding:10px 30px;letter-spacing:.04em}
.info{position:absolute;left:56px;right:56px;top:1390px}
.br{font-size:28px;letter-spacing:.32em;text-transform:uppercase;color:#ddd;font-weight:600;margin-bottom:8px}
.nm{font-size:70px;font-weight:700;line-height:1.04;letter-spacing:.03em;text-transform:uppercase;margin-bottom:12px}
.pr{display:flex;align-items:baseline;gap:24px}.now{font-size:140px;font-weight:700;color:#ff5a4d;line-height:1}.old{font-size:50px;color:#bbb;text-decoration:line-through}
.cta{position:absolute;left:0;right:0;top:280px;text-align:center;padding:0 60px}.cta .l2{width:150px;margin:0 auto 34px;display:block}
.cta h2{font-size:122px;line-height:1;font-weight:700}.cta h3{font-size:60px;font-weight:600;color:#ddd;margin:30px 0 54px}
.pill{display:inline-block;background:#25d366;color:#05301a;font-weight:700;font-size:62px;padding:26px 56px;margin-bottom:26px}
.cta .u{font-size:50px;font-weight:600;letter-spacing:.05em}`;
const bg = (id, extra = '') => `<div class="bg" style="background-image:url('${img(id)}');${extra}"></div><div class="shade"></div>`;
const m = (t, top, size, delay, color = '#fff', anim = 'up') => `<div class="m A" style="top:${top}px;font-size:${size}px;color:${color};animation:${anim} .4s ${delay}s both">${t}</div>`;
const tag = (t, top, cls, delay = 0) => `<div class="tag ${cls} A" style="top:${top}px;animation:pop .35s ${delay}s both">${t}</div>`;
const product = (id, caption, stickerHtml) => {
  const p = P(id);
  return { dur: 2.6, html: `${bg(id)}${m(caption, 110, 66, 0)}
    <div class="photo A" style="animation:slideR .35s .05s both"><img src="${img(id)}"></div>${stickerHtml || ''}
    <div class="info"><div class="br A" style="animation:up .3s .25s both">${[p.brand, p.concentration, p.ml ? p.ml + ' ml' : ''].filter(Boolean).join(' · ')}</div>
    <div class="nm A" style="animation:up .35s .35s both">${p.name}</div>
    <div class="pr"><span class="now A" style="animation:pop .4s .7s both">${fmt(p.price)}</span>${p.oldPrice ? `<span class="old A" style="animation:fade .3s 1s both">${fmt(p.oldPrice)}</span>` : ''}</div></div>` };
};
const cta = (bgId, h2, h3) => ({ dur: 2.8, html: `${bg(bgId)}<div class="shade" style="background:rgba(0,0,0,.72)"></div>
  <div class="cta"><img class="l2 A" src="${logo}" style="animation:pop .4s both"><h2 class="A" style="animation:up .4s .1s both">${h2}</h2><h3 class="A" style="animation:up .4s .3s both">${h3}</h3>
  <div class="pill A" style="animation:pop .4s .6s both">WhatsApp ${cfg.contact.whatsappDisplay}</div><br><div class="u A" style="animation:fade .4s .9s both">@${cfg.contact.instagram} · Envíos a todo Uruguay</div></div>` });

const VIDEOS = {
  pov: { file: 'Video-TikTok-POV', scenes: [
    { dur: 2.4, html: `${bg('odyssey-dubai-chocolat')}${tag('POV', 230, 'red')}
      ${m('TE PREGUNTAN<br>“¿QUÉ PERFUME<br>USÁS?”', 400, 118, .2)}
      <div class="m A" style="top:1050px;font-family:CG,serif;font-style:italic;text-transform:none;font-size:92px;font-weight:500;animation:fade .5s 1.3s both">y vos tenés la respuesta</div>` },
    { dur: 3.0, html: `<div class="bg" style="background:#1a1a1a;filter:none"></div>
      ${m('Nadie:', 200, 120, .1)}${m('Absolutamente nadie:', 400, 100, .7)}${m('Yo con Dubai Chocolat puesto:', 640, 100, 1.3, '#ff5a4d')}
      <div class="photo A" style="top:1010px;left:190px;width:700px;height:700px;animation:pop .4s 1.7s both"><img src="${img('odyssey-dubai-chocolat')}" style="animation:shake .5s 2.1s infinite"></div>` },
    product('odyssey-dubai-chocolat', 'Todos: “¿QUÉ TE PUSISTE?!”', ''),
    { ...product('yara-candy', 'Ella: “¿Y ESE PERFUME??”', ''), dur: 2.4 },
    { dur: 2.2, html: `${bg('raghba')}${m('Mi billetera después:', 520, 96, .1)}${m('TRANQUILA', 780, 150, .6, '#25d366', 'pop')}
      <div class="m A" style="top:1130px;font-size:64px;animation:fade .4s 1.1s both">desde ${fmt(Math.min(...data.map((x) => x.price)))}</div>` },
    cta('odyssey-dubai-chocolat', 'MANDÁSELO A<br>QUIEN SIEMPRE<br>PREGUNTA', 'o comentá “YO” 👇'.replace(' 👇', '')),
  ] },
  flags: { file: 'Video-TikTok-Flags', scenes: [
    { dur: 2.2, html: `${bg('badee-al-oud-sublime')}${tag('GREEN FLAG', 330, 'green')}${m('O', 520, 120, .3)}${tag('RED FLAG', 700, 'red', .5)}
      ${m('EDICIÓN<br>PERFUMES', 960, 130, .9)}` },
    product('badee-al-oud-sublime', 'Oler a noche sin gastar de más', `<div class="sticker green A" style="animation:pop .35s .5s both"><span style="display:inline-block;animation:wob .5s .9s infinite alternate">GREEN FLAG</span></div>`),
    product('odyssey-toffee-coffee', 'Que te pregunten “¿qué perfume usás?”', `<div class="sticker green A" style="animation:pop .35s .5s both"><span style="display:inline-block;animation:wob .5s .9s infinite alternate">GREEN FLAG</span></div>`),
    product('hawas-for-him', 'Entrar a un lugar y que se note', `<div class="sticker green A" style="animation:pop .35s .5s both"><span style="display:inline-block;animation:wob .5s .9s infinite alternate">GREEN FLAG</span></div>`),
    { dur: 2.6, html: `<div class="bg" style="background:#3a0d0a;filter:none"></div>${tag('RED FLAG', 330, 'red')}
      ${m('Usar el mismo<br>perfume<br>hace 10 años', 560, 118, .4)}<div class="m A" style="top:1120px;font-family:CG,serif;font-style:italic;text-transform:none;font-size:90px;font-weight:500;animation:fade .5s 1.4s both">dale una oportunidad a otro aroma</div>` },
    cta('hawas-for-him', 'COMENTÁ<br>TU FLAG', 'y pedí el tuyo por WhatsApp'),
  ] },
};
(async () => {
  const V = VIDEOS[process.argv[2]];
  if (!V) { console.error('Uso: node tools/promo-tiktok-memes.js pov|flags'); process.exit(1); }
  const tf = `${ROOT}/tiktok/tiempos-${process.argv[2]}.json`; // duraciones por escena ajustadas a la voz (tools/voz-tiktok.py)
  if (fs.existsSync(tf)) { const T = JSON.parse(fs.readFileSync(tf, 'utf8')); V.scenes.forEach((sc, i) => { if (T[i]) sc.dur = T[i]; }); }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tm-'));
  const b = await chromium.launch({ args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  let n = 0;
  for (let s = 0; s < V.scenes.length; s++) {
    const hf = path.join(tmp, `s${s}.html`);
    fs.writeFileSync(hf, `<style>${css}</style>${V.scenes[s].html}`);
    await pg.goto('file://' + hf, { waitUntil: 'load' });
    await pg.evaluate(() => document.fonts.ready);
    const frames = Math.round(V.scenes[s].dur * FPS);
    for (let f = 0; f < frames; f++) {
      await pg.evaluate((ms) => document.getAnimations().forEach((a) => { a.pause(); a.currentTime = ms; }), (f / FPS) * 1000);
      await pg.screenshot({ path: path.join(tmp, `f${String(n++).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 88 });
    }
    if (process.argv[3] === 'preview') fs.copyFileSync(path.join(tmp, `f${String(n - 1).padStart(5, '0')}.jpg`), path.join(tmp, `prev${s}.jpg`));
  }
  await b.close();
  fs.mkdirSync(ROOT + '/tiktok', { recursive: true });
  const out = `${ROOT}/tiktok/${V.file}.mp4`, out2 = `${ROOT}/tiktok/${V.file}-audio.mp4`;
  execFileSync('ffmpeg', ['-y', '-framerate', String(FPS), '-i', path.join(tmp, 'f%05d.jpg'), '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-crf', '19', '-r', String(FPS), '-movflags', '+faststart', out], { stdio: 'ignore' });
  execFileSync('ffmpeg', ['-y', '-i', out, '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', out2], { stdio: 'ignore' });
  console.log(V.file, 'listo', n, 'cuadros');
})();
