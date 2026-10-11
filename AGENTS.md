# Agent guide: Intention

Expo SDK 57 / React Native 0.86 / TypeScript strict. iOS-first app that asks for an intention
before you use your phone. Read `README.md` (architecture) and `docs/PRODUCT_SPEC.md` first.

## Expo changes fast: don't trust memory

Check versioned docs before touching an Expo/RN API: https://docs.expo.dev/versions/v57.0.0/
(append `.md` for Markdown) and https://docs.expo.dev/llms.txt.

## Commands

```sh
npx expo install <pkg>   # always: picks SDK-compatible versions
npm run ios              # native build on the iOS Simulator (needs a Mac with Xcode)
npm run check            # typecheck + lint + tests: run before declaring work done
npx expo-doctor          # dependency/config health
npx expo export --platform web   # catches bundling errors
```

## Rules

- Routes live in `src/app/`; non-route code stays outside it.
- Layering: `app → features → services/state → domain`. `src/domain` must not import React
  Native. Put business rules there, with tests in `__tests__`.
- Side effects of a session (notifications, Live Activity, Screen Time) go through
  `src/features/session/sessionController.ts`, never directly from screens.
- UI uses `src/ui/theme` tokens and `src/ui/components`. No hard-coded colors or font sizes in
  screens. New icons go in `Icon.tsx` (SF Symbol + Material Symbol pair).
- Design language: black and white only (both appearances). No accent colors, no solid
  buttons: primary actions use `Button` (glass), secondary ones `variant="quiet"`. Color lives
  only in `GlowSlab` (palettes in `src/ui/theme/ambient.ts`); text on it uses `ON_GLOW`.
- Reanimated shared values: use `.get()` / `.set()` (React Compiler friendly), and respect
  `useReducedMotion()`.
- Keep Expo Go compatibility for Phase 1: native modules not in Expo Go must be loaded with
  `requireOptionalNativeModule` and degrade gracefully (see `services/speech`).
- Never add APIs or copy implying the app intercepts unlocking or locks the device
  (see `docs/APPLE_REVIEW.md`).
- `ios/` and `android/` are generated (CNG). Configure native behavior in `app.json`.
