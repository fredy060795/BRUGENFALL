# Burgenfall 8.5

## Krankheit
Kranke Einwohner gehen nach Hause, unterbrechen Arbeit, Transport und Besuche
und behalten ihren Arbeitsplatz. Eine besetzte, aktive Apotheke heilt sie zuhause
nach acht Sekunden Behandlung. Ohne Heilung sterben sie nach 600 Sekunden
laufender Simulation. Offline-Zeit und übersprungene Nachtstunden zählen nicht
als echte Minuten. Der Krankheitszähler wird mit dem Einwohner gespeichert;
Neuladen setzt ihn nicht zurück. Nach Heilung beginnt die bisherige Arbeit wieder.
Kranke werden nicht automatisch oder manuell anderen Arbeitsplätzen zugeteilt.

## Einwohnerverbrauch und Schweinehaltung
Pro Spieltag wird eine Nahrungseinheit pro lebendem Einwohner aus dem gemeinsamen
Lager verbraucht, einschließlich kranker Bewohner und Soldaten. Im Winter wird
zusätzlich ein Holz pro zwei Einwohner verbraucht, aufgerundet. Die Tagesabrechnung
erfolgt auch beim Überspringen der Nacht. Fehlende Nahrung und fehlendes Heizholz
werden gemeldet und senken die Zufriedenheit. Im Frei-Bau pausiert dieser Verbrauch.

Schweineställe liefern acht Fleisch je Spieljahr, am Jahreswechsel nach vier
Jahreszeiten. Der Stall muss eingeschaltet sein und einen gesunden zugewiesenen
Arbeiter haben. Keine Fleischproduktion alle 40 Sekunden mehr. Der letzte
Schlachttermin wird gespeichert, um doppelte Ausschüttungen zu verhindern.
Ein Spieljahr dauert standardmäßig 16 Spieltage, entsprechend der Einstellung
für die Länge der Jahreszeiten.

## Arbeitsplätze und Zuweisung
Werkstätten erhalten Arbeitspositionen im Inneren an der jeweiligen Einrichtung,
auch bei gedrehten Gebäuden. Der Schmied arbeitet am Amboss. Beim Betreten und
Verlassen werden Eingangspunkte verwendet. Fundamenthöhe wird berücksichtigt.

E am Produktionsgebäude:
- Zuweisung automatisch/manuell umschalten.
- Einen freien gesunden Arbeiter für dieses Gebäude zuweisen.
- Einen bestimmten Einwohner aus der Liste wählen, auch zum Umsetzen aus
  einer anderen Werkstatt.
- Zugewiesene Arbeiter freistellen. Sie werden danach nicht sofort von der
  Automatik wieder eingezogen und können erneut manuell zugewiesen werden.

Manuelle Zuweisung schaltet das Zielgebäude auf manuell. Bereits entnommene
Produktionsmaterialien bzw. fertige Lieferungen werden bei einer Versetzung
ins Lager zurückgegeben. Zuweisungen und Betriebsmodus bleiben im Spielstand.

## Friedhof und Updates
Der Friedhof hat Naturboden, keine Steinplatte und kein flächiges Fundament.
Auch optionale alte Friedhof-Modelle werden nicht mehr verwendet. Zäune und
Gräber folgen dem Gelände. Browserdateien werden beim Laden auf Aktualität
geprüft, um veraltete Gebäudedarstellungen nach Updates zu vermeiden.

## Prüfung
Server-, Client- und echte HTTP-/WebSocket-Tests bestanden. Gezielt geprüft:
Heilung zuhause, kein Arbeiten während Krankheit, Tod nach 600 Sekunden,
Arbeitsposition einer gedrehten Schmiede, Jahresertrag ohne Doppelausschüttung,
Nahrung/Heizholz, manuelle Zuweisung/Freistellung, Friedhof ohne Bodenplatte
sowie Speichern und Wiederherstellen des Arbeitsgebäudes und des manuellen Modus.
Keine visuelle Browser-/GPU-Abnahme. Die Modellübersicht 8.4 bleibt als
Grafikreferenz enthalten; die Änderungen von 8.5 betreffen überwiegend Spiellogik.
