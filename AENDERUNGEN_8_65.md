# Zeitreise 8.65 – Zuzug im Survival freischaltbar

* Survival-Welten starten weiterhin ohne Zuzug. Sobald der Bergfried (bzw. Rathaus, Schloss … je Epoche) auf **Ausbaustufe 2**
  ausgebaut ist, kommt die Meldung „Zuzug kann jetzt freigegeben werden“ und der Schalter „Zuzug“ in der Verwaltung des Bergfrieds
  lässt sich einschalten.
* Vorher zeigt der Schalter „🔒 gesperrt“ mit der Bedingung und der aktuellen Stufe.
* Im Frei-Bau und in normalen Welten gilt keine Sperre.
* Der Server-Test (`npm test`) prüft den Ablauf: gesperrt → Ausbau auf Stufe 2 → Zuzug lässt sich freigeben.
