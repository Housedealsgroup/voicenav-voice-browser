<div align="center">

<img src="assets/icon.svg" alt="VoiceNav Logo" width="120" height="120">

# VoiceNav

### Supercomputer-Level Voice Navigation Browser

**Speak naturally. Get things done. One button. Zero limits.**

A fully accessible mobile browser that understands your voice and completes complex tasks automatically. No external APIs — everything runs on-device.

[![Expo](https://img.shields.io/badge/Expo-54-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-61dafb?style=for-the-badge&logo=react&logoColor=white)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/Housedealsgroup/voicenav?style=for-the-badge&logo=github)](https://github.com/Housedealsgroup/voicenav/stargazers)
[![GitHub Issues](https://img.shields.io/github/issues/Housedealsgroup/voicenav?style=for-the-badge&logo=github)](https://github.com/Housedealsgroup/voicenav/issues)

---

**Built by [GITLAWB](https://github.com/Housedealsgroup) · Powered by [MIMO](https://github.com/Housedealsgroup) · Backed by [APOLLO BTC](https://github.com/Housedealsgroup)**

</div>

---

## Demo

<div align="center">

### Watch VoiceNav in Action

[![VoiceNav Demo Video](https://img.shields.io/badge/▶_Watch_Demo-ff006e?style=for-the-badge&logo=youtube&logoColor=white)](https://youtube.com/watch?v=YOUR_VIDEO_ID)

*Click above to watch the full VoiceNav demo on YouTube*

</div>

---

## Screenshots

<div align="center">

<table>
  <tr>
    <td align="center"><img src="assets/screenshots/home.svg" alt="Home Screen" width="200"></td>
    <td align="center"><img src="assets/screenshots/voice.svg" alt="Voice Command" width="200"></td>
    <td align="center"><img src="assets/screenshots/browser.svg" alt="Browser" width="200"></td>
  </tr>
  <tr>
    <td align="center"><b>Home Screen</b></td>
    <td align="center"><b>Voice Command</b></td>
    <td align="center"><b>Browser</b></td>
  </tr>
  <tr>
    <td align="center"><img src="assets/screenshots/task.svg" alt="Task Progress" width="200"></td>
    <td align="center"><img src="assets/screenshots/palette.svg" alt="Command Palette" width="200"></td>
    <td align="center"><img src="assets/screenshots/bookmarks.svg" alt="Bookmarks" width="200"></td>
  </tr>
  <tr>
    <td align="center"><b>Task Automation</b></td>
    <td align="center"><b>Command Palette</b></td>
    <td align="center"><b>Bookmarks</b></td>
  </tr>
</table>

<img src="assets/screenshots/settings.svg" alt="Settings" width="200">

**Settings**

</div>

---

## Quick Start Guide

<div align="center">

### Get Running in 60 Seconds

</div>

**Step 1: Clone & Install**
```bash
git clone https://github.com/Housedealsgroup/voicenav.git
cd voicenav
npm install
```

**Step 2: Start the App**
```bash
npm start
```

**Step 3: Open on Your Phone**
- Install **Expo Go** from [App Store](https://apps.apple.com/app/expo-go/id982107779) or [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)
- Scan the QR code with your phone camera
- VoiceNav launches instantly

<div align="center">

```
┌─────────────────────────────────────────────────┐
│                                                 │
│   📱  Open Expo Go                              │
│       │                                         │
│       ▼                                         │
│   📷  Scan QR Code                              │
│       │                                         │
│       ▼                                         │
│   🎤  Tap Mic & Speak                           │
│       │                                         │
│       ▼                                         │
│   ✅  VoiceNav Does It                          │
│                                                 │
└─────────────────────────────────────────────────┘
```

</div>

---

## How It Works

<div align="center">

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

</div>

1. **You speak** — VoiceNav captures your command via speech-to-text
2. **NLU processes** — Intent classification, entity extraction, confidence scoring
3. **Context resolves** — Session memory resolves pronouns and references
4. **Brain decides** — The decision engine selects the best action
5. **Action executes** — Click, type, scroll, navigate in the WebView
6. **You hear feedback** — Text-to-speech confirms every action
7. **Memory updates** — Session context tracks what happened

**No cloud APIs. No subscriptions. Everything runs locally on your device.**

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

## Visual How-To Guide

<div align="center">

### 1. Basic Navigation

</div>

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  🎤 Say: "Go to Amazon"                                    │
│                                                             │
│  VoiceNav: "Navigating to amazon.com"                      │
│                                                             │
│  ✅ Amazon loads automatically                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**What happens:**
- NLU detects intent: `navigate`
- Extracts entity: `amazon.com`
- Executes navigation
- Speaks confirmation

<div align="center">

### 2. Searching the Web

</div>

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  🎤 Say: "Search for wireless headphones"                  │
│                                                             │
│  VoiceNav: "Searching Google for wireless headphones"      │
│                                                             │
│  ✅ Google results displayed                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**What happens:**
- NLU detects intent: `search`
- Extracts entity: `wireless headphones`
- Navigates to Google
- Performs search automatically

<div align="center">

### 3. Shopping Automation

</div>

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  🎤 Say: "Shop for headphones on Amazon"                   │
│                                                             │
│  VoiceNav executes multi-step task:                        │
│                                                             │
│  ✅ Step 1: Navigate to Amazon                              │
│  ✅ Step 2: Search "headphones"                             │
│  ✅ Step 3: Read first 3 results                            │
│  ✅ Step 4: Compare prices                                  │
│                                                             │
│  VoiceNav: "Found 3 options. Sony $79, Bose $129,          │
│             JBL $49. Would you like me to open one?"       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**What happens:**
- Task template activates
- Executes each step sequentially
- Reads and compares results
- Speaks summary with prices

<div align="center">

### 4. Reading Content

</div>

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  🎤 Say: "Read this page"                                  │
│                                                             │
│  VoiceNav: "Reading page. Title: Latest Tech News.         │
│             Article discusses new AI developments..."      │
│                                                             │
│  🎤 Say: "Scroll down"                                     │
│                                                             │
│  VoiceNav: "Scrolled down. More content available."        │
│                                                             │
│  🎤 Say: "Read again"                                      │
│                                                             │
│  VoiceNav: "Continuing reading from where we left off..."  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**What happens:**
- DOM extractor identifies main content
- Text-to-speech reads content
- Session memory tracks position
- Continues from last position

<div align="center">

### 5. Form Filling

</div>

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  🎤 Say: "Fill the form"                                   │
│                                                             │
│  VoiceNav: "I see a sign-up form. What's your name?"       │
│                                                             │
│  🎤 Say: "John Smith"                                      │
│                                                             │
│  VoiceNav: "Name entered. What's your email?"              │
│                                                             │
│  🎤 Say: "john@example.com"                                │
│                                                             │
│  VoiceNav: "Email entered. Ready to submit?"               │
│                                                             │
│  🎤 Say: "Submit"                                          │
│                                                             │
│  VoiceNav: "Form submitted successfully"                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**What happens:**
- DOM extractor finds form fields
- Conversational flow guides input
- Session memory tracks form state
- Confirms before submission

<div align="center">

### 6. Voice Macros

</div>

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  🎤 Say: "Start morning routine"                           │
│                                                             │
│  VoiceNav executes macro:                                  │
│                                                             │
│  ✅ Check email (Gmail)                                     │
│  ✅ Read news (Google News)                                 │
│  ✅ Check weather                                           │
│                                                             │
│  VoiceNav: "Morning routine complete. You have 3 new       │
│             emails, top headline is about AI, and          │
│             it's 72°F outside."                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**What happens:**
- Macro template activates
- Executes predefined sequence
- Aggregates results
- Speaks summary

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

## Use Cases

### For Blind & Visually Impaired Users

- **Browse the web** — Navigate any website by voice
- **Shop online** — Compare prices, read reviews, checkout
- **Read content** — Articles, emails, news read aloud
- **Fill forms** — Sign up, log in, complete forms hands-free
- **Stay informed** — News, weather, stocks via voice

### For Hands-Busy Users

- **Cooking** — Look up recipes without touching phone
- **Driving** — Get directions, send messages (safely)
- **Exercise** — Control music, check stats while moving
- **Working** — Multitask without switching focus

### For Elderly Users

- **Simple interface** — One button to press, speak naturally
- **No typing** — Everything by voice
- **Large text** — Accessibility options built-in
- **Voice feedback** — Confirms every action

---

## Privacy & Security

- **100% On-Device** — No data sent to external servers
- **No API Keys** — Everything runs locally
- **No Tracking** — Zero analytics or telemetry
- **Local Storage** — All data stays on your device
- **Open Source** — Full transparency

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

```bash
# Clone repo
git clone https://github.com/Housedealsgroup/voicenav.git
cd voicenav

# Install dependencies
npm install

# Start development
npm start

# Run tests
npm test

# Build for production
npm run build
```

---

## Roadmap

- [ ] **Offline Mode** — Full functionality without internet
- [ ] **Cloud Sync** — Sync bookmarks & settings across devices
- [ ] **Caregiver Dashboard** — Remote monitoring & assistance
- [ ] **Custom Voice Profiles** — Personalized voice recognition
- [ ] **iOS App Store** — Public release
- [ ] **Google Play Store** — Public release
- [ ] **Desktop Version** — Windows & Mac support
- [ ] **API for Developers** — Build custom voice extensions

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- **GITLAWB** — Project creator & lead developer
- **MIMO** — AI-powered development assistance
- **APOLLO BTC** — Technical architecture & guidance
- **Expo Team** — Amazing cross-platform framework
- **React Native Community** — Incredible ecosystem

---

<div align="center">

**Built with care for accessibility**

*VoiceNav — Because the web should be for everyone.*

[![GitHub](https://img.shields.io/badge/GitHub-VoiceNav-181717?style=for-the-badge&logo=github)](https://github.com/Housedealsgroup/voicenav)
[![Expo](https://img.shields.io/badge/Expo-Go-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)

</div>
