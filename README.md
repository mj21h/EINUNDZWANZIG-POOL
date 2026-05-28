# EINUNDZWANZIG POOL 🌋

Eine Fokus-Plattform für Bitcoin-Marktanalysen, interaktive Indikatoren und nützliche Einsteiger-Ressourcen – konzipiert als Progressive Web App (PWA) mit automatisierter Android APK-Kompilierung.

---

## 🚀 Features

- **Bitcoin-Marktanalysen & Metriken**: Interaktive Daten-Visualisierungen und Diagramme wichtiger On-Chain- und Preis-Indikatoren.
- **Progressive Web App (PWA)**: Direkte Installation auf dem Homescreen, Offline-Caching und schnelle Ladezeiten.
- **Automatisierte APK/AAB Builds**: GitHub Actions Workflow zur automatischen Generierung signierter Android-Apps.

---

## 📱 Android-App & APK Build Pipeline

Dieses Repository enthält einen fertigen CI/CD-Workflow (`.github/workflows/build-apk.yml`), der bei jedem Push auf den `main`- oder `master`-Branch vollautomatisch Android-Installationsdateien erstellt.

### Build-Prozess im Workflow:

- **Lokaler Bubblewrap-Compiler (Offline-Build)**:
  - Kompiliert das Projekt direkt auf dem GitHub-Runner unter Verwendung von **JDK 17** und dem **Android SDK**.
  - Erstellt einen lokalen Keystore zur sicheren Signierung der APK.
  - Initialisiert das Android-Projekt vollautomatisch und nicht-interaktiv.
  - Gibt eine direkt installierbare, signierte Release-APK (`app-release-signed.apk`) aus.

### APK manuell herunterladen:
Nach jedem Workflow-Durchlauf auf GitHub findest du die fertigen Builds in den **Action-Artifacts** deines GitHub-Runs zum direkten Download.

---

## 🛠️ Lokale Entwicklung

### Voraussetzungen
Stelle sicher, dass **Node.js (v20+)** auf deinem System installiert ist.

### 1. Repository klonen und Abhängigkeiten installieren
```bash
git clone https://github.com/DEIN_USERNAME/einundzwanzig-pool.git
cd einundzwanzig-pool
npm install
```

### 2. Entwicklungs-Server starten
```bash
npm run dev
```
Der Server läuft standardmäßig auf `http://localhost:3000`.

### 3. PWA für Produktion kompilieren
```bash
npm run build
```
Die fertigen statischen Dateien werden im Ordner `dist/` abgelegt.
