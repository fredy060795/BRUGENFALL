# Betrieb auf einem eigenen Server

1. Den vollständigen Ordner einschließlich node_modules auf den Server kopieren.
2. Node.js installieren, sofern nicht vorhanden.
3. Im Ordner `sh start.sh` starten (oder `HTTP=1 PORT=5035 node server.js`).
4. Für dauerhaften Betrieb mit einem Prozessmanager/systemd starten.
5. Für eine Webadresse einen HTTPS-Reverse-Proxy auf Port 5035 einrichten.
   Er muss auch WebSocket-Verbindungen weiterleiten.

Beispiel für einen Caddy-Reverse-Proxy (Domain ersetzen):

```
spiel.example.org {
    reverse_proxy 127.0.0.1:5035
}
```

Bei einem lokalen Proxy den Spielprozess mit `HOST=127.0.0.1` starten, damit
Port 5035 nicht direkt von außen erreichbar ist. Standard ist 0.0.0.0 für LAN-Spiel.

Die Datei saves/worlds.json regelmäßig sichern. Vor Server-Updates den Prozess
normal beenden, den saves-Ordner behalten und erst danach neu starten.

Der Prototyp hat gemeinsame Welten mit Beitrittscodes, aber keine Benutzerkonten
oder vollständige Anti-Cheat-Absicherung. Für private Spielrunden gedacht.
Öffentliches Hosting wurde in dieser Entwicklungsumgebung nicht bereitgestellt
oder unter Last geprüft. Grafik wird weiterhin auf den PCs der Mitspieler berechnet.
