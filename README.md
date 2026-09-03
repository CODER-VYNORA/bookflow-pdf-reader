# DINU RAATO KE READER💀🤫 — Local-first Interactive PDF Book Reader

DINU RAATO KE READER💀🤫 is a responsive PDF reader designed to feel like a physical book while keeping your library and annotations in the browser.

## What is included
- PDF library stored in IndexedDB (the PDF Blob is stored locally).
- Reading progress, bookmarks, highlights and highlight notes persist on the device/browser.
- PDF.js rendering + selectable text layer.
- Mouse drag, touch drag and swipe page turning.
- Desktop automatic two-page spread; mobile/tablet single-page reading.
- Paper / cream / dark reader themes and zoom.
- Searchable highlights and bookmarks.
- PWA install support: install DINU RAATO KE READER💀🤫 on Android, iPad/iPhone, Windows, macOS and supported tablets/desktops.
- Offline app shell and local PDF.js CMaps after the first successful load.
- Optional Gemini AI drawer remains available when its server/API is configured; the core library does not need an account or cloud database.

## Run locally

Prerequisite: Node.js 20+ recommended.

```bash
npm install
npm run dev
```

The included Express/Vite dev server already listens on `0.0.0.0:3000`, so for phone/tablet testing:

1. Find your laptop's local IPv4 address (for example `192.168.1.5`).
2. Make sure the phone/tablet and laptop are on the same Wi-Fi.
3. Run:

```bash
npm run dev
```

4. Open `http://YOUR-LAPTOP-IP:3000` on the phone/tablet.

If Windows Firewall asks, allow Node.js on the **Private network**.

## Build the web app

For a normal web/PWA deployment (for example Vercel):

```bash
npm install
npm run build:web
```

The production files are in `dist/`.

## Install on a phone/tablet

DINU RAATO KE READER💀🤫 is a **PWA**, not an APK. Once deployed over HTTPS:

- Android Chrome/Edge: open the site and choose **Install app** / **Add to Home screen**.
- iPhone/iPad Safari: Share → **Add to Home Screen**.
- Desktop Chrome/Edge: use the install icon in the address bar or browser menu.

After installation, the app opens like a normal app and its PDF library stays in that device/browser's IndexedDB. A PDF added on a phone is not automatically synced to a laptop.

## Important storage behavior

PDF files are stored locally in IndexedDB. Browser storage quotas vary by browser/device; DINU RAATO KE READER💀🤫 reads the browser's storage estimate when available and handles quota errors.

## AI

The core reader is local-first. The optional AI drawer calls `/api/gemini/chat` and therefore needs the project's server/API configuration. If you deploy only the static PWA without that API, the reader, PDFs, bookmarks and highlights still work; only AI chat will be unavailable.
