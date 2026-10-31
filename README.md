# Retail F1 Fiber 🏁

3D-Multiplayer-Rennspiel im Retro-/Low-Poly-Look: Fahr mit dem magentafarbenen **Telekom-Glasfaser-Truck** durch eine deutsche Kleinstadt mit Fachwerkhäusern, Kirche, Telekom-Shop und Glasfaser-Baustellen und bewirf die Konkurrenz mit **HA-Only Verträgen**.

Läuft rein statisch im Browser (Handy im Querformat und Desktop) und eignet sich deshalb für **GitHub Pages**.

## Features
- **4 Trucks** zur Auswahl, jeweils mit eigenen Werten für Tempo, Beschleunigung und Handling:
  - Glasfaser Classic
  - Showtruck Markise
  - Speed-Faser #1
  - Gigabit-Mobil
- **Rennstrecke:** Rundkurs durch eine deutsche Kleinstadt.
  - 3 Runden mit Countdown „3-2-1-LOS!“.
  - HUD mit Runde, Position, Rundenzeit, Bestzeit, Minimap und km/h.
  - Warnung „FALSCHE RICHTUNG“ und Ergebnistabelle am Ende.
- **Waffe „HA-Only Vertrag“:**
  - Einsammeln an den **?-Boxen** auf der Strecke (Start mit 1, maximal 3).
  - Abfeuern mit **Leertaste** oder dem Button **FEUER**.
  - Der fliegende Vertrag sucht sich leicht sein Ziel.
  - Wer getroffen wird, dreht sich und wird stark abgebremst („Von HA-Only Vertrag getroffen!“). Danach ist er kurz unverwundbar.
- **Solo-Modus** gegen 3 KI-Gegner (KUPFER-KARL, FUNKLOCH-FRANZI, DSL-DIETER, …). Die KI schießt ebenfalls.
- **Multiplayer** über Supabase Realtime (Broadcast + Presence, **ohne Datenbank-Tabellen**):
  - „Schnelles Rennen“ (öffentlicher Raum), eigenen Raum erstellen (4-Buchstaben-Code) oder einem Raum per Code beitreten.
  - Der Host (👑, wer zuerst im Raum war) startet das Rennen; der Countdown ist synchron.
  - Positionen werden mit 12 Hz gesendet und flüssig interpoliert; die Trucks tragen Namensschilder.
  - Schüsse und Treffer werden übertragen; der Zieleinlauf ist für alle gleich.
- **Name** wird einmal eingegeben und im Browser gespeichert (localStorage).

## Steuerung
| | Tastatur | Handy |
|---|---|---|
| Gas | ↑ / W | GAS |
| Bremse / Rückwärts | ↓ / S | BREMSE |
| Lenken | ← → / A D | ◀ ▶ |
| HA-Only Vertrag | Leertaste | FEUER |
| Pause | Esc / P | ⏸ |
| Ton an/aus | M | 🔊 |

## Hosting auf GitHub Pages
1. Den Inhalt dieses Ordners ins Repo pushen, z. B. `Hekobuero/Retail-F1-Fiber`.
2. Unter **Settings → Pages** die Quelle „Deploy from a branch“, Branch `main` und Ordner `/ (root)` wählen.
3. Nach kurzer Zeit läuft das Spiel unter `https://hekobuero.github.io/Retail-F1-Fiber/`.

Die Datei `.nojekyll` sorgt dafür, dass GitHub Pages die Dateien unverändert ausliefert.

## Dateien
- `index.html`: Seite und UI.
- `style.css`: Retro-Magenta-Design inklusive Handy-Layout.
- `js/main.js`: das gesamte Spiel (Three.js 0.169.0 und supabase-js 2.118.0 werden per CDN von jsDelivr geladen).
- `favicon.svg`
- `screenshot-*.png`: Screenshots aus den automatischen Tests.

## Konfiguration
Supabase-URL und der öffentliche *publishable* Key stehen oben in `js/main.js` (`SUPABASE_URL`, `SUPABASE_KEY`). Es werden nur Realtime-Channels `rf1f-<CODE>` genutzt. Dabei wird nichts in die Datenbank geschrieben.

URL-Parameter zum Testen:
- `?laps=1` setzt die Rundenanzahl (1–9).
- `?autodrive` lässt den eigenen Truck von der KI fahren.
- `?touchui` zeigt die Touch-Buttons auch am Desktop.

## Bekannte Einschränkungen
- Die ?-Boxen werden im Multiplayer nicht synchronisiert. Jeder Client verwaltet sie selbst, deshalb kann jeder jede Box einsammeln.
- Kollisionen mit Mitspielern werden nur lokal aufgelöst: Man wird selbst weggeschoben, der andere nicht.
- Treffer entscheidet der getroffene Client. Bei hoher Latenz kann ein Vertrag deshalb optisch „durchfliegen“.
- Maximal 8 Spieler pro Rennen. Wer während eines laufenden Rennens beitritt, fährt erst beim nächsten Rennen mit.
- Neigungssteuerung (Tilt) ist nicht eingebaut; gesteuert wird über die Touch-Buttons.
- Es gibt keine Bestenliste; Bestzeiten werden nicht gespeichert.
