#!/usr/bin/env python3
"""Maak de adresbestanden voor de site: per postcodegebied (4 cijfers) één klein .js-bestand.

Gebruik (standaardbibliotheek):
    python3 build_adressen.py <vbo.jsonl> <fcab_utrecht.jsonl> <fcabregel_70mm.csv> <fcabregel_90mm.csv> <uitvoermap>

Per adres (BAG-verblijfsobject) wordt het pand opgezocht en daarvan:
  - bui 70 mm/1 uur: de officiele FCAB-klasse en waterdiepte_p99 (Klimaateffectatlas). Heeft FCAB
    het pand niet, dan dezelfde rekenregel op de 70 mm-data (p99 in 0,5 m rond de gevel).
  - bui 90 mm/1 uur: FCAB bestaat hiervoor niet; zelfde rekenregel op de 90 mm-data
    (getoetst: bij 70 mm 93% dezelfde klasse als FCAB, zie calibrate_fcab.py).
Een adres in meerdere panden krijgt het pand met de hoogste waarde.

Uitvoer <uitvoermap>/<pc4>.js:
    WATERWAL_ADRES("3551", {"<vbo-id>": "k70,k90,d70,d90,f", ...})
    k = klasse 1..7 (1 onbekend, 2 = 0-2 cm, 3 = 2-10, 4 = 10-15, 5 = 15-20, 6 = 20-30, 7 = >30 cm)
    d = waterdiepte (p99) tegen de gevel in hele cm;  f = 1 als k70 uit FCAB zelf komt, anders 0
Een .js-bestand (geen .json) zodat het ook werkt als index.html direct van schijf wordt geopend.
Alleen adressen waarvan het pand binnen beide datasets valt komen erin.
"""
import csv
import json
import sys
from collections import defaultdict
from pathlib import Path

KLASSE_INDEX = {"Onbekend": 1, "0 tot 2 cm": 2, "2 tot 10 cm": 3, "10 tot 15 cm": 4,
                "15 tot 20 cm": 5, "20 tot 30 cm": 6, "meer dan 30 cm": 7}
GRENZEN = [0.02, 0.10, 0.15, 0.20, 0.30]


def klasse(p99_m):
    return 2 + sum(p99_m >= g for g in GRENZEN)


def main(vbo_path, fcab_path, csv70, csv90, out_dir):
    fcab = {}
    for line in open(fcab_path, encoding="utf-8"):
        r = json.loads(line)
        fcab[r["id"]] = (KLASSE_INDEX.get(r["klasse"], 1), r["p99"])
    p70 = {r["id"]: float(r["p99_cm"]) for r in csv.DictReader(open(csv70, encoding="utf-8"))}
    p90 = {r["id"]: float(r["p99_cm"]) for r in csv.DictReader(open(csv90, encoding="utf-8"))}

    def pand_waarde(pid):
        if pid not in p90 or pid not in p70:
            return None
        if pid in fcab and fcab[pid][1] is not None:
            k70, d70, f = fcab[pid][0], fcab[pid][1] * 100, 1
        elif pid in fcab:  # FCAB 'Onbekend'
            k70, d70, f = 1, p70[pid], 1
        else:
            k70, d70, f = klasse(p70[pid] / 100), p70[pid], 0
        return (k70, klasse(p90[pid] / 100), round(d70), round(p90[pid]), f)

    shards = defaultdict(dict)
    n = skipped = official = 0
    for line in open(vbo_path, encoding="utf-8"):
        v = json.loads(line)
        pc = (v.get("pc") or "")[:4]
        vals = [w for w in (pand_waarde(p) for p in v["pand"]) if w]
        if not pc or not vals:
            skipped += 1
            continue
        best = max(vals, key=lambda w: (w[0], w[1], w[3]))
        shards[pc][v["id"]] = ",".join(map(str, best))
        n += 1
        official += best[4]
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    for pc, recs in shards.items():
        body = json.dumps(recs, separators=(",", ":"), sort_keys=True)
        (out / f"{pc}.js").write_text(f'WATERWAL_ADRES("{pc}",{body});\n', encoding="utf-8")
    (out / "index.json").write_text(json.dumps(sorted(shards)), encoding="utf-8")
    print(f"{n} adressen in {len(shards)} postcodegebieden ({official} met officiele FCAB-klasse), "
          f"{skipped} overgeslagen (buiten de data)")


if __name__ == "__main__":
    if len(sys.argv) != 6:
        sys.exit(__doc__)
    main(*sys.argv[1:])
