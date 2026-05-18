<div align="center">

<img src="assets/voicenav-logo.svg" alt="VoiceNav Voice Browser" width="320" height="320">

# **VoiceNav Voice Browser**

### Speak naturally. Browse everything. Zero limits.

An AI-powered mobile browser that lets you control the entire web with your voice. 116 languages. On-device AI. No cloud. No subscriptions. No compromises.

[![Expo](https://img.shields.io/badge/Expo_SDK_54-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native_0.81-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript_5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-00E676?style=for-the-badge)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-25_Suites_938+-00E676?style=for-the-badge)](#testing)
[![Languages](https://img.shields.io/badge/Languages-116-FF6B6B?style=for-the-badge)](#116-languages)

---

<img src="assets/demo.svg" alt="VoiceNav Voice Browser Demo" width="100%">

*VoiceNav Voice Browser in action: speak naturally to navigate the web, extract information, and automate tasks — all processed on-device.*

---

**100% On-Device AI. No Cloud. No APIs. Zero Data Collection.**

</div>

---

## What Is This

VoiceNav Voice Browser is a fully accessible mobile browser built for voice-first interaction. Tap the microphone, say a command, and watch it happen. The AI understands natural language across 116 languages and executes complex multi-step tasks — navigating pages, clicking buttons, filling forms, comparing prices, reading content aloud — all without sending a single byte to the cloud.

Built for blind users, drivers, multitaskers, and anyone who'd rather speak than tap.

---

## Features

| Feature | Description |
|---------|-------------|
| **Voice Control** | Navigate, click, scroll, search, and fill forms — all by voice |
| **116 Languages** | Full on-device speech recognition for 116 languages |
| **On-Device AI** | All processing happens locally. Zero data leaves your device |
| **Smart Navigation** | AI predicts your next command and suggests actions |
| **Conversation Mode** | Multi-turn voice conversations with context |
| **Shopping Assistant** | Compare prices, add to cart, checkout — hands-free |
| **Page Reader** | Any page read aloud in your language |
| **Tab Manager** | Open, close, switch tabs by voice |
| **Form Filling** | Sign in and fill forms with voice commands |
| **Reading Mode** | Distraction-free reading with adjustable speed |
| **Translation** | Real-time page translation across 116 languages |
| **PDF Reader** | Read and navigate PDFs by voice |
| **QR Scanner** | Scan codes and navigate to URLs |
| **Dark Mode** | Full dark theme with customizable colors |
| **Bookmarks** | Save and organize pages by voice |
| **Privacy Report** | See what trackers were blocked |
| **Offline Mode** | Browse cached pages without connection |

---

## Quick Start

### 1. Clone

```bash
git clone https://github.com/housedealsgroup/voicenav-voice-browser
cd voicenav-voice-browser
```

### 2. Install

```bash
npm install
```

### 3. Run

```bash
npx expo start
```

Scan the QR code with Expo Go (Android) or Camera app (iOS).

---

## Voice Commands

### Navigation

| Command | Action |
|---------|--------|
| `Go to [website]` | Open any website |
| `Search for [query]` | Google search |
| `Go back` / `Go forward` | Browser navigation |
| `Scroll down` / `Scroll up` | Navigate the page |
| `Tap [element]` | Click buttons and links |

### Page Control

| Command | Action |
|---------|--------|
| `Read this page` | Hear page content |
| `Bookmark this` | Save current page |
| `Fill in [field]` | Form input |
| `Translate this page` | Real-time translation |
| `What can you do?` | Show available commands |

### Shopping

| Command | Action |
|---------|--------|
| `Shop for [item]` | Search and browse products |
| `Add to cart` | Add items to cart |
| `Compare prices` | Price comparison across sites |
| `Sort by price` | Filter results |
| `Checkout` | Complete purchase |

### Productivity

| Command | Action |
|---------|--------|
| `Open new tab` | Tab management |
| `Switch to [tab]` | Switch tabs |
| `Close tab` | Close current tab |
| `Set a reminder` | Create voice reminder |
| `Check my email` | Open email |

---

## 116 Languages

Full on-device speech recognition across every major language family:

| Region | Languages |
|--------|-----------|
| **Americas** | English, Espanol, Portugues, Francais |
| **Western Europe** | Deutsch, Italiano, Nederlands, Svenska, Dansk, Norsk, Suomi |
| **Eastern Europe** | Polski, Romana, Cesky, Magyar, Hrvatski, Slovensky, Slovenščina, Lietuvių, Latviešu, Eesti |
| **Balkans & Caucasus** | Ελληνικά, Български, Srpski, Українська |
| **Middle East** | العربية, Türkçe, Kurdî, فارسی, עברית, اردو |
| **South Asia** | हिंदी, বাংলা, தமிழ், తెలుగు, मराठी, ગુજરાતી, ಕನ್ನಡ, മലയാളം, ਪੰਜਾਬੀ, नेपाली, සිංහල |
| **East Asia** | 中文, 日本語, 한국어 |
| **Southeast Asia** | ภาษาไทย, Tiếng Việt, Bahasa Indonesia, Bahasa Melayu, Tagalog, မြန်မာ, ខ្មែរ, ລາວ |
| **Africa** | Afrikaans, Swahili, Yoruba, Igbo, Hausa, Zulu, Amharic, Somali |
| **Celtic & Others** | Gaeilge, Cymraeg, Basque, Icelandic, Maltese |

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Expo SDK 54** | Cross-platform mobile framework |
| **React Native 0.81** | Native mobile UI |
| **TypeScript 5.9** | Type-safe development |
| **On-Device AI** | Local speech recognition and NLU |
| **Web Speech API** | Text-to-speech output |
| **Expo Router** | File-based navigation |

---

## Project Structure

```
voicenav-voice-browser/
├── app/                    # Expo Router pages
│   ├── index.tsx           # Home screen
│   ├── browser.tsx         # WebView browser
│   ├── onboarding.tsx      # First-run experience
│   └── settings.tsx        # User preferences
├── src/
│   ├── agent/              # AI command processing
│   │   ├── nlu.ts          # Natural language understanding
│   │   ├── brain.ts        # Command execution engine
│   │   └── contextActions.ts
│   ├── voice/              # Speech I/O
│   │   ├── speechToText.ts # On-device STT
│   │   └── textToSpeech.ts # TTS output
│   ├── browser/            # WebView integration
│   ├── components/         # Reusable UI components
│   ├── store/              # State management
│   ├── a11y/               # Accessibility utilities
│   └── utils/              # Helpers and utilities
├── assets/                 # Icons, logos, screenshots
│   ├── voicenav-logo.svg   # Logo (vector)
│   ├── voicenav-logo.png   # Logo (1024x1024 PNG)
│   └── demo.svg            # App demo screenshot
└── __tests__/              # 938+ tests across 25 suites
```

---

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific suite
npm test -- --testPathPattern="nlu"
```

**938+ tests across 25 suites** covering natural language understanding, voice command processing, browser automation, accessibility compliance, state management, and error handling.

---

## Accessibility

Built from the ground up for users who need it most:

- **WCAG 2.1 AA compliant** — Meets international accessibility standards
- **Screen reader optimized** — Full TalkBack and VoiceOver support
- **High contrast mode** — Customizable colors for low vision
- **Voice-first design** — Every action available by voice
- **Haptic feedback** — Physical confirmation of actions
- **Large touch targets** — Minimum 48dp for all interactive elements

---

## Privacy

| What | Status |
|------|--------|
| Data Collection | **Zero.** Nothing leaves your device. |
| Cloud Processing | **None.** All AI runs on-device. |
| Analytics | **None.** No tracking. No telemetry. |
| Subscriptions | **None.** Free and open source. |
| Ads | **None.** Forever. |

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**VoiceNav Voice Browser** by **HouseDealsGroup**

*Production-grade. Worldwide scalable. Zero compromises.*

</div>
