#!/usr/bin/env python3
"""Haal alle BAG-panden en -verblijfsobjecten op binnen de gedownloade waterdieptetegels.

Gebruik (standaardbibliotheek, Python 3.9+):
    python3 fetch_bag.py <map-met-tifs> <uitvoermap>

Schrijft <uitvoermap>/panden.jsonl  ({"id", "rings"} per regel, RD-coordinaten)
     en <uitvoermap>/vbo.jsonl     ({"id", "pand", "pc", "nr"} per regel).
De dekking wordt per tegel van 5x5 km uit de GeoTIFF-tiepoints gelezen en in
vakken van 1 km opgevraagd bij de PDOK BAG WFS.
"""
import json
import struct
import sys
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

WFS = "https://service.pdok.nl/lv/bag/wfs/v2_0"
PAGE = 1000


def tile_extent(path):
    """(xmin, ymin, xmax, ymax) van een (niet-Big)TIFF met GeoTIFF-tags."""
    with open(path, "rb") as f:
        e = "<" if f.read(2) == b"II" else ">"
        f.read(2)
        f.seek(struct.unpack(e + "I", f.read(4))[0])
        tags = {}
        for _ in range(struct.unpack(e + "H", f.read(2))[0]):
            tag, typ, cnt = struct.unpack(e + "HHI", f.read(8))
            raw = f.read(4)
            if tag in (256, 257):
                tags[tag] = struct.unpack(e + ("H" if typ == 3 else "I"), raw[: 2 if typ == 3 else 4])[0]
            elif tag in (33550, 33922):
                pos = f.tell()
                f.seek(struct.unpack(e + "I", raw)[0])
                tags[tag] = struct.unpack(e + "d" * cnt, f.read(8 * cnt))
                f.seek(pos)
    sx, sy = tags[33550][0], tags[33550][1]
    x0, ytop = tags[33922][3], tags[33922][4]
    return x0, ytop - tags[257] * sy, x0 + tags[256] * sx, ytop


def get(params, tries=5):
    url = WFS + "?" + urllib.parse.urlencode(params)
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "waterwal-hevige-regen/1.0"})
            with urllib.request.urlopen(req, timeout=120) as r:
                return json.load(r)
        except Exception as ex:  # netwerk/5xx: even wachten en opnieuw
            if i == tries - 1:
                raise
            time.sleep(2 + 3 * i)
            print(f"  opnieuw ({ex})", file=sys.stderr)


def fetch_cell(typename, bbox):
    feats, start = [], 0
    while True:
        res = get({"service": "WFS", "version": "2.0.0", "request": "GetFeature", "typeNames": typename,
                   "outputFormat": "application/json", "srsName": "EPSG:28992", "count": PAGE,
                   "startIndex": start, "sortBy": "identificatie",
                   "bbox": ",".join(str(v) for v in bbox) + ",EPSG:28992"})
        page = res.get("features", [])
        feats.extend(page)
        if len(page) < PAGE:
            return feats
        start += PAGE


def main(tif_dir, out_dir):
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    cells = set()
    for p in sorted(Path(tif_dir).glob("*.tif")):
        x0, y0, x1, y1 = tile_extent(p)
        for x in range(int(x0), int(x1), 1000):
            for y in range(int(y0), int(y1), 1000):
                cells.add((x, y, x + 1000, y + 1000))
    cells = sorted(cells)
    print(f"{len(cells)} vakken van 1 km")

    for typename, fname, conv in (
        ("bag:pand", "panden.jsonl", conv_pand),
        ("bag:verblijfsobject", "vbo.jsonl", conv_vbo),
    ):
        seen = set()
        with open(out / fname, "w", encoding="utf-8") as fo, ThreadPoolExecutor(4) as ex:
            for n, feats in enumerate(ex.map(lambda c: fetch_cell(typename, c), cells), 1):
                for ft in feats:
                    rec = conv(ft)
                    if rec and rec["id"] not in seen:  # een object kan in twee vakken vallen
                        seen.add(rec["id"])
                        fo.write(json.dumps(rec, separators=(",", ":")) + "\n")
                if n % 25 == 0:
                    print(f"  {typename}: {n}/{len(cells)} vakken, {len(seen)} objecten")
        print(f"{typename}: {len(seen)} -> {out / fname}")


def conv_pand(ft):
    g = ft.get("geometry") or {}
    if g.get("type") == "Polygon":
        rings = g["coordinates"]
    elif g.get("type") == "MultiPolygon":
        rings = [r for poly in g["coordinates"] for r in poly]
    else:
        return None
    rings = [[[round(x, 2), round(y, 2)] for x, y, *_ in r] for r in rings]
    return {"id": ft["properties"]["identificatie"], "rings": rings}


def conv_vbo(ft):
    p = ft["properties"]
    panden = [s.strip() for s in str(p.get("pandidentificatie") or "").split(",") if s.strip()]
    return {"id": p["identificatie"], "pand": panden, "pc": p.get("postcode"), "nr": p.get("huisnummer")}


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
