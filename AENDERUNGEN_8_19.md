# Burgenfall 8.19 – Bäume/Steine/Erze + Hüte/Helme

## Kritischer Fix: Ressourcen unsichtbar
- Bäume, Felsen und Leichen wurden mit `y = NaN` platziert (Höhe über `bY` ohne Gebäudetyp).
- Dadurch erschienen auf **keiner** Karte Bäume, Steine oder Erze.
- Position wird jetzt korrekt über `heightAt(x,z)` gesetzt.

## Eigenkarten
- `applyMap` platziert Wälder/Felsen zuverlässiger (mehr Versuche, weniger strenge Fluss-Sperre).
- Leere vs. befüllte Eigenkarten werden sauberer erkannt (`isBlankMap`).

## Neue Hüte & Helme
Zivil (Kleiderschrank):
- Chaperon (weicher mittelalterlicher Hut mit Zipfel)
- Federhut / Pfauenhut
- Jägerhut (bereits vorhanden, jetzt in der Auswahl)

Kampf (Rüstkammer):
- Schaller (Sallet) mit Visier und Atemlöchern
- Visierhelm (geschlossener Helm)

## Kleidung
- Ordner `public/textures/kleidung/` mit README für eigene Texturen.
