import { isJewelryId } from "./jewelry";
import { isPlacementId } from "./placements";
import { createEmptyPlan } from "./reducer";
import type { PlanState } from "./types";

const STORAGE_KEY = "gpc:plan:v1";

/**
 * localStorage persistence with a versioned key and defensive parsing.
 * Anything unrecognised (older schema, hand-edited JSON, ids removed from the
 * catalog) is dropped field-by-field instead of crashing the app.
 */
export function loadPlan(): PlanState | null {
  if (typeof window === "undefined") return null; // SSR
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null; // storage disabled (private mode, iframe policies)
  }
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const p = parsed as Record<string, unknown>;
    if (p.version !== 1) return null;

    const base = createEmptyPlan();

    if (Array.isArray(p.selected)) {
      base.selected = p.selected.filter(isPlacementId);
    }
    if (typeof p.assignments === "object" && p.assignments !== null) {
      for (const [placement, pieceId] of Object.entries(p.assignments)) {
        if (isPlacementId(placement) && isJewelryId(pieceId) && base.selected.includes(placement)) {
          base.assignments[placement] = pieceId;
        }
      }
    }
    if (Array.isArray(p.saved)) {
      base.saved = p.saved.filter(isJewelryId);
    }
    if (typeof p.booking === "object" && p.booking !== null) {
      const b = p.booking as Record<string, unknown>;
      base.booking = {
        dateISO: typeof b.dateISO === "string" ? b.dateISO : null,
        time: typeof b.time === "string" ? b.time : null,
        note: typeof b.note === "string" ? b.note : "",
        status: b.status === "confirmed" ? "confirmed" : "draft",
        confirmedAtISO: typeof b.confirmedAtISO === "string" ? b.confirmedAtISO : null,
      };
    }
    return base;
  } catch {
    return null;
  }
}

export function savePlan(state: PlanState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota exceeded / storage disabled — the app keeps working in memory.
  }
}
