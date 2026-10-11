# Intention: Product Spec (MVP)

## Problem

People unlock their phones without a clear purpose, or with one purpose (reply to a message,
check the weather) that gets lost in Instagram, email or news. A simple action quietly turns
into 30 minutes, and they forget why they picked up the phone.

## Goal

Make every unlock deliberate: **name the intention → get gentle reminders → stop on time.**

Success signals (on-device only, never uploaded):

- Share of sessions marked "I did it"
- Sessions that end before or at the time limit
- Repeat use: sessions per day, days with at least one intention

## Platform reality → approvable design

iOS has no public API to run code between Face ID and the Home Screen, to lock the device, or to
draw over other apps. Any app that tries gets rejected under App Review Guideline 2.5.1
(public APIs only). Each part of the concept therefore maps to an Apple-sanctioned surface:

| Concept                         | Apple-approved implementation                                                                                                                                                                                                                                                                                                                                                                              | Phase                         |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| Intention screen at unlock      | **App launch = the unlock moment.** Entry points that make it one tap from the Lock Screen: **Lock Screen Control** (iOS 18+, replaces the flashlight/camera button: press → Face ID → intention screen), **Lock Screen widget**, **App Intent** for Siri / Action Button / Shortcuts, and an optional **Shortcuts automation** ("When Instagram is opened → Set Intention", the pattern used by one sec). | 1 (screen) · 2 (entry points) |
| Type or speak the goal          | Text field + on-device speech (`SFSpeechRecognizer`) with keyboard dictation as fallback.                                                                                                                                                                                                                                                                                                                  | 1                             |
| Reminders every 5 / 10 / 15 min | Local notifications on a fixed grid from the start time, with an "I did it" action. Regular reminders use the `active` interruption level; only the time-limit alert is `timeSensitive`.                                                                                                                                                                                                                   | 1                             |
| Floating, draggable module      | **In-app:** floating pill with PiP-style physics (drag, flick, snap to corners, tuck into an edge, expand, close). **System-wide:** a **Live Activity** (Lock Screen + Dynamic Island) with the intention, a countdown and an interactive "I did it" button. Using Picture-in-Picture for non-video content is deliberately avoided (review risk).                                                         | 1 · 2                         |
| Hard lock                       | **Screen Time API** (FamilyControls + ManagedSettings + DeviceActivity): at the limit, shield all apps except an allowlist (Phone, Messages, Maps…) with a custom shield naming the intention. Phase 1: in-app time's-up screen + time-sensitive notification.                                                                                                                                             | 1 · 2                         |

## User flows

### 1. First launch

Welcome screen (3 feature rows, privacy line) → **Continue** → system notification prompt →
intention screen.

### 2. Set an intention (the "unlock moment")

The intention is written on a large glowing slab (see Design system). Only the essentials are
on the screen:

- A glass settings button at the top right.
- The glow slab, holding a large text field with the prompt **"What are you here to do?"** and a
  glass mic button.
  On-device dictation streams into the field; if it's unavailable, a one-line tip points to the
  keyboard mic.
- **REMIND:** 5m / 10m / 15m (default 10, then the last choice).
- **LIMIT:** Off / 15m / 30m / 45m / 1h.
- A glass **Begin** button, disabled until there's text. The session begins with a medium haptic,
  and notification permission is requested here if it hasn't been yet (asked in context, per HIG).

Validation: 1–120 characters; whitespace collapsed (dictation adds stray newlines).

### 3. During a session

- The screen goes quiet: plain black (or white), the intention in large type, and one thin
  countdown (time left when there's a limit, otherwise the next reminder) with a hairline
  progress bar. **Done** (glass) and **End session** (quiet).
- **Floating pill** on top of the app, starting in the bottom-right corner:
  - Drag → follows the finger with a slight lift; release → springs to the nearest corner,
    following the flick (WWDC "Designing Fluid Interfaces" projection).
  - Drag or fling past the left/right edge → tucks away, leaving a 28-pt tab with a chevron.
    Tap the tab → back to the corner.
  - Tap → expands: full intention, progress, **Done · Tuck · Close**.
  - Close → hidden for this session ("Show reminder" on the session screen brings it back).
  - When a reminder fires while the app is open, the pill comes out of the edge and bounces
    gently (no banner covering the screen).
- **Reminders** on the grid `start + k × interval`, never at or after the time limit, capped at
  2 hours without a limit and at 60 pending notifications (iOS allows 64).
  Copy: "Still on track? · 10 min in. You unlocked to: Reply to Sam".
- **Done** (session screen, pill, or the notification's "I did it" action) → session completed,
  success haptic, pending and delivered notifications cleared, and a quiet "Done. Phone down?"
  line on the home screen.
- **End session** → recorded as ended.

### 4. Time's up

- At the limit: time-sensitive notification ("Time's up. You unlocked to: …"). In the app, a
  full-screen, plain **Time's up** screen with the intention.
- "Did you get it done?" → **Yes, done** / **Not this time** / **5 more min** (once per session,
  counted from now).
- Then **Phone down**: a 60-second rest with a countdown before "New intention" unlocks.
- Phase 2: apps stay shielded by Screen Time until the person answers.

### 5. Settings (sheet)

Default reminder and limit, notifications status (opens iOS Settings), haptics, history (last 20,
outcome glyphs, clear with confirmation), version.

## Design system

Monochrome, quiet and precise (references: Linear, Cosmos), within Apple's Human Interface
Guidelines. Tokens live in `src/ui/theme`.

- **Color:** black and white only, following the phone's appearance (black UI in dark mode,
  white in light mode). The accent is the label color itself; hierarchy comes from opacity
  (100 / 56 / 34 / 18%) and hairlines. Color appears in exactly one place: the glow. Red is
  reserved for the single destructive action.
- **The glow (home, session card, onboarding, app icon):** a frosted slab lit from inside, in
  the style of the aurō reference: a deep umber core at the top, burnt orange along the left
  edge, a cream glow rising from the bottom and a cool blue-grey highlight in the top-right
  corner. The four lights drift, breathe and fade on long, unrelated periods (13–27 s) behind
  fine frosted grain, with a soft light rim and a warm halo spilling onto the black or white
  around it. The balance shifts with the time of day while staying in that warm family: dawn is
  lighter and creamier, day is the reference balance, dusk/night is deeper and redder. It holds
  still with Reduce Motion. Text on the glow is warm white.
- **Materials:** no solid buttons. Every control uses the same glass / brushed-metal material:
  a frosted blur, a soft vertical sheen gradient, a hairline rim and a thin highlight along the
  top edge (white-on-dark or soft-white-on-light).
- **Type:** SF Pro with tight tracking. `display` (32) for the intention, a thin `numeral` (64)
  for countdowns, `micro` uppercase monospace labels (SF Mono, 11) used sparingly, like an
  instrument readout; Dynamic Type sizes elsewhere.
- **Components:** glass and quiet capsule buttons, a glass-indicator choice group (segmented
  control), a monochrome toggle, glass icon buttons, hairline lists without icon tiles, and
  Liquid Glass (iOS 26+) for the floating pill.
- **Motion:** springs approximating SwiftUI `.snappy` / `.smooth` / `.bouncy`. Press feedback
  scales controls to 0.97, the choice indicator glides, and the home screen cross-fades into the
  quiet session screen. Every animation falls back to fades or stillness with Reduce Motion.
- **Haptics:** selection (choices), light (pill settles), medium (begin), success (done),
  warning (time's up). Can be turned off in Settings.
- **Accessibility:** VoiceOver labels everywhere (choices are radios with spoken labels like
  "Every 5 minutes"), pill custom actions (Done / Tuck away / Close), countdowns read as
  "4 minutes 5 seconds", 44-pt targets, Dynamic Type with sensible caps on floating chrome.

## Data & privacy

- Stored on-device only (AsyncStorage): settings, the active session, and the last 200 records.
- No account, no network requests, no analytics, no third-party SDKs that collect data.
- App Store privacy label: **Data Not Collected**.

## Out of scope for the MVP

Accounts and sync, analytics dashboards, streaks and gamification, Android-specific polish,
iPad layouts.
