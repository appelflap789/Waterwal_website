#!/usr/bin/env python3
"""Waterdiepte rondom elk BAG-pand uit de Klimaateffectatlas-tegels (0,5 m GeoTIFF).

Gebruik (numpy + zstandard nodig, bijv. conda-env 'main'):
    python pand_stats.py <map-met-tifs> <panden.jsonl> <uitvoer.csv> [--buffer 3]

Per pand: alle pixels tot --buffer meter buiten de gevel (de 'ring'). Uitvoer per pand:
oppervlak van de ring, m2 met >= 2 / 10 / 20 cm water, 95e percentiel en maximum
(pixels zonder waarde tellen als 0 cm: droog, bebouwd of open water).
Met --buffer 0.5 is p99_cm de FCAB-omgevingsscore: getoetst op 2561 Utrechtse panden gaf dat bij
de 70 mm-bui in 93% dezelfde klasse als FCAB zelf (tools/hevige-regen/calibrate_fcab.py).
"""
import argparse
import csv
import json
import math
import struct
from collections import OrderedDict
from pathlib import Path

import numpy as np
import zstandard

PIX = 0.5
NODATA = -9999.0


class Tegel:
    def __init__(self, path):
        self.f = open(path, "rb")
        f = self.f
        e = "<" if f.read(2) == b"II" else ">"
        assert struct.unpack(e + "H", f.read(2))[0] == 42, "BigTIFF niet ondersteund"
        f.seek(struct.unpack(e + "I", f.read(4))[0])
        fmt = {3: "H", 4: "I", 12: "d"}
        size = {3: 2, 4: 4, 12: 8}
        tags = {}
        for _ in range(struct.unpack(e + "H", f.read(2))[0]):
            tag, typ, cnt = struct.unpack(e + "HHI", f.read(8))
            raw = f.read(4)
            if typ not in fmt:
                continue
            n = size[typ] * cnt
            if n > 4:
                pos = f.tell()
                f.seek(struct.unpack(e + "I", raw)[0])
                raw = f.read(n)
                f.seek(pos)
            tags[tag] = struct.unpack(e + fmt[typ] * cnt, raw[:n])
        self.w, self.h = tags[256][0], tags[257][0]
        self.tw, self.th = tags[322][0], tags[323][0]
        self.off, self.cnt = tags[324], tags[325]
        self.pred = tags.get(317, (1,))[0]
        assert tags[259][0] == 50000 and tags[33550][:2] == (PIX, PIX)
        self.x0, self.ytop = tags[33922][3], tags[33922][4]
        self.c0 = round(self.x0 / PIX)               # globale kolom van de linkerrand
        self.r0 = round(self.ytop / PIX)             # globale 'rij' (y/PIX) van de bovenrand
        self.across = math.ceil(self.w / self.tw)
        self.dtype = np.dtype(e + "u4")
        self.zd = zstandard.ZstdDecompressor()

    def block(self, bi, bj):
        k = bj * self.across + bi
        self.f.seek(self.off[k])
        raw = self.zd.decompress(self.f.read(self.cnt[k]), max_output_size=self.tw * self.th * 4)
        a = np.frombuffer(raw, dtype=self.dtype).astype(np.uint32).reshape(self.th, self.tw)
        if self.pred == 2:
            a = np.cumsum(a, axis=1, dtype=np.uint32)  # wrap-around = horizontale differentie
        v = a.view(np.float32).copy()
        v[(v == NODATA) | ~np.isfinite(v)] = 0.0
        return v


class Mozaiek:
    """Leest willekeurige vensters (globale pixelcoordinaten) over meerdere tegels."""

    def __init__(self, folder, cache_blocks=400):
        self.tegels = [Tegel(p) for p in sorted(Path(folder).glob("*.tif"))]
        self.cache = OrderedDict()
        self.max = cache_blocks

    def _block(self, t, bi, bj):
        key = (id(t), bi, bj)
        if key in self.cache:
            self.cache.move_to_end(key)
            return self.cache[key]
        b = t.block(bi, bj)
        self.cache[key] = b
        if len(self.cache) > self.max:
            self.cache.popitem(last=False)
        return b

    def venster(self, gc0, gc1, gy0, gy1):
        """Waarden voor kolommen gc0..gc1-1 en y-rijen gy0..gy1-1 (gy = floor(y/PIX)).
        Rij 0 van het resultaat is de noordelijkste (gy1-1). Buiten de tegels: NaN."""
        out = np.full((gy1 - gy0, gc1 - gc0), np.nan, dtype=np.float32)
        for t in self.tegels:
            # lokale kolom = gc - t.c0 ; lokale rij = (t.r0 - 1) - gy
            lc0, lc1 = max(gc0 - t.c0, 0), min(gc1 - t.c0, t.w)
            lr0, lr1 = max(t.r0 - gy1, 0), min(t.r0 - gy0, t.h)
            if lc0 >= lc1 or lr0 >= lr1:
                continue
            for bj in range(lr0 // t.th, (lr1 - 1) // t.th + 1):
                for bi in range(lc0 // t.tw, (lc1 - 1) // t.tw + 1):
                    b = self._block(t, bi, bj)
                    rr0, rr1 = max(lr0, bj * t.th), min(lr1, (bj + 1) * t.th)
                    cc0, cc1 = max(lc0, bi * t.tw), min(lc1, (bi + 1) * t.tw)
                    # uitvoerindex: rij = (gy1-1) - gy, gy = t.r0-1-lr  -> rij = lr - (t.r0 - gy1)
                    out[rr0 - (t.r0 - gy1):rr1 - (t.r0 - gy1), cc0 + t.c0 - gc0:cc1 + t.c0 - gc0] = \
                        b[rr0 - bj * t.th:rr1 - bj * t.th, cc0 - bi * t.tw:cc1 - bi * t.tw]
        return out


def stats(moz, rings, buf):
    pts = np.concatenate([np.asarray(r, dtype=np.float64) for r in rings])
    gc0 = math.floor((pts[:, 0].min() - buf) / PIX)
    gc1 = math.ceil((pts[:, 0].max() + buf) / PIX)
    gy0 = math.floor((pts[:, 1].min() - buf) / PIX)
    gy1 = math.ceil((pts[:, 1].max() + buf) / PIX)
    v = moz.venster(gc0, gc1, gy0, gy1)
    xs = (np.arange(gc0, gc1) + 0.5) * PIX
    ys = (np.arange(gy1 - 1, gy0 - 1, -1) + 0.5) * PIX
    X, Y = np.meshgrid(xs, ys)
    inside = np.zeros(X.shape, dtype=bool)
    d2 = np.full(X.shape, np.inf)
    for r in rings:
        a = np.asarray(r, dtype=np.float64)
        b = np.roll(a, -1, axis=0)
        for (x1, y1), (x2, y2) in zip(a, b):
            cross = ((y1 > Y) != (y2 > Y))
            if cross.any():
                with np.errstate(divide="ignore", invalid="ignore"):
                    xi = (x2 - x1) * (Y - y1) / (y2 - y1) + x1
                inside ^= cross & (X < xi)
            dx, dy = x2 - x1, y2 - y1
            ll = dx * dx + dy * dy
            t = np.zeros_like(X) if ll == 0 else np.clip(((X - x1) * dx + (Y - y1) * dy) / ll, 0, 1)
            d2 = np.minimum(d2, (X - x1 - t * dx) ** 2 + (Y - y1 - t * dy) ** 2)
    ring = (~inside) & (d2 <= buf * buf)
    vals = v[ring]
    if np.isnan(vals).any():
        return None  # pand ligt (deels) buiten de tegels
    n = vals.size
    if n == 0:
        return None
    m2 = PIX * PIX
    return {
        "ring_m2": n * m2,
        "m2_2cm": int((vals >= 0.02).sum()) * m2,
        "m2_10cm": int((vals >= 0.10).sum()) * m2,
        "m2_20cm": int((vals >= 0.20).sum()) * m2,
        "p95_cm": round(float(np.percentile(vals, 95)) * 100, 1),
        "p99_cm": round(float(np.percentile(vals, 99)) * 100, 1),  # FCAB-maat (met --buffer 0.5)
        "max_cm": round(float(vals.max()) * 100, 1),
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("tifs")
    ap.add_argument("panden")
    ap.add_argument("out")
    ap.add_argument("--buffer", type=float, default=3.0)
    a = ap.parse_args()
    moz = Mozaiek(a.tifs)
    panden = [json.loads(l) for l in open(a.panden, encoding="utf-8")]
    # sorteer op 512-blok zodat de blokcache goed werkt
    def key(p):
        x, y = p["rings"][0][0]
        return (int(y // 256), int(x // 256))
    panden.sort(key=key)
    cols = ["id", "ring_m2", "m2_2cm", "m2_10cm", "m2_20cm", "p95_cm", "p99_cm", "max_cm"]
    skipped = 0
    with open(a.out, "w", newline="", encoding="utf-8") as fo:
        w = csv.writer(fo)
        w.writerow(cols)
        for i, p in enumerate(panden, 1):
            s = stats(moz, p["rings"], a.buffer)
            if s is None:
                skipped += 1
            else:
                w.writerow([p["id"]] + [s[c] for c in cols[1:]])
            if i % 10000 == 0:
                print(f"{i}/{len(panden)} panden", flush=True)
    print(f"klaar: {len(panden) - skipped} panden, {skipped} overgeslagen (buiten tegels)")


if __name__ == "__main__":
    main()
