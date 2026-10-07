# Zeitreise 8.51 – Alle Verbesserungen je Epoche

## Schiffe je Epoche
| Epoche | Handelsschiff |
| --- | --- |
| Steinzeit | Einbaum mit Stechpaddeln und Fellbündel |
| Hallstatt | großer Einbaum (Salzboot) mit Salzsäcken |
| Römerzeit | Flussgaleere: Ruderreihen (bewegt), rot-weißes Rahsegel, Schildreihe, Rammsporn, Heckzier |
| Frühmittelalter | Langschiff: hohe Steven, Drachenkopf, bunte Schildreihe, gestreiftes Segel |
| Hoch-/Spätmittelalter, Renaissance | Kogge (wie bisher) |
| Barock, Napoleon | Plätte: flacher Lastkahn mit Hütte, langem Heckruder und Fässern |
| Neuzeit | Raddampfer; beim Anlegen ertönt die **Dampfpfeife** |

## Fest-Bilder je Epoche
* Wintersonnenwende/Julfest (Steinzeit, Hallstatt, Frühmittelalter): großes Sonnwendfeuer mit Steinkranz und flackerndem Licht.
* Saturnalien (Römer): Festtafel mit Klinen, Goldtellern, Früchten, Kerzen, Spanferkel und Amphoren.
* Tauschfest/Salzmarkt (Steinzeit, Hallstatt): Fellzelte, Felle, Feuerstein, Tonkrüge bzw. Salzsäcke, Lagerfeuer.
* Volksfest (Neuzeit): Karussell mit Holzpferden, die sich drehen und auf und ab gehen, neben den Buden.
* Im Frei-Bau lassen sich Feste zum Testen sofort auslösen (`evnow` mit `k:'fest'`).

## Banditen und Namen je Epoche
* Angreifer: fremde Jäger mit Steinkeule (Steinzeit), Plünderer (Hallstatt), Germanen mit Speer (Römer), Nordmänner mit Nasalhelm und Axt
  (Frühmittelalter), Marodeure (Renaissance, Barock), Deserteure in zerschlissener Uniform mit Muskete (Napoleon), Räuber (Neuzeit).
* Dorfbewohner tragen Namen ihrer Zeit: Steinzeit (Tala, Arok, Embe …), keltisch (Brennos, Boudica …), lateinisch (Marcus, Iulia …),
  fränkisch (Childerich, Radegund …).

## Feuerwehr, Friedhof, Pferde, Werkzeuge
* **Vigiles** (Römer): Wachstation der Vigiles, Siphon-Pumpe mit Wasserfass, Mannschaft in Tunika.
* Grabstätten der Steinzeit und Hallstattzeit mit **Flechtzaun** statt Holzklötzen.
* **Keine Reitpferde in der Steinzeit**: Reiten ist gesperrt, die Reitertruppe heißt „Häuptlingskrieger“ und kämpft zu Fuß.
* **Werkzeuge je Epoche**: Steinzeit Feuersteinbeil, Geweihhacke, Grabstock, Steinschlägel; Römer Gladius statt Schwert; Napoleon/Neuzeit Säbel.

## Innenräume je Epoche
* Taverne: Feuerhalle mit Feuerstelle, Baumstamm-Tresen und Tonkrügen (Steinzeit, Hallstatt); Thermopolium mit gemauertem Tresen,
  eingelassenen Töpfen und Amphoren (Römer).
* Wohnhaus: Felle und Tontöpfe (Vorzeit), Hausaltar (Lararium) und Amphore (Römer), Eisenofen mit Rohr und Wanduhr (Neuzeit).

## Spieltiefe
* **Epochen-Boni** (stehen im Menü „Epoche wechseln“):
  Steinzeit Jäger +50 %, Hallstatt Bergleute und Steinmetze +30 %, Römer alle Arbeiten +10 % und Lager +25 %, Frühmittelalter Ausbildung 7 s,
  Renaissance Heiler, Priester, Weber +30 %, Barock Zufriedenheit +5, Napoleon Ausbildung 6 s, Neuzeit Produktion +30 %.
* **Hintergrundmusik je Epoche** (prozedural): Flöte und Rahmentrommel (Steinzeit, Hallstatt), Lyra (Römer), Bordun (Frühmittelalter),
  Laute mit Akkorden (Renaissance, Barock), Marschtrommel (Napoleon), Blasmusik-Walzer (Neuzeit). Hoch- und Spätmittelalter behalten die Musik.
* **Chronik der Dynastie** im Stadtbuch (Z): Herrscherwechsel, Zeitsprünge, Epochenwechsel, Feste und Turniersieger mit Tag und Epoche.

## Automatischer Rundumtest
* `npm run test:eras` startet einen Testserver, betritt eine Frei-Bau-Welt und baut in allen 10 Epochen jedes Gebäude
  (Bergfried in allen Stufen), alle Figurenrollen, Spielerfigur, Schiff, alle Marktplatz-Feste und die Feuerwehr: 146 Modelle je Epoche.
  Jeder Fehler wird gemeldet. Ergebnis: alle Epochen fehlerfrei.
