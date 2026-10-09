#!/usr/bin/env python3
"""Agrega una voz en off (Piper, voz es_AR) a los videos de TikTok con formato meme.
Uso: python3 tools/voz-tiktok.py pov|flags   (necesita piper-tts y el modelo en VOZ_DIR)
Salida: tiktok/Video-TikTok-<POV|Flags>-voz.mp4"""
import subprocess, sys, os, wave, tempfile
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VOZ = os.environ.get('VOZ_DIR', '/tmp/work/voz'); MODEL = VOZ + '/es_AR-daniela-high.onnx'
V = {
 'pov': ('Video-TikTok-POV', [(0.0, 2.4, 'Te preguntan qué perfume usás... y vos tenés la respuesta.'),
   (2.4, 3.0, 'Nadie. Absolutamente nadie. Yo, con Khamrah puesto.'),
   (5.4, 2.6, 'Todos: ¿qué te pusiste? Khamrah.'),
   (8.0, 2.4, 'Ella: ¿y ese perfume? Yara.'),
   (10.4, 2.2, 'Mi billetera después: tranquila.'),
   (12.6, 2.8, 'Mandáselo a quien siempre pregunta. Pedilo por WhatsApp.')]),
 'flags': ('Video-TikTok-Flags', [(0.0, 2.2, '¿Green flag, o red flag? Edición perfumes.'),
   (2.2, 2.6, 'Green flag: oler a noche sin gastar de más.'),
   (4.8, 2.6, 'Green flag: que te pregunten qué perfume usás.'),
   (7.4, 2.6, 'Green flag: entrar y que se note.'),
   (10.0, 2.6, 'Red flag: usar el mismo perfume hace diez años.'),
   (12.6, 2.8, 'Comentá tu flag y pedí el tuyo por WhatsApp.')]),
}
name, lines = V[sys.argv[1]]
tmp = tempfile.mkdtemp(); inputs = []; filt = []
for i, (start, dur, text) in enumerate(lines):
    raw = f'{tmp}/l{i}.wav'
    subprocess.run(['python3', '-m', 'piper', '-m', MODEL, '-f', raw], input=text.encode(), check=True, capture_output=True)
    w = wave.open(raw); secs = w.getnframes() / w.getframerate(); w.close()
    tempo = max(1.0, min(1.5, secs / (dur - 0.15)))
    print(f'{text[:40]:40s} {secs:.2f}s en {dur}s -> x{tempo:.2f}')
    inputs += ['-i', raw]
    filt.append(f'[{i+1}:a]atempo={tempo:.3f},adelay={int((start+0.05)*1000)}:all=1[a{i}]')
mix = ''.join(f'[a{i}]' for i in range(len(lines)))
filt.append(f'{mix}amix=inputs={len(lines)}:normalize=0,loudnorm=I=-16:TP=-1.5[v]')
src = f'{ROOT}/tiktok/{name}.mp4'; out = f'{ROOT}/tiktok/{name}-voz.mp4'
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', src] + inputs + ['-filter_complex', ';'.join(filt), '-map', '0:v', '-map', '[v]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-ar', '44100', '-ac', '2', '-shortest', '-movflags', '+faststart', out], check=True)
print('listo', out)
