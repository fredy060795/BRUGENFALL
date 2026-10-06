# Burgenfall 8.20 – Gewandungen, Tiere, Survival, Fraktionen

## Figuren (people.js)
- Kleidung ist jetzt körperangepasst und in Lagen aufgebaut (Hemd → Weste/Wams → Schürze → Gürtel → Umhang).
- Neue Berufsgewandungen mit Zufallsvarianten je Person: Mönche (Benediktiner, Franziskaner,
  Zisterzienser, Dominikaner) mit Habit, Skapulier, Kapuze, Strickgürtel, Tonsur, Kreuz, Rosenkranz;
  Bäcker/Metzger, Fischer (Ölzeug, Wattstiefel, Fischkorb, Netz), Schmied (Lederschurz, Zange),
  Heilerin (Gebende, Kräuterschürze), Jäger (Gugel, Fellkragen), Holzfäller (Lederweste,
  Wickelgamaschen), Steinmetz, Müller, Bergmann, Hirte, Weberin, Gerber, Wirt, Totengräber,
  Henker (Henkerhaube), Händler (Houppelande mit Pelzbesatz).
- Banditen: Halsabschneider, Wilderer, Schläger, Bandenführer – zerfetzte Kapuzen/Umhänge,
  Flicken, Gesichtstücher, rostige Helme und Brustpanzer.
- Soldaten: Gambeson, Brustpanzer, Beckenhaube/Eisenhut, Arm- und Beinzeug, Stundenglashandschuhe (Ritter).
- Kleine Teile werden pro Figur zusammengefasst (weniger Draw-Calls).

## Tiere (animals.js, neu)
- Pferd, Kuh, Schwein, Schaf, Hirsch, Wolf neu modelliert: Anatomie, Fellmuster, individuelle Varianten,
  Paarhufe/Hufe/Pfoten, Hörner, Geweih, Mähne, Euter. Reitpferd mit Sattel und Zaumzeug in Fraktionsfarbe.

## Fraktionen
- Farbwahl beim Beitritt (12 Farben). Eigene Kleidung und alle eigenen Soldaten tragen die Farbe.

## Survival-Modus (bei Weltgründung, Standard: an)
- Start als Bauer mit Hacke, keine Bewohner, kein Zuzug (im Bergfried umschaltbar).
- Selbst herstellen am jeweiligen Gebäude (Menü Handwerk → Werkstätten):
  Heiltrank (Apotheke), Tuch / Kleidung / Gambeson (Weberei), Mehl (Mühle), Brot (Bäckerei),
  Käse (Käserei), Leder (Gerberei), Waffe / Helm (Schmiede), Kettenhemd / Brustpanzer /
  Plattenharnisch (Rüstungsmacher).
- Sammeln: Kräuter mit der Hacke unter Bäumen/auf Wiesen, Eisen/Kupfer mit der Spitzhacke an der Mine.
- Tiere im Stall kaufen (Schaf, Kuh, Schwein); jedes Tier frisst täglich Weizen, ohne Futter verhungern sie.
- Kleiderschrank/Rüstkammer: nur selbst hergestellte Kleidung und Rüstung ist anziehbar.

## Ausdauer & Hunger
- Jeder Schlag/Schuss kostet Energie (Axt/Spitzhacke am meisten). Bei 0: erschöpft – kein Angriff,
  kein Rennen, langsames Gehen bis 35 Energie. Erholung langsamer, bei Hunger halbiert.
- Arbeit und Rennen erhöhen den Hunger.

## Sonstiges
- Vorgegebene Bodenstraße entfernt (Wege zeichnet der Spieler selbst).
- Scheiterhaufen: Opfer steht aufrecht, festgebunden am Pfahl.

## Karteneditor: Fluss frei bearbeiten (8.20b)
- Der Fluss ist jetzt ein freier Pfad: Punkte lassen sich in alle Richtungen ziehen (auch Ost–West,
  Bögen, Schleifen). Werkzeug „Flusspunkte“: Klick fügt einen Punkt am nächsten Abschnitt ein,
  Rechtsklick entfernt ihn (mind. 2, max. 24 Punkte).
- „Fluss an/aus“: Karten ganz ohne Fluss.
- Gelände, Wasser, Minikarte, Bauregeln, Pflanzen und Wild folgen dem neuen Pfad.
- Handelsschiffe fahren nur, wenn der Fluss durchgehend von Süd nach Nord läuft.
- Alte Karten (5 Flusspunkte) werden automatisch übernommen.

## Korrekturen (8.20b)
- Server zählt Arbeitshiebe höchstens alle 250 ms (Schutz gegen Nachrichtenflut).
- Survival-Status und Zuzug-Sperre bleiben beim Speichern/Laden erhalten.
- Abgelehnte Kleiderwahl setzt das Aussehen im Client zurück.

# Burgenfall 8.21 – Gebäude im neuen Stil, HD-Texturen

## Texturen
- Gebäude-Atlanten nahtlos (Image Quilting statt Spiegeln), doppelte Auflösung (1024 px je Kachel).
- Echte Normal- und Rauheitskarten für Stein, Holz, Putz, Reet, Dachziegel, Schiefer, Schindeln, Dielen.
- Kleidungsstoffe (Leinen, Leder) nutzen ebenfalls den nahtlosen HD-Atlas.
- Skript tools/texturen_generieren.py erzeugt alles neu (auch aus eigenen Fotos).

## Verwitterung (Shader, alle Gebäude)
- Großflächige Farbschwankung gegen sichtbare Kachelwiederholung.
- Spritzwasser und Erde am Sockel, Moos auf Stein, Reet und Dächern.

## Lebendige Details
- Zunftschilder mit Symbol am Ausleger: Amboss, Helm, Bogen, Brezel, Krug, Fass, Spule, Mörser,
  Hackbeil, Fell, Fisch, Käse, Axt, Sack, Münze, Geweih, Spitzhacke.
- Leuchtende Laterne an jeder Front.
- Gewerbe-Gegenstände: Amboss, Löschbottich, Kohlehaufen (Schmiede); Rüstungsständer; Bogenstapel;
  Mehlsäcke, Brennholz (Bäckerei); Tische und Bänke (Taverne); Fässer (Brauerei); Webstuhl, Wollballen
  (Weberei); Kräuter-Trockengestell, Tontöpfe (Apotheke); Fleischhaken (Metzgerei); Felle zum Trocknen,
  Gerbbottich (Gerberei); Räucherfisch; Milchkannen, Käselaibe; Holzstapel, Hackklotz mit Axt (Holzfäller);
  Heuballen, Wagen (Hof, Ställe, Kornspeicher); Steinblöcke, Erzbrocken; Netzgestell (Fischerei);
  Wäscheleine oder Holzstoß und Blumenkästen (Wohnhäuser).
- Gegenstände stehen an Rückwand und linker Seite, Türen bleiben frei.

## Tiere
- Teile je Gelenk zusammengefasst (weniger Draw-Calls); Gelenke/Lider erscheinen nicht mehr schwarz.

# Burgenfall 8.22 – Kinder, Tiere, Krankheit, Maibaum

## Kinder
- Neugeborene sind Kinder (kleiner, eigene Kleidung), spielen tagsüber Fangen und toben am
  Dorfplatz (hüpfen beim Rennen), schlafen nachts zuhause.
- Nach einem Jahr (4 Jahreszeiten) werden sie erwachsen und stehen als Arbeiter zur Verfügung.
- Kinder arbeiten nicht, werden nicht rekrutiert und nicht geopfert.

## Tiere
- Körper waren von außen unsichtbar (falsche Dreieckswicklung) und wirkten durchsichtig – behoben,
  jede Fläche prüft ihre Ausrichtung jetzt selbst.
- Gelenke ragen nicht mehr aus dem Fell (kleiner, farbig).

## Krankheit
- Endlosschleife behoben: Geheilte sind 6 Tage immun, Ansteckung halbiert.
- Heilerin heilt auch ohne Heiltränke: mit Kräutern (mittel) oder reiner Pflege (langsam).
- Leichte Krankheiten können von selbst ausheilen.

## Maibaum
- Bänder hängen vom Kranz an der Mastspitze nach unten zu den Tänzern und drehen sich beim Tanz.

## Spielstände
- Versehentlich mitgelieferte Testwelten aus 8.20–8.21 entfernt (Original-Spielstände wiederhergestellt).

# Burgenfall 8.23 – Sounds, Ställe, Felder, Kirchen, Häuserzeilen

## Sounds (public/audio/<Ordner>/)
- Ein Ordner pro Sound (siehe public/audio/LIESMICH.txt); MP3s einfach hineinlegen, mehrere pro Ordner
  werden abgewechselt. Server liefert die Liste unter /audio/index.json.
- Einzelklänge (Hiebe, Axt, Hacke, Spitzhacke, Pfeil, Schmied, Tiere), Schleifen (Taverne, Bäckerei,
  Weberei, Markt, Feuer, Regen, Vögel, Galopp, Holzschritte, Musik), Ereignisse (Einsturz, Überfall,
  Tod + Totenglocke, Feste, Hinrichtungen, Husten). Fehlende Sounds: eingebauter Ersatzklang.

## Tiere
- Rehe und Wölfe laufen jetzt animiert und schauen in Laufrichtung (vorher: Position wurde hart gesetzt).

## Ställe
- Unterstand mit vier Eckpfosten, Kopfbändern, Bretter-Rückwand, Reetdach, Streu.
- Futterkrippe: Bauern füllen täglich aus dem Lager; manuell „Futterkrippe füllen“ (+10 Weizen).
  Tiere fressen nur aus der Krippe; Füllstand sichtbar. Bis zu 6 Tierplätze.
- Keine schwebenden Laternen/Schilder mehr an offenen Bauten.

## Felder & Plantagen
- Feld mit echten Furchen und Getreide in Reihen (Halme mit Ähren).
- Obstplantage: Flechtzaun, Obstbäume mit Ästen und Früchten, Leiter, Korb, Fallobst.
- Hopfengarten: Stangen, Drahtgerüst, Steigschnüre, Ranken mit Blättern und Dolden.

## Häuserzeilen
- Gleich ausgerichtete Gebäude rasten bündig aneinander (gemeinsame Frontlinie) oder Rücken an Rücken.
- Gegenstände an Rückwand/Seite werden ausgeblendet, wenn ein Nachbar angrenzt.

## Kirchen
- Kirche: Turmhelm mit Kreuz; Kapelle: Dachreiter mit Glocke; Dom: Rosette, Heiligenfiguren;
  Giebelkreuze, Portallichter; Friedhöfe neben Kapelle und Kirche.

# Burgenfall 8.24 – Eigene Grundmodelle, Hafen & Schiffe

## Eigene Grundmodelle (Giebel zur Straße, seitlich bündig anbaubar)
- Taverne: vorkragendes Obergeschoss, Dachgauben, Steinsockel.
- Großes Haus: Vorkragung, Treppenturm mit Schieferhelm.
- Apotheke: Erker im Obergeschoss, Kräuterbeet.
- Bäckerei: gemauerter Kuppel-Backofen mit Abzug, Verkaufsklappe.
- Schmiede: Steinbau mit hoher Esse. Rüstungsmacher: Steinbau mit Treppengiebel.
- Weberei: zweigeschossig, Fensterreihe, Ladeluke mit Lastkran. Lager: hohes Scheunentor, Lastkran.
- Brauerei: Dachlaterne (Darre). Räucherei: steiler Holzbau mit Rauchhaube.
- Gerberei: offener Lattengiebel. Käserei: kühler Steinbau mit Lüftungsgiebel.
- Metzger: Steinsockel, Verkaufsklappe. Bogner: Strohzielscheiben. Bretterbauten für Bogner, Holzfäller, Fischer.

## Hafen & Schiffe
- Neue Kogge: geklinkerter Rumpf mit Sprung, Achter- und Vorderkastell, Rahsegel quer zum Schiff mit
  Bauch und Streifen in Stadtfarben, Wanten/Stagen, Ruder, Bugspriet, Ladung, Wimpel.
- Schiffe machen seitlich am Kai fest statt mitten im Fluss.
- Hafen: Tretradkran, Poller mit Tauen, Laufplanke, Laternen.

# Burgenfall 8.25 – Kartengröße bis 5×

- Beim Erstellen einer Welt wählbar: 1× (400 m) bis 5× (2 km Kantenlänge). Auch im Karteneditor.
- Vorhandene Karten werden beim Vergrößern gestreckt und die neue Fläche mit Wäldern, Felsen und
  Erzen gefüllt; der Fluss wächst mit.
- Gelände in Kacheln (64 m): nur in Sichtweite vorhanden, nah fein, fern grob – rund 90 000 Vertices
  statt 201 000, unabhängig von der Kartengröße. Burggraben verformt auch nachgeladene Kacheln.
- Gras wächst als Wolke um den Spieler, Himmel folgt der Kamera, Bergkranz passt sich an.
- Server: alle Grenzen, Rehgebiet und Rehzahl (max. 120) wachsen mit der Karte.
- Minikarte zeigt auf großen Karten einen 400-m-Ausschnitt um den Spieler; die große Karte zeigt alles.

# Burgenfall 8.26 – Flussenden, optionale Orte

## Fluss
- Ein Flussende nahe am Kartenrand fließt gerade zum Rand hinaus; ein Ende im Inneren ist eine Quelle
  bzw. Mündung: der Fluss läuft dort auf ~30 m schmal und flach aus (Quelle auf Geländehöhe).
- Damit sind Flüsse möglich, die nicht durch die ganze Karte gehen (Quelle im Land, Bach zwischen zwei Punkten).
- Behoben: Verlängerung an den Enden schoss bei kurzen/gekrümmten Endstücken in falsche Richtungen.
- Behoben: Flusspunkte ließen sich auf großen Karten nur bis ±190 m ziehen.
- Handelsschiffe fahren nur bei durchgehendem Süd-Nord-Fluss.

## Dörfer und Banditenlager optional
- Karten werden nicht mehr automatisch mit 2 Dörfern und 1 Banditenlager aufgefüllt.
- Ohne Banditenlager: keine Überfälle, kein Lager, keine Expeditionen (statt eines unsichtbaren Lagers).
- Ohne Dörfer: keine Händler und Handelsschiffe.
