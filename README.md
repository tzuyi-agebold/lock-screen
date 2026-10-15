# Intention

**Unlock your phone with intention.** Before you dive in, name the one thing you came to do.
Intention reminds you of it every 5, 10 or 15 minutes, keeps it visible in a floating pill, and,
if you set a time limit, asks you to put the phone down when time's up.

Built with **Expo SDK 57 · React Native 0.86 · TypeScript (strict)**. It compiles to a real native
iOS app (not a web wrapper), and the same code ships to TestFlight and the App Store.

| Home                                                                                | Session + floating pill                                                        | Time's up                                   |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------- |
| Type or dictate your goal on a softly glowing slab, then pick reminders and a limit | Quiet black or white screen; a glass pill that snaps to corners and tucks away | A plain stop screen, then a one-minute rest |

---

## Run it

### On the iOS Simulator (Mac with Xcode)

Once per Mac: open Xcode, install the iOS platform (Xcode → Settings → Components), and install
[Node.js 22 LTS](https://nodejs.org). Then, in Terminal:

```sh
git clone https://github.com/tzuyi-agebold/lock-screen.git
cd lock-screen     # run every command below from inside this folder
npm install
npm run ios        # compiles the app and opens it in the Simulator
```

The first build takes a few minutes. After that, `npm start` reloads changes instantly. In VS
Code, open the `lock-screen` folder and use **Terminal → Run Task → "iOS Simulator: build and
run"**. No Mac? `npm run build:simulator` builds it in the cloud with EAS. Details and
troubleshooting in [docs/RELEASE.md](docs/RELEASE.md).

### Quick preview in Expo Go (any computer)

1. Install [Node.js 22 LTS](https://nodejs.org) and [VS Code](https://code.visualstudio.com), and
   **Expo Go** on your iPhone.
2. Open the folder in VS Code (accept the recommended extensions), then in the terminal:
   ```sh
   npm install
   npm run start:go
   ```
3. Scan the QR code with your iPhone camera. The app reloads every time you save a file. If the
   phone can't reach your computer, use `npx expo start --go --tunnel`.
4. Press `w` in the terminal for an iPhone-sized preview in the browser.

### App Store

Production builds and uploads run in the cloud with EAS (no Mac needed):
`npm run build:production`, then `npm run submit:ios`. The listing text is in
[`store.config.json`](store.config.json) and draft screenshots in [`store/`](store). Follow the
checklist in [docs/RELEASE.md](docs/RELEASE.md).

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
    theme/                Monochrome colors, glass material, type, glow palettes, springs
    components/           Glass Button, ChoiceGroup, GlowSlab, List, GlassSurface…
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
  buttons; color only in a frosted slab lit from inside by warm, slowly drifting light. Also
  Dynamic Type, SF Symbols, 44-pt hit targets, springs that respect Reduce Motion, VoiceOver
  labels and custom actions, haptics, and Liquid Glass on iOS 26+. See the Design system section
  in [docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md).

---

## Scripts

| Command                    | What it does                                                         |
| -------------------------- | -------------------------------------------------------------------- |
| `npm run ios`              | Build and run on the iOS Simulator (Mac with Xcode)                  |
| `npm start`                | Dev server for the development build (`w` opens the browser preview) |
| `npm run start:go`         | Dev server for Expo Go                                               |
| `npm run web`              | Start straight into the browser preview                              |
| `npm run build:simulator`  | Cloud build for the iOS Simulator (EAS)                              |
| `npm run build:production` | Cloud App Store build (EAS)                                          |
| `npm run submit:ios`       | Upload the latest App Store build to App Store Connect               |
| `npm test`                 | Unit tests (Jest)                                                    |
| `npm run typecheck`        | TypeScript, strict                                                   |
| `npm run lint`             | ESLint (Expo config + Prettier)                                      |
| `npm run check`            | All three of the above, as CI runs them                              |

CI (`.github/workflows/ci.yml`) runs typecheck, lint, tests and a web build on every push.
