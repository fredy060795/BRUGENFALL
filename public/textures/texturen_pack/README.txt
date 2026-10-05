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
