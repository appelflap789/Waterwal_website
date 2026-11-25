#!/usr/bin/env python3
"""Kaarttegels met de panden ingekleurd volgens de FCAB-klasse (rood = water tegen de gevel).

Gebruik (Pillow):
    python make_fcab_tiles.py <fcab_utrecht.jsonl> <uitvoermap> [--csv fcabregel_90mm.csv]
                              [--zmin 13] [--zmax 16] [--px 512]

Zonder --csv: de officiele FCAB-klasse uit het jsonl (bui 70 mm/1 uur).
Met --csv:    klasse uit kolom p99_cm van pand_stats.py (--buffer 0.5), bijv. voor de 90 mm-bui.
Tegels zijn --px pixels breed (512 = scherp op telefoons en bij inzoomen; Leaflet toont ze als 256).
Kleuren = de .sld van de FCAB-omgevingsscore.
"""
import argparse
import csv
import json
import math
from collections import defaultdict
from pathlib import Path

from PIL import Image, ImageDraw

KLASSE_INDEX = {"Onbekend": 1, "0 tot 2 cm": 2, "2 tot 10 cm": 3, "10 tot 15 cm": 4,
                "15 tot 20 cm": 5, "20 tot 30 cm": 6, "meer dan 30 cm": 7}
KLEUREN = ["#000000", "#b2b2b2", "#ffffff", "#ffbebe", "#ff7f7f", "#ff0000", "#700000", "#280000"]
RAND = 8  # index voor de pandrand
RAND_KLEUR = "#8c8c8c"
GRENZEN = [0.02, 0.10, 0.15, 0.20, 0.30]

# RD -> WGS84 (Schreutelaar), ~0,3 m
K = [(0, 1, 3235.65389), (2, 0, -32.58297), (0, 2, -0.24750), (2, 1, -0.84978), (0, 3, -0.06550),
     (2, 2, -0.01709), (1, 0, -0.00738), (4, 0, 0.00530), (2, 3, -0.00039), (4, 1, 0.00033), (1, 1, -0.00012)]
L = [(1, 0, 5260.52916), (1, 1, 105.94684), (1, 2, 2.45656), (3, 0, -0.81885), (1, 3, 0.05594),
     (3, 1, -0.05607), (0, 1, 0.01199), (3, 2, -0.00256), (1, 4, 0.00128), (0, 2, 0.00022),
     (2, 0, -0.00022), (5, 0, 0.00026)]


def rd_to_wgs(x, y):
    dx, dy = (x - 155000) * 1e-5, (y - 463000) * 1e-5
    lat = 52.15517440 + sum(c * dx ** p * dy ** q for p, q, c in K) / 3600
    lon = 5.38720621 + sum(c * dx ** p * dy ** q for p, q, c in L) / 3600
    return lat, lon


def merc(lat, lon):
    """Wereldcoordinaat 0..1 (x naar oost, y naar zuid)."""
    return (lon + 180) / 360, (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2


def klasse_uit_p99(p99_m):
    k = sum(p99_m >= g for g in GRENZEN)
    return ["0 tot 2 cm", "2 tot 10 cm", "10 tot 15 cm", "15 tot 20 cm", "20 tot 30 cm", "meer dan 30 cm"][k]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("fcab")
    ap.add_argument("out")
    ap.add_argument("--csv")
    ap.add_argument("--zmin", type=int, default=13)
    ap.add_argument("--zmax", type=int, default=16)
    ap.add_argument("--px", type=int, default=512)
    a = ap.parse_args()

    alt = None
    if a.csv:
        alt = {r["id"]: klasse_uit_p99(float(r["p99_cm"]) / 100) for r in csv.DictReader(open(a.csv, encoding="utf-8"))}

    panden = []  # (kleurindex, [ringen in wereldcoordinaten])
    for line in open(a.fcab, encoding="utf-8"):
        r = json.loads(line)
        k = alt.get(r["id"]) if alt is not None else r["klasse"]
        if k is None:
            k = "Onbekend"
        rings = [[merc(*rd_to_wgs(x, y)) for x, y in ring] for ring in r["rings"]]
        panden.append((KLASSE_INDEX.get(k, 1), rings))
    print(f"{len(panden)} panden")

    pal = []
    for hexc in KLEUREN + [RAND_KLEUR]:
        pal += [int(hexc[i:i + 2], 16) for i in (1, 3, 5)]
    pal += [0, 0, 0] * (256 - len(KLEUREN) - 1)

    out = Path(a.out)
    total = 0
    for z in range(a.zmin, a.zmax + 1):
        n = 2 ** z
        per_tegel = defaultdict(list)
        for i, (k, rings) in enumerate(panden):
            xs = [p[0] for p in rings[0]]
            ys = [p[1] for p in rings[0]]
            for tx in range(int(min(xs) * n), int(max(xs) * n) + 1):
                for ty in range(int(min(ys) * n), int(max(ys) * n) + 1):
                    per_tegel[(tx, ty)].append(i)
        s = a.px
        for (tx, ty), idx in per_tegel.items():
            im = Image.new("P", (s, s), 0)
            im.putpalette(pal)
            d = ImageDraw.Draw(im)
            # lichte klassen eerst, rood erbovenop
            for i in sorted(idx, key=lambda j: panden[j][0]):
                k, rings = panden[i]
                outer = [((x * n - tx) * s, (y * n - ty) * s) for x, y in rings[0]]
                if len(outer) < 3:
                    continue
                d.polygon(outer, fill=k, outline=RAND if z >= 15 else None)
                for hole in rings[1:]:
                    hp = [((x * n - tx) * s, (y * n - ty) * s) for x, y in hole]
                    if len(hp) >= 3:
                        d.polygon(hp, fill=0)
            p = out / str(z) / str(tx) / f"{ty}.png"
            p.parent.mkdir(parents=True, exist_ok=True)
            im.save(p, optimize=True, transparency=0)
        total += len(per_tegel)
        print(f"z{z}: {len(per_tegel)} tegels", flush=True)
    (out / "meta.json").write_text(json.dumps({"minzoom": a.zmin, "maxzoom": a.zmax, "px": a.px,
                                               "bron": "csv" if a.csv else "fcab", "tegels": total}))


if __name__ == "__main__":
    main()
