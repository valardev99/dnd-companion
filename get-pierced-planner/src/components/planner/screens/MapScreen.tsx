import { PLACEMENTS, getPlacement } from "@/lib/planner/placements";
import { EarDiagram } from "../EarDiagram";
import { Chip, PrimaryButton, SectionLabel, type ScreenProps } from "../shared";

export function MapScreen({ plan, dispatch, go, showToast }: ScreenProps) {
  const toggle = (id: (typeof PLACEMENTS)[number]["id"]) => {
    const removing = plan.selected.includes(id);
    const hadJewelry = removing && plan.assignments[id] !== undefined;
    dispatch({ type: "toggle-placement", placement: id });
    if (hadJewelry) showToast(`${getPlacement(id).label} removed — jewelry unassigned`);
  };

  const lastSelected = plan.selected.at(-1);
  const detail = lastSelected ? getPlacement(lastSelected) : null;

  return (
    <div className="h-full overflow-y-auto px-5 pb-6 float-in">
      <div className="mt-2">
        <SectionLabel>Step 01 · Ear map</SectionLabel>
        <h1 className="font-display text-2xl mt-1">Where are we piercing?</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Tap a spot on the ear (or the chips below) to add it to your plan.
        </p>
      </div>

      <div className="relative mt-4 rounded-2xl border border-primary/20 bg-card/40 p-2">
        <EarDiagram
          selected={plan.selected}
          assignments={plan.assignments}
          onSelectPlacement={toggle}
          className="w-full h-80"
        />
        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[10px] font-mono text-bone/70">
          <span>RIGHT EAR</span>
          <span>
            {plan.selected.length} PLACEMENT{plan.selected.length === 1 ? "" : "S"}
          </span>
        </div>
      </div>

      {detail && (
        <div className="mt-3 rounded-xl border border-border bg-card/50 p-3 float-in">
          <div className="flex items-baseline justify-between">
            <div className="text-sm font-medium">{detail.label}</div>
            <div className="text-[11px] font-mono text-gold">${detail.serviceFee} service</div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{detail.blurb}</p>
          <div className="text-[11px] text-muted-foreground mt-1.5">
            <span className="uppercase tracking-widest">Heals in</span>{" "}
            <span className="text-bone">{detail.healing}</span>
          </div>
        </div>
      )}

      <div className="mt-4">
        <SectionLabel>All placements</SectionLabel>
        <div className="mt-2 flex flex-wrap gap-2">
          {PLACEMENTS.map((p) => (
            <Chip key={p.id} on={plan.selected.includes(p.id)} onClick={() => toggle(p.id)}>
              {p.label}
            </Chip>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <PrimaryButton onClick={() => go("tryon")} disabled={plan.selected.length === 0}>
          {plan.selected.length === 0 ? "Pick a placement first" : "Continue to try-on"}
        </PrimaryButton>
      </div>
    </div>
  );
}
