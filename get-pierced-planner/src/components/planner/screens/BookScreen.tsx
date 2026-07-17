import { useMemo, useState } from "react";
import { getPiece } from "@/lib/planner/jewelry";
import { getPlacement } from "@/lib/planner/placements";
import { canBook, planTotals } from "@/lib/planner/reducer";
import { slotsFor, upcomingDays } from "@/lib/planner/schedule";
import { JewelryImage } from "../JewelryImage";
import { PrimaryButton, SectionLabel, type ScreenProps } from "../shared";

export function BookScreen({ plan, dispatch, go, goTryOn, showToast }: ScreenProps) {
  // Snapshot "now" once per visit so the day strip doesn't reshuffle mid-tap.
  const [now] = useState(() => new Date());
  const days = useMemo(() => upcomingDays(14, now), [now]);
  const slots = useMemo(
    () => (plan.booking.dateISO ? slotsFor(plan.booking.dateISO, now) : []),
    [plan.booking.dateISO, now],
  );

  const totals = planTotals(plan);
  const bookable = canBook(plan);
  const unassigned = plan.selected.filter((id) => !plan.assignments[id]);

  const confirm = () => {
    if (!bookable) return;
    dispatch({ type: "confirm", confirmedAtISO: new Date().toISOString() });
    go("confirmed");
  };

  return (
    <div className="h-full overflow-y-auto px-5 pb-6 float-in">
      <div className="mt-2">
        <SectionLabel>Step 03 · Consultation</SectionLabel>
        <h1 className="font-display text-2xl mt-1">Book your session</h1>
      </div>

      <div className="mt-4">
        <SectionLabel>Date</SectionLabel>
        <div className="mt-2 flex gap-2 overflow-x-auto -mx-5 px-5 pb-1">
          {days.map((d) => {
            const on = plan.booking.dateISO === d.iso;
            return (
              <button
                key={d.iso}
                type="button"
                onClick={() => dispatch({ type: "set-date", dateISO: d.iso })}
                aria-pressed={on}
                className={`shrink-0 w-16 py-2.5 rounded-xl border text-center transition-colors ${
                  on
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary/50"
                }`}
              >
                <div className="text-[10px] tracking-widest uppercase">
                  {d.isToday ? "Today" : d.weekday}
                </div>
                <div className="font-display text-xl leading-none mt-1">{d.dayNum}</div>
                <div className="text-[9px] tracking-widest uppercase mt-0.5 opacity-70">{d.monthShort}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        <SectionLabel>Time</SectionLabel>
        {plan.booking.dateISO ? (
          <div className="mt-2 grid grid-cols-3 gap-2">
            {slots.map((s) => {
              const on = plan.booking.time === s.time;
              return (
                <button
                  key={s.time}
                  type="button"
                  disabled={!s.available}
                  onClick={() => dispatch({ type: "set-time", time: s.time })}
                  aria-pressed={on}
                  className={`min-h-11 rounded-lg text-[11px] tracking-widest uppercase border transition-colors ${
                    on
                      ? "bg-primary text-primary-foreground border-primary"
                      : s.available
                        ? "border-border text-muted-foreground hover:border-primary/50"
                        : "border-border/40 text-muted-foreground/40 line-through cursor-not-allowed"
                  }`}
                >
                  {s.time}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">Pick a date to see open times.</p>
        )}
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between mb-2">
          <SectionLabel>Your plan · sent ahead</SectionLabel>
          <button
            type="button"
            onClick={() => go("map")}
            className="min-h-11 px-2 text-[10px] tracking-widest uppercase text-primary"
          >
            Edit
          </button>
        </div>

        {plan.selected.length === 0 ? (
          <div className="rounded-xl border border-border bg-card/40 p-4 text-center">
            <p className="text-xs text-muted-foreground">
              No placements chosen yet — your piercer needs to know where you're piercing.
            </p>
            <button
              type="button"
              onClick={() => go("map")}
              className="mt-3 min-h-11 px-4 text-[11px] tracking-widest uppercase text-primary border border-primary/40 rounded-full"
            >
              Open the ear map
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
            {plan.selected.map((id) => {
              const placement = getPlacement(id);
              const pieceId = plan.assignments[id];
              const piece = pieceId ? getPiece(pieceId) : undefined;
              return (
                <div
                  key={id}
                  className="flex items-center gap-3 text-xs rounded-lg bg-card/40 border border-border p-2.5"
                >
                  <div className="w-9 h-9 rounded bg-accent/15 flex items-center justify-center overflow-hidden shrink-0">
                    {piece ? (
                      <JewelryImage src={piece.img} alt={piece.name} className="max-w-[85%] max-h-[85%]" />
                    ) : (
                      <span className="text-muted-foreground">?</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium">{placement.label}</div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground truncate">
                      {piece ? piece.name : "Jewelry TBD at studio"}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[11px] text-gold">${placement.serviceFee + (piece?.price ?? 0)}</div>
                    <div className="text-[9px] text-muted-foreground uppercase tracking-widest">
                      {piece ? `svc ${placement.serviceFee} + jwl ${piece.price}` : "service only"}
                    </div>
                  </div>
                </div>
              );
            })}

            {unassigned.length > 0 && (
              <button
                type="button"
                onClick={() => goTryOn()}
                className="w-full text-left text-[11px] text-muted-foreground rounded-lg border border-dashed border-border p-2.5 hover:border-primary/50 hover:text-bone transition-colors"
              >
                {unassigned.length} placement{unassigned.length === 1 ? "" : "s"} without jewelry —
                tap to pick pieces (or choose at the studio)
              </button>
            )}

            <div className="rounded-lg border border-border bg-card/40 p-2.5 space-y-1 text-[11px]">
              <Row label="Service" value={`$${totals.serviceTotal}`} />
              <Row label="Jewelry" value={`$${totals.jewelryTotal}`} />
              <Row label="Estimated total" value={`$${totals.total}`} strong />
              <Row label="Deposit due now" value={`$${totals.deposit} · applied to total`} />
            </div>
          </div>
        )}
      </div>

      <div className="mt-4">
        <label htmlFor="booking-note" className="block">
          <SectionLabel>Notes for your piercer</SectionLabel>
        </label>
        <textarea
          id="booking-note"
          value={plan.booking.note}
          onChange={(e) => dispatch({ type: "set-note", note: e.target.value })}
          rows={3}
          maxLength={500}
          placeholder="Anatomy notes, pain worries, the look you're going for…"
          className="mt-2 w-full rounded-xl bg-card/60 border border-border p-3 text-sm text-bone placeholder:text-muted-foreground focus:outline-none focus:border-primary/60"
        />
      </div>

      <div className="mt-4">
        <PrimaryButton
          onClick={() => {
            if (!bookable) {
              showToast(
                plan.selected.length === 0
                  ? "Add at least one placement first"
                  : "Pick a date and time first",
              );
              return;
            }
            confirm();
          }}
        >
          {bookable
            ? "Confirm booking"
            : plan.selected.length === 0
              ? "Add placements to book"
              : "Pick a date & time"}
        </PrimaryButton>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Free cancellation up to 24h before your appointment.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className={strong ? "text-gold font-medium" : "text-bone"}>{value}</span>
    </div>
  );
}
