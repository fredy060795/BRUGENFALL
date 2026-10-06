Kleidungs-Texturen für Burgenfall
=================================

Hier kannst du eigene Texturen ablegen und im Code nutzen.

Empfohlene Dateien (PNG, 256x256 oder 512x512):
  leinen.png      – Stoff für Tuniken / Kleider
  leder.png       – Leder für Wämser / Gürtel
  kettenhemd.png  – Kettenhemd-Muster
  gambeson.png    – Gestepptes Polster
  wolle.png       – Grobe Wolle

Aktuell werden die meisten Kleidungsstücke prozedural
(Canvas-Muster + Flat Colors) erzeugt. Um eine Datei
zu nutzen, in materials.js oder people.js z.B.:

  surfaceMaterial('linen', farbe, [2,2])
  // lädt intern aus dem Texturen-Pack

Oder eigene Map:
  const tex = new THREE.TextureLoader().load('/textures/kleidung/leinen.png');
  mat.map = tex;

Hüte / Helme (prozedural in people.js):
  - none, cap, scarf, strawhat, chaperon, plume, hunterhat
  - helmet, hood, sallet, visored
