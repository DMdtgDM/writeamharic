# Direnya on phones

The playground is now an installable, offline-capable app (PWA). Nothing loads from the internet:
CodeMirror, JSZip and the Ethiopic font live in `playground/vendor/`.

## Option 1 — install from the web (easiest, no app store)
1. Host the `playground/` folder on any HTTPS static host (GitHub Pages, Netlify, Cloudflare Pages…).
2. Open `playground/index.html`'s `SHARE_BASE_URL` constant and set it to that address so share links work for everyone.
3. On Android/Chrome tap **📲 ጫን (Install)**. On iPhone: Share → *Add to Home Screen*.
After the first visit it works with no internet.
When you change any file listed in `playground/sw.js`, bump `CACHE` there so phones pick up the update.

## Option 2 — real APK / iOS app (Capacitor)
Needs Node, plus Android Studio (APK) or Xcode (iOS).
```
npm init -y
npm i @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npx cap add android        # and/or: npx cap add ios
npx cap sync
npx cap open android       # build/run from Android Studio
```
`capacitor.config.json` already points `webDir` at `playground/`. After editing the playground, run `npx cap sync` again.
Icons: `playground/icons/` (192, 512, maskable). Replace the generated launcher icons in Android Studio's Image Asset tool using `icon-512.png`.

## What's phone-specific
- Code / Preview tabs at the bottom and a floating ▶ button (screens under 760px wide).
- First-launch welcome (3 screens), reopen with ❔.
- Safe-area padding for notches; offline service worker.
