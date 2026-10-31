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
- **Zusammenstöße (Rempler):**
  - Fahrzeuge stoßen nur gegeneinander und fahren weiter: kein Dreher, kein Kontrollverlust, kein Zurückwerfen.
  - Sie werden physisch auseinandergeschoben, damit sie sich nicht überlappen, und bekommen einen kleinen Seitenschubs, damit sie aneinander vorbeigleiten.
  - Ein Rempler kostet höchstens ca. 4 % Tempo. Dazu gibt es ein kurzes dumpfes Rumms, ein leichtes Kamerawackeln und auf Handys eine kurze Vibration.
  - **Bande:** Man prallt ab und fährt weiter. Es gibt einen einmaligen kleinen Tempoverlust, und der Truck richtet sich sanft parallel zur Bande aus (höchstens ~90°/s) – kein Drehen.
  - Das gilt für KI und Multiplayer gleich. Dreher gibt es **nur** durch HA-Only-Treffer, die Rakete und Business-Minen; dabei sagt immer ein Toast, was einen getroffen hat.
  - Die KI schießt HA-Only-Verträge erst ab 16 m Abstand und legt Minen nie direkt vor einem Hintermann (unter 22 m) ab. So sieht ein Treffer nie wie ein Crash aus.
- **Norman ruft an:** Ab **150 km/h** fährt von rechts ein Anruf-Fenster herein: „Norman ruft an: Du fährst zu schnell! Der Vermieter beschwert sich.“
  - Es klingelt, das Fenster bleibt ca. 3 s und meldet sich höchstens alle ~18 s.
- **Blitzer (Starenkasten):**
  - Er steht auf der längsten Geraden, ein Schild „120“ warnt vorher.
  - Wer schneller als 120 km/h vorbeifährt, wird geblitzt: weißer Blitz, Kamera-Klick und „GEBLITZT! (1/2)“. Das zählt höchstens einmal pro Runde.
  - Bei **2x geblitzt** ist man **disqualifiziert**: Das Fahrzeug bleibt stehen und verschwindet, in der Ergebnisliste steht „DSQ (2x geblitzt)“.
  - Das gilt auch für die KI, die meistens bremst, aber nicht immer.
- **?-Boxen (Loot):** Jede Box mit „?“ gibt genau **ein** Ergebnis.
  - Eine kurze Slot-Animation zeigt dabei nacheinander alle Möglichkeiten (HA-Only, Business-Vertrag, ✖) und bleibt dann auf einer stehen; dazu kommt ein Toast.
  - Wahrscheinlichkeiten: **HA-Only 2/5 · Niete 2/5 („❌ Niete – leider nix!“) · Business-Vertrag 1/5**.
  - Jede Box wird nach 5 s wieder aktiv.
- **Waffe „HA-Only Vertrag“:**
  - Jeder (Spieler, KI, Multiplayer) startet jedes Rennen mit **0 Verträgen**; man muss sie erst an den **?-Boxen** einsammeln (maximal 3).
  - Ohne Vertrag zeigt das HUD „x0“, und **FEUER** ist gedimmt und deaktiviert.
  - Abfeuern mit **Leertaste** oder **FEUER**; der Vertrag sucht sich leicht sein Ziel.
  - Getroffene drehen sich und werden stark abgebremst.
- **BUSINESS-Vertrag (Mine):**
  - Man kann höchstens einen halten; das HUD zeigt dann 💼 BUSINESS neben dem Item-Slot.
  - Mit **💼** (kleiner Button links neben GAS) oder **B** wird er **hinter** dem eigenen Truck abgelegt.
  - Aussehen: Aktenkoffer mit blinkendem roten Licht, das nachts leuchtet.
  - Wer hineinfährt, dreht sich wie bei einem HA-Only-Treffer: KI, Mitspieler und später auch der Ableger selbst (nach ca. 1 s Schonzeit). Danach ist die Mine weg.
  - Sonst bleibt sie **das ganze Rennen** liegen, ohne Zeitlimit.
  - Die KI sammelt und legt Minen auch.
  - Im Multiplayer werden Ablegen und Entfernen per ID übertragen; der erste Treffer gewinnt.
- **TV-VERTRÄGE und RAKETE:**
  - **Wo:** Die TV-Verträge liegen **nur in Kurven**, auf der befahrenen Ideallinie: leicht zur Kurven-Innenseite (ca. 2–3 m neben der Mitte), sodass man natürlich hindurchfährt. Sie stehen in Gruppen von **2–4** pro Kurve.
  - **Aussehen:** Großes, schwebendes Magenta/Weiß-Symbol mit „TV“, pulsierendem Leuchten, einem Lichtstrahl nach oben und einem Ring am Boden. Man sieht sie schon von Weitem, nachts noch stärker.
  - **Nachschub:** Eingesammelte kommen nach 14 s wieder, damit auch in späteren Runden welche da sind.
  - **Zähler:** Das HUD zeigt „📺 TV x/5“. Jeder Start beginnt bei 0, mehr als 5 geht nicht.
  - **Rakete:** Bei 5/5 leuchtet der **🚀 RAKETE**-Button (links neben FEUER) bzw. Taste **R**. Abfeuern verbraucht alle 5.
  - **Ziel:** Die Rakete fliegt die Strecke entlang nach vorne, zur dichtesten Gruppe vor einem. Ist niemand vor einem, nimmt sie den nächsten Fahrer.
  - **Einschlag:** Es gibt einen stilisierten **Nuklearpilz**: Blitz, aufsteigender Stiel und Pilzkappe, Druckwellenring, Staub und eine Farbe, die von glühend über Feuer zu Rauch wechselt. Er bleibt etwa 7 s sichtbar.
  - **Effekte:** Dazu kommen ein tiefer Knall, in der Nähe Kamerawackeln und Bildschirmblitz sowie Vibration auf Handys.
  - **Wirkung:** Bis zu **4 Trucks im Umkreis von 18 m** drehen sich wie bei einem HA-Only-Treffer. Der Schütze ist nie betroffen.
  - **KI und Multiplayer:** Die KI feuert gelegentlich selbst. Im Multiplayer werden Start, Einschlagort und die getroffenen IDs übertragen.
  - **Bestenliste:** Raketen- und Minen-Treffer zählen **nicht** als HA-Only-Treffer.
- **Solo-Modus** gegen 6 KI-Gegner mit zufälligen Fahrzeugen. Die KI schießt, weicht aus und bremst meistens vor dem Blitzer.
  - Die Zahl der Gegner lässt sich mit `?ai=0…7` ändern.
- **Multiplayer** für **bis zu 8 Spieler** über Supabase Realtime (Broadcast + Presence, **ohne Datenbank-Tabellen**):
  - **Offene Lobby:** Im Menü führt **👥 MULTIPLAYER – OFFENE LOBBY** direkt in eine gemeinsame Lobby. Raum-Codes gibt es nicht. Die Lobby zeigt alle Spieler live mit Name und Fahrzeug.
  - **Host 👑:** Host ist, wer die Lobby zuerst betreten hat (laut Server-Presence; bei Gleichstand entscheidet die ID). Verlässt der Host die Lobby, übernimmt der Nächstfrühere.
  - **Start:** Nur der Host sieht **RENNEN STARTEN**. Der Button ist ab 2 Spielern (1vs1) aktiv; allein steht dort „Warte auf Mitspieler…“.
    - Gestartet wird mit genau den Spielern, die gerade in der Lobby sind (maximal 8).
    - Wer währenddessen dazukommt, sieht „Rennen läuft – du bist beim nächsten dabei“. Ein 9. Spieler sieht „Lobby voll – Rennen läuft/voll“ und rückt nach.
  - **Nach dem Rennen** geht es automatisch zurück in die Lobby: 6 s nachdem alle im Ziel, disqualifiziert oder ausgestiegen sind, spätestens nach 25 s. Mit **ZUR LOBBY** geht es sofort.
  - Übertragen werden das gewählte Fahrzeug, Positionen (5–12 Hz je nach Spielerzahl, interpoliert), Schüsse und Treffer, Raketen (Start, Einschlag, getroffene IDs), Business-Minen (Ablegen/Entfernen), Rempler, Blitzer-Strafen, DSQ und der Zieleinlauf.
- **Sound** komplett prozedural per WebAudio, ohne Audiodateien:
  - **Musik:** eigene, fröhliche Chiptune-Komposition im Retro-Kart-Stil, keine Kopie einer echten Melodie. Im Menü läuft ein ruhiges Thema (F-Dur, 108 BPM, Dreieck-Lead), im Rennen ein flottes (C-Dur, 150 BPM, 25-%-Puls-Lead, Bass und leichtes Schlagzeug).
    - Bei Norman und beim Polizeifunk wird die Musik leiser.
    - Ein-/Ausschalten mit 🎵 im Menü und im Rennen oder mit Taste **N**; die Einstellung wird gespeichert.
  - **Polizeifunk:** Fahren mindestens 4 Fahrer (Spieler + KI) gleichzeitig über 130 km/h, kommt ab und zu ein Funkspruch, höchstens etwa alle 45 s.
    - Dazu gibt es Rauschen und Squelch-Piepser und eine blaue „POLIZEIFUNK“-Box mit Untertitel.
    - Gesprochen wird per Sprachausgabe des Geräts (de-DE). Die Sprachausgabe lässt sich nicht filtern, deshalb kommen Rauschen und Piepser drumherum.
    - Mehrere Sprüche wechseln sich ab. Im Multiplayer zählt jedes Gerät selbst anhand der bekannten Tempi.
    - Funk und Norman überlappen sich nie, der jeweils zweite wartet.
  - Motor (leise und weich abgemischt, damit die Musik hörbar bleibt) mit eigener Klangfarbe je Fahrzeugklasse (Diesel, Van, V8 im BMW, Zweitakt im Trabi); Tonhöhe und Lautstärke folgen dem Tempo, mit „Gangwechseln“.
  - Reifenquietschen bei starkem Lenken und bei Drehern.
  - Hupe: Taste **H** sowie automatisch bei knappen Überholmanövern.
  - Rempler-Rumms, Papier-Wusch beim Vertragswurf, Treffer, Item-Glockenspiel, Blitzer-Klick, Telefonklingeln (Norman), Countdown, Startton, Runden-Jingle, Sieger-Fanfare und eine traurige Posaune bei DSQ.
  - Audio wird mit der ersten Berührung freigeschaltet (auch auf iOS). Die Stummschaltung (🔊 / Taste M) gilt für alles, auch für Musik und Sprachausgabe; die Gesamtlautstärke wird über einen Kompressor begrenzt.
- **Name** wird einmal eingegeben und im Browser gespeichert.

## Bestenlisten 🏆
Es gibt zwei Listen mit je den Top 15 pro Spielername; das zuletzt gefahrene Fahrzeug steht klein dahinter:
- **Meiste Siege**: Rennen auf Platz 1 beendet, solo gegen KI oder im Multiplayer.
- **Meiste HA-Only-Treffer**: Vertrags-Treffer auf Gegner. Rempler, Raketen und Business-Minen zählen nicht.

Die Listen öffnet man im Hauptmenü über **🏆 BESTENLISTE** oder nach dem Rennen über den 🏆-Knopf. Auf schmalen Bildschirmen schaltet man zwischen den beiden Listen per Tab um.

Gemeldet wird nur vom eigenen Gerät, für den eigenen Truck und genau einmal pro Rennen: beim Zieleinlauf oder bei der Disqualifikation, dann ohne Sieg. Wer ein Rennen abbricht, meldet nichts.

**Einrichtung (einmalig):** Im Supabase-Dashboard unter *SQL Editor* den Inhalt von `supabase-setup.sql` ausführen. Die Datei legt Folgendes an:
- die Tabelle `f1_stats` (nur lesbar für anon);
- die RPC-Funktion `f1_add_result(name, won, hits, truck)`. Sie zählt per *security definer* hoch, ist auf höchstens 20 Treffer und 1 Meldung pro Name alle 20 s begrenzt und für anon freigegeben.

Die Flappy-Tabelle `scores` wird nicht angefasst. Solange die Tabelle fehlt, zeigt das Spiel „Bestenliste noch nicht eingerichtet“ und läuft normal weiter.

## Version und Cache

- Im Fahrzeugmenü steht unten links die Build-Version (z. B. „Version 20261031-1250“).
- `style.css` und `js/main.js` werden mit `?v=<Build>` eingebunden, und `index.html` hat no-cache-Meta-Tags. So lädt ein Handy nach einem Update die neue Version.
- GitHub Pages schickt `index.html` trotzdem mit `max-age=600`. Im Zweifel einmal neu laden; passen HTML und Skript nicht zusammen, zeigt das Label „⚠️ bitte neu laden“.

## Steuerung
**Smartphone (Querformat, empfohlen).** Auf Touch-Geräten werden die Touch-Steuerelemente automatisch eingeblendet.
- **Links unten: analoger Stick zum Lenken.** Je weiter der Daumen zur Seite geht, desto stärker lenkt der Truck.
  - Stick **nach unten ziehen** = Bremse bzw. Rückwärts (der Ring leuchtet dann rot).
  - Tippt man irgendwo in der linken unteren Bildschirmhälfte, springt der Stick unter den Daumen.
- **Rechts unten: großer GAS-Button.**
- **Darüber: FEUER** für den HA-Only Vertrag, gut mit dem rechten Daumen erreichbar.
- **Daneben: 🚀 RAKETE** (leuchtet bei 5/5 TV-Verträgen) und links neben GAS der kleine **💼**-Button für den Business-Vertrag. Beide liegen weder über dem Stick noch über GAS und sind gedimmt, solange man nichts hat.
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
| Rakete (bei 5/5 TV) | R |
| Business-Vertrag ablegen | B |
| Pause | Esc / P |
| Ton an/aus | M |
| Hupe | H |
| Musik an/aus | N (oder 🎵) |

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
Supabase-URL und der öffentliche *publishable* Key stehen oben in `js/main.js` (`SUPABASE_URL`, `SUPABASE_KEY`). Der Multiplayer nutzt nur den Realtime-Channel `rf1f-PUBLIC` (offene Lobby). In die Datenbank schreibt allein die Bestenlisten-RPC `f1_add_result`; siehe `supabase-setup.sql`.

URL-Parameter zum Testen:
- `?laps=1` setzt die Rundenanzahl (1–9).
- `?autodrive` lässt den eigenen Truck von der KI fahren.
- `?hour=N` erzwingt eine Uhrzeit von 0 bis 24, z. B. `?hour=23` für Nacht.
- `?touchui` zeigt die Touch-Steuerung (Stick, GAS, FEUER, RAKETE, 💼) auch am Desktop.
- `?ai=0..7` setzt die Zahl der KI-Gegner im Solo-Rennen (Standard 6).
- `?testlobby=NAME` funktioniert nur zusammen mit `?autodrive` und verlegt die Lobby für automatische Tests auf einen eigenen Kanal, damit echte Spieler nicht gestört werden.
- `?nostats` meldet keine Ergebnisse. Mit `?autodrive`, `?laps` oder `?ai` wird ohnehin nichts gemeldet, damit Testläufe die Bestenliste nicht verfälschen.

## Bekannte Einschränkungen
- Die ?-Boxen und TV-Verträge werden im Multiplayer nicht synchronisiert. Jeder Client verwaltet sie selbst, deshalb kann jeder jede Box einsammeln; das Loot wird lokal ausgewürfelt.
- Raketen-Treffer entscheidet der Client des Schützen anhand seiner (leicht verzögerten) Sicht auf die Positionen.
- Kollisionen mit Mitspielern werden auf jedem Gerät für das eigene Fahrzeug aufgelöst. Ein Rempler wird zusätzlich übertragen, damit beide denselben kleinen Schubs bekommen (ohne Dreher); bei hoher Latenz kann er aber leicht versetzt wirken.
- Treffer entscheidet der getroffene Client. Bei hoher Latenz kann ein Vertrag deshalb optisch „durchfliegen“.
- Maximal 8 Spieler pro Rennen. Wer während eines laufenden Rennens beitritt, fährt erst beim nächsten Rennen mit.
- Leistung: Die Stadt besteht aus wenigen zusammengeführten Meshes (pro Material und 110-m-Zelle), Laternen und Straßenmöbel sind InstancedMeshes, und es gibt keine Schatten. Am meisten Draw Calls kosten die detailreichen Trucks, deshalb werden Trucks im Nebel nicht gezeichnet.
- Neigungssteuerung (Tilt) ist nicht eingebaut; gesteuert wird über den Touch-Stick.
- Rundenbestzeiten werden nicht gespeichert, nur Siege und Treffer.
- Die Bestenliste hängt am Namen, ohne Login. Wer denselben Namen wählt, zählt auf dasselbe Konto.
- Im Multiplayer schicken bis zu 4 Spieler 8 Positionen pro Sekunde, 5–8 Spieler 5 pro Sekunde. Das schont das Realtime-Kontingent; die Bewegung wird dazwischen interpoliert.
- Freie Multiplayer-Plätze werden (noch) nicht mit KI aufgefüllt.
- Die Host-Wahl nutzt die Uhrzeit der Geräte beim Beitritt. Das ist eindeutig, aber bei falsch gehender Uhr ist nicht unbedingt der „wirklich Erste“ Host.
