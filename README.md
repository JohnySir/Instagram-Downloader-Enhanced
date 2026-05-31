<div align="center">

# 📸 Instagram Downloader Enhanced
### Version 4 — by hoaianle × My Custom Enhancements

![Version](https://img.shields.io/badge/Version-4.0-blueviolet?style=for-the-badge&logo=github)
![Manifest](https://img.shields.io/badge/Manifest-V3-blue?style=for-the-badge&logo=googlechrome)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![Platform](https://img.shields.io/badge/Browser-Chrome%20%2F%20Edge-orange?style=for-the-badge&logo=googlechrome)

> **Download Instagram photos, videos, reels, and stories** — now with a draggable button, position lock, one-click bulk download, and popup reset control.

</div>

---

## 🧬 Credits & Base Code

> [!IMPORTANT]
> The **core download engine** is built on top of the excellent open-source extension by **[HOAI AN LE (hoaianle)](https://github.com/hoaianle/Instagram-Downloader)**.
> All original logic for fetching posts, reels, stories, highlights, and ZIP packaging belongs to him.
> This fork adds a set of UI/UX enhancements on top — full details in the [New Features](#-new-features-v4) section below.

| | Detail |
|---|---|
| 🧑‍💻 **Original Author** | HOAI AN LE |
| 🔗 **Original Repo** | [github.com/hoaianle/Instagram-Downloader](https://github.com/hoaianle/Instagram-Downloader) |
| 📄 **License** | MIT — Copyright © 2022 HOAI AN LE |
| 🔀 **This Fork** | Instagram Downloader Enhanced — V4 |

---

## ✨ New Features (V4)

These features were **custom-built on top of the base** and are not part of the original extension:

---

### 🟣 Draggable Download Button

The floating `Download` button can be **dragged anywhere on screen**.

- Grab and drag it to your preferred corner or position
- Position is **saved automatically** — it stays where you put it even after refreshing or navigating to another post
- Uses `chrome.storage.local` to persist position across sessions

---

### 🔒 Lock / Unlock Button

A **🔒 lock toggle** in the media panel's title bar lets you control whether the download button can be dragged.

| State | Icon | Behavior |
|---|---|---|
| Locked (default) | 🔒 | Button acts normally — click to download |
| Unlocked | 🔓 | Button becomes draggable — grab and move it |

> Click the lock icon in the top-right of the media panel to toggle.

---

### ⬇ Download All Button

A **⬇ one-click button** in the panel title bar downloads everything currently visible.

| Items in panel | What happens |
|---|---|
| 1 item | Downloads that file directly |
| 2+ items | Bundles all into a single `.zip` file automatically |

> No need to manually select each item — one click, everything saved.

---

### 🎯 Smart Panel Positioning

The media panel **opens anchored to wherever your Download button is** — not at a fixed hardcoded position.

- Drag your button to the top-left? Panel opens top-left.
- Panel is smart enough to **flip direction** if it would go off-screen.
- Always stays fully within the viewport.

---

### 🔄 Reset Button Position (Popup)

Click the **extension icon** in your browser toolbar to open the Settings popup.

- Hit **"Reset Button Position"** to snap the Download button back to the **center of the screen**
- Useful if you accidentally dragged it off-screen or to an awkward spot
- Also clears the saved position from storage

---

## 🚀 Installation Guide

> [!NOTE]
> You do **not** need to install anything from a web store. You load it directly from the folder on your computer. This is called "Developer Mode" loading — don't worry, it's totally safe and easy!

---

### Step 1 — Download the Extension

```
📁 Make sure you have the extension folder on your computer.
   It should contain: manifest.json, popup.html, src/, icons/, etc.
```

If you received a `.zip` file:
1. Right-click the `.zip` file
2. Click **"Extract All..."**
3. Choose a folder you'll remember (e.g. `Documents\Instagram-Downloader`)
4. Click **Extract**

---

### Step 2 — Open Chrome Extensions Page

Open **Google Chrome** (or Microsoft Edge) and do one of the following:

**Option A — Type in the address bar:**
```
chrome://extensions
```
*(For Edge, type `edge://extensions`)*

**Option B — Use the menu:**
```
Click the ⋮ three-dot menu (top right)
→ More Tools
→ Extensions
```

---

### Step 3 — Enable Developer Mode

> [!IMPORTANT]
> This step is required. Without it, you cannot load your own extensions.

Look for the **"Developer mode"** toggle in the **top-right corner** of the Extensions page.

```
┌─────────────────────────────────────────────┐
│  Extensions                  Developer mode ●│  ← Toggle this ON
└─────────────────────────────────────────────┘
```

Click it so it turns **blue / on**.

---

### Step 4 — Load the Extension

After enabling Developer Mode, you'll see three new buttons appear. Click:

```
[ Load unpacked ]
```

A file picker will open. **Navigate to your extension folder** — the one that contains `manifest.json` — and click **"Select Folder"**.

> [!TIP]
> Make sure you select the **folder itself**, not a file inside it. The folder should contain `manifest.json` at its root.

---

### Step 5 — Pin It to Your Toolbar (Recommended)

```
Click the 🧩 puzzle piece icon in the top-right of Chrome
→ Find "Instagram Downloader Enhanced"
→ Click the 📌 pin icon next to it
```

Now the extension icon will always be visible in your toolbar for quick access to settings.

---

### Step 6 — Use It!

1. Go to **[instagram.com](https://www.instagram.com)**
2. Open any **post, reel, story, or highlight**
3. A **`Download` button** will appear on screen
4. Click it to fetch the media — a panel slides open showing all photos/videos
5. Click any individual item to download it, or hit **⬇** in the panel header to grab everything at once

---

## 🎮 Controls Cheat Sheet

| Action | How |
|---|---|
| **Open/fetch media** | Click `Download` button — or press `D` |
| **Close panel** | Click `×` — or press `Escape` / `C` |
| **Select multiple** | Press `S` to enter select mode, click items |
| **Download selected** | Click `Download` again while in select mode |
| **Select / Deselect all** | Long-press the "Media" title |
| **Download everything** | Click `⬇` in the panel title bar |
| **Lock / Unlock drag** | Click `🔒` in the panel title bar |
| **Drag button** | Unlock first (`🔓`), then drag the Download button |
| **Reset button position** | Click extension icon in toolbar → "Reset Button Position" |

---

## 🗂 What Can It Download?

| Content Type | Supported |
|---|---|
| 📷 Single photo post | ✅ |
| 🎞 Carousel (multi-photo post) | ✅ |
| 🎬 Video / Reel | ✅ |
| 📺 IGTV | ✅ |
| 📖 Stories | ✅ |
| 🌟 Highlights | ✅ |

---

## 🛠 Troubleshooting

> [!WARNING]
> If the Download button doesn't appear on Instagram, try these steps.

**Button not showing?**
- Go to `chrome://extensions` and make sure the extension is **enabled** (toggle is blue)
- Click the 🔄 refresh icon on the extension card
- Hard-refresh Instagram: `Ctrl + Shift + R`

**"Could not establish connection" error in popup?**
- This is normal if no Instagram tab is open — open Instagram first, then try again

**Button went off-screen?**
- Click the extension icon in your toolbar → **"Reset Button Position"**

**Extension disappeared after Chrome update?**
- Chrome sometimes disables unpacked extensions after updates
- Go to `chrome://extensions`, find it, and re-enable it

---

## 📁 File Structure

```
Instagram-Downloader Enhanced/
│
├── 📄 manifest.json          — Extension config (permissions, scripts)
├── 🌐 popup.html             — Settings popup UI
├── ⚙️  popup.js              — Reset position logic
├── 📁 icons/                 — Extension icons (16, 32, 48, 128px)
│
└── 📁 src/
    ├── 📁 js/
    │   ├── main.js           — UI init, drag, lock, event handling
    │   ├── utils.js          — Download logic, downloadAll(), panel positioning
    │   ├── post.js           — Post/reel media fetching
    │   ├── story.js          — Story/highlight fetching
    │   ├── zip.js            — ZIP bundling helper
    │   └── 📁 global/        — Home feed, stories, reels observers
    │
    └── 📁 style/
        └── style.css         — All extension styles
```

---

## 📜 License

```
MIT License — Copyright (c) 2022 HOAI AN LE

Original project: https://github.com/hoaianle/Instagram-Downloader
V4 Enhancements by Johny: Draggable button, lock/unlock, download-all, smart panel positioning
```

Permission is hereby granted, free of charge, to any person obtaining a copy of this software to deal in it without restriction — including the rights to use, copy, modify, merge, and distribute — subject to the original MIT License terms.

---

<div align="center">

Built on 💜 by **[hoaianle](https://github.com/hoaianle/Instagram-Downloader)** · Enhanced with ⚡ by **Johny**

</div>
