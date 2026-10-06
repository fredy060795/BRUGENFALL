# Burgenfall 8.2

## Architektur

- Kirche: Portal an der Längsseite, korrigierte Sitzrichtung, gotische Fenster und Strebepfeiler, offener Glockenstuhl mit schwingender Bronzeglocke. Dachfirst entlang des Kirchenschiffs.
- Kathedrale: Kreuzunterkante am Dachfirst, leuchtende Turmspitzen mit lokalem Nachtlicht.
- Bauernhof: 18 × 16 m reservierte Grundfläche mit Wohnhaus, Scheune, Bett, Tisch, Herd, Vorräten, Kräuterbeeten, kleinem dekorativem Getreidefeld, Strohpuppe und Zaun.
- Torhaus: 8 × 4 m aus zwei 4 × 4-Modulen, Wehrgang auf 4 m, Frontzinnen. Fallgitter und Zugbrücke mit sanfter Bewegung; Graben vor dem Tor bestimmt die Mechanik automatisch. Manuelle Stellung hat Vorrang vor der Angriffsautomatik.
- Gemeinsame Überlappungsregeln für Bauvorschau und Server. Mauern, Zinnenmauern, Türme, Palisaden, Tore und Treppen können ineinandergeschoben werden. 25-cm-Raster statt 2-m-Raster.

## Landschaft und Baumodus

- Überlappende Gräben werden auf einem gemeinsamen Viertelmeter-Raster vereinigt: jede Wasserzelle existiert nur einmal, eine zusammenhängende Gruppe hat einen Wasserstand. Gelände wird nur am Graben abgesenkt.
- Fundamente orientieren sich an mehreren Höhenmessungen der gedrehten Grundfläche. Anpassbare Sockel und eine Zufahrtsrampe statt Planieren der gesamten Umgebung. Laufhöhe und Kollision berücksichtigen den Gebäudesockel.
- Freihandwege per gedrückter linker Maustaste. Boden anvisieren; B beendet das Werkzeug. Letzten Pinselabschnitt im Baumenü entfernen.
- Frei-Bau-Schalter pro Welt: kostenlose Gebäude und kein Hunger. Ressourcenmenü für Baum, Wurzelstock, Fels, Eisen, Kupfer und Reh. Serverseitige Bereichs-, Abstands- und Mengenprüfung.
- Wege, gepflanzte Ressourcen, Frei-Bau-Zustand und Reh-Regeneration werden gespeichert und nach Neustart geladen.

## Gameplay

- Ego-Arme verwenden die vorhandene Gelenk-/Handanimation mit werkzeugspezifischen Schlagphasen. Kameraabhängige Ausrichtung, Armbewegung beim Gehen, sichtbares Reitpferd und dezente Reitbewegung. Keine externen Animationspakete erforderlich.
- Wurzelstöcke mit der Axt abbaubar; Spitzhacke weiterhin möglich.
- 75 % langsamerer Hungerrückgang beim Spielen und Schlafen.
- Rehe: kontrollierte Bestandserholung bis 14 Tiere, maximal eines pro Minute mit sicherem Spawnabstand; Heilung außerhalb der Nähe von Spielern und Jägern.
- Räumliche Trennung lebender Spieler, NPCs, Gegner und Tiere mit Höhenprüfung und räumlichem Suchraster. Lokale Kollision plus Serverkorrektur; auch exakte Überlagerungen werden aufgelöst.

## Bedienung und Kompatibilität

Vollständige Anleitung in `START_HIER.txt`. Bestehenden `saves`-Ordner übernehmen, nachdem der alte Server beendet wurde. Die vergrößerten Torhäuser und Höfe versetzen bestehende Gebäude nicht automatisch: Bei dicht bebauten alten Welten können Nachbargebäude überlappen.

Die neuen Darstellungen basieren auf den vorhandenen prozeduralen Three.js-Modellen. Hofbeete und Hoffeld sind dekorativ. Wege sind ein Gelände-Werkzeug, keine neue KI-Navigation. Höhenversetzte Personen werden nicht gegeneinander verschoben.

## Prüfung

`npm test` führt drei enthaltene Prüfungen aus: isolierte Serverlogik, Client/Geometrie mit simuliertem Renderer sowie echter HTTP/WebSocket-Server mit Speichern und Neustart. Alle sind erfolgreich. Die Browser-/GPU-Darstellung, Animationseindruck und Bedienung auf Windows wurden hier nicht visuell geprüft, da der Testbrowser nicht installierbar war.
