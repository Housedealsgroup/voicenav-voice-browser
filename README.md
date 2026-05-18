<div align="center">

<img src="assets/voicenav-logo.svg" alt="VoiceNav Voice Browser" width="320" height="320">

# **VoiceNav Voice Browser**

### Speak naturally. Browse everything. Zero limits.

A Progressive Web App voice-controlled browser. Speak commands to navigate, search, bookmark, and control the web — hands-free.

[![TypeScript](https://img.shields.io/badge/TypeScript_5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite_6-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev)
[![License](https://img.shields.io/badge/License-MIT-00E676?style=for-the-badge)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-21_Passing-00E676?style=for-the-badge)](#testing)
[![PWA](https://img.shields.io/badge/PWA-Ready-5F4BB6?style=for-the-badge&logo=pwa&logoColor=white)](#pwa)

---

<img src="assets/demo.svg" alt="VoiceNav Voice Browser Demo" width="100%">

*VoiceNav in action: speak naturally to navigate the web, search, bookmark pages, and control browsing — all processed in-browser with the Web Speech API.*

---

**100% Client-Side. No Cloud. No APIs. Zero Data Collection.**

</div>

---

## What Is This

VoiceNav is a Progressive Web App (PWA) that lets you control a web browser using voice commands. Tap the microphone, say a command, and watch it happen. The browser understands natural language and executes commands — navigating pages, searching, bookmarking, scrolling, and more.

Built with React + TypeScript + Vite, it works on any device with a modern browser. Install it as a PWA for a native app experience.

---

## Features

| Feature | Description |
|---------|-------------|
| **Voice Control** | Navigate, search, scroll, bookmark — all by voice |
| **Web Speech API** | Browser-native speech recognition and synthesis |
| **Smart Navigation** | Auto-detect URLs vs search queries |
| **Tab Manager** | Open, close, switch tabs by voice or click |
| **Bookmarks** | Save and organize pages by voice or click |
| **History** | Browsing history with timestamps |
| **Multiple Search Engines** | Google, DuckDuckGo, or Bing |
| **Font Size Control** | Zoom in/out by voice or settings |
| **PWA** | Install as app, works offline |
| **Dark Theme** | Easy on the eyes |
| **Voice Feedback** | Spoken confirmations for commands |
| **13 Languages** | Voice recognition in 13 languages |

---

## Quick Start

### 1. Clone

```bash
git clone https://github.com/Housedealsgroup/voicenav-voice-browser
cd voicenav-voice-browser
```

### 2. Install

```bash
npm install
```

### 3. Run

```bash
npm run dev
```

Open `http://localhost:3000` in your browser. Click the microphone and start speaking.

### 4. Build for Production

```bash
npm run build
npm run preview
```

---

## Voice Commands

### Navigation

| Command | Action |
|---------|--------|
| `Go to youtube.com` | Navigate to a website |
| `Open github.com` | Navigate to a website |
| `Search for weather` | Search the web |
| `Look up TypeScript` | Search the web |
| `Go back` / `Back` | Go to previous page |
| `Go forward` / `Forward` | Go to next page |
| `Reload` / `Refresh` | Reload current page |

### Page Control

| Command | Action |
|---------|--------|
| `Scroll down` / `Page down` | Scroll the page down |
| `Scroll up` / `Page up` | Scroll the page up |
| `Bookmark` / `Save this` | Save current page |
| `Zoom in` / `Bigger` | Increase text size |
| `Zoom out` / `Smaller` | Decrease text size |

### Tab Management

| Command | Action |
|---------|--------|
| `New tab` / `Open tab` | Open a new tab |
| `Close tab` | Close current tab |
| `Home` / `Go home` | Go to home screen |
| `Stop` / `Cancel` | Stop speaking |

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 19** | UI framework |
| **TypeScript 5.8** | Type-safe development |
| **Vite 6** | Build tool and dev server |
| **vite-plugin-pwa** | PWA generation with Workbox |
| **Web Speech API** | Speech recognition and synthesis |
| **Vitest** | Unit testing |
| **Testing Library** | Component testing |

---

## Project Structure

```
voicenav-voice-browser/
├── index.html              # Entry point
├── public/                 # Static assets
│   ├── favicon.svg         # App icon
│   └── manifest.json       # PWA manifest
├── src/
│   ├── main.tsx            # React entry
│   ├── App.tsx             # Root component
│   ├── App.css             # App styles
│   ├── index.css           # Global styles
│   ├── vite-env.d.ts       # Type declarations
│   ├── context/
│   │   └── AppContext.tsx   # Global state management
│   ├── hooks/
│   │   └── useVoice.ts     # Voice recognition hook
│   ├── components/
│   │   ├── Header.tsx       # Top navigation bar
│   │   ├── HomeScreen.tsx   # Home page with search
│   │   ├── BrowserView.tsx  # iframe-based browser
│   │   ├── TabBar.tsx       # Tab management
│   │   ├── VoiceOverlay.tsx # Voice listening overlay
│   │   ├── BookmarksView.tsx
│   │   ├── HistoryView.tsx
│   │   └── SettingsView.tsx
│   ├── types/
│   │   └── index.ts         # TypeScript types
│   └── test/
│       ├── setup.ts         # Test configuration
│       ├── App.test.tsx     # App component tests
│       ├── voice.test.ts    # Voice command tests
│       └── context.test.tsx # State management tests
├── assets/                  # Logos and images
├── package.json
├── tsconfig.json
├── vite.config.ts
└── LICENSE
```

---

## Testing

```bash
# Run all tests
npm test

# Run in watch mode
npm run test:watch
```

**21 tests across 3 suites** covering voice command parsing, state management, and component rendering.

---

## PWA

VoiceNav is a Progressive Web App. To install:

1. Open in Chrome/Edge/Safari
2. Click the install icon in the address bar
3. Or use the browser menu: "Install app" / "Add to Home Screen"

Features:
- Works offline (cached assets)
- Installable on desktop and mobile
- Standalone app window
- Auto-updates via service worker

---

## Privacy

| What | Status |
|------|--------|
| Data Collection | **Zero.** Nothing leaves your device. |
| Cloud Processing | **None.** All processing is in-browser. |
| Analytics | **None.** No tracking. No telemetry. |
| Subscriptions | **None.** Free and open source. |
| Ads | **None.** Forever. |

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**VoiceNav Voice Browser** by **HouseDealsGroup**

*Production-grade. Installable. Zero compromises.*

</div>
