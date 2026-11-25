#!/usr/bin/env python3
"""Knip de landelijke FCAB-omgevingsscore (GeoPackage) uit op een RD-gebied.

Gebruik (standaardbibliotheek):
    python3 extract_fcab.py <fcab.gpkg> <uitvoer.jsonl> <xmin> <ymin> <xmax> <ymax>

Per pand een regel: {"id", "p99", "klasse", "rings"} (RD-coordinaten, 2 decimalen).
Bron: Klimaateffectatlas, "FCAB omgevingsscore wateroverlast" (bui 70 mm in 1 uur), CC BY 4.0.
"""
import json
import sqlite3
import struct
import sys

ENV_LEN = {0: 0, 1: 32, 2: 48, 3: 48, 4: 64}


def wkb_rings(b, o=0):
    """Ringen van een WKB Polygon / MultiPolygon (2D; Z/M wordt overgeslagen)."""
    e = "<" if b[o] == 1 else ">"
    typ = struct.unpack_from(e + "I", b, o + 1)[0]
    o += 5
    base, dims = typ % 1000, 2 + (1 if typ // 1000 in (1, 2) else 0) + (1 if typ // 1000 == 3 else 0)
    if typ // 1000 == 3:
        dims = 4
    rings = []
    if base == 3:
        (nr,) = struct.unpack_from(e + "I", b, o)
        o += 4
        for _ in range(nr):
            (n,) = struct.unpack_from(e + "I", b, o)
            o += 4
            pts = struct.unpack_from(e + "d" * (n * dims), b, o)
            o += 8 * n * dims
            rings.append([[round(pts[i], 2), round(pts[i + 1], 2)] for i in range(0, len(pts), dims)])
        return rings, o
    if base == 6:
        (np_,) = struct.unpack_from(e + "I", b, o)
        o += 4
        for _ in range(np_):
            r, o = wkb_rings(b, o)
            rings.extend(r)
        return rings, o
    raise ValueError(f"geometrietype {typ}")


def gpkg_rings(blob):
    flags = blob[3]
    env = ENV_LEN[(flags >> 1) & 7]
    return wkb_rings(blob, 8 + env)[0]


def main(gpkg, out, xmin, ymin, xmax, ymax):
    c = sqlite3.connect(f"file:{gpkg}?mode=ro", uri=True)
    t = c.execute("select table_name from gpkg_contents where data_type='features'").fetchone()[0]
    rtree = f"rtree_{t}_geom"
    has_rtree = c.execute("select count(*) from sqlite_master where name=?", (rtree,)).fetchone()[0]
    if has_rtree:
        q = (f'select f.identificatie_bag, f.waterdiepte_p99, f.waterdiepte_klasse, f.geom from "{t}" f '
             f'join "{rtree}" r on r.id = f.fid where r.maxx >= ? and r.minx <= ? and r.maxy >= ? and r.miny <= ?')
        rows = c.execute(q, (xmin, xmax, ymin, ymax))
    else:
        rows = c.execute(f'select identificatie_bag, waterdiepte_p99, waterdiepte_klasse, geom from "{t}"')
    n = 0
    with open(out, "w", encoding="utf-8") as fo:
        for ident, p99, klasse, geom in rows:
            if geom is None:
                continue
            rings = gpkg_rings(geom)
            xs = [p[0] for p in rings[0]]
            ys = [p[1] for p in rings[0]]
            if max(xs) < xmin or min(xs) > xmax or max(ys) < ymin or min(ys) > ymax:
                continue
            fo.write(json.dumps({"id": ident, "p99": None if p99 is None else round(p99, 3),
                                 "klasse": klasse, "rings": rings}, separators=(",", ":")) + "\n")
            n += 1
    print(f"{n} panden -> {out} (rtree: {'ja' if has_rtree else 'nee'})")


if __name__ == "__main__":
    if len(sys.argv) != 7:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2], *map(float, sys.argv[3:]))
