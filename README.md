# Intention

**Unlock your phone with intention.** Before you dive in, name the one thing you came to do.
Intention reminds you of it every 5, 10 or 15 minutes, keeps it visible in a floating pill, and,
if you set a time limit, asks you to put the phone down when time's up.

Built with **Expo SDK 57 · React Native 0.86 · TypeScript (strict)**. It compiles to a real native
iOS app (not a web wrapper), and the same code ships to TestFlight and the App Store.

| Home                                                                                                | Session + floating pill                                                        | Time's up                                   |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------- |
| Type or dictate your goal and pick reminders and a limit, over slowly moving, blurred nature colors | Quiet black or white screen; a glass pill that snaps to corners and tucks away | A plain stop screen, then a one-minute rest |

---

## Preview it (VS Code, no Mac required)

1. **Install once:** [Node.js 22 LTS](https://nodejs.org) and [VS Code](https://code.visualstudio.com).
   On your iPhone, install **Expo Go** from the App Store.
2. **Open the folder** in VS Code. Accept the recommended extensions when prompted (Expo Tools,
   ESLint, Prettier).
3. **Install dependencies.** In the VS Code terminal (`` Ctrl+` ``):
   ```sh
   npm install
   ```
4. **Start the preview:**
   ```sh
   npm start
   ```
   Or use **Terminal → Run Task… → Expo: Start**.
5. **On your iPhone**, open the Camera and scan the QR code shown in the terminal. The app
   opens in Expo Go and reloads instantly every time you save a file.
   - Phone and computer must be on the same Wi-Fi. If they can't see each other, run
     `npx expo start --tunnel`.
6. **In a browser:** press `w` in the terminal. It opens an iPhone-sized preview, which is handy
   for quick layout checks.

### What works where

| Feature                                                               |   Expo Go (iPhone)    |      Browser      |    Development / App Store build     |
| --------------------------------------------------------------------- | :-------------------: | :---------------: | :----------------------------------: |
| Intention screen, defaults, history                                   |          ✅           |        ✅         |                  ✅                  |
| Floating pill (drag, snap, tuck, expand)                              |          ✅           |        ✅         |                  ✅                  |
| Reminder notifications (5/10/15 min) + "I did it" action              |          ✅           | in-app nudge only |                  ✅                  |
| Time's-up screen + rest                                               |          ✅           |        ✅         |                  ✅                  |
| Voice input in the app                                                | keyboard 🎤 dictation |    Chrome only    |  ✅ on-device `SFSpeechRecognizer`   |
| Haptics, Liquid Glass (iOS 26+)                                       |          ✅           |         —         |                  ✅                  |
| Live Activity / Dynamic Island, Lock Screen button, Screen Time limit |           —           |         —         | Phase 2 ([roadmap](docs/ROADMAP.md)) |

---

## How this maps to iOS (and why)

iOS doesn't let any app show a screen right after Face ID, lock the device, or float over other
apps. Intention uses the closest **App Store-approvable** equivalent for each part of the idea:

| The idea                     | How Intention does it                                                                                                                                                                                            |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Screen right after unlocking | The app opens to the intention screen. **Phase 2:** a Lock Screen button (iOS 18+ Control: press → Face ID → intention), a Lock Screen widget, Siri/Shortcuts, and "when Instagram opens, ask for an intention". |
| Floating, draggable module   | In-app floating pill (Picture-in-Picture style). **Phase 2:** a Live Activity on the Lock Screen and in the Dynamic Island, visible over every app.                                                              |
| Reminders                    | Local notifications on the chosen interval, with an "I did it" action.                                                                                                                                           |
| Hard lock                    | Time's-up screen + time-sensitive notification. **Phase 2:** Apple's Screen Time API pauses distracting apps when time's up.                                                                                     |

The full spec is in [docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md) and the App Review checklist
in [docs/APPLE_REVIEW.md](docs/APPLE_REVIEW.md).

---

## Project structure

```
src/
  app/                    Screens (Expo Router: every file is a route)
    _layout.tsx           Providers, navigation stack, global floating pill
    index.tsx             Home: intention composer ↔ active session
    onboarding.tsx        Welcome screen
    settings.tsx          Defaults, notifications, history (modal sheet)
    times-up.tsx          Time limit reached → rest (full-screen)
  domain/                 Pure TypeScript business rules, fully unit-tested
    session.ts            Session model and state transitions
    schedule.ts           Which notifications to schedule, and when
    duration.ts           Time formatting (visual + VoiceOver)
  features/
    intention/            Composer, mic button, suggestions
    session/              Dashboard, session controller (side effects), app-wide effects
    floating-pill/        The pill + its snapping math (snap.ts, unit-tested)
  services/               Platform adapters behind small interfaces
    notifications/        expo-notifications (native) / no-op (web)
    speech/               On-device speech-to-text with graceful fallback
    focusShield/          Screen Time hard lock: interface + Phase 1 stub
    liveActivity/         Live Activity: interface + Phase 1 stub
    haptics.ts
  state/                  Zustand stores persisted on-device (AsyncStorage)
  ui/
    theme/                Monochrome colors, glass material, type, ambient palettes, springs
    components/           Glass Button, ChoiceGroup, AmbientBackground, List, GlassSurface…
docs/                     Product spec, App Review notes, roadmap
```

### Architecture principles

- **Layers only depend downward:** `app → features → services/state → domain`. The domain
  layer has no React Native imports, so its rules are tested in plain Jest and can be reused
  by future widgets.
- **One place for side effects.** Screens call `features/session/sessionController.ts`
  (`startIntention`, `finishIntention`, `extendIntention`). The controller updates the store and
  syncs notifications, Live Activities and the focus shield. Phase 2 native features plug in
  there without touching any screen.
- **Platform services behind interfaces**, with `.web.ts` variants. Native modules missing in
  Expo Go are detected at runtime and degrade gracefully.
- **Privacy by design:** no accounts, no network calls, no analytics. Everything is stored on
  the device.
- **Monochrome glass design** (Linear / Cosmos-like), within Apple's HIG: black and white only,
  following the phone's light/dark setting; glass / brushed-metal controls instead of solid
  buttons; an ambient background of drifting nature colors that follows the time of day. Also
  Dynamic Type, SF Symbols, 44-pt hit targets, springs that respect Reduce Motion, VoiceOver
  labels and custom actions, haptics, and Liquid Glass on iOS 26+. See the Design system section
  in [docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md).

---

## Scripts

| Command             | What it does                                                                            |
| ------------------- | --------------------------------------------------------------------------------------- |
| `npm start`         | Start the dev server (QR code for Expo Go; `w` for web, `i` for iOS Simulator on a Mac) |
| `npm run web`       | Start straight into the browser preview                                                 |
| `npm test`          | Unit tests (Jest)                                                                       |
| `npm run typecheck` | TypeScript, strict                                                                      |
| `npm run lint`      | ESLint (Expo config + Prettier)                                                         |
| `npm run check`     | All three of the above, as CI runs them                                                 |

CI (`.github/workflows/ci.yml`) runs typecheck, lint, tests and a web build on every push.

---

## Shipping to iPhone (later)

Expo Go is for previewing. To put Intention on the App Store, use EAS Build. It runs in
the cloud, so you don't need a Mac:

```sh
npx eas-cli@latest login
npx eas-cli@latest build --platform ios --profile production
npx eas-cli@latest submit --platform ios
```

You'll need an [Apple Developer Program](https://developer.apple.com/programs/) membership.
See [docs/ROADMAP.md](docs/ROADMAP.md) for the Phase 2 native features and
[docs/APPLE_REVIEW.md](docs/APPLE_REVIEW.md) before submitting.
