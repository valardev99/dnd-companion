# Code Review: Lovable "Get Pierced Planner" Export → Functional Rebuild

**Verdict on the Lovable export:** it is a *pitch mockup*, not a product. It renders a fake
phone inside a marketing landing page and simulates an app with hardcoded data. Nothing the
user does survives a refresh, the dates are wrong the day after it was generated, and the
"AI scan" is a `setTimeout`. If the goal is a working planner customers can actually use to
plan a piercing and arrive at the studio with that plan, roughly none of the original code
is reusable as-is.

This directory is a ground-up rebuild on the **same Lovable template** (TanStack Start +
Tailwind v4 + the GPC wine/pink/gold theme), so files can be copied back into the connected
Lovable project without fighting the toolchain.

---

## What was wrong with the export

### Product-level
| # | Issue | Where |
|---|-------|-------|
| 1 | The whole thing is a landing page *about* an app — fake phone frame, notch, "9:41" status bar, marketing side copy. There is no app. | `routes/index.tsx` (all of it) |
| 2 | Pre-seeded fake state: user "Sasha", a pre-filled plan, a pre-booked "Fri 14 · 3:30 PM" appointment with "Miles". First impression is someone else's data. | `INITIAL_PLAN` |
| 3 | "AI · RESCAN" is a 2.4-second `setTimeout` that animates a gradient. "AR · LIVE" labels a static JPEG. Dishonest claims wired into the UI. | `MapScreen`, `TryOnScreen` |
| 4 | Booking dates are hardcoded strings (`"Wed 12"…"Sun 16"`) — permanently stale, no notion of *today*, past slots bookable. | `BookScreen` |
| 5 | "Confirm Booking" navigates to a screen. No record, nothing sent, nothing exportable — the one thing the flow promises ("your plan goes to your piercer") doesn't exist. | `ConfirmedScreen` |
| 6 | No persistence at all. Close the tab, lose the plan. | everywhere |

### State-model bugs
| # | Issue | Where |
|---|-------|-------|
| 7 | Assignments keyed **piece → placement** (`pieces: Record<pieceId, PlacementId>`), so two pieces can occupy one placement, and deselecting a placement on the map **orphans** the jewelry assigned to it (it stays in the booking summary and totals). Real ears hold one piece per hole. | `Plan` type |
| 8 | `useEffect` keyed on `tryOnPiece` with an `eslint-disable exhaustive-deps` reading stale `availablePlacements` — placement silently resets to a possibly-deselected spot. | `TryOnScreen` |
| 9 | Toast `setTimeout`s never cleared — leak on unmount, and rapid clicks make toasts vanish early. | `TryOnScreen.toggleSave/addToPlan` |
| 10 | No fit rules: a clicker hoop can be "worn" on the flat, a flat back on the daith. The plan handed to a piercer could be physically impossible. | `JEWELRY` |
| 11 | Two different ear *photos* with hand-tuned percentage coordinates that don't correspond between the map and try-on screens — "helix" is a different pixel on each. | `PLACEMENTS`, both screens |
| 12 | Non-null assertions (`p!.name`, `p!.price`) sprinkled through the booking summary; one bad id in state crashes the screen. | `BookScreen` |
| 13 | Hotlinked Shopify CDN images with no error handling — a dead link renders a broken-image icon in the "vault". | all screens |

### Craft
| # | Issue |
|---|-------|
| 14 | 1,092 lines in one file: data, state, six screens, icons, marketing copy. |
| 15 | 47 shadcn/ui components + Radix/recharts/embla/react-hook-form/zod shipped; **zero** used. (Removed here — `bunx shadcn add <x>` restores any of them.) |
| 16 | Accessibility: 8–9px text, ~24px touch targets, placement dots with no keyboard access, save buttons with no pressed state. |

---

## What the rebuild does instead

**Architecture** — data, rules, and UI are separated and typed:

```
src/lib/planner/     types, placements (anatomy + fees + healing), jewelry (+fit rules),
                     reducer (all mutations, invariants enforced), storage (versioned,
                     validating localStorage), schedule (real dates/slots), summary (export text)
src/hooks/           usePlanner (SSR-safe persistence), useToast (timer hygiene)
src/components/planner/  EarDiagram (one shared SVG), BottomNav, screens/*
src/routes/index.tsx     ~120-line shell
```

**Functionality**
- **Real state machine** (`reducer.ts`): assignments keyed **placement → piece**; deselecting
  a placement removes its jewelry; assigning implies selecting + saving; pieces that don't
  fit a placement are rejected at the reducer, not just hidden in the UI.
- **Persistence**: versioned localStorage with field-by-field validation — corrupt or stale
  data degrades to a fresh plan, never a crash (verified with garbage in the storage key).
- **Real scheduling**: next 14 days generated from the clock, today's already-past slots
  disabled, changing the day clears the chosen time.
- **One SVG ear** shared by map, try-on and summary — same coordinates everywhere, jewelry
  rendered *on* the ear, keyboard-operable nodes with ~44px hit areas.
- **Fit rules**: hoops need a rim (no flat), flat backs need a flat exit (no daith); the
  tray dims what doesn't fit and explains why.
- **Honest pricing**: per-placement service fee + jewelry, line-item math, deposit.
- **A deliverable**: confirmation screen builds a plain-text plan (placements, jewelry,
  totals, notes) and hands it to `navigator.share` with clipboard fallback — the "sent
  ahead to your piercer" promise, actually kept.
- **Honest empty states** instead of fake seeded data; no "AI"/"AR" claims.
- **Resilience**: image fallbacks for the CDN links, deep-link guard on the confirmed
  screen, corrupt-storage guard, no non-null assertions.

**Verification** — `npx tsc --noEmit` clean, `npm run build` clean, and a 26-check
Playwright drive of the real flows (select/deselect placements, fit-rule assignment,
remove/re-add, search + save, booking gates, confirm, reload-persistence, corrupt-storage
boot) — 26/26 passing.

## Running it

```bash
cd get-pierced-planner
npm install   # or bun install
npm run dev
```

## Honest limitations (by design, until there's a backend)
- Bookings persist locally and export as text; there is no server to receive them yet.
  `schedule.ts` and the `Booking` type are shaped to become the API contract.
- Slot availability is "all open, past slots disabled" — real availability needs the studio's
  calendar.
- Catalog is the 8 sample pieces from the export; swap in a Shopify product fetch when ready.
