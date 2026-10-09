#!/usr/bin/env python3
"""Agrega una voz en off (Kokoro, voz masculina es: em_alex) a los videos de TikTok con formato meme.
Uso: python3 tools/voz-tiktok.py pov|flags   (necesita kokoro-onnx, soundfile y model.onnx + voices.npz en VOZ_DIR)
Salida: tiktok/Video-TikTok-<POV|Flags>-voz.mp4"""
import subprocess, sys, os, tempfile
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VOZ = os.environ.get('VOZ_DIR', '/tmp/work/kok'); VOICE = os.environ.get('VOZ_VOZ', 'em_alex')
SUFIJO = os.environ.get('VOZ_SUFIJO', 'voz')
V = {
 'pov': ('Video-TikTok-POV', [(0.0, 2.4, '¿Qué perfume usás? ¡Vos tenés la respuesta!'),
   (2.4, 3.0, 'Nadie. Absolutamente nadie. Yo, con Khamrah puesto.'),
   (5.4, 2.6, 'Todos: ¡¿qué te pusiste?! Khamrah.'),
   (8.0, 2.4, 'Ella: ¡¿y ese perfume?! Yara.'),
   (10.4, 2.2, 'Mi billetera después... tranquila.'),
   (12.6, 2.8, '¡Mandáselo a quien siempre pregunta! Pedilo por WhatsApp.')]),
 'flags': ('Video-TikTok-Flags', [(0.0, 2.2, '¿Green flag... o red flag?'),
   (2.2, 2.6, 'Green flag: oler a noche, sin gastar de más.'),
   (4.8, 2.6, 'Green flag: que te pregunten qué usás.'),
   (7.4, 2.6, 'Green flag: entrar y que se note.'),
   (10.0, 2.6, 'Red flag: el mismo perfume hace diez años.'),
   (12.6, 2.8, '¡Comentá tu flag y pedilo por WhatsApp!')]),
}
name, lines = V[sys.argv[1]]
kok = Kokoro(VOZ + '/model.onnx', VOZ + '/voices.npz')
tmp = tempfile.mkdtemp(); inputs = []; filt = []
for i, (start, dur, text) in enumerate(lines):
    audio, sr = kok.create(text, voice=VOICE, speed=1.0, lang='es')
    secs = len(audio) / sr
    speed = max(1.0, min(1.4, secs / (dur - 0.2)))  # acelera dentro del modelo, mantiene la entonación
    if speed > 1.0: audio, sr = kok.create(text, voice=VOICE, speed=speed, lang='es'); secs = len(audio) / sr
    print(f'{text[:40]:40s} {secs:.2f}s en {dur}s (velocidad x{speed:.2f})')
    raw = f'{tmp}/l{i}.wav'; sf.write(raw, audio, sr)
    inputs += ['-i', raw]
    filt.append(f'[{i+1}:a]aresample=44100,highpass=f=70,equalizer=f=120:t=h:w=100:g=2,acompressor=threshold=-20dB:ratio=3:attack=5:release=80:makeup=3,adelay={int((start+0.05)*1000)}:all=1[a{i}]')
mix = ''.join(f'[a{i}]' for i in range(len(lines)))
filt.append(f'{mix}amix=inputs={len(lines)}:normalize=0,loudnorm=I=-16:TP=-1.5,apad[v]')
src = f'{ROOT}/tiktok/{name}.mp4'; out = f'{ROOT}/tiktok/{name}-{SUFIJO}.mp4'
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', src] + inputs + ['-filter_complex', ';'.join(filt), '-map', '0:v', '-map', '[v]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-ar', '44100', '-ac', '2', '-shortest', '-movflags', '+faststart', out], check=True)
print('listo', out)
