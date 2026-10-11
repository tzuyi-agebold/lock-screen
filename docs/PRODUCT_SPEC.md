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

- Large title: **"What are you here to do?"** The text field is focused, so typing can start
  immediately.
- Mic button: on-device dictation streams into the field. Unavailable → tip to use the keyboard mic.
- Suggestions: recent intentions first, then defaults ("Reply to messages", "Check my calendar"…).
- **Remind me every:** segmented control 5 / 10 / 15 min (default 10, then the last choice).
- **Time limit:** toggle, revealing 15 / 30 / 45 / 60 min.
- **Start** (disabled until there's text) → session begins with a medium haptic. Notification
  permission is requested here if it hasn't been yet (asked in context, per HIG).

Validation: 1–120 characters; whitespace collapsed (dictation adds stray newlines).

### 3. During a session

- Dashboard: the intention in large type, time elapsed, next reminder countdown, time left with
  a progress bar, today's tally.
- **Floating pill** on top of the app, starting in the bottom-right corner:
  - Drag → follows the finger with a slight lift; release → springs to the nearest corner,
    following the flick (WWDC "Designing Fluid Interfaces" projection).
  - Drag or fling past the left/right edge → tucks away, leaving a 28-pt tab with a chevron.
    Tap the tab → back to the corner.
  - Tap → expands: full intention, progress bar, **I did it · Tuck · Close**.
  - Close → hidden for this session ("Show floating reminder" on the dashboard brings it back).
  - When a reminder fires while the app is open, the pill comes out of the edge and bounces
    gently (no banner covering the screen).
- **Reminders** on the grid `start + k × interval`, never at or after the time limit, capped at
  2 hours without a limit and at 60 pending notifications (iOS allows 64).
  Copy: "Still on track? · 10 min in. You unlocked to: Reply to Sam".
- **I did it** (dashboard, pill, or notification action) → session completed, success haptic,
  pending and delivered notifications cleared, and a "Done: …" banner on the next screen.
- **End without finishing** → recorded as ended.

### 4. Time's up

- At the limit: time-sensitive notification ("Time's up. You unlocked to: …"). In the app, the
  full-screen, always-dark **Time's up** screen.
- "Did you get it done?" → **Yes, I did it** / **Not this time** / **5 more minutes** (once
  per session, counted from now).
- Then **Phone down**: a 60-second rest with a countdown before "Set a new intention" unlocks.
- Phase 2: apps stay shielded by Screen Time until the person answers.

### 5. Settings (sheet)

Default reminder, default time limit, notifications status (opens iOS Settings), haptics, the
"coming in the App Store version" entry points, history (last 20, outcome icons, clear with
confirmation), version.

## Design system

Follows Apple's Human Interface Guidelines; tokens live in `src/ui/theme`.

- **Color:** iOS semantic system colors, light and dark. Indigo accent (calm, not alarming).
  The time's-up screen uses a deep indigo night.
- **Type:** Dynamic Type text styles (Large Title 34 … Caption 2 11), SF Pro, and SF Pro Rounded
  with tabular numerals for timers.
- **Components:** filled / tinted / gray / plain capsule buttons, inset-grouped lists with icon
  tiles, native segmented control and switch, SF Symbols, Liquid Glass (iOS 26+) or system blur
  for floating chrome.
- **Motion:** springs approximating SwiftUI `.snappy` / `.smooth` / `.bouncy`. Press feedback
  scales controls to 0.97. Every animation falls back to fades when Reduce Motion is on.
- **Haptics:** selection (pickers, chips), light (pill settles), medium (start), success
  (done), warning (time's up). Can be turned off in Settings.
- **Accessibility:** VoiceOver labels everywhere, pill custom actions (I did it / Tuck away /
  Close), live countdowns read as "4 minutes 5 seconds", 44-pt targets, Dynamic Type with sensible
  caps on floating chrome.

## Data & privacy

- Stored on-device only (AsyncStorage): settings, the active session, and the last 200 records.
- No account, no network requests, no analytics, no third-party SDKs that collect data.
- App Store privacy label: **Data Not Collected**.

## Out of scope for the MVP

Accounts and sync, analytics dashboards, streaks and gamification, Android-specific polish,
iPad layouts.
