# OmniTag - Universal Tag Search Engine & Media Browser

OmniTag is a modern, responsive tag-based media search engine and gallery application designed to work across PC, mobile, and tablets. It features a Google-style interface with real-time tag autocompletion, multi-tag queries, a rich media lightbox, and a switchable API system that allows you to easily switch between different imageboards or configure your own custom endpoints.

---

## 🌟 Key Features

- **Google-Style Search Experience:**
  - Clean centered home view with large search bar and quick tags.
  - Seamlessly transitions to a sticky top navigation bar when viewing results.
  - Real-time tag autocomplete powered by the active API source.
  - Support for multi-tag queries (`solo blue_eyes`) and tag negation (`-blonde_hair`).
  - Highlights matching characters and displays tag category badges and post counts.

- **Switchable API Sources & Custom Booru Manager:**
  - **1-Click Switching:** Switch between different APIs directly from the search bar or header.
  - **Dynamic Adaptation:** When you switch sources, the tag autocompletion, post fetch endpoints, and image paths automatically adapt to that site's schema.
  - **Built-in Safe Presets:** Safebooru, Danbooru (Safe), Yande.re (Safe), Konachan (Safe).
  - **Rule34 (18+):** Included as a preset. Its API needs a free API key and User ID (rule34.xxx > My Account > Options > API Access Credentials). Open **Manage / Add APIs**, click **Edit** on Rule34 and paste them in. Results are not safe-filtered; use the Rating filter to narrow them.
  - **Add Any Custom Booru:** Easily add any Gelbooru DAPI, Danbooru v2, or Moebooru compatible endpoint by providing the base URL.
  - **Proxy Configuration:** Built-in auto proxy, public CORS proxies (corsproxy.io / allorigins), or direct connection.
  - **Backup & Transfer:** Export your configured sources to a JSON file or import them on any device.

- **Rich Media Viewer (Lightbox):**
  - High-resolution display with support for static images, animated GIFs, and looping WebM/MP4 videos.
  - Keyboard navigation (Left/Right arrows for next/previous, Esc to close).
  - Categorized tag sidebar (Artist, Character, Copyright/Series, General). Click any tag to instantly search for it.
  - Download full resolution media directly or copy the media URL.
  - Save favorites to your local bookmarks collection.

- **Universal Device Support (PWA & Responsive):**
  - Works on PC, Mac, Linux, Android, iPhone, and iPad.
  - Responsive mobile layout with touch-friendly navigation.
  - Progressive Web App (PWA): Install as a standalone desktop or mobile home screen application.
  - Dark & Light mode toggle with automatic system theme detection.

---

## 📱 Native Android App (APK)

You can download and install the standalone native Android APK directly on your phone:

- **[⬇️ Download OmniTag.apk](https://github.com/subnow846-ai/omnitag-app/releases/latest/download/OmniTag.apk)**
- **GitHub Release Page:** [https://github.com/subnow846-ai/omnitag-app/releases](https://github.com/subnow846-ai/omnitag-app/releases)

### How to Install on Android:
1. Tap the download link on your Android phone.
2. Open the downloaded `OmniTag.apk` file from your notification bar or **Downloads** folder.
3. If prompted, select **Settings** and enable **"Allow from this source"**.
4. Tap **Install** and launch OmniTag!

---

## 📱 Instant 1-Click Install to Phone (Scan QR Code)

Double-click:
```
share-to-phone.bat
```
*This automatically sets up a secure public link and pops up a QR code on your PC screen.*

1. Point your iPhone or Android camera at the QR code on your screen.
2. Tap the link to open OmniTag Mobile.
3. Tap **"Install App"** on the banner to download the app directly to your phone's home screen!

---

## 🚀 How to Launch on Windows PC

You have two easy ways to launch the app:

### 1. Standalone Native App Window (Recommended)
Double-click:
```
launch-app-mode.bat
```
*This launches the local server silently and opens the app in a dedicated, borderless desktop window (using Microsoft Edge App Mode), looking and feeling like a native desktop app.*

### 2. Dedicated Mobile Phone Edition (Run on PC Without a Phone)
Double-click:
```
launch-mobile.bat
```
*This launches the dedicated smartphone-first edition in a native vertical mobile phone frame directly on your PC screen, with bottom navigation tabs, horizontal filter pills, touch sheets, and swipeable viewer.*

### 3. Browser Mode
Double-click:
```
start.bat
```
*This starts the lightweight server and opens OmniTag in your default web browser.*

---

## 📱 How to Use on Phone, Tablet, or Other Devices

When `start.bat` or `server.ps1` runs, it automatically detects your local network IP and prints it in the console:

```
==========================================================
                OmniTag Search Engine                     
==========================================================

  [OK] Server running!
  * PC Access:      http://localhost:8080/
  * Mobile/Tablet:  http://192.168.1.XXX:8080/
```

1. Make sure your phone or tablet is connected to the same Wi-Fi network as your PC.
2. Open Safari, Chrome, or any browser on your phone and go to the **Mobile/Tablet URL** (e.g. `http://192.168.1.XXX:8080/`).
3. Tap **"Add to Home Screen"** or **"Install App"** in your mobile browser to install it as an app icon!

---

## ⚙️ How to Add or Switch Custom APIs

1. Click the active site badge (e.g. **Safebooru ▾**) next to the search input.
2. Select any existing site from the dropdown to switch immediately.
3. To add a new site, click **"⚙️ Manage / Add APIs..."** or click the header pill.
4. Click **"+ Add Custom API"**:
   - **Name:** Enter a descriptive name.
   - **API Protocol:** Choose the format (e.g., `Gelbooru / Safebooru DAPI`, `Danbooru 2.x API`, or `Moebooru`).
   - **Base URL:** Enter the site URL (e.g., `https://your-booru-site.com`).
   - The app will automatically populate default post and tag autocomplete URLs.
   - Click **"Save Source"** — it is now instantly active!
5. You can also click **"Export JSON"** to backup your configurations or transfer them to another device.
