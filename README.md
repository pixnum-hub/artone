# Artone PWA — Complete Package v2.1.0
© 2026 Manik Roy · All Rights Reserved

## What's in this package

```
artone-pwa/
├── index.html              ← The full Artone app (rename to your server's homepage)
├── manifest.json           ← Web App Manifest
├── sw.js                   ← Service Worker (real file, used first)
├── offline.html            ← Offline fallback page
├── favicon.ico             ← Multi-size favicon
├── icons/                  ← 19 icon sizes + maskable
├── splash/                 ← 10 iOS splash screens
└── screenshots/            ← Add your own desktop.png / mobile.png
```

`index.html` already contains ALL the PWA `<head>` tags AND the registration
script — **no copy-pasting required**. Just deploy the whole folder.

## How the Service Worker registration works

`index.html` tries, in order:

1. **`/sw.js`** (this real file) — used when deployed to your own server
2. **Embedded Blob fallback** — used if `/sw.js` returns 404 (e.g. when
   `index.html` is opened as a single file without the rest of the folder)
3. **Skips silently** — if running inside a sandboxed iframe (like a chat
   preview) or over `file://`. Artone works 100% normally either way —
   the Service Worker only adds offline caching as a bonus.

## Deployment (3 steps)

### 1. Upload everything
```bash
# Copy the whole folder to your web root
cp -r artone-pwa/* /var/www/html/
```

### 2. Serve over HTTPS
Service Workers require HTTPS (or `localhost` for local testing).
```bash
npx serve .          # quick local test on http://localhost:3000
```

### 3. Verify in Chrome DevTools
- **Application → Manifest** — should show ✓ with no errors
- **Application → Service Workers** — should show "activated and running"
- **Application → Cache Storage** — should list `artone-v2.1.0`

## Install on devices

| Platform          | How to install                         |
|--------------------|-----------------------------------------|
| Android Chrome     | Auto "Add to Home Screen" banner appears |
| iOS Safari         | Share → "Add to Home Screen"             |
| Chrome Desktop     | Install icon (⊕) in address bar          |
| Edge Desktop       | Apps menu → "Install this site as an app"|
| Samsung Internet   | Menu → "Add page to" → Home screen       |

## Features enabled by this PWA package

| Feature              | Where |
|----------------------|-------|
| Offline mode          | `sw.js` caches core assets, fonts, icons |
| Auto-update banner    | "🔄 Artone updated" prompt with Reload button |
| Install prompt        | "📲 Install Artone" floating button |
| App shortcuts         | Long-press icon → New / Presets / AI Art / Export |
| Share target          | Share an image to Artone from gallery/Files apps |
| File handler          | Open .png/.jpg/.webp files directly in Artone |
| Push notifications    | `sw.js` push + notificationclick handlers |
| Background sync       | Queues saves when offline, retries when online |
| iOS splash screens     | 10 device-specific launch images |
| Maskable icon          | Android adaptive icon with safe-zone padding |

## Updating to a new version

1. Edit `index.html` with your changes
2. Bump `SW_VER` in **both**:
   - `sw.js` (top of file)
   - `index.html` (inside the embedded `swSource` template, search for `SW_VER`)
3. Redeploy — users will see the update banner automatically

## Icon Reference

| File                          | Used for                        |
|--------------------------------|----------------------------------|
| icon-16x16.png, icon-32x32.png | Browser favicon                 |
| icon-48x48.png                 | Windows taskbar                 |
| icon-57/60/72/76/114/120px     | Legacy iOS home screen icons    |
| icon-96x96.png                 | Android Chrome, notification badge |
| icon-128x128.png               | Chrome Web Store                |
| icon-144x144.png               | Windows tile, iPad retina       |
| icon-152x152.png               | iPad                            |
| icon-167x167.png               | iPad Pro                        |
| icon-180x180.png               | iPhone (current)                |
| icon-192x192.png               | Android home screen (`any`)     |
| icon-256/384x.png              | High-DPI desktop                |
| icon-512x512.png                | Android splash, Chrome install  |
| icon-512x512-maskable.png       | Android adaptive icon           |

## Splash Screens

All 10 cover current iPhone (SE → 14/15 Pro Max) and iPad (9th gen → Pro 12.9")
in portrait orientation, generated with a dark background matching the app theme.

## Adding Screenshots

For a richer install dialog on Android/Chrome, add:
- `screenshots/desktop.png` — 1280×720, wide form factor
- `screenshots/mobile.png` — 390×844, narrow form factor

These are already referenced in `manifest.json`.
