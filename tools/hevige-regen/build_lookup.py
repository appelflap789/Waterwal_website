#!/usr/bin/env python3
"""Maak het opzoekbestand voor de site: per adres (BAG-verblijfsobject) een klasse.

Gebruik (standaardbibliotheek):
    python3 build_lookup.py <pand_stats.csv> <vbo.jsonl> <gemeentecode> <uitvoer.json>
    bijv.  ... pand_stats_90mm.csv vbo.jsonl 0344 ../../assets/data/regen/0344.json

Klassen (rondom het pand, ring van 3 m buiten de gevel, bui van 90 mm in 1 uur):
    2 = water blijft staan: >= SHARE van de ring heeft >= 10 cm water
    1 = plassen:            >= SHARE van de ring heeft >=  2 cm water
    0 = loopt weg:          anders (staat niet in het bestand)
Een aandeel (geen vaste m2) omdat grote panden anders altijd ergens langs hun lange gevel
een plas hebben. MIN_M2 voorkomt dat bij kleine panden een paar losse pixels beslissen.
Utrecht, 90 mm/1 uur: ~27% klasse 2, ~27% klasse 1, ~46% klasse 0.
Een adres in meerdere panden krijgt de hoogste klasse.

Uitvoer: {"gemeente", "prefix", "scenario", "bron", "1": [...], "2": [...]}; de lijsten
bevatten het adres-id zonder het gemeenschappelijke voorvoegsel `prefix`.
"""
import csv
import json
import sys
from collections import Counter

SHARE = 0.10
MIN_M2 = 2.0


def klasse(row):
    ring = float(row["ring_m2"])
    for k, col in ((2, "m2_10cm"), (1, "m2_2cm")):
        m2 = float(row[col])
        if m2 >= MIN_M2 and m2 >= SHARE * ring:
            return k
    return 0


def main(stats_csv, vbo_jsonl, gemeente, out):
    pand_k = {r["id"]: klasse(r) for r in csv.DictReader(open(stats_csv, encoding="utf-8"))}
    per_vbo, missing = {}, 0
    for line in open(vbo_jsonl, encoding="utf-8"):
        v = json.loads(line)
        if not v["id"].startswith(gemeente):
            continue
        ks = [pand_k[p] for p in v["pand"] if p in pand_k]
        if not ks:
            missing += 1
            continue
        per_vbo[v["id"]] = max(ks)

    ids = list(per_vbo)
    prefix = ids[0]
    for i in ids:  # langste gemeenschappelijke voorvoegsel
        while not i.startswith(prefix):
            prefix = prefix[:-1]
    data = {
        "gemeente": gemeente,
        "prefix": prefix,
        "scenario": "90 mm in 1 uur",
        "bron": "Klimaateffectatlas, 2026 (CC BY 4.0); BAG (PDOK)",
        "regel": f">= {SHARE:.0%} van een ring van 3 m rond het pand (en >= {MIN_M2:g} m2)",
        "1": sorted(i[len(prefix):] for i, k in per_vbo.items() if k == 1),
        "2": sorted(i[len(prefix):] for i, k in per_vbo.items() if k == 2),
    }
    with open(out, "w", encoding="utf-8") as fo:
        json.dump(data, fo, separators=(",", ":"))
    c = Counter(per_vbo.values())
    n = len(per_vbo)
    print(f"{n} adressen ({missing} zonder pand met data)")
    for k, lab in ((0, "loopt weg"), (1, "plassen"), (2, "water blijft staan")):
        print(f"  klasse {k} {lab:<20} {c[k]:>7}  ({c[k] / n * 100:4.1f}%)")
    print(f"-> {out}")


if __name__ == "__main__":
    if len(sys.argv) != 5:
        sys.exit(__doc__)
    main(*sys.argv[1:])
