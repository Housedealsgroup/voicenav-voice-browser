<div align="center">

<img src="assets/voicenav-logo.svg" alt="VoiceNav Voice Browser" width="320" height="320">

# **VoiceNav Voice Browser**

### Speak naturally. Browse everything. Zero limits.

A Progressive Web App voice-controlled browser. Speak commands to navigate, search, bookmark, and control the web — hands-free.

[![TypeScript](https://img.shields.io/badge/TypeScript_5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite_6-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev)
[![License](https://img.shields.io/badge/License-MIT-00E676?style=for-the-badge)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-65_Passing-00E676?style=for-the-badge)](#testing)
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

## Quick Start

```bash
git clone https://github.com/Housedealsgroup/voicenav-voice-browser
cd voicenav-voice-browser
npm install
npm run dev
```

Open **http://localhost:5100** in your browser. Click the microphone and start speaking.

### Build for Production

```bash
npm run build
npm run preview
```

---

## Features

### Voice Recognition
| Feature | Description |
|---------|-------------|
| **Speech-to-Text** | Browser-native Web Speech API — no cloud needed |
| **Real-time Transcript** | See words appear as you speak |
| **Confidence Scoring** | Visual bar shows recognition confidence (0-100%) |
| **Audio Level Monitoring** | Mic ring pulses with your voice volume |
| **Permission Handling** | Detects mic access state (prompt/granted/denied) |
| **Error Recovery** | Handles no-speech, no-mic, denied, network errors |
| **30+ Voice Commands** | Navigate, search, scroll, bookmark, zoom, tabs, home, stop |

### Speech Synthesis
| Feature | Description |
|---------|-------------|
| **Text-to-Speech** | Spoken feedback for every command |
| **Voice Selection** | `getVoices()` API returns all system voices |
| **Configurable** | Rate, pitch, volume, language options |
| **222 Languages** | Full language support with auto-detection — see `src/voice/languages.ts` for the complete list |

### Browser
| Feature | Description |
|---------|-------------|
| **iframe Browsing** | Loads any website with sandbox security |
| **Loading Progress** | Animated bar during page loads |
| **Security Indicator** | Lock icon for HTTPS, warning for HTTP |
| **Error Handling** | Friendly error with retry/home buttons |
| **Stop Button** | Cancel loading mid-request |
| **Tab Manager** | Open, close, switch tabs by voice or click |
| **Bookmarks** | Save pages by voice or click |
| **History** | Browsing history with timestamps |
| **URL Bar** | Type URLs or search queries |

### PWA
| Feature | Description |
|---------|-------------|
| **Installable** | Add to home screen on desktop/mobile |
| **Offline Support** | Service worker caches assets |
| **Auto-updates** | New versions applied automatically |
| **Standalone Window** | Runs like a native app |

---

## Voice Commands

### Navigation
| Command | Action |
|---------|--------|
| `Go to youtube.com` | Navigate to a website |
| `Open github.com` | Navigate to a website |
| `Navigate to reddit.com` | Navigate to a website |
| `Visit example.com` | Navigate to a website |
| `Search for weather` | Search the web |
| `Search TypeScript tutorials` | Search the web |
| `Look up React hooks` | Search the web |
| `Google best restaurants` | Search via Google |
| `Go back` / `Back` / `Previous page` | Go to previous page |
| `Go forward` / `Forward` / `Next page` | Go to next page |
| `Reload` / `Refresh` | Reload current page |

### Page Control
| Command | Action |
|---------|--------|
| `Scroll down` / `Page down` / `Down` | Scroll the page down |
| `Scroll up` / `Page up` / `Up` | Scroll the page up |
| `Scroll to top` | Jump to top of page |
| `Scroll to bottom` | Jump to bottom of page |
| `Bookmark` / `Save this` / `Add bookmark` | Save current page |
| `Zoom in` / `Bigger` / `Make bigger` | Increase text size |
| `Zoom out` / `Smaller` / `Make smaller` | Decrease text size |

### Tab Management
| Command | Action |
|---------|--------|
| `New tab` / `Open new tab` | Open a new tab |
| `Close tab` / `Close this tab` | Close current tab |
| `Home` / `Go home` / `Homepage` | Go to home screen |
| `Stop` / `Cancel` / `Halt` | Stop speaking or cancel |

---

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.1 | UI framework |
| TypeScript | 5.8 | Type-safe development |
| Vite | 6.4 | Build tool and dev server |
| vite-plugin-pwa | 0.21 | PWA generation with Workbox |
| Web Speech API | Browser-native | Speech recognition and synthesis |
| Vitest | 3.2 | Unit testing |
| Testing Library | 16.3 | Component testing |

---

## Project Structure

```
voicenav-voice-browser/
├── index.html                    # Entry point
├── public/
│   ├── favicon.svg               # App icon
│   └── manifest.json             # PWA manifest
├── src/
│   ├── main.tsx                  # React entry
│   ├── App.tsx                   # Root component
│   ├── App.css                   # App styles
│   ├── index.css                 # Global styles (CSS variables)
│   ├── vite-env.d.ts             # Type declarations
│   ├── context/
│   │   └── AppContext.tsx         # Global state (useReducer + Context)
│   ├── hooks/
│   │   └── useVoice.ts           # Voice recognition + synthesis hook
│   ├── components/
│   │   ├── Header.tsx            # Top nav bar with voice button
│   │   ├── HomeScreen.tsx        # Home page with search + quick links
│   │   ├── BrowserView.tsx       # iframe browser with toolbar
│   │   ├── TabBar.tsx            # Tab management bar
│   │   ├── VoiceOverlay.tsx      # Full-screen voice listening overlay
│   │   ├── BookmarksView.tsx     # Bookmarks list
│   │   ├── HistoryView.tsx       # Browsing history
│   │   └── SettingsView.tsx      # Settings (search engine, voice, font)
│   ├── types/
│   │   └── index.ts              # TypeScript interfaces
│   └── test/
│       ├── setup.ts              # Test configuration
│       ├── App.test.tsx          # Component rendering tests
│       ├── voice.test.ts         # Voice recognition + synthesis tests
│       └── context.test.tsx      # State management tests
├── assets/                       # Logos and images
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

**65 tests across 3 suites:**
- `voice.test.ts` — 55 tests: SpeechRecognition API, SpeechSynthesis API, 30+ command parsing scenarios, case insensitivity, fallback behavior
- `context.test.tsx` — 5 tests: default state, navigation, bookmarks, home, deduplication
- `App.test.tsx` — 5 tests: title, search input, voice button, quick links, navigation

---

## PWA Installation

1. Open in Chrome/Edge/Safari
2. Click the install icon in the address bar
3. Or browser menu: "Install app" / "Add to Home Screen"

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

---

## Known Limitations

**Sites That Block Embedding**: Many popular sites (Google, Facebook, X/Twitter, YouTube, etc.) set `X-Frame-Options: DENY` or `Content-Security-Policy: frame-ancestors 'none'` headers, which prevent them from loading inside VoiceNav's iframe. You'll see "refused to connect" or a blank page. **Workaround**: These sites can still be searched via voice ("search for cats on YouTube") — the search results page loads fine; individual pages from those sites will need to be opened in a new browser tab/window.

**Firefox + Embedded Sites**: Firefox blocks embedded pages from certain sites (e.g., x.com) for security. If you see *"Firefox Can't Open This Page — To protect your security, Firefox will not allow Firefox to display the page if another site has embedded it"*, open the link in a new window instead.

**Voice Feedback for Accessibility**: VoiceNav speaks back every command confirmation ("Scrolling down", "Navigating to youtube.com", "Page loaded: ...") so blind and visually impaired users get full audio feedback. If speech synthesis is silent, check your device volume and ensure your browser supports the Web Speech API.

---

## Support VoiceNav

If you find VoiceNav useful, consider supporting the project:

**Bitcoin:** `bc1qkgkhescdu30xn3fpkv52mcea9njn47u7snjj9k`

Every donation, no matter how small, keeps this project alive.

---

<div align="center">

**VoiceNav Voice Browser** by **HouseDealsGroup**

*Production-grade. Installable. Zero compromises.*

</div>
