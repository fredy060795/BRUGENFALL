# Burgenfall 8.4

## Gebäude und Materialien
Die bisher fehlenden Werkstätten sind in den gemeinsamen neuen Stil überführt:
Käserei, Metzgerei, Räucherei, Brauerei, Gerberei, Weberei, Taverne und Fischerei.
Jede erhält zur Nutzung passende Einrichtung (Käseräder, Räucherregale,
Braukessel, Gerberbottiche, Webstuhl usw.). Auch Mühle, Brunnen, Wachposten,
Hafen, Bauernhof, Obstplantage, Tiergehege und Imkerei sind überarbeitet.
Vorhandene Mauern, Treppen, Brücken und kleine Einrichtungsobjekte nutzen
weiterhin dieselben neuen Stein-/Holzmaterialien. Felder bleiben Anbauflächen.

Fachwerk spart die Türöffnungen aus. Werkbänke beim Bogenbauer und
Rüstungsmacher wurden aus dem Eingangsbereich versetzt. Die große Tafel im
Bergfried hat wieder ihre vollständige Tischplatte in allen Ausbaustufen.
Kirche, Kapelle und Kathedrale besitzen farbige Glasflächen mit Bleiraster
auf Außen- UND Innenseite der Wände.

## Naturboden und Gelände
Kuh-, Schaf- und Schweinegehege, Bauernhof, Imkerei und Obstplantage haben
keine flächigen Steinplatten. Die Außenanlagen folgen dem natürlichen Gelände;
Tiere werden auf die lokale Bodenhöhe gesetzt. Die Obstbäume haben verzweigte
Stämme, runde Kronen und Früchte. Die Imkerei verwendet hohe geflochtene
Strohkörbe auf Holzgestellen nach der beigefügten Bildvorlage.
Andere Gebäude bleiben auf gestützten Fundamenten. Mauern, Tore, Palisaden,
Treppen und Wachposten erhalten Bodenschürzen unter den tragenden Teilen.
Die Torpassage bleibt dabei frei. Keine automatischen Zufahrtswege.

## Verteidigung und Bauen
- Wassergraben: sichtbare 4×4-Platzierungsvorschau, rote Anzeige bei ungültigem Ort.
- Geöffnetes Tor: Fallgitter wird nach dem Hochziehen vollständig ausgeblendet.
- Steintor: geschlossene Bogenzwickel; Decke aus Stein, kein seitlich herausragender Holzboden.
- Palisade: überlappende Holzpfähle ohne Durchsichtspalten, zugespitzte Köpfe und Querbalken.
- Steinturm: begehbare Wendeltreppe mit 60 Stufen, zwei Umläufen und Dachöffnung.
- Kupfer-/Eisenmine: Fördergerüst, Seilzug und Erzhaufen im Stil des Steinbruchs.
- Steinbruch: Baufläche muss ein Steinvorkommen überdecken. Client-Vorschau
  und Server prüfen dieselbe Regel, auch im Frei-Bau. Bestehende Steinbrüche bleiben erhalten.

## Bergfried-Erweiterungen
E am Bergfried öffnet die Verwaltung:
- Kerker: 18 Stein + 6 Holz, vier Gefangenenplätze und eingerichtete Zelle.
- Folterkammer: 25 Stein + 10 Holz, erst ab Stufe 3 (Steinbergfried).
  Ermöglicht den bisherigen Henker-Arbeitsplatz und die Verhörfunktionen.
- Im Frei-Bau sind Erweiterungen und Bergfried-Ausbau kostenlos.

Kerker/Folterkammer sind aus der eigenständigen Bauauswahl entfernt; der Server
verhindert auch direkte Bauanfragen. Alte Gebäude dieser Typen werden beim Laden
in den bestehenden Bergfried übertragen. Eine vorhandene Folterkammer unterhalb
Stufe 3 wird vorgemerkt und beim erforderlichen Ausbau wieder aktiviert.
Erweiterungen bleiben bei Speichern/Laden, Ausbau und Wiederaufbau erhalten.
Die Stufen zählen sichtbar ab 1: Holzhalle, Holzbergfried, Steinbergfried,
verstärkter Steinbergfried.

## Prüfung und Grenzen
Automatisierte Server-, Client- und Netzwerkprüfungen bestanden. Geprüft sind
unter anderem freie Eingänge mittels Strahlen gegen echte Meshes, Tischplatten,
Innen-/Außenglas, alle Treppenstufen, Naturboden ohne Fundamentplatten,
Grabenvorschau, Erweiterungsfreigabe und Migration sowie Speichern/Neustart/Laden.
MODELLVORSCHAU_8_4.png zeigt die tatsächlichen Modellgeometrien mit den
Spieltexturen als Software-Rendering. Keine Browser-/GPU-Abnahme oder
Bildratenmessung; das endgültige Spielgefühl muss im laufenden Spiel geprüft werden.
