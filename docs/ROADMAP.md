# Roadmap

## Phase 1: MVP (this repository) ✅

Runs in **Expo Go** and in the browser, so it can be previewed from VS Code without a Mac.

- Intention screen: typing, voice (in-app on-device dictation in builds, keyboard dictation in Expo Go), suggestions
- Reminders every 5 / 10 / 15 min as local notifications with an "I did it" action
- Optional time limit (15–60 min) → full-screen time's-up → 60 s rest
- In-app floating pill: drag, flick, snap to corners, tuck into the edge, expand, close
- Settings, on-device history, onboarding
- Design system following Apple's HIG, unit-tested domain logic, CI

## Phase 2: native iOS surfaces (needs a development build)

Each feature plugs into an existing seam, so screens don't change:
`src/services/liveActivity`, `src/services/focusShield`, and `sessionController.ts`.

### 0. Switch from Expo Go to a development build

```sh
npx expo install expo-dev-client
```

Add a development profile to `eas.json` (`"development": { "developmentClient": true, "distribution": "internal" }`), then:

```sh
npx eas-cli@latest build --profile development --platform ios   # cloud build, no Mac needed
# or, on a Mac with Xcode:  npx expo run:ios --device
```

After installing `expo-dev-client`, `npm start` targets the development build by default.
Press `s` in the terminal to switch back to Expo Go.

This also turns on in-app voice input (`expo-speech-recognition` is already configured).

### 1. Live Activity + Dynamic Island: the system-wide floating module

- `npx expo install expo-widgets @expo/ui` and add the `expo-widgets` config plugin.
- Layouts: Lock Screen banner (intention + `Text(timerInterval:)` countdown + "I did it"
  button), Dynamic Island compact (target icon · countdown), minimal (icon) and expanded
  (intention, progress, buttons).
- Implement `src/services/liveActivity/index.ts` (`start` / `update` / `end`). The controller
  already calls it on start, extend and finish.
- The "I did it" button runs an App Intent that ends the activity and marks the session complete
  (shared through the App Group).

### 2. Lock Screen entry points: "unlock with intention" in one tap

- **Control (iOS 18+):** "Set Intention" for the Lock Screen bottom buttons and Control Center.
  It opens `intention://` after Face ID. Needs a small Swift `ControlWidget` target (via
  `expo-apple-targets` or a local Expo module).
- **Lock Screen widgets** (`accessoryRectangular` / `accessoryCircular` via `expo-widgets`):
  current intention and countdown, or "Set intention".
- **App Intent** `SetIntentionIntent` → Siri, Spotlight, the Action Button and Shortcuts.
- **Shortcuts automation guide** in Settings: Automation → App → Instagram → Is Opened → Run
  Immediately → "Set Intention".

### 3. Screen Time hard lock

- Request the **Family Controls (Distribution)** entitlement early (see APPLE_REVIEW.md).
- `react-native-device-activity` (FamilyControls + ManagedSettings + DeviceActivity, with an Expo
  config plugin), or a local Expo module.
- Setup: `AuthorizationCenter.requestAuthorization(for: .individual)` → `FamilyActivityPicker` to
  choose the apps to pause (default: all, with an allowlist for Phone, Messages, Maps).
- At start: schedule a `DeviceActivity` interval ending at `endsAt`; the monitor extension
  applies the `ManagedSettingsStore` shield when it fires, even if the app was killed.
- Custom shield (ShieldConfiguration extension): "Time's up · You unlocked to: {intention}" with
  a button that opens Intention to answer "Did you get it done?".
- Implement `src/services/focusShield/index.ts` (`scheduleShield` / `release`).

### 4. TestFlight → App Store

- `eas build --profile production`, then `eas submit`.
- Fill in the App Privacy label (Data Not Collected) and paste the review notes from
  APPLE_REVIEW.md.
- Screenshots: intention screen, session with pill, Live Activity, time's up.

## Phase 3: ideas

- Weekly reflection: intentions kept vs. drifted, the apps that pull you away most (on-device).
- Focus filter integration (`SetFocusFilterIntent`) so Work/Personal Focus changes defaults.
- iCloud sync of history (CloudKit, still no account).
- Apple Watch complication showing the current intention.
