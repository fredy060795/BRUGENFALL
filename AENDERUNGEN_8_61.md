# Zeitreise 8.61 – Eisenbahn, Bürgerkleidung, österreichische Feste, Zille, Tests

## Kleidung und Namen
* Spielerfigur ohne Rüstung trägt ab dem Barock automatisch Rock bzw. Anzug oder Kleid der Epoche (in der gewählten Farbe).
* Barock-Bürger: knielanger Rock mit langer Weste, Jabot, Dreispitz, gepuderte Perücke; Frauen im Kleid mit Brusttuch.
* Anzugstoff glatt (keine Kittelfalten), Neuzeit-Bürger in Sakko, Weste, Krawatte, Melone/Zylinder.
* Österreichische Vornamen je Epoche (Hochmittelalter bis Neuzeit: Leopold, Ottokar, Kathrein, Florian, Resi, Sepp, Mizzi …).

## Neuzeit
* **Bahnhof** (neues Gebäude „Handel & Verkehr“, nur Neuzeit): Empfangsgebäude mit Uhrgiebel, Bahnsteig mit Glasdach,
  Gleis bis zum Kartenrand (folgt dem Gelände). **Dampfzüge** bringen Handelsgäste wie Karawanen und Schiffe (70 s Aufenthalt).
* Gründerzeit-Wohnhäuser: genutetes Erdgeschoss, Gurtgesims, Balkon mit Eisengeländer und Konsolen.
* Gaslaternen entlang der Wege (leuchten nachts), ein Fiaker fährt die Wege ab; Litfaßsäule am Marktplatz.

## Feste
* Christkindlmarkt im Winter (ab Hochmittelalter): Holzstandl mit Lichterketten und Lebkuchenherzen am Christbaum.
* Perchtenlauf zur Wintersonnenwende (Hallstatt, Frühmittelalter): Perchten in Fellen mit Holzmasken, Hörnern und Glocken.
* Kirtag statt Jahrmarkt; österreichischer Maibaum mit grünem Wipfel, zwei Kränzen und Zunftzeichen.

## Schiffe, Licht, Fehlerbehebungen
* Eigene **Zille**: lang und flach, hochgezogener Bug (Gransl), Stehruder, Rahsegel, Salzkufen.
* Nacht: schwächeres, bläuliches Mondlicht (vorher leuchtete die Wiese nachts hell); Abend und Morgen geprüft.
* Kirche/Kapelle: Kreuz, Giebel und Dachreiter folgen der Dachhöhe jeder Epoche (kein schwebendes Kreuz), Giebelflächen mit Steinstruktur.
* Säbel: Klinge, Parierstange, Griff, Knauf und Bügel verbunden.
* Karawanen: Nur echtes Wasser zählt als Flussquerung – Wege am Ufer entlang werden nicht mehr fälschlich blockiert.
* Alte Spielstände: Hinweis beim Betreten, wenn das (seit 8.57 größere) Wahrzeichen Nachbargebäude überschneidet.
* Frei-Bau: Uhrzeit setzen und Ereignisse auslösen (Karawane, Zug, Herrscherbesuch, Türkenbelagerung) – praktisch für Tests und Stadtansichten.

## Tests
* `npm test` startet eine Server-Simulation (`tests/austria-sim.cjs`): Karawane jenseits des Flusses ohne Brücke blockiert,
  mit Brücke über die Brücke (nie im Wasser), Brückenmaut, Ankunft am Markt; Herrscherbesuch; Türkenbelagerung; Zug hält am Bahnsteig.
* `npm run test:eras` baut weiterhin alle Modelle in allen 10 Epochen.
