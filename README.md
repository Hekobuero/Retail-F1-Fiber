# Retail F1 Fiber 🏁

3D-Multiplayer-Rennspiel im Retro-/Low-Poly-Look: Fahr mit dem magentafarbenen **Telekom-Glasfaser-Truck** durch eine moderne **Metropole** mit Hochhäusern, Glastürmen, Leuchtreklamen und Hochstraße und weiter über die **Landstraße** mit Feldern, Fachwerkhäusern, Kirche, Telekom-Shop und Glasfaser-Baustellen und bewirf die Konkurrenz mit **HA-Only Verträgen**.

Läuft rein statisch im Browser (Handy im Querformat und Desktop) und eignet sich deshalb für **GitHub Pages**.

## Features
- **10 Fahrzeuge** zur Auswahl, jeweils mit eigenen Werten für Tempo, Beschleunigung und Handling.
  - Alle sind prozedural im Low-Poly-Stil nach den Fotos gebaut, in Magenta-Lackierung mit T-Logo, Glasfaser-Bündel und QR-Code.
  - Die Rückseiten sind beschriftet, damit man sie in der Verfolgerkamera sieht.

  | Fahrzeug | Typ / Look |
  |---|---|
  | Exposer | Fiat-Ducato-Koffer mit großer offener Seitenklappe und Kundenstopper |
  | Papamobil | VW T4 mit dunkler Glaskabine: „UNSERE GLASFASER VERBINDET“, hinten „GLASFASER VORAUS!“ |
  | Bulli Glasfaser | moderner Kompakt-Van: „Mit Highspeed für euch auf Tour“, highspeedvorort.de, Dachträger |
  | Fiat Glasfaser Truck | geschlossener Ducato-Koffer mit Dach-Klimaanlage |
  | BMW X6 mit Anhänger | BMW X6 in Graumetallic mit Kastenanhänger und Glasfaser-Würfel („Jetzt hier in Eurer Stadt!“) |
  | Trabi Glasfaser | Trabant 601 mit Zweitakt-Sound: langsam, aber sehr wendig |
  | Renault Master Glasfaser | Hochdach-Master mit Glitzer-Streifen: „GLASFASER KOMMT!“ vorn, „GLASFASER VORAUS!“ hinten |
  | Sprinter Koffer | Mercedes Sprinter mit offener Hecktür und Treppe |
  | Highspeed-Mobil | rundes Wohnmobil-Design mit Beachflag: „Hier kommt Ihr Highspeed-Anschluss“ |
  | Überholspur | schwarze Felgen und Spoiler; hinten „Jetzt auf die Überholspur wechseln!“ |

  - Auswahl per Pfeiltasten, ◀ ▶-Buttons oder Wischen; das Fahrzeug dreht sich in 3D.
- **Rennstrecke:** Rundkurs zur Hälfte durch die Metropole, zur Hälfte über Land.
  - **Stadt:** Hochhäuser und Glastürme mit Fenstern, die nachts leuchten. Dazu Glasfaser-, MagentaTV- und „Norman sagt: Max. 150!“-Werbetafeln, eine Hochstraße „GLASFASER-AUTOBAHN“ über der Strecke, Ampeln, Poller, Bänke und magenta Mülleimer.
  - **HEKO-Tower:** das höchste Hochhaus der Stadt, direkt in Verlängerung der Start-Geraden. Auf der Krone sitzt auf allen 4 Seiten ein Leuchtkasten mit dem Original-Logo der Heko Büroservice GmbH & Co. KG (`assets/heko-logo.svg`, von heko-bs.de). Nachts leuchtet er wie eine echte Dachreklame.
  - **Land:** Felder, Bäume, Fachwerkhäuser und Kirche. Eine Skyline am Horizont ist von überall zu sehen.
- **Echtzeit-Tageszeit:** Sonne, Himmel, Nebel und Umgebungslicht folgen der lokalen Uhrzeit des Geräts (mit Sonnenauf- und -untergang je nach Jahreszeit). Es gibt Tag, goldene Dämmerung und Nacht mit Sternen und Mond.
  - Nachts leuchten Fenster und Werbung, und alle Trucks fahren mit Scheinwerfern.
  - Straßenlaternen auf der gesamten Runde mit Lichtkegeln und Lichtflecken auf dem Asphalt halten die Fahrbahn auch nachts gut sichtbar.
  - Das Licht ist nur vorgetäuscht (leuchtende Lampenköpfe und additive Decals), echte Punktlichter gibt es nicht. Das spart Leistung auf dem Handy.
  - Test: `?hour=13` (Tag), `?hour=19` (Dämmerung), `?hour=23` (Nacht). Mit `?hour` gilt ein fester Sommertag (Sonnenaufgang 6:00, Sonnenuntergang 19:36).
  - 3 Runden mit Countdown „3-2-1-LOS!“.
  - HUD mit Runde, Position, Zeiten, Minimap, km/h und Blitzer-Zähler.
- **Tempo:**
  - Je nach Fahrzeug liegt die Höchstgeschwindigkeit zwischen ca. 126 km/h (Trabi) und ca. 176 km/h (BMW).
  - **Windschatten** dicht hinter einem anderen Fahrzeug bringt +8 % („💨 WINDSCHATTEN“).
- **Crashs:**
  - Fahrzeuge kollidieren und werden auseinandergeschoben.
  - Ein echter Aufprall wirkt wie ein HA-Only-Treffer – für **beide** beteiligten Fahrzeuge: Dreher, starkes Abbremsen, kurz unverwundbar („💥 Crash mit NAME!“).
  - In den ersten 3 Sekunden nach dem Start gibt es keine Dreher.
- **Norman ruft an:** Ab **150 km/h** fährt von rechts ein Anruf-Fenster herein: „Norman ruft an: Du fährst zu schnell! Der Vermieter beschwert sich.“
  - Es klingelt, das Fenster bleibt ca. 3 s und meldet sich höchstens alle ~18 s.
- **Blitzer (Starenkasten):**
  - Er steht auf der längsten Geraden, ein Schild „120“ warnt vorher.
  - Wer schneller als 120 km/h vorbeifährt, wird geblitzt: weißer Blitz, Kamera-Klick und „GEBLITZT! (1/3)“. Das zählt höchstens einmal pro Runde.
  - Bei **3x geblitzt** ist man **disqualifiziert**: Das Fahrzeug bleibt stehen und verschwindet, in der Ergebnisliste steht „DSQ (3x geblitzt)“.
  - Das gilt auch für die KI, die meistens bremst, aber nicht immer.
- **Waffe „HA-Only Vertrag“:**
  - Einsammeln an den **?-Boxen** (Start mit 1, maximal 3).
  - Abfeuern mit **Leertaste** oder **FEUER**; der Vertrag sucht sich leicht sein Ziel.
  - Getroffene drehen sich und werden stark abgebremst.
- **Solo-Modus** gegen 6 KI-Gegner mit zufälligen Fahrzeugen. Die KI schießt, weicht aus und bremst meistens vor dem Blitzer.
  - Die Zahl der Gegner lässt sich mit `?ai=0…7` ändern.
- **Multiplayer** für **bis zu 8 Spieler** über Supabase Realtime (Broadcast + Presence, **ohne Datenbank-Tabellen**):
  - „Schnelles Rennen“ (öffentlicher Raum), eigenen Raum mit 4-Buchstaben-Code erstellen oder per Code beitreten.
  - **Host-Wahl:** Host ist, wer laut Server-Presence am frühesten beigetreten ist (bei Gleichstand die kleinere ID). Der Start-Button erscheint erst, wenn die Lobby synchronisiert ist (ca. 1,5 s). Starten zwei Spieler gleichzeitig, gewinnt der Start des älteren Hosts.
  - Übertragen werden das gewählte Fahrzeug, Positionen (12 Hz, interpoliert), Schüsse und Treffer, Crashs, Blitzer-Strafen, DSQ und der Zieleinlauf.
- **Sound** komplett prozedural per WebAudio, ohne Audiodateien:
  - Motor mit eigener Klangfarbe je Fahrzeugklasse (Diesel, Van, V8 im BMW, Zweitakt im Trabi); Tonhöhe und Lautstärke folgen dem Tempo, mit „Gangwechseln“.
  - Reifenquietschen bei starkem Lenken und bei Drehern.
  - Hupe: Taste **H** sowie automatisch bei knappen Überholmanövern.
  - Crash, Papier-Wusch beim Vertragswurf, Treffer, Item-Glockenspiel, Blitzer-Klick, Telefonklingeln (Norman), Countdown, Startton, Runden-Jingle, Sieger-Fanfare und eine traurige Posaune bei DSQ.
  - Audio wird mit der ersten Berührung freigeschaltet (auch auf iOS). Die Stummschaltung (🔊 / Taste M) gilt für alles; die Gesamtlautstärke wird über einen Kompressor begrenzt.
- **Name** wird einmal eingegeben und im Browser gespeichert.

## Bestenlisten 🏆
Es gibt zwei Listen mit je den Top 15 pro Spielername; das zuletzt gefahrene Fahrzeug steht klein dahinter:
- **Meiste Siege**: Rennen auf Platz 1 beendet, solo gegen KI oder im Multiplayer.
- **Meiste HA-Only-Treffer**: Vertrags-Treffer auf Gegner. Crashs zählen nicht.

Die Listen öffnet man im Hauptmenü über **🏆 BESTENLISTE** oder nach dem Rennen über den 🏆-Knopf. Auf schmalen Bildschirmen schaltet man zwischen den beiden Listen per Tab um.

Gemeldet wird nur vom eigenen Gerät, für den eigenen Truck und genau einmal pro Rennen: beim Zieleinlauf oder bei der Disqualifikation, dann ohne Sieg. Wer ein Rennen abbricht, meldet nichts.

**Einrichtung (einmalig):** Im Supabase-Dashboard unter *SQL Editor* den Inhalt von `supabase-setup.sql` ausführen. Die Datei legt Folgendes an:
- die Tabelle `f1_stats` (nur lesbar für anon);
- die RPC-Funktion `f1_add_result(name, won, hits, truck)`. Sie zählt per *security definer* hoch, ist auf höchstens 20 Treffer und 1 Meldung pro Name alle 20 s begrenzt und für anon freigegeben.

Die Flappy-Tabelle `scores` wird nicht angefasst. Solange die Tabelle fehlt, zeigt das Spiel „Bestenliste noch nicht eingerichtet“ und läuft normal weiter.

## Steuerung
**Smartphone (Querformat, empfohlen).** Auf Touch-Geräten werden die Touch-Steuerelemente automatisch eingeblendet.
- **Links unten: analoger Stick zum Lenken.** Je weiter der Daumen zur Seite geht, desto stärker lenkt der Truck.
  - Stick **nach unten ziehen** = Bremse bzw. Rückwärts (der Ring leuchtet dann rot).
  - Tippt man irgendwo in der linken unteren Bildschirmhälfte, springt der Stick unter den Daumen.
- **Rechts unten: großer GAS-Button.**
- **Darüber: FEUER** für den HA-Only Vertrag, gut mit dem rechten Daumen erreichbar.
- **Multitouch:** Lenken, Gas und Feuer funktionieren gleichzeitig.
- Seitenscrollen, Zoom und Long-Press-Menüs sind gesperrt.
- Die Bedienelemente sind halbtransparent und berücksichtigen Notch/Safe-Area.

**Kamera:** Jeder Spieler sieht seinen **eigenen** Truck von hinten (Verfolgerkamera).
- Leichter Nachlauf, Blick nach vorn.
- Bei Tempo etwas mehr Abstand und Sichtfeld.
- Vor Häusern und Bäumen rückt die Kamera näher heran.

**Tastatur (Desktop):**

| Aktion | Taste |
|---|---|
| Gas | ↑ / W |
| Bremse / Rückwärts | ↓ / S |
| Lenken | ← → / A D |
| HA-Only Vertrag | Leertaste |
| Pause | Esc / P |
| Ton an/aus | M |
| Hupe | H |

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
- `assets/heko-logo.svg`: HEKO-Logo (Original-SVG von heko-bs.de) für den HEKO-Tower. Fehlt die Datei, zeigt der Tower einen „HEKO“-Schriftzug als Ersatz.
- `supabase-setup.sql`: SQL für die Bestenlisten (Tabelle, RLS und RPC).
- `screenshot-*.png`: Screenshots aus den automatischen Tests.

## Konfiguration
Supabase-URL und der öffentliche *publishable* Key stehen oben in `js/main.js` (`SUPABASE_URL`, `SUPABASE_KEY`). Der Multiplayer nutzt nur Realtime-Channels `rf1f-<CODE>`. In die Datenbank schreibt allein die Bestenlisten-RPC `f1_add_result`; siehe `supabase-setup.sql`.

URL-Parameter zum Testen:
- `?laps=1` setzt die Rundenanzahl (1–9).
- `?autodrive` lässt den eigenen Truck von der KI fahren.
- `?hour=N` erzwingt eine Uhrzeit von 0 bis 24, z. B. `?hour=23` für Nacht.
- `?touchui` zeigt die Touch-Steuerung (Stick, GAS, FEUER) auch am Desktop.
- `?ai=0..7` setzt die Zahl der KI-Gegner im Solo-Rennen (Standard 6).
- `?nostats` meldet keine Ergebnisse. Mit `?autodrive`, `?laps` oder `?ai` wird ohnehin nichts gemeldet, damit Testläufe die Bestenliste nicht verfälschen.

## Bekannte Einschränkungen
- Die ?-Boxen werden im Multiplayer nicht synchronisiert. Jeder Client verwaltet sie selbst, deshalb kann jeder jede Box einsammeln.
- Kollisionen mit Mitspielern werden auf jedem Gerät für das eigene Fahrzeug aufgelöst. Den Dreher bekommen beide, weil der Crash übertragen wird; bei hoher Latenz kann ein Zusammenstoß aber leicht versetzt wirken.
- Treffer entscheidet der getroffene Client. Bei hoher Latenz kann ein Vertrag deshalb optisch „durchfliegen“.
- Maximal 8 Spieler pro Rennen. Wer während eines laufenden Rennens beitritt, fährt erst beim nächsten Rennen mit.
- Leistung: Die Stadt besteht aus wenigen zusammengeführten Meshes (pro Material und 110-m-Zelle), Laternen und Straßenmöbel sind InstancedMeshes, und es gibt keine Schatten. Am meisten Draw Calls kosten die detailreichen Trucks, deshalb werden Trucks im Nebel nicht gezeichnet.
- Neigungssteuerung (Tilt) ist nicht eingebaut; gesteuert wird über den Touch-Stick.
- Rundenbestzeiten werden nicht gespeichert, nur Siege und Treffer.
- Die Bestenliste hängt am Namen, ohne Login. Wer denselben Namen wählt, zählt auf dasselbe Konto.
- Im Multiplayer schicken bis zu 4 Spieler 8 Positionen pro Sekunde, 5–8 Spieler 5 pro Sekunde. Das schont das Realtime-Kontingent; die Bewegung wird dazwischen interpoliert.
- Freie Multiplayer-Plätze werden (noch) nicht mit KI aufgefüllt.
- Die Host-Wahl nutzt die Uhrzeit der Geräte beim Beitritt. Das ist eindeutig, aber bei falsch gehender Uhr ist nicht unbedingt der „wirklich Erste“ Host.
