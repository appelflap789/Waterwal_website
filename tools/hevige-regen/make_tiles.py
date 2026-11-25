#!/usr/bin/env python3
"""Maak kaarttegels (XYZ, Web Mercator, 256 px PNG) uit de waterdiepte-GeoTIFFs.

Gebruik (numpy + zstandard + Pillow, bijv. conda-env 'main'):
    python make_tiles.py <map-met-tifs> <uitvoermap> [--zmin 13] [--zmax 16]

- Kleuren = de officiele legenda (.sld) van de Klimaateffectatlas; < 2 cm is doorzichtig.
- Zoom zmax: per kaartpixel 2x2 monsters uit de 0,5 m-data, het diepste telt.
  Lagere zooms: 2x2 kaartpixels -> diepste klasse (zo blijven smalle natte straten zichtbaar).
- RD -> WGS84 met de bekende benaderingsformules (Schreutelaar), nauwkeurig op ~1 m.
- Lege tegels worden niet geschreven; Leaflet toont daar niets.
"""
import argparse
import json
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from pand_stats import Tegel, PIX  # noqa: E402

GRENZEN = [0.02, 0.10, 0.15, 0.20, 0.30]  # klasse 1..5
KLEUREN = ["#000000", "#b6edf0", "#74b4e8", "#1f83e0", "#1d44b8", "#002673"]

# WGS84 -> RD (Schreutelaar). dphi/dlam in eenheden van 10000" t.o.v. Amersfoort.
PHI0, LAM0, X0, Y0 = 52.15517440, 5.38720621, 155000.0, 463000.0
R = [(0, 1, 190094.945), (1, 1, -11832.228), (2, 1, -114.221), (0, 3, -32.391), (1, 0, -0.705),
     (3, 1, -2.340), (1, 3, -0.608), (0, 2, -0.008), (2, 3, 0.148)]
S = [(1, 0, 309056.544), (0, 2, 3638.893), (2, 0, 73.077), (1, 2, -157.984), (3, 0, 59.788),
     (0, 1, 0.433), (2, 2, -6.439), (1, 1, -0.032), (0, 4, 0.092), (1, 4, -0.054)]


def wgs_to_rd(lat, lon):
    dp = 0.36 * (lat - PHI0)
    dl = 0.36 * (lon - LAM0)
    x = X0 + sum(c * dp ** p * dl ** q for p, q, c in R)
    y = Y0 + sum(c * dp ** p * dl ** q for p, q, c in S)
    return x, y


def laad_klassen(folder):
    """Per GeoTIFF een uint8-array met klasse 0..5 (0 = < 2 cm of geen waarde)."""
    bronnen = []
    for p in sorted(Path(folder).glob("*.tif")):
        t = Tegel(p)
        k = np.zeros((t.h, t.w), dtype=np.uint8)
        for bj in range(math.ceil(t.h / t.th)):
            for bi in range(t.across):
                v = t.block(bi, bj)
                r0, c0 = bj * t.th, bi * t.tw
                hh, ww = min(t.th, t.h - r0), min(t.tw, t.w - c0)
                k[r0:r0 + hh, c0:c0 + ww] = np.digitize(v[:hh, :ww], GRENZEN).astype(np.uint8)
        bronnen.append((t.x0, t.ytop, t.w, t.h, k))
        print(f"  {p.name}: {(k > 0).mean() * 100:.1f}% nat", flush=True)
    return bronnen


def bemonster(bronnen, x, y):
    out = np.zeros(x.shape, dtype=np.uint8)
    for x0, ytop, w, h, k in bronnen:
        c = np.floor((x - x0) / PIX).astype(np.int64)
        r = np.floor((ytop - y) / PIX).astype(np.int64)
        m = (c >= 0) & (c < w) & (r >= 0) & (r < h)
        if m.any():
            out[m] = k[r[m], c[m]]
    return out


def tegel_lat_lon(z, tx, ty, n):
    """Middelpunten van een n x n raster binnen tegel (z, tx, ty), als lat/lon-arrays."""
    f = (np.arange(n) + 0.5) / n
    lon = (tx + f) / 2 ** z * 360.0 - 180.0
    merc = math.pi * (1 - 2 * (ty + f) / 2 ** z)
    lat = np.degrees(np.arctan(np.sinh(merc)))
    return np.meshgrid(lat, lon, indexing="ij")


def lonlat_naar_tegel(lon, lat, z):
    x = (lon + 180.0) / 360.0 * 2 ** z
    y = (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * 2 ** z
    return int(x), int(y)


def schrijf(arr, path, pal):
    path.parent.mkdir(parents=True, exist_ok=True)
    im = Image.fromarray(arr, mode="P")
    im.putpalette(pal)
    im.save(path, optimize=True, transparency=0)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("tifs")
    ap.add_argument("out")
    ap.add_argument("--zmin", type=int, default=13)
    ap.add_argument("--zmax", type=int, default=16)
    a = ap.parse_args()
    out = Path(a.out)

    print("GeoTIFFs inlezen...")
    bronnen = laad_klassen(a.tifs)
    pal = []
    for hexc in KLEUREN:
        pal += [int(hexc[i:i + 2], 16) for i in (1, 3, 5)]
    pal += [0, 0, 0] * (256 - len(KLEUREN))

    # dekking in lat/lon: ruim, lege tegels vallen vanzelf af
    xs = [b[0] for b in bronnen] + [b[0] + b[2] * PIX for b in bronnen]
    ys = [b[1] for b in bronnen] + [b[1] - b[3] * PIX for b in bronnen]
    rd_box = (min(xs), min(ys), max(xs), max(ys))
    # RD-box naar lat/lon door een ruim lat/lon-raster te toetsen
    lat_g, lon_g = np.meshgrid(np.linspace(50.7, 53.6, 600), np.linspace(3.3, 7.3, 600), indexing="ij")
    gx, gy = wgs_to_rd(lat_g, lon_g)
    inb = (gx >= rd_box[0]) & (gx <= rd_box[2]) & (gy >= rd_box[1]) & (gy <= rd_box[3])
    south, north = lat_g[inb].min() - 0.01, lat_g[inb].max() + 0.01
    west, east = lon_g[inb].min() - 0.01, lon_g[inb].max() + 0.01

    z = a.zmax
    x0, y0 = lonlat_naar_tegel(west, north, z)
    x1, y1 = lonlat_naar_tegel(east, south, z)
    niveau, geschreven = {}, 0
    for tx in range(x0, x1 + 1):
        for ty in range(y0, y1 + 1):
            lat, lon = tegel_lat_lon(z, tx, ty, 512)
            x, y = wgs_to_rd(lat, lon)
            k = bemonster(bronnen, x, y).reshape(256, 2, 256, 2).max(axis=(1, 3))
            if k.any():
                niveau[(tx, ty)] = k
        print(f"  z{z}: kolom {tx - x0 + 1}/{x1 - x0 + 1}, {len(niveau)} tegels met water", flush=True)
    for (tx, ty), k in niveau.items():
        schrijf(k, out / str(z) / str(tx) / f"{ty}.png", pal)
        geschreven += 1
    print(f"z{z}: {len(niveau)} tegels")

    while z > a.zmin:
        z -= 1
        ouders = {}
        for (tx, ty), k in niveau.items():
            px, py = tx // 2, ty // 2
            big = ouders.setdefault((px, py), np.zeros((512, 512), dtype=np.uint8))
            ox, oy = (tx % 2) * 256, (ty % 2) * 256
            big[oy:oy + 256, ox:ox + 256] = k
        niveau = {key: big.reshape(256, 2, 256, 2).max(axis=(1, 3)) for key, big in ouders.items()}
        for (tx, ty), k in niveau.items():
            schrijf(k, out / str(z) / str(tx) / f"{ty}.png", pal)
            geschreven += 1
        print(f"z{z}: {len(niveau)} tegels")

    meta = {"bounds": [[round(south, 5), round(west, 5)], [round(north, 5), round(east, 5)]],
            "minzoom": a.zmin, "maxzoom": a.zmax, "tegels": geschreven}
    (out / "meta.json").write_text(json.dumps(meta))
    print("klaar:", meta)


if __name__ == "__main__":
    main()
