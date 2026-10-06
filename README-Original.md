# Burgenfall – Koop-Burgenbau mit Soldaten & Banditenüberfällen

## Start (Linux)
```
npm install
# Zertifikat (siehe unten), dann:
PORT=5035 KEY_FILE=/etc/letsencrypt/live/DEINE.DOMAIN/privkey.pem CERT_FILE=/etc/letsencrypt/live/DEINE.DOMAIN/fullchain.pem node server.js
```
Aufruf: `https://DEINE.DOMAIN:5035` – Port 5035 in Firewall (`ufw allow 5035/tcp`) und Router freigeben.

## HTTPS für die Xbox
Der Xbox-Browser (Edge) lässt sich bei selbstsignierten Zertifikaten kaum überreden. Nimm ein echtes Zertifikat:
Domain (z. B. DuckDNS) auf deine IP → `sudo certbot certonly --standalone -d DEINE.DOMAIN` (Port 80 kurz frei) → Pfade wie oben.
`gen-cert.sh` erzeugt nur ein Test-Zertifikat für den PC.

## Koop
„Neue Welt gründen“ erzeugt einen Code (steht oben links im HUD). Freunde geben ihn bei „Welt beitreten“ ein. Gold und Bauten sind geteilt.

## Steuerung
| | Tastatur/Maus | Xbox-Controller |
|---|---|---|
| Laufen / Umsehen | WASD (Shift rennen) / Maus (Klick = Maus fangen) | Linker / rechter Stick |
| Menü | M | Start |
| Baumodus an/aus | B | X |
| Bauteil wechseln | Tab | Y |
| Drehen | Q/E/R | LB / RB |
| Bauen | Klick / Enter | A |
| Soldaten: Folgen / Wache / Patrouille | F / G / P | Menü |

Im Menü stellst du Überfall-Intervall (0 = aus) und max. Banditenzahl ein.

## Eigene Texturen
Lege `stone.jpg`, `wood.jpg`, `grass.jpg`, `dungeon.jpg` in `public/textures/` – sie ersetzen automatisch die generierten Texturen.

## Dauerbetrieb
`sudo npm i -g pm2 && pm2 start server.js --name burgenfall && pm2 save`

## Neu in v2
Kollisionen (Bäume, Mauern, Türme), begehbare Häuser und Kerker (Tür, Gitterzelle), Dritte-Person-Ansicht mit animierten Figuren (Laufen, Schwerthieb), Springen, eigener Nahkampf (Klick / RT / J), Banditen greifen auch Spieler an (Leben im HUD, Respawn bei 0). Ansicht wechseln: V / L3.

## Windows-Test
`start.bat` doppelklicken (Node.js LTS nötig). Startet im HTTP-Modus auf http://localhost:5035 und öffnet den Browser. Für Mitspieler im LAN: `http://<deine-PC-IP>:5035` (Windows-Firewall-Abfrage bestätigen).
