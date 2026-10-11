# App Store Review Readiness

How Intention stays within the [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
and the [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/).
Re-check this list before every submission.

## Guideline checklist

| Guideline                                    | What it requires                                  | How Intention complies                                                                                                                                                                                         |
| -------------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **2.5.1** Public APIs only                   | No private APIs or hooks into system UI           | No unlock interception, device locking or overlays over other apps. Only UserNotifications, Speech, ActivityKit, WidgetKit/Controls, App Intents, FamilyControls/ManagedSettings/DeviceActivity.               |
| **2.3 / 2.3.1** Accurate metadata            | No claims the app can't keep                      | Never say "replaces your lock screen" or "locks your phone". Say "asks for an intention when you open it, reminds you, and can pause distracting apps (Screen Time) when time's up". Screenshots show real UI. |
| **4.2** Minimum functionality                | More than a repackaged website                    | Native notifications, haptics, speech, Live Activity, Screen Time integration.                                                                                                                                 |
| **4.5.4** Push/notifications                 | Not required to use the app; no marketing         | Notifications are only reminders the person scheduled. The app works without permission (in-app nudges).                                                                                                       |
| **5.1.1** Data collection & permissions      | Clear purpose strings; ask in context             | Notification permission requested on onboarding / first Start. Mic and speech only when the mic button is tapped. Purpose strings set in `app.json`.                                                           |
| **5.1.2** Data use                           | Screen Time data stays on device                  | FamilyControls tokens and activity are never transmitted, logged or used for anything but shielding.                                                                                                           |
| **5.1.1(v)** Account deletion                | Required if accounts exist                        | No accounts.                                                                                                                                                                                                   |
| **2.5.4** Background modes                   | Only for their intended purpose                   | No background audio, location or VoIP tricks to stay alive. Reminders are scheduled local notifications.                                                                                                       |
| **HIG: Live Activities**                     | For tasks with a defined start and end, up to 8 h | A session is a bounded task. The activity ends at completion or at the limit (max 60 + 5 min).                                                                                                                 |
| **HIG: Notifications / interruption levels** | `timeSensitive` only when it truly is             | Regular reminders: `active`. Only the time-limit alert is `timeSensitive`. People can turn off Time Sensitive in iOS Settings.                                                                                 |

## Permissions & purpose strings

| Permission            | When it's asked                                            | String (in `app.json`)                                                                               |
| --------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Notifications         | Onboarding → Continue, or first Start                      | System prompt (no custom string)                                                                     |
| Microphone            | First tap on the mic button (development/App Store builds) | "Intention uses the microphone so you can say your intention instead of typing it."                  |
| Speech recognition    | Same moment                                                | "Intention turns your spoken intention into text. Speech is processed on your iPhone when possible." |
| Screen Time (Phase 2) | When the person first turns on "Pause apps when time's up" | System FamilyControls sheet (`.individual` authorization)                                            |

## Entitlements & capabilities

| Entitlement                                            | Phase | Notes                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------------------ | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `com.apple.developer.usernotifications.time-sensitive` | 1     | Already set in `app.json` → `ios.entitlements`.                                                                                                                                                                                                                                                                                                             |
| Push Notifications (APNs)                              | 1     | Added automatically by `expo-notifications`; only local notifications are used.                                                                                                                                                                                                                                                                             |
| `com.apple.developer.family-controls`                  | 2     | **Development works immediately, but App Store distribution needs Apple's approval.** Request it per bundle ID (app + each extension) at <https://developer.apple.com/contact/request/family-controls-distribution>. Allow 1–4 weeks. Describe the use plainly: "Individuals choose apps to pause when the time limit they set for their own session ends." |
| App Groups                                             | 2     | Share the active session between the app, widget, Live Activity and Screen Time extensions.                                                                                                                                                                                                                                                                 |
| `NSSupportsLiveActivities`                             | 2     | Info.plist key, set via the widgets config plugin.                                                                                                                                                                                                                                                                                                          |

## Privacy

- **Privacy manifest** (`PrivacyInfo.xcprivacy`) generated from `app.json → ios.privacyManifests`:
  no tracking, no collected data, UserDefaults access with reason `CA92.1` (app-only storage).
- **App Store privacy label:** Data Not Collected.
- **Export compliance:** `ITSAppUsesNonExemptEncryption = false` (no custom encryption).

## Review notes template (paste into App Store Connect → App Review Information)

> Intention helps people use their phone deliberately. When opened, it asks what the person
> wants to do, sends the reminders they choose (every 5, 10 or 15 minutes), and, if they set a
> time limit, shows a "Time's up" screen. With their Screen Time permission, it also pauses the
> apps they chose until they respond. No account is required and no data leaves the device.
> To test: open the app → type an intention → turn on "Set a time limit" → choose 15 min →
> Start. The floating pill can be dragged, tucked into the screen edge and expanded.

## Common rejection risks to avoid

- Marketing copy or screenshots implying system-level unlock interception.
- Using Picture-in-Picture to show non-video content (the pill is in-app; the system-wide
  surface is the Live Activity).
- Requesting notification permission at launch, before explaining why.
- Sending notifications the person didn't configure (no "We miss you" nudges).
- Shipping FamilyControls code before the distribution entitlement is granted. Gate it behind
  `focusShield.available` (already the case).
