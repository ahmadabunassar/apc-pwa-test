# APC PWA Test

A tiny Progressive Web App that installs on **iPhone and Android** for free, hosted on your own server.
No npm install needed. It needs only Node.js.

## Run it
```
node server.js
```
It prints the addresses, for example `http://localhost:3000` and `http://10.x.x.x:3000`.
To use another port: `set PORT=8080 && node server.js` on Windows, or `PORT=8080 node server.js` on Linux.

## Test steps
1. **On your PC:** open http://localhost:3000 in Chrome or Edge. It already counts as a full PWA,
   because localhost is allowed without HTTPS. Click the install icon in the address bar.
2. **On a phone:** the phone needs **HTTPS** before install and offline mode work.
   With plain `http://10.x.x.x:3000` the page still opens, but it won't install as a real app.
   The quickest free way to get HTTPS:
   - **Cloudflare Tunnel:** install `cloudflared` on the server, then run
     `cloudflared tunnel --url http://localhost:3000`
     It prints a temporary `https://xxxx.trycloudflare.com` link. Open that link on the phone.
     (For a permanent address, use a named tunnel with your own domain. This is also free.)
   - Or, if IT gives you an internal domain plus certificate, put IIS or nginx in front of port 3000.
3. **iPhone:** open the HTTPS link in **Safari** → Share → **Add to Home Screen**.
   **Android:** open it in Chrome → **Install app**.
4. Open the app from its icon. Then:
   - Section 1 should say "Running as an installed app".
   - Section 2: ping the server.
   - Section 3: add notes. They are saved in `notes.json` on the server.
   - Section 4: take a photo with the camera.
   - Turn on airplane mode and reopen the app. It still opens (offline cache), and the badge shows Offline.

## Updating the app
Edit the files, then change `VERSION` in `public/sw.js` (for example to `apc-test-v2`).
Phones pick up the new version the next time they open the app.

## Files
- `server.js`: web server and API (`/api/time`, `/api/notes`)
- `public/manifest.webmanifest`: app name, icons and colors
- `public/sw.js`: service worker (offline cache)
- `public/index.html`, `app.js`, `style.css`: the app itself
- `public/icons/`: app icons (replace them with the APC logo)

## Next step
Replace `notes.json` with your SQL Server, using the `mssql` package, the same way you do in your Express apps.
