<div align="center">

# VoiceNav

### Voice-Controlled Web Browser for Blind & Visually Impaired Users

A fully accessible mobile browser that lets you navigate the web using only your voice. No external APIs needed — everything runs on-device.

[![Expo](https://img.shields.io/badge/Expo-54-blue.svg)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-61dafb.svg)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6.svg)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## What It Does

VoiceNav is a **voice-first browser** designed from the ground up for people who can't see the screen. Just speak naturally — the app understands your intent and does the rest.

### Core Features

- **Real Voice Commands** — Full speech-to-text via expo-speech-recognition, no external API
- **Voice Navigation** — "Go to Amazon", "Search for headphones", "Click add to cart"
- **Page Reading** — "Read this page" and the app speaks the content back to you
- **Smart Scrolling** — "Scroll down", "Go to top", "Page down"
- **Bookmarks** — Save pages with categories, search & filter, persistent storage
- **Voice Shortcuts** — Custom phrases like "go home" or "watch videos" trigger actions
- **Onboarding** — Guided walkthrough for first-time users
- **Form Interaction** — Type into search boxes, fill forms, submit — all by voice
- **Cart Commands** — "Add to cart" finds and clicks buy buttons automatically
- **Animated Mic Button** — Pulse ring, glow effect, and live audio waveform
- **Haptic Feedback** — Vibration cues confirm actions without looking
- **Quick Links** — One-tap access to Google, Amazon, YouTube, Wikipedia, Reddit, GitHub
- **Dark & Light Themes** — High-contrast, accessible color schemes
- **Adjustable Speech Rate** — Slow, Normal, Fast, Very Fast

### Voice Commands

| Command | What It Does |
|---------|-------------|
| "Go to amazon.com" | Navigates to Amazon (30+ site aliases built-in) |
| "Search for headphones" | Types and submits a search |
| "Click add to cart" | Finds and clicks the button (fuzzy matching) |
| "Read this page" | Speaks page content and structure aloud |
| "Scroll down" | Scrolls the page |
| "Bookmark this" | Saves current page to bookmarks |
| "Add to cart" | Finds and clicks the add-to-cart button |
| "Go back" | Goes to previous page |
| "Help" | Lists available commands |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)

### Installation

```bash
git clone https://github.com/Housedealsgroup/voicenav.git
cd voicenav
npm install
```

### Running

```bash
# Start development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run in web browser
npm run web
```

### Testing on Your Phone

1. Install **Expo Go** from the App Store or Google Play
2. Run `npm start`
3. Scan the QR code with your phone camera

## Architecture

```
voicenav/
├── app/                    # Expo Router screens
│   ├── _layout.tsx         # Root layout with theme
│   ├── index.tsx           # Home screen with voice, quick links, history
│   ├── browser.tsx         # Main browser with voice control & bookmarks
│   ├── bookmarks.tsx       # Bookmark manager with search & categories
│   ├── onboarding.tsx      # 4-step feature walkthrough
│   └── settings.tsx        # Speech rate, shortcuts, accessibility
├── src/
│   ├── agent/              # On-device AI brain
│   │   ├── brain.ts        # Intent parser, 30+ site aliases, fuzzy matching
│   │   └── loop.ts         # Multi-step agent execution loop
│   ├── browser/            # WebView integration
│   │   ├── BrowserView.tsx # WebView wrapper with JS injection
│   │   ├── domExtractor.js # Page structure extraction
│   │   ├── actionExecutor.js # Click, type, scroll, navigate actions
│   │   └── types.ts        # TypeScript definitions
│   ├── components/         # Reusable UI components
│   │   ├── VoiceButton.tsx # Animated mic with pulse/glow/waveform
│   │   └── VoiceWaveform.tsx # Live audio waveform bars
│   ├── voice/              # Speech I/O
│   │   ├── textToSpeech.ts # TTS with queue & interrupt
│   │   └── speechToText.ts # Real STT via expo-speech-recognition
│   ├── store/              # State management (Zustand + AsyncStorage)
│   │   ├── index.ts        # App state
│   │   ├── theme.ts        # Theme state
│   │   ├── bookmarks.ts    # Persistent bookmarks
│   │   └── voiceCommands.ts # Persistent voice shortcuts
│   ├── a11y/               # Accessibility themes
│   └── utils/              # Logging
└── assets/                 # Icons & splash screens
```

## How It Works

1. **You speak** — VoiceNav captures your command via speech-to-text
2. **Brain parses intent** — Pattern matching identifies what you want (navigate, search, click, read, scroll)
3. **Page is analyzed** — DOM extractor scans the WebView for interactive elements
4. **Action executes** — The agent clicks buttons, types text, scrolls, or navigates
5. **You hear feedback** — Text-to-speech confirms every action

No cloud APIs. No subscriptions. Everything runs locally on your device.

## Tech Stack

- **Expo SDK 54** — Cross-platform React Native framework
- **Expo Router** — File-based navigation
- **React Native WebView** — Embedded browser
- **Zustand** — Lightweight state management
- **Expo Speech** — Text-to-speech
- **Expo Haptics** — Vibration feedback

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with care for accessibility**

</div>
