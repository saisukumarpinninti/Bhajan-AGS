# Bhajan Mandali

A React/Vite devotional library app, configured for the GitHub Pages repository `saisukumarpinninti/Bhajan-AGS`.

## Configure Firebase

1. Create a Firebase project and register a Web app.
2. Enable **Authentication > Sign-in method > Anonymous**.
3. Create a Firestore database.
4. Copy the Firebase web app settings into [`firebase.config.js`](firebase.config.js), replacing each `YOUR_...` value. Keep `appId` as the Firestore collection namespace unless you intentionally want a different data path.
5. Set Firestore rules for the app's data at `artifacts/{appId}/public/data/...`. The admin password screen in this app is client-side convenience, not a security boundary; do not grant public writes in production without adding server-enforced authorization rules.

Firebase web app settings are intended to be present in browser code. Never put Firebase service account keys or other private credentials in this file.

## Run locally

```sh
npm install
npm run dev
```

To create and preview a production build:

```sh
npm run build
npm run preview
```

## Deploy to GitHub Pages

1. Upload these project files to the `main` branch of `https://github.com/saisukumarpinninti/Bhajan-AGS`.
2. In the repository, open **Settings > Pages** and set **Build and deployment > Source** to **GitHub Actions**.
3. The workflow in `.github/workflows/deploy.yml` builds and deploys on every push to `main`.

The site URL will be `https://saisukumarpinninti.github.io/Bhajan-AGS/`. The Vite base path is configured for that repository name in `vite.config.js`.
