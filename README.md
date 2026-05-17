<div align="center">

<img src="assets/voicenav-logo.svg" alt="VoiceNav Logo" width="200" height="200">

# **VoiceNav v8**

### **The AI Voice Browser That Actually Works**

**Speak naturally. Browse everything. Zero limits.**

A fully accessible mobile browser powered by on-device AI that understands 29 languages, predicts your next command, and automates complex multi-step tasks. Built for blind users. No cloud. No subscriptions. No compromises.

[![Expo](https://img.shields.io/badge/Expo_SDK_54-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native_0.81-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript_5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-00E676?style=for-the-badge)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/Housedealsgroup/voicenav?style=for-the-badge&logo=github&color=FFD600)](https://github.com/Housedealsgroup/voicenav/stargazers)
[![Tests](https://img.shields.io/badge/Tests-12_Suites_100+-00E676?style=for-the-badge)](#testing)
[![CI](https://img.shields.io/badge/CI-GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)](#cicd)
[![Sentry](https://img.shields.io/badge/Monitoring-Sentry-362D59?style=for-the-badge&logo=sentry&logoColor=white)](#monitoring)

---

**Built by [HouseDealsGroup](https://github.com/Housedealsgroup)**

</div>

---

## **Live Demo**

<div align="center">

<img src="assets/demo.svg" alt="VoiceNav v8 Demo" width="350">

**Tap the mic. Speak naturally. VoiceNav does the rest.**

</div>

---

## **What's New in v8**

<div align="center">

### **6 Major Features. 1 Massive Upgrade.**

</div>

| Feature | What It Does |
|---------|-------------|
| **Voice Onboarding** | Interactive tutorial teaches new users every command through speech |
| **Smart Predictions** | AI predicts your next command based on page context, time, and habits |
| **Voice Shortcuts** | Create custom aliases: "my email" opens Gmail, "shopping" opens Amazon |
| **Page Intelligence** | Extracts prices, ratings, reviews, articles, forms, contacts from any page |
| **Haptic Feedback** | Tactile feedback on every action — feel the browser respond |
| **Persistent State** | Bookmarks, history, preferences survive app restarts |
| **Sentry Monitoring** | Production error tracking for rock-solid reliability |
| **29 Languages** | Real-time language detection with Unicode script analysis |

---

## **Screenshots**

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
    <td align="center"><b>Smart Browser</b></td>
  </tr>
  <tr>
    <td align="center"><img src="assets/screenshots/task.svg" alt="Task Automation" width="200"></td>
    <td align="center"><img src="assets/screenshots/palette.svg" alt="Command Palette" width="200"></td>
    <td align="center"><img src="assets/screenshots/bookmarks.svg" alt="Bookmarks" width="200"></td>
  </tr>
  <tr>
    <td align="center"><b>Task Automation</b></td>
    <td align="center"><b>Command Palette</b></td>
    <td align="center"><b>Bookmarks</b></td>
  </tr>
</table>

</div>

---

## **Getting Started**

<div align="center">

### **3 Steps. 60 Seconds. You're In.**

</div>

### **Step 1: Install Expo Go**

| Platform | Link |
|----------|------|
| **iPhone** | [App Store](https://apps.apple.com/app/expo-go/id982107779) |
| **Android** | [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent) |

### **Step 2: Clone and Run**

```bash
git clone https://github.com/Housedealsgroup/voicenav.git
cd voicenav
npm install
npm start
```

### **Step 3: Scan and Speak**

1. Open **Expo Go** on your phone
2. Scan the QR code
3. Tap the **microphone button**
4. Say **"Go to Amazon"**

<div align="center">

```
  Step 1            Step 2            Step 3
  ┌──────┐          ┌──────┐          ┌──────┐
  │  📱  │   ───▶   │  📷  │   ───▶   │  🎤  │
  │ Expo │          │ Scan │          │Speak!│
  │  Go  │          │  QR  │          │      │
  └──────┘          └──────┘          └──────┘
```

</div>

---

## **100+ Voice Commands**

<div align="center">

### **Navigation**

</div>

| Say This | What Happens |
|----------|--------------|
| "Go to Amazon" | Opens amazon.com |
| "Open Gmail" | Opens mail.google.com |
| "Go back" | Previous page |
| "Refresh" | Reload page |
| "Go home" | Return to VoiceNav |

<div align="center">

### **Search & Click**

</div>

| Say This | What Happens |
|----------|--------------|
| "Search for headphones" | Google search |
| "Click the first result" | Clicks element |
| "Click sign in" | Clicks button by text |
| "Tap it" | Clicks last referenced |

<div align="center">

### **Shopping**

</div>

| Say This | What Happens |
|----------|--------------|
| "Add to cart" | Adds item to cart |
| "Sort by price" | Sorts results |
| "Compare prices" | Multi-store search |
| "Checkout" | Proceed to checkout |

<div align="center">

### **Reading & Forms**

</div>

| Say This | What Happens |
|----------|--------------|
| "Read this page" | Reads content aloud |
| "Summarize" | Page summary |
| "Fill the form" | Guided form filling |
| "Type hello" | Enter text |
| "Submit" | Submit form |

<div align="center">

### **Multi-Step Commands**

</div>

```
"Search for headphones then click the first result"
"Go to Amazon then search for laptop then sort by price"
"Read this page then scroll down then bookmark it"
```

---

## **Voice Shortcuts**

<div align="center">

### **Your Voice. Your Commands.**

</div>

Create custom voice shortcuts that work instantly:

```
"When I say 'my email' then go to gmail"
"Shortcut 'music' to go to spotify"
"Create shortcut for 'work' that goes to slack"
```

**Built-in shortcuts:**

| Say This | Goes To |
|----------|---------|
| "My email" | Gmail |
| "My calendar" | Google Calendar |
| "Watch videos" | YouTube |
| "Listen to music" | Spotify |
| "Go shopping" | Amazon |
| "Check messages" | Gmail |

---

## **Smart Command Predictions**

<div align="center">

### **VoiceNav Learns How You Browse**

</div>

The AI predicts what you want to do next based on:

- **Page context** — Shopping page? Suggests "add to cart"
- **Time of day** — Morning? Suggests "check email"
- **Your habits** — Frequently says "scroll down"? It learns
- **Command sequences** — After "search for", suggests "click first result"

---

## **Page Intelligence**

<div align="center">

### **VoiceNav Understands Every Page**

</div>

Automatically extracts structured data from any web page:

| Data Type | What It Finds |
|-----------|--------------|
| **Prices** | $29.99, discounts, price ranges |
| **Ratings** | 4.5/5 stars, 2,341 reviews |
| **Articles** | Title, author, reading time, summary |
| **Forms** | Fields, labels, submit buttons |
| **Contacts** | Emails, phone numbers |
| **Navigation** | Menus, breadcrumbs |
| **Media** | Videos, images, audio |
| **Social** | Facebook, Twitter, LinkedIn links |

```
You: "Describe this page"
VoiceNav: "Product page. Sony WH-1000XM5 headphones. $79.99,
           was $129.99. 4.5 out of 5 stars, 2,341 reviews.
           Add to cart button detected."
```

---

## **Voice Onboarding**

<div align="center">

### **Learn By Doing**

</div>

First-time users get an interactive voice tutorial:

1. **Welcome** — "Say 'help' to hear what you can do"
2. **Navigate** — "Say 'go to Google'"
3. **Search** — "Say 'search for weather'"
4. **Read** — "Say 'read this page'"
5. **Scroll** — "Say 'scroll down'"
6. **Click** — "Say 'click the first link'"
7. **More** — Shopping, bookmarks, multi-step commands

Skip any step. Haptic feedback on success. Celebration animation on completion.

---

## **Haptic Feedback**

<div align="center">

### **Feel Every Action**

</div>

| Action | Feedback |
|--------|----------|
| Mic activated | Medium tap |
| Command recognized | Selection click |
| Action success | Success pulse |
| Action failed | Error buzz |
| Bookmark saved | Success notification |
| Button pressed | Light tap |
| Page boundary | Rigid tap |
| Tutorial complete | Triple celebration |

---

## **How It Works**

<div align="center">

```
  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
  │   You Speak  │────▶│  Language    │────▶│   NLU        │
  │              │     │  Detector    │     │   Engine     │
  └──────────────┘     │  (29 langs)  │     │  Intent +    │
                       └──────────────┘     │  Entities +  │
                                            │  Confidence  │
                                            └──────┬───────┘
                                                   │
  ┌──────────────┐     ┌──────────────┐     ┌──────▼───────┐
  │   Haptic     │◀────│  Voice       │◀────│   Brain      │
  │   Feedback   │     │  Shortcuts   │     │   Decision   │
  └──────────────┘     └──────────────┘     │   Engine     │
                                            └──────┬───────┘
                                                   │
                       ┌──────────────┐     ┌──────▼───────┐
                       │  Session     │◀───▶│   Action     │
                       │  Memory +    │     │   Executor   │
                       │  Predictor   │     │  (WebView)   │
                       └──────────────┘     └──────────────┘
```

</div>

**No cloud APIs. No subscriptions. No data leaves your device.**

---

## **Architecture**

<div align="center">

### **Enterprise-Grade Codebase**

</div>

```
voicenav/
├── app/                          # Expo Router screens
│   ├── _layout.tsx               # Root layout with ErrorBoundary
│   ├── index.tsx                 # Home — voice, quick tasks, links
│   ├── browser.tsx               # Browser — AI agent, commands, tasks
│   ├── bookmarks.tsx             # Bookmark manager
│   ├── onboarding.tsx            # First-run walkthrough
│   ├── settings.tsx              # Settings & preferences
│   └── privacy.tsx               # Privacy policy
├── src/
│   ├── agent/                    # AI Brain
│   │   ├── nlu.ts                # NLU engine — 44 intents, fuzzy matching
│   │   ├── brain.ts              # Decision engine with predictions
│   │   ├── sessionMemory.ts      # Context tracking & pronouns
│   │   ├── taskEngine.ts         # Multi-step task automation
│   │   ├── assistant.ts          # Proactive suggestions
│   │   ├── commandPredictor.ts   # Smart command predictions
│   │   ├── voiceOnboarding.ts    # Interactive voice tutorial
│   │   ├── voiceShortcuts.ts     # Custom voice aliases
│   │   ├── pageIntelligence.ts   # Page content extraction
│   │   └── __tests__/            # 12 test suites
│   ├── browser/                  # WebView Integration
│   │   ├── BrowserView.tsx       # WebView with JS injection
│   │   ├── domExtractor.js       # Smart DOM extraction
│   │   ├── actionExecutor.js     # Click, type, scroll, forms
│   │   └── types.ts              # TypeScript definitions
│   ├── components/               # UI Components
│   │   ├── VoiceButton.tsx       # Animated mic button
│   │   ├── VoiceWaveform.tsx     # Audio visualization
│   │   ├── CommandPalette.tsx    # Searchable command palette
│   │   ├── TaskProgress.tsx      # Task progress overlay
│   │   ├── FloatingAssistant.tsx # Persistent floating assistant
│   │   ├── OfflineBanner.tsx     # Offline mode indicator
│   │   └── ErrorBoundary.tsx     # Error recovery
│   ├── voice/                    # Speech I/O
│   │   ├── speechToText.ts       # On-device STT
│   │   ├── textToSpeech.ts       # TTS with queue
│   │   ├── continuousListener.ts # Always-on voice mode
│   │   ├── voiceMacros.ts        # Record & replay macros
│   │   ├── languageDetector.ts   # 29-language real-time detection
│   │   ├── languages.ts          # Language configurations
│   │   └── __tests__/            # Unit tests
│   ├── store/                    # State Management
│   │   ├── index.ts              # Zustand app state
│   │   ├── theme.ts              # Dark/Light theme
│   │   ├── bookmarks.ts          # Bookmark store
│   │   ├── voiceCommands.ts      # Voice shortcuts store
│   │   ├── persistentState.ts    # AsyncStorage persistence
│   │   └── __tests__/            # Unit tests
│   └── utils/
│       ├── logger.ts             # Structured logging
│       ├── crashReporting.ts     # Sentry error tracking
│       └── haptics.ts            # Haptic feedback system
├── assets/
│   ├── icon.svg                  # App icon (stunning new design)
│   ├── voicenav-logo.svg         # Full logo with text
│   └── demo.svg                  # Animated demo
├── .github/workflows/            # CI/CD
│   ├── ci.yml                    # Lint, typecheck, test
│   └── eas-build.yml             # EAS Build on tags
├── jest.config.js                # Test configuration
├── jest.setup.js                 # Native module mocks
├── eas.json                      # EAS Build profiles
├── CONTRIBUTING.md               # Contribution guide
└── app.json                      # Expo configuration
```

---

## **Tech Stack**

<div align="center">

| Technology | Purpose |
|-----------|---------|
| **Expo SDK 54** | Cross-platform framework |
| **React Native 0.81** | Native performance |
| **TypeScript 5.9** | Type safety |
| **Expo Router** | File-based navigation |
| **React Native WebView** | Embedded browser |
| **Zustand** | State management |
| **AsyncStorage** | Persistent data |
| **expo-speech-recognition** | On-device STT |
| **expo-speech** | Text-to-speech |
| **expo-haptics** | Tactile feedback |
| **@sentry/react-native** | Error monitoring |
| **Jest + Testing Library** | Testing |
| **GitHub Actions** | CI/CD |
| **EAS Build** | App store builds |

</div>

---

## **Use Cases**

<div align="center">

### **For Blind & Visually Impaired Users**

</div>

- **Browse the web** — Navigate any website by voice
- **Shop online** — Compare prices, read reviews, checkout
- **Read content** — Articles, emails, news read aloud
- **Fill forms** — Sign up, log in, complete forms hands-free
- **Stay informed** — News, weather, stocks via voice

<div align="center">

### **For Hands-Busy Users**

</div>

- **Cooking** — Look up recipes hands-free
- **Driving** — Voice-only navigation (safely)
- **Exercise** — Control music while moving
- **Working** — Multitask without switching focus

<div align="center">

### **For Elderly Users**

</div>

- **One button** — Just tap and speak
- **No typing** — Everything by voice
- **Voice feedback** — Confirms every action
- **Learn by doing** — Interactive tutorial

---

## **Privacy & Security**

<div align="center">

### **Your Data Stays With You**

</div>

- **100% On-Device** — No data sent to servers
- **No API Keys** — Everything runs locally
- **No Tracking** — Zero analytics or telemetry
- **No Cloud** — All processing on your phone
- **Local Storage** — AsyncStorage on device
- **Open Source** — Full transparency
- **Sentry** — Error reports only (no personal data)

**Read our full [Privacy Policy](app/privacy.tsx)**

---

## **Testing**

<div align="center">

### **12 Test Suites. 100+ Tests. Rock Solid.**

</div>

```bash
npm test                    # Run all tests
npm test -- --watch         # Watch mode
npm test -- --testPathPattern=nlu  # Specific suite
```

| Suite | Tests | Coverage |
|-------|-------|----------|
| NLU Engine | Intent classification, entities, fuzzy matching | Core |
| Brain | Decision engine, page analysis | Core |
| Task Engine | Lifecycle, templates, multi-step | Core |
| Session Memory | Pronouns, context, entity tracking | Core |
| Voice Macros | Matching, variables, recording | Voice |
| Assistant | Suggestions, greetings | AI |
| Languages | 29 language configs, RTL | Voice |
| Language Detector | Unicode scripts, stop words, detection | Voice |
| Stores | Bookmarks, shortcuts, theme | State |
| Command Predictor | Context, habits, sequences | AI |
| Page Intelligence | Prices, ratings, articles, forms | AI |
| Voice Shortcuts | Create, delete, match, built-ins | Voice |
| Voice Onboarding | Tutorial flow, hints, progress | Onboarding |

---

## **29 Languages**

<div align="center">

### **Real-Time Language Detection**

</div>

VoiceNav detects your language instantly using Unicode script analysis and stop word matching:

English, Spanish, French, German, Italian, Portuguese, Russian, Japanese, Korean, Chinese, Arabic, Hindi, Dutch, Polish, Swedish, Danish, Finnish, Norwegian, Czech, Romanian, Hungarian, Turkish, Thai, Vietnamese, Indonesian, Greek, Hebrew, Ukrainian, Malay

---

## **Monitoring**

<div align="center">

### **Sentry Error Tracking**

</div>

Production builds include Sentry for real-time error monitoring:

- **Crash reporting** with full stack traces
- **Performance monitoring** with traces
- **Breadcrumbs** for debugging
- **User feedback** integration
- **No personal data** sent — errors only

---

## **CI/CD**

<div align="center">

### **Automated Quality Gates**

</div>

**On every push and PR:**
- TypeScript type checking
- Full test suite
- Build verification

**On version tags:**
- EAS Build for Android and iOS
- Automated app store submission

---

## **Contributing**

<div align="center">

### **Join the Mission**

</div>

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for new functionality
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## **Roadmap**

<div align="center">

### **What's Next**

</div>

- [x] **v1** — Basic voice browser
- [x] **v2** — Bookmarks, voice shortcuts, onboarding
- [x] **v3** — Enterprise suite, security, multi-language
- [x] **v4** — Supercomputer-level navigation, NLU, task automation
- [x] **v5** — Testing (60+ tests), CI/CD, error boundaries, offline mode, crash reporting
- [x] **v6** — 29-language real-time detection, NLU multi-language support
- [x] **v7** — Sentry monitoring, haptics, persistent state, smart predictions
- [x] **v8** — Voice onboarding, shortcuts, page intelligence, stunning new UI
- [ ] **v9** — Cloud sync across devices
- [ ] **v9.1** — Caregiver dashboard
- [ ] **v9.2** — Custom voice profiles
- [ ] **v10** — iOS & Android app store release

---

## **License**

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

## **Built with care for accessibility**

*VoiceNav — Because the web should be for everyone.*

---

[![GitHub](https://img.shields.io/badge/GitHub-VoiceNav-181717?style=for-the-badge&logo=github)](https://github.com/Housedealsgroup/voicenav)
[![Expo](https://img.shields.io/badge/Expo_Go-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![License](https://img.shields.io/badge/MIT_License-00E676?style=for-the-badge)](LICENSE)

---

**© 2026 HouseDealsGroup. All rights reserved.**

</div>
