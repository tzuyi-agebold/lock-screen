# App Store assets

- `../store.config.json` holds the listing text, categories, age rating and review notes
  (pushed with `npx eas-cli@latest metadata:push`).
- `screenshots/iphone-6.9/` holds **draft** screenshots at 1290 × 2796, accepted for the 6.9"
  iPhone slot. They are rendered from the web build. Before release, capture the same screens in
  the iOS Simulator (iPhone Pro Max) and upload those in App Store Connect.

See [docs/RELEASE.md](../docs/RELEASE.md) for the full checklist.
