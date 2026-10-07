# Zeitreise 8.35 – neuer Name, Späher, Tribut, Überfallstärke nach Siedlung

## Neuer Name
- Das Spiel heißt jetzt **Zeitreise** (Mittelalter Edition): Fenstertitel, Startbildschirm, `start.bat`, `package.json`.
- Gespeicherte Einstellungen, Figuren, eigene Karten und Spielstände bleiben erhalten (interne Speicher-Schlüssel unverändert).

## Späher melden Überfälle
- Steht ein **Wachturm** oder **Wachposten** (oder sind Bogenschützen auf Posten), melden Späher Banditen **30 s vor dem Angriff**:
  Anzahl, Herkunft und Tribut erscheinen im Ereignis-Log und dauerhaft in der Statusanzeige.
- Ohne Späher greifen die Banditen wie bisher ohne Vorwarnung an.

## Tribut
- Während der 30 s Vorwarnung kann im **Bergfried** oder in der **Garnison** Tribut gezahlt werden:
  25 Gold je Bandit, mindestens 40 Gold. Die Banditen ziehen ab, der nächste Überfall kommt später, Ansehen -1.

## Überfallstärke
- Die Zahl der Banditen richtet sich nach **Einwohnern und Gold** (1 + Einwohner/5 + Gold/250),
  gedeckelt durch den Menüwert und durch 1,5× Soldaten + 1; Abschreckung senkt sie weiter.
