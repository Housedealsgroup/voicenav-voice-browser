<div align="center">

<img src="assets/voicenav-logo.svg" alt="VoiceNav Voice Browser" width="200" height="200">

# **VoiceNav Voice Browser**

### Speak naturally. Browse everything. Zero limits.

A Progressive Web App voice-controlled browser. Speak commands to navigate, search, bookmark, and control the web — hands-free. Built for everyone, with full audio feedback for blind and visually impaired users.

[![TypeScript](https://img.shields.io/badge/TypeScript_5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite_6-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev)
[![License](https://img.shields.io/badge/License-MIT-00E676?style=for-the-badge)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-584_Passing-00E676?style=for-the-badge)](#testing)
[![PWA](https://img.shields.io/badge/PWA-Ready-5F4BB6?style=for-the-badge&logo=pwa&logoColor=white)](#pwa)
[![Languages](https://img.shields.io/badge/Languages-222-E94560?style=for-the-badge)](#languages)

---

<img src="assets/demo.svg" alt="VoiceNav Voice Browser Demo" width="100%">

*VoiceNav in action: speak naturally to navigate the web, search, bookmark pages, and control browsing — all processed in-browser with the Web Speech API.*

**100% Client-Side. No Cloud. No APIs. Zero Data Collection.**

</div>

---

## Screenshots

<div align="center">

| Home Screen | Voice Listening | Browser View |
|:-----------:|:---------------:|:------------:|
| <img src="assets/screenshots/home.svg" alt="Home Screen" width="260"> | <img src="assets/screenshots/voice.svg" alt="Voice Listening" width="260"> | <img src="assets/screenshots/browser.svg" alt="Browser View" width="260"> |
| Tap the mic or type a URL | Speak naturally — see real-time transcript | Browse any website hands-free |

| Bookmarks | Settings | Voice Commands |
|:---------:|:--------:|:--------------:|
| <img src="assets/screenshots/bookmarks.svg" alt="Bookmarks" width="260"> | <img src="assets/screenshots/settings.svg" alt="Settings" width="260"> | <img src="assets/screenshots/task.svg" alt="Voice Commands" width="260"> |
| Save and manage bookmarks | 222 languages, search engine, voice | Natural language command parsing |

</div>

---

## How To Use — Step by Step

### Step 1: Install & Launch

```bash
git clone https://github.com/Housedealsgroup/voicenav-voice-browser
cd voicenav-voice-browser
npm install
npm run dev
```

Open **http://localhost:5100** in Chrome, Edge, or Safari.

### Step 2: Grant Microphone Access

When you first tap the microphone button, your browser will ask for microphone permission. Click **Allow**. VoiceNav needs this to hear your commands — audio is processed locally and never leaves your device.

### Step 3: Speak a Command

Tap the red microphone button and say any command:

| Say This | What Happens |
|----------|--------------|
| **"Go to amazon.com"** | Navigates to Amazon |
| **"Search for weather"** | Opens a Google search for "weather" |
| **"Scroll down"** | Scrolls the page down |
| **"Bookmark"** | Saves the current page |
| **"New tab"** | Opens a new browser tab |
| **"Go back"** | Goes to previous page |
| **"Zoom in"** | Increases text size |
| **"Home"** | Returns to home screen |

### Step 4: Install as App (Optional)

Click the install icon in your browser's address bar, or go to your browser menu and select **"Install app"** / **"Add to Home Screen"**. VoiceNav runs as a standalone app with offline support.

### Step 5: Change Language (Optional)

Go to **Settings** and select your preferred voice language from the dropdown. VoiceNav supports **222 languages** with automatic language detection.

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
| `Find [word]` | Search page for text |

### Tab Management
| Command | Action |
|---------|--------|
| `New tab` / `Open new tab` | Open a new tab |
| `Close tab` / `Close this tab` | Close current tab |
| `Home` / `Go home` / `Homepage` | Go to home screen |
| `Stop` / `Cancel` / `Halt` | Stop speaking or cancel |

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

### Speech Synthesis (Voice Feedback)
| Feature | Description |
|---------|-------------|
| **Spoken Confirmation** | Every command gets spoken feedback ("Scrolling down", "Navigating to youtube.com", "Page loaded: ...") |
| **Page Load Announcements** | Speaks the page title when navigation completes |
| **Error Announcements** | Speaks error messages when pages fail to load |
| **Voice Selection** | `getVoices()` API returns all system voices |
| **Configurable** | Rate, pitch, volume, language options |
| **222 Languages** | Full language support with auto-detection |

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

### Accessibility
| Feature | Description |
|---------|-------------|
| **Full Voice Control** | Every action available by voice — no screen needed |
| **Spoken Feedback** | All commands confirmed with speech synthesis |
| **Page Load Announcements** | "Page loaded: {title}" on every navigation |
| **Error Announcements** | Spoken error messages for failed loads |
| **222 Languages** | Support for 222 languages with auto-detection |
| **RTL Support** | Right-to-left languages fully supported |

---

## Languages

VoiceNav supports **222 languages** including:

**Major Languages**: English, Spanish, French, German, Italian, Portuguese, Chinese, Japanese, Korean, Arabic, Hindi, Russian, Turkish, Thai, Vietnamese, Indonesian, Malay, Greek, Polish, Dutch, Czech, Swedish, Danish, Finnish, Norwegian, Hebrew, Ukrainian, Romanian, Hungarian, Bulgarian, Croatian, Slovak, Serbian, Lithuanian, Slovenian, Estonian, Latvian, Catalan, Basque, Filipino, Bengali, Tamil, Telugu, Urdu, Gujarati, Kannada, Malayalam, Marathi, Punjabi, Nepali, Sinhala, Georgian, Armenian, Kazakh, Uzbek, Azerbaijani, Mongolian, Tibetan, Burmese, Khmer, Lao, Amharic, Swahili, Yoruba, Igbo, Hausa, Zulu, Afrikaans, and many more.

**Regional Variants**: English (US, UK, Australia, India, South Africa, Ireland, New Zealand, Singapore), Spanish (Spain, Mexico, Argentina, Colombia, Chile, US), French (France, Canada, Belgium, Switzerland), German (Germany, Austria, Switzerland), Arabic (multiple regions), Chinese (Simplified, Traditional, Hong Kong, Cantonese, Wu, Hakka, Hokkien), Portuguese (Brazil, Portugal), and more.

**Indigenous & Minority**: Quechua, Guarani, Aymara, Nahuatl, Yucatec Maya, Cree, Inuktitut, Ojibwe, Esperanto, and more.

See the complete list in [`src/voice/languages.ts`](src/voice/languages.ts).

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
│   ├── voice/
│   │   ├── languages.ts          # 222 supported languages
│   │   ├── languageDetector.ts   # Auto-detect language from text
│   │   ├── speechToText.ts       # Expo STT integration
│   │   └── textToSpeech.ts       # Expo TTS with queue + audio cues
│   ├── types/
│   │   └── index.ts              # TypeScript interfaces
│   └── test/
│       ├── setup.ts              # Test configuration
│       ├── App.test.tsx          # Component rendering tests
│       ├── voice.test.ts         # Voice recognition + synthesis tests
│       └── context.test.tsx      # State management tests
├── assets/                       # Logos, screenshots, banners
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

**584 tests across 12 suites** — all passing. Covers voice recognition, speech synthesis, 30+ command parsing scenarios, state management, language detection, and component rendering.

---

## Privacy

| What | Status |
|------|--------|
| **Data Collection** | **Zero.** Nothing leaves your device. |
| **Cloud Processing** | **None.** All speech recognition is in-browser via the Web Speech API. |
| **Analytics** | **None.** No tracking. No telemetry. No Google Analytics. |
| **Cookies** | **None.** Only localStorage for your settings and bookmarks. |
| **Subscriptions** | **None.** Free and open source. |
| **Ads** | **None.** Forever. |
| **Third-Party Servers** | **None.** Your voice never leaves your device. |
| **Account Required** | **No.** Use immediately, no sign-up. |

VoiceNav processes all speech recognition and synthesis locally using the browser's built-in Web Speech API. No audio data is sent to any server. Your bookmarks, history, and settings are stored only in your browser's localStorage.

---

## Disclaimers

**Browser Compatibility**: VoiceNav uses the Web Speech API, which is supported in Chrome, Edge, and Safari. Firefox has limited support for speech recognition. For the best experience, use Chrome or Edge.

**Sites That Block Embedding**: Many popular sites (Google, Facebook, X/Twitter, YouTube, etc.) set `X-Frame-Options: DENY` or `Content-Security-Policy: frame-ancestors 'none'` headers, which prevent them from loading inside VoiceNav's iframe. You'll see "refused to connect" or a blank page. **Workaround**: Search via voice ("search for cats on YouTube") — the search results page loads fine. Individual pages from those sites will need to be opened in a new browser tab/window.

**Firefox + Embedded Sites**: Firefox blocks embedded pages from certain sites (e.g., x.com) for security. If you see *"Firefox Can't Open This Page — To protect your security, Firefox will not allow Firefox to display the page if another site has embedded it"*, open the link in a new window instead.

**Voice Feedback for Accessibility**: VoiceNav speaks back every command confirmation ("Scrolling down", "Navigating to youtube.com", "Page loaded: ...") so blind and visually impaired users get full audio feedback. If speech synthesis is silent, check your device volume and ensure your browser supports the Web Speech API.

**Not a Replacement for Full Browsers**: VoiceNav is designed as a voice-first browsing tool, not a full replacement for Chrome, Firefox, or Safari. Some websites may not work correctly inside the iframe.

---

## License

MIT License — see [LICENSE](LICENSE) for details.

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
