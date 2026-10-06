# Burgenfall 8.3

## Grafik nach den Gebäudevorlagen
23 Gebäudetypen erhalten überarbeitete 3D-Modelle: Wohnhäuser, Apotheke,
Bäckerei, Holzfäller, Jagdhütte, Steinbruch mit Kran, Bogenbauer,
Rüstungsmacher, Waffenkammer, Nahrungslager, Markt, Lager, Bergfried,
Garnison, Torhäuser, Steinturm, Kapelle, Kirche, Kathedrale, Kuhstall und Schmiede.
Holz- und Steinausbaustufen unterscheiden sich sichtbar. Die Gestaltung
orientiert sich an den bereitgestellten Mittelalter-/Stronghold-Vorlagen;
es sind eigenständige Modelle, keine exakt übernommenen Spielassets.
Die Schmiede-HTML enthielt keine brauchbare Einzelvorlage und wurde passend
zu den übrigen Werkstätten gestaltet.

Acht neue Materialien: Kalkstein, Eichenholz, Putz, Stroh, rote Dachziegel,
Schiefer, Holzschindeln und Dielen. Zwei generierte Texturatlanten mit jeweils
1254 × 1254 Pixeln, je vier Materialfelder mit 627 × 627 Pixeln.
Die Materialien nutzen wiederholte Texturkoordinaten und dezente Bump-Details.
Geometrie wird nach Material zusammengefasst, um Zeichenaufrufe zu reduzieren.

## Bedienung und Spielstände
Bogenbauer, Rüstungsmacher, Waffenkammer und Nahrungslager stehen im Baumenü.
Bogenbauer und Rüstungsmacher produzieren die bestehende Sammelressource
Waffen; es wurden keine zusätzlichen Rüstungs-Inventarkategorien eingeführt.
Torhäuser und Garnison lassen sich über E zum Steinbau ausbauen.
Kosten: 45 Stein, 15 Holz; im Frei-Bau kostenlos. Bestehende Tore/Garnisonen
älterer Spielstände behalten beim Laden ihre bisherige Steinausführung.
Neue Ausbaustufen werden gespeichert und über das Netzwerk synchronisiert.

## Letzte Korrekturen
Die Ego-Kamera verwendet die Augenhöhe des Charaktermodells (rund 1,68 m).
Der Armaufbau ist ebenfalls um die Augenhöhe versetzt, statt wie zuvor nur
um 1,25 m. Eine angepasste Ruhehaltung hält die Hände im unteren Sichtfeld.
Auf dem Pferd kommt die Sitzhöhe hinzu. Werkzeugwechsel blendet den eigenen
Körper zuverlässig aus; der Bogenpfeil bleibt an seinen Animationszustand gebunden.

Automatisch erzeugte Wege/Zufahrtsrampen vor Gebäuden wurden entfernt,
einschließlich ihrer unsichtbaren Laufflächen. Fundamente und selbst
gezeichnete Wege bleiben erhalten. An steilen Hängen kann der Eingang
entsprechend höher liegen; den Bauplatz darauf prüfen.

## Prüfung
Alle drei automatisierten Regressionstests bestanden: Server, echte
Three.js-Geometrie/Clientlogik und HTTP/WebSocket mit Speichern/Neustart/Laden.
Kamerahöhe, Armversatz, entfernte Rampen und gespeicherte Tor-Ausbaustufen
werden gezielt geprüft. Kein Browser-/GPU-Test und keine Bildratenmessung.
MODELLVORSCHAU_8_3.png ist eine Software-Rasterung der Modellgeometrien mit
Texturen, kein Screenshot des laufenden Spiels. Ältere PNGs sind unverändert.
