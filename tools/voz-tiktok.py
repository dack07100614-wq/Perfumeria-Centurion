#!/usr/bin/env python3
"""Agrega una voz en off (Kokoro, voz masculina es: em_alex) a los videos de TikTok con formato meme.
Uso: python3 tools/voz-tiktok.py pov|flags   (necesita kokoro-onnx, soundfile y model.onnx + voices.npz en VOZ_DIR)
Salida: tiktok/Video-TikTok-<POV|Flags>-voz.mp4"""
import subprocess, sys, os, tempfile, json
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VOZ = os.environ.get('VOZ_DIR', '/tmp/work/kok'); VOICE = os.environ.get('VOZ_VOZ', 'em_alex')
SUFIJO = os.environ.get('VOZ_SUFIJO', 'voz')
# Los textos se escriben como suenan en español (Khamrah -> Jámra, flag -> fláj) para que la voz los pronuncie bien.
V = {
 'pov': ('Video-TikTok-POV', [(0.0, 2.4, '¿Qué perfume usás? ¡Vos tenés la respuesta!'),
   (2.4, 3.0, 'Nadie. Absolutamente nadie. Yo, con Jámra puesto.'),
   (5.4, 2.6, 'Todos: ¡¿qué te pusiste?! Jámra.'),
   (8.0, 2.4, 'Ella: ¡¿y ese perfume?! Yara.'),
   (10.4, 2.2, 'Mi billetera después... tranquila.'),
   (12.6, 2.8, '¡Mandáselo a quien siempre pregunta! Pedilo por Guatsap.')]),
 'flags': ('Video-TikTok-Flags', [(0.0, 2.2, '¿Grin fláj... o red fláj?'),
   (2.2, 2.6, 'Grin fláj: oliendo a noche, sin gastar de más.'),
   (4.8, 2.6, 'Grin fláj: que te pregunten qué usás.'),
   (7.4, 2.6, 'Grin fláj: entrar y que se note.'),
   (10.0, 2.6, 'Red fláj: el mismo perfume hace diez años.'),
   (12.6, 2.8, '¡Comentá tu fláj y pedilo por Guatsap!')]),
}
name, lines = V[sys.argv[1]]
kok = Kokoro(VOZ + '/model.onnx', VOZ + '/voices.npz')
tmp = tempfile.mkdtemp(); inputs = []; filt = []; clips = []
for i, (start, mindur, text) in enumerate(lines):
    audio, sr = kok.create(text, voice=VOICE, speed=1.0, lang='es')  # velocidad normal, sin acelerar
    audio = np.concatenate([np.zeros(int(sr * 0.2)), audio, np.zeros(int(sr * 0.2))])
    raw = f'{tmp}/l{i}.wav'; sf.write(raw, audio, sr); clips.append((raw, len(audio) / sr))
# cada escena dura lo que tarda la frase (+ un respiro), nunca menos que su duración mínima
durs = [round(max(mind, secs + 0.35), 2) for (_, mind, _), (_, secs) in zip(lines, clips)]
json.dump(durs, open(f'{ROOT}/tiktok/tiempos-{sys.argv[1]}.json', 'w'))
print('duraciones de escena:', durs, 'total', round(sum(durs), 2), 's')
subprocess.run(['node', f'{ROOT}/tools/promo-tiktok-memes.js', sys.argv[1]], check=True)
t0 = 0.0
for i, ((raw, secs), d) in enumerate(zip(clips, durs)):
    inputs += ['-i', raw]
    filt.append(f'[{i+1}:a]aresample=44100,highpass=f=70,equalizer=f=120:t=h:w=100:g=2,acompressor=threshold=-20dB:ratio=3:attack=5:release=80:makeup=3,adelay={int((t0 + 0.1) * 1000)}:all=1[a{i}]')
    t0 += d
mix = ''.join(f'[a{i}]' for i in range(len(lines)))
filt.append(f'{mix}amix=inputs={len(lines)}:normalize=0,loudnorm=I=-16:TP=-1.5,apad[v]')
src = f'{ROOT}/tiktok/{name}.mp4'; out = f'{ROOT}/tiktok/{name}-{SUFIJO}.mp4'
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', src] + inputs + ['-filter_complex', ';'.join(filt), '-map', '0:v', '-map', '[v]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-ar', '44100', '-ac', '2', '-shortest', '-movflags', '+faststart', out], check=True)
print('listo', out)
