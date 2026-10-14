#!/usr/bin/env python3
"""Busca códigos EAN/GTIN de los perfumes del catálogo en Open Beauty Facts (base pública y colaborativa).
Salida: codigos/Codigos-universales.csv. Son CANDIDATOS: hay que confirmarlos con la caja física antes de usarlos."""
import json, os, re, time, csv, unicodedata, urllib.parse, urllib.request
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
prods = json.load(open(ROOT + '/data/products.json'))['products']
def norm(s): return re.sub(r'[^a-z0-9 ]', ' ', unicodedata.normalize('NFKD', s.lower()).encode('ascii', 'ignore').decode()).split()
STOP = {'edp', 'edt', 'eau', 'de', 'parfum', 'toilette', 'perfume', 'pack', 'duo', 'for', 'man', 'men', 'ml', 'spray', 'the', 'al'}
BAD = {'set', 'collection', 'dive', 'elixir', 'mini', 'travel', 'gift', 'tester', 'sample', 'coffret', 'x25ml', '4x25ml', '4x25', 'deodorant', 'deo', 'body', 'mist', 'lotion', 'shampoo', 'gel', 'oil'}
def checksum_ok(c):  # dígito verificador GTIN-8/12/13/14
    d = [int(x) for x in c]; body, chk = d[:-1], d[-1]
    tot = sum(v * (3 if i % 2 == 0 else 1) for i, v in enumerate(reversed(body)))
    return (10 - tot % 10) % 10 == chk
def search(q):
    url = 'https://world.openbeautyfacts.org/cgi/search.pl?' + urllib.parse.urlencode({'search_terms': q, 'json': 1, 'page_size': 20, 'fields': 'code,product_name,brands,quantity'})
    for _ in range(3):
        try: return json.load(urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'PerfumeriaCenturion/1.0 (infoperfumeriacenturion@gmail.com)'}), timeout=30)).get('products', [])
        except Exception: time.sleep(3)
    return []
rows = []
for p in prods:
    if p['id'].startswith('pack-'):
        rows.append([p['id'], p['name'], p['brand'], p['ml'], '', '', '', 'pack: no tiene código propio, usá el de cada perfume o el del pack si la caja trae uno']); continue
    toks = [t for t in norm(p['name']) if t not in STOP]
    res = search(f"{p['brand']} {p['name']}")
    best = None
    for r in res:
        code = (r.get('code') or '').strip()
        if not re.fullmatch(r'\d{8,14}', code): continue
        name_t = set(norm((r.get('product_name') or '') + ' ' + (r.get('brands') or '')))
        if not any(norm(p['brand'])[0] == b for b in name_t): continue
        if not checksum_ok(code): continue
        if (name_t & BAD) - set(norm(p['name'])): continue  # sets, minis y variantes que no son este producto
        hit = sum(1 for t in toks if t in name_t)
        qty = re.sub(r'\s', '', (r.get('quantity') or '').lower())
        ml_ok = (f"{p['ml']}ml" in qty) or (f"{p['ml']}ml" in re.sub(r'\s', '', (r.get('product_name') or '').lower()))
        score = hit / max(1, len(toks)) + (0.5 if ml_ok else 0)
        if hit == len(toks) and ml_ok and (best is None or score > best[0]): best = (score, code, r.get('product_name'), r.get('quantity'), ml_ok)
    if best: rows.append([p['id'], p['name'], p['brand'], p['ml'], best[1], best[2], best[3] or '', 'coincide nombre y tamaño' if best[4] else 'coincide el nombre; verificar tamaño'])
    else: rows.append([p['id'], p['name'], p['brand'], p['ml'], '', '', '', 'sin dato en la base: leer el código de la caja'])
    time.sleep(0.8)
from collections import Counter
dup = Counter(r[4] for r in rows if r[4])
for r in rows:  # un mismo código para dos productos distintos es un error de la base: se descarta
    if r[4] and dup[r[4]] > 1: r[4] = ''; r[5] = ''; r[6] = ''; r[7] = 'sin dato confiable: la base repite el código en otra variante; leer el código de la caja'
os.makedirs(ROOT + '/codigos', exist_ok=True)
with open(ROOT + '/codigos/Codigos-universales.csv', 'w', newline='', encoding='utf-8-sig') as f:
    w = csv.writer(f); w.writerow(['id', 'Producto', 'Marca', 'ml', 'Código (EAN/GTIN) candidato', 'Nombre en la base', 'Cantidad en la base', 'Observación']); w.writerows(rows)
print(sum(1 for r in rows if r[4]), 'con candidato de', len(rows))
