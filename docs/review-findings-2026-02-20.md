# Review Findings Tracker (2026-02-20)

| ID | Priority | File | Summary | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| F1 | P1 | `src/components/Citadel/hooks/useCommandHistory.ts` | Base history navigation on loaded commands | Done | `navigateHistory` now computes indexes from freshly loaded commands and guards missing selections. |
| F2 | P1 | `src/components/Citadel/Citadel.tsx` | Guard custom element registration from duplicate loads | Done | Registration now checks existing element before `define`, and avoids crashing in non-browser contexts. |
| F3 | P2 | `src/components/Citadel/Citadel.tsx` | Unmount React root when custom element disconnects | Done | Added `disconnectedCallback` to unmount root and clear shadow contents. |
| F4 | P2 | `src/components/Citadel/types/state.ts` | Stop using millisecond timestamps as output identity | Done | Added stable per-output `id` and switched result patching/render keys from timestamp to id. |
| F5 | P2 | `src/components/Citadel/storage/StorageFactory.ts` | Respect per-instance storage configuration | Done | Storage now initializes from requested type and reinitializes when config changes. |
| F6 | P1 | `src/components/Citadel/config/defaults.ts` | Remove runtime dependency on `process.env` in browser bundle | Done | Default config and logger now use `import.meta.env.PROD` rather than runtime `process.env`. |

## Next Up

- None. All tracked findings above are implemented.
