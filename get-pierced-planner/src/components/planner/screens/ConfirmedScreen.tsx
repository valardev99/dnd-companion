import { useState } from "react";
import { getPiece } from "@/lib/planner/jewelry";
import { getPlacement } from "@/lib/planner/placements";
import { formatDayLong } from "@/lib/planner/schedule";
import { buildPlanSummary } from "@/lib/planner/summary";
import { JewelryImage } from "../JewelryImage";
import { GhostButton, PrimaryButton, SectionLabel, type ScreenProps } from "../shared";

export function ConfirmedScreen({ plan, dispatch, go, showToast }: ScreenProps) {
  const [confirmingReset, setConfirmingReset] = useState(false);
  const { booking } = plan;

  // Deep-linking/back-nav guard: nothing confirmed → nothing to show.
  if (booking.status !== "confirmed" || !booking.dateISO || !booking.time) {
    return (
      <div className="h-full overflow-y-auto px-5 pb-6 float-in">
        <div className="mt-10 rounded-2xl border border-border bg-card/40 p-6 text-center">
          <p className="text-sm text-muted-foreground">No confirmed booking yet.</p>
          <div className="mt-4">
            <PrimaryButton onClick={() => go("book")}>Go to booking</PrimaryButton>
          </div>
        </div>
      </div>
    );
  }

  const sharePlan = async () => {
    const text = buildPlanSummary(plan);
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: "My piercing plan", text });
        return;
      }
      await navigator.clipboard.writeText(text);
      showToast("Plan copied to clipboard");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return; // user closed share sheet
      try {
        await navigator.clipboard.writeText(text);
        showToast("Plan copied to clipboard");
      } catch {
        showToast("Couldn't share — try a screenshot");
      }
    }
  };

  const startNewPlan = () => {
    dispatch({ type: "start-new-plan" });
    go("home");
    showToast("Fresh plan started — saved pieces kept");
  };

  return (
    <div className="h-full overflow-y-auto px-5 pb-6 float-in">
      <div className="mt-6 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-gold-gradient flex items-center justify-center text-primary-foreground text-3xl" aria-hidden>
          ✓
        </div>
        <div className="text-[11px] tracking-[0.25em] uppercase text-primary mt-4">Booking confirmed</div>
        <h1 className="font-display text-2xl mt-1">See you in the chair.</h1>
        <p className="text-xs text-muted-foreground mt-2 max-w-[260px]">
          Bring photo ID, eat beforehand, and skip the alcohol the night before — you'll thank us.
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-4">
        <SectionLabel>Appointment</SectionLabel>
        <div className="font-display text-lg mt-1">
          {formatDayLong(booking.dateISO)} · {booking.time}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {plan.selected.length} placement{plan.selected.length === 1 ? "" : "s"} · Get Pierced Co Studio
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-card/60 p-3">
        <SectionLabel>Your plan</SectionLabel>
        <div className="mt-2 space-y-1.5">
          {plan.selected.map((id) => {
            const placement = getPlacement(id);
            const pieceId = plan.assignments[id];
            const piece = pieceId ? getPiece(pieceId) : undefined;
            return (
              <div key={id} className="flex items-center gap-2.5 text-xs">
                <div className="w-8 h-8 rounded bg-accent/15 flex items-center justify-center overflow-hidden shrink-0">
                  {piece ? (
                    <JewelryImage src={piece.img} alt={piece.name} className="max-w-[85%] max-h-[85%]" />
                  ) : (
                    <span className="text-muted-foreground">?</span>
                  )}
                </div>
                <span className="font-medium">{placement.label}</span>
                <span className="text-muted-foreground truncate flex-1">
                  {piece ? piece.name : "jewelry at studio"}
                </span>
              </div>
            );
          })}
        </div>
        {booking.note.trim() && (
          <p className="mt-3 text-[11px] text-muted-foreground border-t border-border pt-2">
            “{booking.note.trim()}”
          </p>
        )}
      </div>

      <div className="mt-5 space-y-2">
        <PrimaryButton onClick={sharePlan}>Share plan with your piercer</PrimaryButton>
        <div className="grid grid-cols-2 gap-2">
          <GhostButton onClick={() => go("book")}>Modify booking</GhostButton>
          {confirmingReset ? (
            <button
              type="button"
              onClick={startNewPlan}
              className="w-full min-h-12 rounded-full border border-destructive/60 text-[12px] tracking-widest uppercase text-destructive"
            >
              Really start over?
            </button>
          ) : (
            <GhostButton onClick={() => setConfirmingReset(true)}>Start new plan</GhostButton>
          )}
        </div>
      </div>
    </div>
  );
}
