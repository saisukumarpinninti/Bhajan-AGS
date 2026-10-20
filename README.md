# Bhajan Mandali 🪔

A React devotional music & lyrics library web app configured for GitHub Pages (`saisukumarpinninti/Bhajan-AGS`).

---

## 🌟 Key Features

1. **Devotional Lyrics Player**:
   - Edge-to-edge stanza highlight with repeat counters (`x2`, `x3`).
   - Dual-language toggle: Hindi / Sanskrit and English transliteration.
   - Live font size adjustments (`A-`, `A+`) for singers and devotees.
   - Embedded YouTube accompaniment with auto-extracted video IDs.
   - Closing Nara (chant) banner.

2. **Session Queue & Live Link Sharing**:
   - Queue up bhajans for tonight's satsang or bhajan mandali session.
   - 1-click **Share Session Link**: Generates a shareable URL (`?queue=id1,id2,id3`) so all participants open the exact same bhajan lineup simultaneously on their phones.

3. **Admin Lyrics Creation & Editing**:
   - Add new bhajans and edit existing ones.
   - **Line-by-Line Stanza Editor**: Manage Hindi and English lines, set repeat multipliers, reorder stanzas up/down, and delete stanzas.
   - **Quick Text Paste**: Paste entire lyrics from WhatsApp or Google Docs, and the app auto-splits them into stanzas.
   - Single-click duplication and deletion of bhajans.

4. **Assets Folder & Google Drive Workflow**:
   - **Database in Files**: All bhajans are stored in the [`assets/`](assets/) folder:
     - `assets/bhajans.json`: Master database file.
     - `assets/songs/`: Individual JSON files for each bhajan (e.g. `ganesha-vandana.json`, `achyutam-keshavam.json`).
   - **Export Database**: Admin can export the entire database to `bhajans.json` with one click to save into the `assets` folder or backup to Google Drive.
   - **Google Drive Extraction & Import**:
     - **Upload Files**: Select one or multiple `.json` files downloaded from your Google Drive folder.
     - **Google Drive Sharing Link**: Paste a public Google Drive sharing link to extract the JSON directly.
     - **Paste Raw JSON**: Paste JSON arrays or objects directly with live validation and preview before applying.
     - Choose between **Merge** (add/update) or **Replace Library**.

5. **100% File-Based Storage**:
   - Zero Firebase/cloud configuration needed.
   - Master database in `assets/bhajans.json` and `public/assets/bhajans.json`.
   - Browser storage cache for immediate, offline responsiveness.
   - Default admin login password is `admin` (can be changed from the Admin panel).

---

## 📁 Repository Structure

```
Bhajan-AGS/
├── assets/                          # Master JSON database & individual song files
│   ├── bhajans.json                 # Complete library database
│   └── songs/                       # Individual song JSON files for Drive & sharing
│       ├── ganesha-vandana.json
│       ├── achyutam-keshavam.json
│       ├── shiv-panchakshar.json
│       ├── durga-aarti.json
│       └── hanuman-chalisa.json
├── public/                          # Static assets served by Vite
│   └── assets/                      # Bundled copy for GitHub Pages
│       ├── bhajans.json
│       └── songs/
├── src/
│   ├── main.jsx                     # App entry point
│   └── style.css                    # Tailwind CSS base
├── bhajan_mandali.tsx               # Main React Application (100% file-based)
├── index.html                       # HTML root
└── vite.config.js                   # Vite configuration (base: /Bhajan-AGS/)
```

---

## 🚀 How to Run Locally

```sh
npm install
npm run dev
```

To create and preview a production build:

```sh
npm run build
npm run preview
```

---

## ☁️ Deploy to GitHub Pages

1. Push your code to the `main` branch of `https://github.com/saisukumarpinninti/Bhajan-AGS`.
2. In GitHub, go to **Settings > Pages** and set **Source** to **GitHub Actions**.
3. The site will automatically build and publish at:
   `https://saisukumarpinninti.github.io/Bhajan-AGS/`
