import { getPiece, pieceFits } from "./jewelry";
import { getPlacement } from "./placements";
import type { PlacementId, PlanState } from "./types";

/**
 * All plan mutations go through this reducer so the invariants hold no matter
 * which screen triggered the change:
 *
 *  1. `assignments` only ever references placements in `selected` — deselecting
 *     a placement removes its jewelry too (the original mock let these drift).
 *  2. One piece per placement, and only pieces that physically fit it.
 *  3. Assigning jewelry implicitly selects the placement and saves the piece.
 *  4. A booking can only be confirmed when it is actually complete.
 */

export type PlanAction =
  | { type: "hydrate"; state: PlanState }
  | { type: "toggle-placement"; placement: PlacementId }
  | { type: "assign"; placement: PlacementId; pieceId: string }
  | { type: "unassign"; placement: PlacementId }
  | { type: "toggle-saved"; pieceId: string }
  | { type: "set-date"; dateISO: string }
  | { type: "set-time"; time: string }
  | { type: "set-note"; note: string }
  | { type: "confirm"; confirmedAtISO: string }
  | { type: "start-new-plan" };

export function createEmptyPlan(): PlanState {
  return {
    version: 1,
    selected: [],
    assignments: {},
    saved: [],
    booking: { dateISO: null, time: null, note: "", status: "draft", confirmedAtISO: null },
  };
}

export function planReducer(state: PlanState, action: PlanAction): PlanState {
  switch (action.type) {
    case "hydrate":
      return action.state;

    case "toggle-placement": {
      const { placement } = action;
      if (state.selected.includes(placement)) {
        const assignments = { ...state.assignments };
        delete assignments[placement];
        return {
          ...state,
          selected: state.selected.filter((id) => id !== placement),
          assignments,
        };
      }
      return { ...state, selected: [...state.selected, placement] };
    }

    case "assign": {
      const { placement, pieceId } = action;
      if (!getPiece(pieceId) || !pieceFits(pieceId, placement)) return state;
      return {
        ...state,
        selected: state.selected.includes(placement)
          ? state.selected
          : [...state.selected, placement],
        assignments: { ...state.assignments, [placement]: pieceId },
        saved: state.saved.includes(pieceId) ? state.saved : [...state.saved, pieceId],
      };
    }

    case "unassign": {
      if (!(action.placement in state.assignments)) return state;
      const assignments = { ...state.assignments };
      delete assignments[action.placement];
      return { ...state, assignments };
    }

    case "toggle-saved": {
      const { pieceId } = action;
      if (!getPiece(pieceId)) return state;
      return {
        ...state,
        saved: state.saved.includes(pieceId)
          ? state.saved.filter((id) => id !== pieceId)
          : [...state.saved, pieceId],
      };
    }

    case "set-date":
      // Changing the day invalidates the chosen time — its slot may not exist there.
      return {
        ...state,
        booking: { ...state.booking, dateISO: action.dateISO, time: null, status: "draft" },
      };

    case "set-time":
      return { ...state, booking: { ...state.booking, time: action.time, status: "draft" } };

    case "set-note":
      return { ...state, booking: { ...state.booking, note: action.note } };

    case "confirm":
      if (!canBook(state)) return state;
      return {
        ...state,
        booking: { ...state.booking, status: "confirmed", confirmedAtISO: action.confirmedAtISO },
      };

    case "start-new-plan":
      // Keep the wishlist — it belongs to the person, not to one appointment.
      return { ...createEmptyPlan(), saved: state.saved };

    default:
      return state;
  }
}

/* ---------- selectors ---------- */

export function canBook(state: PlanState): boolean {
  return (
    state.selected.length > 0 && state.booking.dateISO !== null && state.booking.time !== null
  );
}

export interface PlanTotals {
  serviceTotal: number;
  jewelryTotal: number;
  total: number;
  deposit: number;
}

export const DEPOSIT = 40;

export function planTotals(state: PlanState): PlanTotals {
  const serviceTotal = state.selected.reduce(
    (sum, id) => sum + getPlacement(id).serviceFee,
    0,
  );
  const jewelryTotal = Object.values(state.assignments).reduce(
    (sum, pieceId) => sum + (pieceId ? (getPiece(pieceId)?.price ?? 0) : 0),
    0,
  );
  return {
    serviceTotal,
    jewelryTotal,
    total: serviceTotal + jewelryTotal,
    deposit: Math.min(DEPOSIT, serviceTotal + jewelryTotal),
  };
}
