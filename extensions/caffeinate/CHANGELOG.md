# Changelog

All notable changes to this project will be documented in this file.  
This project follows "Keep a Changelog" principles and uses semantic, human-readable entries.

## [Unreleased] - 2025-12-16

### Added
- Initial Raycast extension "Caffeinate" (Windows) — prevent the system from sleeping when needed.
- Commands
  - `caffeinate` — Prevent your Windows PC from sleeping (mode: no-view).
  - `decaffeinate` — Turn off sleep prevention (mode: no-view).
  - `caffeinateWhile` — Prevent sleep while a specified application is running (mode: view).
  - `caffeinateToggle` — Toggle caffeine state on/off (mode: no-view).
  - `caffeinateFor` — Keep the PC awake for a given duration (arguments: hours, minutes, seconds; mode: no-view).
  - `caffeinateUntil` — Keep the PC awake until a specific time (argument: time; mode: no-view).
  - `addSchedule` — UI for scheduling caffeination (mode: view).
  - `status` — Check current caffeination status (mode: no-view; interval: 15s).
- Tools (for Raycast Tool integration)
  - `caffeinate-for`, `caffeinate`, `check-caffeination-status`, `decaffeinate`, `schedule-caffeination`, `caffeinate-while-app-is-running`.
- Smart scheduling with natural-language support (AI-driven schedules described in manifest).
- README and metadata describing features, screenshots and usage examples.

### Changed
- N/A (initial development)

### Fixed
- N/A (initial development)

### Notes
- Platforms: Windows only.
- Categories: System.
- Dependencies:
  - @raycast/api, @raycast/utils
- Dev dependencies:
  - @raycast/eslint-config, typescript, prettier, eslint, etc.
- Development scripts (from package.json):
  - `npm run dev` — start extension in development (ray develop).
  - `npm run build` — build extension to `dist`.
  - `npm run publish` — publish to Raycast Store (uses @raycast/api publish helper).

### Usage examples
- Command palette: run `Caffeinate` to keep PC awake indefinitely.
- Use `Caffeinate for` with arguments to keep awake for a defined period (e.g., "1" hours, "30" minutes).
- Use `Caffeinate While` to monitor an app process; caffeination toggles while the process is active.
- Use `Schedule Caffeination` to add recurring schedules (weekday schedules, time ranges) via the AI assistant described in manifest.

### Contributors
- nitinprajwal — author / initial implementation

---

## Release history
- Unreleased — Initial development and feature implementation (2025-12-16)
