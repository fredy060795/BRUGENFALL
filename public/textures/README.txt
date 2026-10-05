MITTELALTER MATERIALPAKET

medieval-atlas.png enthält vier gleich große Felder:
oben links: Kalksteinmauer
oben rechts: alte Eichenbretter
unten links: Wiesenboden
unten rechts: alte Tonziegel

Das Spiel schneidet die Felder beim Laden intern aus und wiederholt sie
pro Oberfläche. Die dunklere Steinvariante wird für den Kerker verwendet.
Die einfache Bump-Wirkung wird aus der Bildhelligkeit abgeleitet. Dies sind
keine vermessenen PBR-Materialien und keine echten Normal-/Roughness-Scans.

Erzeugt mit dem integrierten Bildgenerator, eigens für dieses Projekt.
Der verwendete Prompt liegt als GENERATION_PROMPT.txt bei.

UNREAL-IMPORT (Materialien, kein fertiges Unreal-Spiel):
Die vier Einzelbilder *_BaseColor.png in den Unreal Content Browser ziehen.
Pro Bild ein Material erstellen, Texture Sample RGB an Base Color anschließen.
Roughness als Scalar etwa 0.85–0.95; Metallic = 0.
TextureCoordinate vor UV einsetzen und Kachelung am jeweiligen Mesh einstellen.
Die beigefügten Bilder enthalten keine riggbaren Figuren oder Animation Clips.
Die Figurenanimationen laufen im JavaScript des enthaltenen Browserspiels.

DETAIL-ATLAS (Version 3.0)
Oben links Putz, oben rechts Leder, unten links Leinen, unten rechts Erde.
Die Felder werden durch materials.js im Spiel getrennt und angewendet.
Der Prompt steht in DETAIL_PROMPT.txt.
