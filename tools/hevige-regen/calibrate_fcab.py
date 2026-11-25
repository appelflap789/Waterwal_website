#!/usr/bin/env python3
"""Zoek de FCAB-rekenregel terug: welke zone rond een pand geeft dezelfde waterdiepte_p99?

Gebruik:  python calibrate_fcab.py <map-met-70mm-tifs> <fcab_utrecht.jsonl> [--n 3000]
Toetst ringen van verschillende breedte (met/zonder het pand zelf) op een steekproef en
vergelijkt het 99e percentiel met FCAB's waterdiepte_p99 (zelfde 70 mm-data).
"""
import argparse
import json
import math
import random
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from pand_stats import Mozaiek, PIX  # noqa: E402

KLASSEN = [0.02, 0.10, 0.15, 0.20, 0.30]


def masks(rings, bmax):
    pts = np.concatenate([np.asarray(r, dtype=np.float64) for r in rings])
    gc0 = math.floor((pts[:, 0].min() - bmax) / PIX)
    gc1 = math.ceil((pts[:, 0].max() + bmax) / PIX)
    gy0 = math.floor((pts[:, 1].min() - bmax) / PIX)
    gy1 = math.ceil((pts[:, 1].max() + bmax) / PIX)
    xs = (np.arange(gc0, gc1) + 0.5) * PIX
    ys = (np.arange(gy1 - 1, gy0 - 1, -1) + 0.5) * PIX
    X, Y = np.meshgrid(xs, ys)
    inside = np.zeros(X.shape, bool)
    d2 = np.full(X.shape, np.inf)
    for r in rings:
        a = np.asarray(r, dtype=np.float64)
        for (x1, y1), (x2, y2) in zip(a, np.roll(a, -1, axis=0)):
            cross = (y1 > Y) != (y2 > Y)
            if cross.any():
                with np.errstate(divide="ignore", invalid="ignore"):
                    inside ^= cross & (X < (x2 - x1) * (Y - y1) / (y2 - y1) + x1)
            dx, dy = x2 - x1, y2 - y1
            ll = dx * dx + dy * dy
            t = np.zeros_like(X) if ll == 0 else np.clip(((X - x1) * dx + (Y - y1) * dy) / ll, 0, 1)
            d2 = np.minimum(d2, (X - x1 - t * dx) ** 2 + (Y - y1 - t * dy) ** 2)
    return (gc0, gc1, gy0, gy1), inside, np.sqrt(d2)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("tifs")
    ap.add_argument("fcab")
    ap.add_argument("--n", type=int, default=3000)
    ap.add_argument("--buffers", type=float, nargs="+", default=[0.5, 1.0, 1.5, 2.0, 3.0, 5.0])
    a = ap.parse_args()
    moz = Mozaiek(a.tifs)
    recs = [json.loads(l) for l in open(a.fcab, encoding="utf-8")]
    recs = [r for r in recs if r["p99"] is not None and r["klasse"] != "Onbekend"]
    random.seed(1)
    sample = random.sample(recs, min(a.n, len(recs)))
    configs = [(b, inc) for b in a.buffers for inc in (False,)]
    err = {c: [] for c in configs}
    agree = {c: 0 for c in configs}
    used = 0
    for r in sample:
        box, inside, dist = masks(r["rings"], 5.0)
        v = moz.venster(*box)
        if np.isnan(v).any():
            continue
        used += 1
        for b, inc in configs:
            m = (dist <= b) & ~inside
            if inc:
                m |= inside
            if not m.any():
                continue
            p = float(np.percentile(v[m], 99))
            err[(b, inc)].append(abs(p - r["p99"]))
            agree[(b, inc)] += int(np.digitize(p, KLASSEN) == np.digitize(r["p99"], KLASSEN))
    print(f"{used} panden getoetst")
    for c in configs:
        e = np.array(err[c])
        print(f"ring {c[0]:>3} m {'+pand' if c[1] else '     '}: mediane fout {np.median(e) * 100:5.2f} cm,"
              f" gem {e.mean() * 100:5.2f} cm, zelfde klasse {agree[c] / used * 100:5.1f}%")


if __name__ == "__main__":
    main()
