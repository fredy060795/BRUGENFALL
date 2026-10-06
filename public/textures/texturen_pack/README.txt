# Texturen-Pack für Burgenfall

Ordnerstruktur zum eigenen Bearbeiten:

- grundmaterialien/   – Atlanten und BaseColor-Texturen (Stein, Holz, Dach, Gras, Detail-Atlas)
- haeuser/            – ausgeklappte Haus-Rückwände / Fachwerk-Vorlagen (PNG mit Transparenz)
- kirchenfenster/     – gotische Buntglas-Vorlagen (Rautenmuster)
- tierfelle/          – Fell-/Wolle-Vorlagen (Wolf, Hirsch, Schaf, Schwein)
- ruestungen/         – Platten- und Ledervorlagen

Die Vorlagen sind bewusst schlicht und als UV-/Textur-Basis gedacht.
Du kannst sie in GIMP, Photoshop oder Krita bearbeiten und später
als Ersatz in public/textures/ einbinden bzw. in materials.js referenzieren.

Hinweis: Die Spiel-Meshes nutzen aktuell vor allem die Atlanten
(medieval-atlas.png, detail-atlas.png) und die BaseColor-Dateien.
Einzelne Gebäude-Fenster im Spiel sind geometrisch (gotische Formen),
nicht als fertige Fenster-Textur gemappt – die PNGs hier dienen als
Vorlage für eigene Textur-Arbeit.

- hafen/             – Kai-Stein, Holzplanken, Tauwerk
- schiffe/           – Rumpf, Deck, Segel, Metall/Anker

Hafen und Schiffe nutzen im Spiel primär Mesh-Farben; die PNGs hier
dienen als Basis für eigene Texturen (z. B. UV-Mapping später).

## Neu in 8.21: HD-Materialien
Für Gebäude und Kleidung werden jetzt automatisch erzeugte Dateien verwendet:
- *-hd.jpg      nahtlos kachelbare Farbtextur (2048 px Atlas, 4 Kacheln à 1024 px)
- *-normal.jpg  Normal-Karte (Fugen, Ritzen, Holzmaserung als echtes Relief)
- *-rough.jpg   Rauheitskarte (Fugen matt, glatte Flächen glänzen leicht)
Neu erzeugen: python tools/texturen_generieren.py
Eigene Texturen: Atlas-PNG (2x2 Kacheln) ersetzen und das Skript starten.
Verwitterung (Sockel-Schmutz, Moos, großflächige Farbschwankung) entsteht im Shader
(reference-buildings.js -> weather()) und lässt sich pro Material einstellen.
