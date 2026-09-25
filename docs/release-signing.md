# Feste Signatur für App-Releases

Der Workflow `.github/workflows/build-apk.yml` signiert APK und AAB mit einem festen Release-Keystore aus GitHub-Actions-Secrets. Fehlt eines der Secrets, bricht der Build mit der Meldung „Signing secrets missing“ ab. So tragen alle Releases dieselbe Signatur, und Updates über eine bestehende Installation funktionieren.

## 1. Keystore einmalig erstellen (lokal, nicht im Repository)

```bash
keytool -genkeypair -v \
  -keystore einundzwanzig-release.keystore \
  -alias einundzwanzig \
  -keyalg RSA -keysize 4096 \
  -validity 10000 \
  -dname "CN=EINUNDZWANZIG POOL"
```

`keytool` fragt Keystore- und Schlüsselpasswort interaktiv ab. Starke, unterschiedliche Passwörter wählen und im Passwortmanager speichern.

**Wichtig:** Keystore und Passwörter sicher sichern (Passwortmanager plus Offline-Backup). Geht der Keystore verloren, lässt sich keine Update-fähige Version mehr bauen. Die Datei nie committen.

## 2. Keystore für das Secret base64-kodieren

```bash
# Linux
base64 -w0 einundzwanzig-release.keystore > keystore.b64
# macOS
base64 -i einundzwanzig-release.keystore -o keystore.b64
```

Den Inhalt von `keystore.b64` danach als Secret hinterlegen und die Datei `keystore.b64` löschen.

## 3. Secrets in GitHub anlegen

Repository → Settings → Secrets and variables → Actions → New repository secret:

| Secret | Inhalt |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | Inhalt von `keystore.b64` |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore-Passwort |
| `ANDROID_KEY_ALIAS` | Alias, im Beispiel `einundzwanzig` |
| `ANDROID_KEY_PASSWORD` | Schlüsselpasswort |

Alternativ mit der GitHub CLI:

```bash
gh secret set ANDROID_KEYSTORE_BASE64 < keystore.b64
gh secret set ANDROID_KEYSTORE_PASSWORD
gh secret set ANDROID_KEY_ALIAS --body einundzwanzig
gh secret set ANDROID_KEY_PASSWORD
```

## 4. Prüfen

Workflow unter Actions → „Build Offline Standalone APK“ → „Run workflow“ starten. Die Signatur der fertigen APK lässt sich prüfen mit:

```bash
apksigner verify --print-certs app-release.apk
```

Der SHA-256-Fingerprint muss bei jedem Build gleich sein und zu `keytool -list -v -keystore einundzwanzig-release.keystore` passen.

## 5. Einmalige Neuinstallation

Bisherige APKs wurden bei jedem Build mit einem neuen, zufälligen Schlüssel signiert. Android lehnt ein Update mit abweichender Signatur ab. Bestehende Installationen daher einmalig deinstallieren und die neu signierte APK installieren. App-Daten gehen dabei verloren. Ab dann funktionieren Updates direkt über die bestehende Installation.

## Fehlermeldungen im Workflow

| Meldung | Ursache |
|---|---|
| Signing secrets missing | Mindestens eines der vier Secrets fehlt oder ist leer |
| ANDROID_KEYSTORE_BASE64 is not valid base64 | Secret enthält kein gültiges Base64 (z. B. mit Zeilenumbrüchen kopiert) |
| Keystore could not be opened … | Falsches Keystore-Passwort oder Alias nicht im Keystore |
