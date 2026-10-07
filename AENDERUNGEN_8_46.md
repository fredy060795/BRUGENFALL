# Zeitreise 8.46 – Infotexte passen sich der Epoche an

Meldungen und Hinweise nannten bisher in jeder Epoche „Bergfried“ und „Garnison“, z. B.
„Zuerst den Bergfried platzieren – er ist das Herz deiner Siedlung“. Jetzt steht dort der Name der jeweiligen Epoche,
grammatisch richtig mit passendem Artikel und Pronomen:

| Epoche | Beispiel |
| --- | --- |
| Hochmittelalter | Zuerst **den Bergfried** platzieren – **er** ist das Herz deiner Siedlung |
| Römerzeit | Zuerst **die Principia (Kastell)** platzieren – **sie** ist das Herz deiner Siedlung |
| Neuzeit | Zuerst **das Rathaus** platzieren – **es** ist das Herz deiner Siedlung |

## Angepasste Texte
* Server: Platzieren, „Dein … steht!“, „Es kann nur einen/eine/ein … geben“, Ausbau, Abriss, Bankett, Kerker und Folterkammer,
  Schatzkarren, Truhe, Schlafen, Kleiderschrank und Rüstkammer, Garnison bzw. Kaserne (Ausbildung, voll),
  Späher und Tribut, Zufriedenheit („Bankett im/in der …“), Zuzug.
* Ausbaustufen: Im Hochmittelalter bleiben die Namen (Holzbergfried, Steinbergfried, Verstärkter Steinbergfried).
  In allen anderen Epochen steht „Stufe 1–3 von 3“, und auf Stufe 3 „höchste Ausbaustufe“ statt „vier Türme und Eisentor“.
* Ausbildung: „Die Ausbildung ‚Eques‘ braucht eine Rüstung …“ statt „Ein Ritter braucht …“, ebenso für die Armbrust-Truppe.
* Client: HUD (Banditen-Hinweis, Tribut, Bau-Hinweis), Weltenliste im Menü (mit der Epoche der jeweiligen Welt),
  Truhe/Lager, Steuern, Schatzkarren, Abriss-Knopf, Hilfe.

## Technik
* `Rules.bname(era,k)` liefert den Gebäudenamen der Epoche, `Rules.bart(era,k,fall)` den Namen mit Artikel
  (Fälle: nom, akk, dat, ein, dein, deinA, in, an, zu; Pronomen er/ihn). Die Geschlechter stehen in einer Tabelle in `rules.js`.
