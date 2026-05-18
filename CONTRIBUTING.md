# Contributing to VoiceNav

We welcome contributions from both **humans** and **AI agents**. Clone the repo, make a change, and push.

## Development Setup

```bash
git clone https://github.com/Housedealsgroup/voicenav-voice-browser.git
cd voicenav-voice-browser
npm install
npm start
```

## Code Style

- TypeScript strict mode
- React functional components with hooks
- Zustand for state management
- Expo SDK 54 patterns

## Testing

```bash
npm test
```

All new agent and voice modules must have unit tests in `__tests__/` directories.

## Architecture

```
src/agent/     → AI brain (NLU, decision engine, task automation, session memory)
src/voice/     → Speech I/O (STT, TTS, continuous listening, macros, languages)
src/browser/   → WebView integration (DOM extraction, action execution)
src/components/→ UI components (VoiceButton, FloatingAssistant, CommandPalette)
src/store/     → Zustand stores (app state, bookmarks, shortcuts, theme)
```

## Adding a Voice Command

1. Add intent pattern in `src/agent/nlu.ts`
2. Add handler in `src/agent/brain.ts` `decideAction()`
3. Add test in `src/agent/__tests__/nlu.test.ts`
4. Update README command table

## Adding a Page Type

1. Add detection in `src/browser/domExtractor.js`
2. Add to `PageType` in `src/browser/types.ts`
3. Add suggestions in `src/agent/brain.ts` `getPageSuggestions()`

## Pull Requests

1. Fork and create a feature branch
2. Write tests for new functionality
3. Ensure `npm run lint` passes
4. Ensure `npm test` passes
5. Submit PR with clear description

## Credits

- **GITLAWB** — Project creator
- **MIMO** — AI development assistance
- **APOLLO BTC** — Technical architecture
