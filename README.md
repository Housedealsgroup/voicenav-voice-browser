<div align="center">

# VoiceNav

### Supercomputer-Level Voice Navigation Browser

**Speak naturally. Get things done. One button. Zero limits.**

A fully accessible mobile browser that understands your voice and completes complex tasks automatically. No external APIs — everything runs on-device.

[![Expo](https://img.shields.io/badge/Expo-54-blue.svg)](https://expo.dev)
[![React Native](https://img.shields.io/React%20Native-0.81-61dafb.svg)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/TypeScript-5.9-3178c6.svg)](https://www.typescriptlang.org)
[![License](https://img.shields.io/License-MIT-green.svg)](LICENSE)

</div>

---

## Screenshots

<div align="center">

### Home Screen
![Home Screen](assets/screenshots/home.png)

### Voice Command
![Voice Command](assets/screenshots/voice.png)

### Browser with AI Agent
![Browser](assets/screenshots/browser.png)

### Task Automation
![Task Progress](assets/screenshots/task.png)

### Command Palette
![Command Palette](assets/screenshots/palette.png)

### Bookmarks
![Bookmarks](assets/screenshots/bookmarks.png)

### Settings
![Settings](assets/screenshots/settings.png)

</div>

---

## What's New in v4

### Supercomputer-Level Intelligence

- **NLU Engine** — Natural Language Understanding with confidence scoring, entity extraction, fuzzy matching, and context resolution
- **Task Automation Engine** — Multi-step task execution with state machine, templates, conditional logic, and error recovery
- **Session Memory** — Tracks conversation context, entity references, page history, and pronoun resolution
- **Continuous Listening** — Always-on voice mode with wake word detection and barge-in support
- **Voice Macros** — Record and replay command sequences, built-in macros for common workflows
- **Command Palette** — Searchable command palette with categories, recent commands, and context suggestions
- **Task Progress Tracker** — Visual step-by-step progress with pause, resume, and cancel controls
- **Floating Assistant** — Persistent bubble with quick actions, suggestions, and conversation history

### 100+ Voice Commands

| Category | Commands |
|----------|----------|
| **Navigation** | Go to, Open, Visit, Navigate to, Go back, Go forward, Refresh, Go home |
| **Search** | Search for, Find, Look up, Google, What is, Who is, How to |
| **Click** | Click, Tap, Press, Select, Click the first/second/third, Click it |
| **Shopping** | Add to cart, Buy, Purchase, Compare prices, Sort by price, Filter, Checkout |
| **Reading** | Read this page, Summarize, Describe, What's on screen, Scroll up/down |
| **Forms** | Fill, Type, Enter, Submit, Sign in, Log in, Sign up, Register |
| **Media** | Play, Pause, Next, Previous, Skip |
| **Bookmarks** | Bookmark this, Save page, Remove bookmark |
| **Tabs** | New tab, Close tab, Next tab, Previous tab |
| **Utility** | Copy, Share, Download, Zoom in/out, Find on page, Help |

### Multi-Step Commands

Chain commands with "then":
```
"Search for headphones then click the first result"
"Go to Amazon then search for laptop then sort by price"
"Read this page then scroll down then read again"
```

### Task Templates

Built-in automation for common workflows:
```
"Shop for headphones on Amazon"     → Navigates, searches, reads results
"Compare prices for laptop"         → Searches across stores
"Check my email"                    → Opens Gmail, reads inbox
"Read news"                         → Opens Google News, reads headlines
"Watch youtube"                     → Opens YouTube, reads trending
```

### Voice Macros

Record and replay command sequences:
```
"Morning routine"    → Check email, read news, check weather
"Amazon shop for X"  → Navigate to Amazon, search, read results
"Compare prices for X" → Search Google, open top results, compare
```

### 60+ Site Aliases

Just say the name — VoiceNav knows where to go:
```
"Go to amazon"      → amazon.com
"Open gmail"        → mail.google.com
"Go to github"      → github.com
"Open youtube"      → youtube.com
"Check news"        → news.google.com
"Go to spotify"     → spotify.com
```

### 25+ Languages

Full voice support for: English, Spanish, French, German, Italian, Portuguese, Russian, Japanese, Korean, Chinese, Arabic, Hindi, Dutch, Polish, Swedish, Danish, Finnish, Norwegian, Czech, Romanian, Hungarian, Turkish, Thai, Vietnamese, Indonesian, Greek, Hebrew

---

## Architecture

```
voicenav/
├── app/                          # Expo Router screens
│   ├── index.tsx                 # Home — voice, quick tasks, links, history
│   ├── browser.tsx               # Browser — AI agent, command palette, tasks
│   ├── bookmarks.tsx             # Bookmark manager with search & categories
│   ├── onboarding.tsx            # Guided walkthrough for first-time users
│   └── settings.tsx              # Speech, shortcuts, accessibility settings
├── src/
│   ├── agent/                    # AI Brain
│   │   ├── nlu.ts                # NLU engine — intent, entities, confidence
│   │   ├── brain.ts              # Decision engine — action selection
│   │   ├── sessionMemory.ts      # Conversation context & entity tracking
│   │   ├── taskEngine.ts         # Multi-step task automation
│   │   ├── assistant.ts          # Proactive suggestions
│   │   └── loop.ts               # Agent execution loop
│   ├── browser/                  # WebView Integration
│   │   ├── BrowserView.tsx       # WebView wrapper with JS injection
│   │   ├── domExtractor.js       # Smart DOM extraction with relevance scoring
│   │   ├── actionExecutor.js     # Click, type, scroll, form fill, keyboard
│   │   └── types.ts              # TypeScript definitions
│   ├── components/               # UI Components
│   │   ├── VoiceButton.tsx       # Animated mic with pulse/glow/waveform
│   │   ├── VoiceWaveform.tsx     # Live audio waveform bars
│   │   ├── CommandPalette.tsx    # Searchable command palette
│   │   ├── TaskProgress.tsx      # Task progress overlay
│   │   └── FloatingAssistant.tsx # Persistent floating assistant
│   ├── voice/                    # Speech I/O
│   │   ├── speechToText.ts       # Real STT via expo-speech-recognition
│   │   ├── textToSpeech.ts       # TTS with queue & interrupt
│   │   ├── continuousListener.ts # Always-on voice mode
│   │   ├── voiceMacros.ts        # Record & replay macros
│   │   └── languages.ts          # 25+ language support
│   ├── store/                    # State Management (Zustand)
│   │   ├── index.ts              # App state with task & assistant state
│   │   ├── theme.ts              # Dark/Light theme
│   │   ├── bookmarks.ts          # Persistent bookmarks
│   │   └── voiceCommands.ts      # Persistent voice shortcuts
│   ├── a11y/                     # Accessibility themes
│   └── utils/                    # Logging
└── assets/                       # Icons & splash screens
```

---

## How It Works

```
  ┌─────────────┐     ┌──────────────┐     ┌──────────────┐
  │  You Speak  │────▶│  NLU Engine  │────▶│   Decision   │
  │  or Type    │     │  Intent +    │     │   Engine     │
  └─────────────┘     │  Entities +  │     │  (brain.ts)  │
                      │  Confidence  │     └──────┬───────┘
                      └──────────────┘            │
                                                   ▼
  ┌─────────────┐     ┌──────────────┐     ┌──────────────┐
  │  You Hear   │◀────│  Text-to-    │◀────│   Action     │
  │  Feedback   │     │  Speech      │     │   Executor   │
  └─────────────┘     └──────────────┘     └──────┬───────┘
                                                   │
                      ┌──────────────┐            ▼
                      │  Session     │     ┌──────────────┐
                      │  Memory      │◀───▶│  DOM Extract │
                      │  (context)   │     │  (WebView)   │
                      └──────────────┘     └──────────────┘
```

1. **You speak** — VoiceNav captures your command via speech-to-text
2. **NLU processes** — Intent classification, entity extraction, confidence scoring
3. **Context resolves** — Session memory resolves pronouns and references
4. **Brain decides** — The decision engine selects the best action
5. **Action executes** — Click, type, scroll, navigate in the WebView
6. **You hear feedback** — Text-to-speech confirms every action
7. **Memory updates** — Session context tracks what happened

No cloud APIs. No subscriptions. Everything runs locally on your device.

---

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

---

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| **Expo SDK 54** | Cross-platform React Native framework |
| **Expo Router** | File-based navigation |
| **React Native WebView** | Embedded browser with JS injection |
| **Zustand** | Lightweight state management |
| **expo-speech-recognition** | On-device speech-to-text |
| **expo-speech** | Text-to-speech |
| **expo-haptics** | Vibration feedback |
| **AsyncStorage** | Persistent local storage |

---

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

*VoiceNav — Because the web should be for everyone.*

</div>
