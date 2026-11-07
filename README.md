# MINERVA

Davids persönliches Organisationssystem als installierbare Web-App.

- **Oberfläche:** diese Seite (GitHub Pages). Startet sofort aus dem Speicher des Geräts, läuft im Vollbild und offline.
- **Daten:** bleiben im Google Sheet „MINERVA_Datenbank“. Die App spricht über Apps Script (`apps-script/Code.gs`, Funktion `doPost`) mit dem Sheet, geschützt mit einem geheimen Schlüssel.
- **In diesem Repository liegen keine Daten und keine Schlüssel.** Den Schlüssel kennt nur das Apps-Script-Projekt und jedes verbundene Gerät.

## Einrichten (einmalig)

1. **Apps Script aktualisieren:** Im Apps-Script-Editor `Code` und `Index` durch `apps-script/Code.gs` und `apps-script/Index.html` ersetzen, speichern.
2. **Schlüssel anlegen:** Oben im Editor die Funktion `appEinrichten` wählen, „Ausführen“. Im Ausführungsprotokoll steht der Schlüssel. Kopieren.
3. **Schnittstelle freigeben:** „Bereitstellen“ → „Neue Bereitstellung“ → Typ „Web-App“, „Ausführen als: Ich“, „Zugriff: Jeder“ → „Bereitstellen“. Die Web-App-URL (endet auf `/exec`) kopieren. Die bisherige Bereitstellung bleibt, wie sie ist.
4. **App verbinden:** Die App öffnen, Adresse und Schlüssel eintragen, „Verbinden“.
5. **Installieren:** iPhone/iPad: Safari → Teilen → „Zum Home-Bildschirm“. Android/PC: Chrome → „App installieren“. Auf dem iPhone hat die installierte App einen eigenen Speicher: dort einmal neu verbinden.

## Updates

- **Oberfläche:** neue Dateien in dieses Repository. Die App lädt sie im Hintergrund und ist beim nächsten Öffnen auf dem neuen Stand.
- **Apps Script** (selten nötig): `Code`/`Index` ersetzen, speichern, dann „Bereitstellen“ → „Bereitstellungen verwalten“ → Stift → Version „Neue Version“ → „Bereitstellen“.

## Sicherheit

- Ohne Schlüssel liefert die Schnittstelle nichts. Neuer Schlüssel: Funktion `appSchluesselErneuern` ausführen, danach alle Geräte neu verbinden.
- Die alte Oberfläche (`/dev`) zeigt Daten nur dem Besitzer des Skripts.
