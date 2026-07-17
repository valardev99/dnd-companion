import { getPiece } from "./jewelry";
import { getPlacement } from "./placements";
import { planTotals } from "./reducer";
import { formatDayLong } from "./schedule";
import type { PlanState } from "./types";

/**
 * The plan as plain text — what actually gets handed to the piercer.
 * Used by the share/copy actions on the confirmation screen.
 */
export function buildPlanSummary(state: PlanState): string {
  const totals = planTotals(state);
  const lines: string[] = ["GET PIERCED CO — PIERCING PLAN", ""];

  if (state.booking.dateISO && state.booking.time) {
    lines.push(`Appointment: ${formatDayLong(state.booking.dateISO)} at ${state.booking.time}`, "");
  }

  lines.push(`Placements (${state.selected.length}):`);
  for (const id of state.selected) {
    const placement = getPlacement(id);
    const pieceId = state.assignments[id];
    const piece = pieceId ? getPiece(pieceId) : undefined;
    const jewelry = piece ? `${piece.name} (${piece.metal}, $${piece.price})` : "jewelry TBD at studio";
    lines.push(`  • ${placement.label} — $${placement.serviceFee} service — ${jewelry}`);
  }

  lines.push(
    "",
    `Service total: $${totals.serviceTotal}`,
    `Jewelry total: $${totals.jewelryTotal}`,
    `Estimated total: $${totals.total} (deposit $${totals.deposit} applied)`,
  );

  if (state.booking.note.trim()) {
    lines.push("", `Notes: ${state.booking.note.trim()}`);
  }

  return lines.join("\n");
}
