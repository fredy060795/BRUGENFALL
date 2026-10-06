# Burgenfall 8.17 – Karten-Editor, Marktplatz & Galgen

## Karten-Editor
- **Echte leere Karten** möglich: „Editor leeren“ und „Neue Eigenkarte“ erzeugen jetzt eine blanke Karte (kein Fluss, keine Dörfer, keine Wälder/Erze/Felsen).
- `sanitizeMap` respektiert explizit leere Arrays und füllt nicht mehr zwangsweise Defaults auf.
- Eigene Karten behalten beim Speichern und beim Spielstart ihre leeren Bereiche (Wälder, Erze, Steine, Dörfer werden nur gesetzt, wenn man sie im Editor platziert).

## Marktplatz
- Festival-Zelte (rot-weiß) deutlich höher und besser proportioniert.
- Mehr Zuschauer bei Hänge-Events (12 statt 8).
- Opfer am Galgen: Kopf in der Schlinge, gefesselte Arme, realistischere Pose und leichte Schaukel-Animation.
- Galgen-Seil und Schlinge optisch korrigiert (Noose horizontal, bessere Höhe).

## Seuchenkreuz
- Weißes Kreuz sitzt jetzt fest auf der Türfläche von Haus und Großhaus (nicht mehr in der Luft / im Türloch).

## Leichen
- Bleiben bei der weißen Leichentuch-Darstellung (`shroudedBody`).
