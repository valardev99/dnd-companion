import { useEffect, useRef, useState } from "react";
import { JEWELRY, getPiece, pieceFits } from "@/lib/planner/jewelry";
import { PLACEMENTS, getPlacement } from "@/lib/planner/placements";
import type { PlacementId } from "@/lib/planner/types";
import { EarDiagram } from "../EarDiagram";
import { JewelryImage } from "../JewelryImage";
import { Chip, GhostButton, PrimaryButton, SectionLabel, type ScreenProps } from "../shared";

interface TryOnScreenProps extends ScreenProps {
  /** Piece carried in from the Vault/Home "try on" buttons. */
  incomingPieceId: string | null;
  onIncomingConsumed: () => void;
}

/**
 * One rule everywhere: jewelry always goes to the *active* spot. Tapping the
 * ear (or a chip) picks the spot; tapping the tray places a piece on it.
 */
export function TryOnScreen({
  plan,
  dispatch,
  go,
  showToast,
  incomingPieceId,
  onIncomingConsumed,
}: TryOnScreenProps) {
  const [active, setActive] = useState<PlacementId | null>(plan.selected[0] ?? null);

  // Place a piece brought in from another screen: prefer the active spot,
  // then the first selected spot it fits, then the first fitting spot overall
  // (assignment auto-selects it).
  const placedIncoming = useRef(false);
  useEffect(() => {
    if (placedIncoming.current || !incomingPieceId) return;
    placedIncoming.current = true;
    const piece = getPiece(incomingPieceId);
    onIncomingConsumed();
    if (!piece) return;
    const target =
      (active && pieceFits(piece.id, active) && active) ||
      plan.selected.find((id) => pieceFits(piece.id, id)) ||
      PLACEMENTS.find((p) => pieceFits(piece.id, p.id))?.id;
    if (!target) return;
    dispatch({ type: "assign", placement: target, pieceId: piece.id });
    setActive(target);
    showToast(`${piece.name} → ${getPlacement(target).label}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot on mount, guarded by ref
  }, []);

  const activePlacement = active ? getPlacement(active) : null;
  const activePieceId = active ? plan.assignments[active] : undefined;
  const activePiece = activePieceId ? getPiece(activePieceId) : undefined;

  const selectSpot = (id: PlacementId) => {
    if (!plan.selected.includes(id)) {
      dispatch({ type: "toggle-placement", placement: id });
      showToast(`${getPlacement(id).label} added to your plan`);
    }
    setActive(id);
  };

  const placePiece = (pieceId: string) => {
    const piece = getPiece(pieceId);
    if (!piece) return;
    if (!active) {
      showToast("Tap a spot on the ear first");
      return;
    }
    if (!pieceFits(pieceId, active)) {
      showToast(`${piece.type}s don't fit the ${getPlacement(active).label.toLowerCase()}`);
      return;
    }
    dispatch({ type: "assign", placement: active, pieceId });
    showToast(`${piece.name} → ${getPlacement(active).label}`);
  };

  if (plan.selected.length === 0) {
    return (
      <div className="h-full overflow-y-auto px-5 pb-6 float-in">
        <div className="mt-2">
          <SectionLabel>Step 02 · Try-on</SectionLabel>
          <h1 className="font-display text-2xl mt-1">Nothing to dress yet</h1>
        </div>
        <div className="mt-6 rounded-2xl border border-border bg-card/40 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Pick at least one placement on the ear map, then come back to pair jewelry with it.
          </p>
          <div className="mt-5">
            <PrimaryButton onClick={() => go("map")}>Open the ear map</PrimaryButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-5 pb-6 float-in">
      <div className="mt-2 flex items-end justify-between">
        <div>
          <SectionLabel>Step 02 · Try-on</SectionLabel>
          <h1 className="font-display text-2xl mt-1">Dress your ear</h1>
        </div>
        <div className="text-[11px] font-mono text-primary pb-1">
          {Object.keys(plan.assignments).length}/{plan.selected.length} placed
        </div>
      </div>

      <div className="relative mt-3 rounded-2xl border border-border bg-card/40 p-2">
        <EarDiagram
          selected={plan.selected}
          assignments={plan.assignments}
          active={active}
          onSelectPlacement={selectSpot}
          className="w-full h-72"
        />
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto -mx-5 px-5 pb-1">
        {plan.selected.map((id) => (
          <Chip key={id} on={id === active} onClick={() => setActive(id)}>
            {getPlacement(id).label}
            {plan.assignments[id] ? " ·✦" : ""}
          </Chip>
        ))}
      </div>

      {activePlacement && (
        <div className="mt-3 rounded-xl border border-border bg-card/50 p-3 flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-accent/15 flex items-center justify-center overflow-hidden shrink-0">
            {activePiece ? (
              <JewelryImage src={activePiece.img} alt={activePiece.name} className="max-w-[85%] max-h-[85%]" />
            ) : (
              <span className="text-muted-foreground text-lg">?</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">
              {activePlacement.label}
              {activePiece ? ` · ${activePiece.name}` : ""}
            </div>
            <div className="text-[11px] text-muted-foreground truncate">
              {activePiece
                ? `${activePiece.metal} · $${activePiece.price}`
                : "Empty — tap a piece below to place it here"}
            </div>
          </div>
          {activePiece && active && (
            <button
              type="button"
              onClick={() => {
                dispatch({ type: "unassign", placement: active });
                showToast(`${activePlacement.label} cleared`);
              }}
              className="min-h-11 px-3 text-[11px] tracking-widest uppercase text-muted-foreground hover:text-primary"
            >
              Remove
            </button>
          )}
        </div>
      )}

      <div className="mt-4">
        <SectionLabel>Jewelry tray</SectionLabel>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {JEWELRY.map((j) => {
            const fitsActive = active ? pieceFits(j.id, active) : true;
            const isOnActive = activePieceId === j.id;
            const placedSomewhere = Object.values(plan.assignments).includes(j.id);
            return (
              <button
                key={j.id}
                type="button"
                onClick={() => placePiece(j.id)}
                aria-label={`${j.name}, $${j.price}${fitsActive ? "" : " (doesn't fit this spot)"}`}
                className={`relative rounded-lg overflow-hidden border bg-accent/10 aspect-square flex items-center justify-center transition-all ${
                  isOnActive
                    ? "border-primary shadow-[0_0_0_2px_var(--color-primary)]"
                    : "border-border hover:border-primary/50"
                } ${fitsActive ? "" : "opacity-35"}`}
              >
                <JewelryImage src={j.img} alt={j.name} className="max-w-[80%] max-h-[80%]" />
                {placedSomewhere && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-gold" aria-hidden />
                )}
              </button>
            );
          })}
        </div>
        {active && (
          <p className="text-[11px] text-muted-foreground mt-2">
            Dimmed pieces don't fit the {activePlacement?.label.toLowerCase()} — hoops need a rim,
            flat backs need a flat exit.
          </p>
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <GhostButton onClick={() => go("vault")}>Browse vault</GhostButton>
        <PrimaryButton onClick={() => go("book")}>Review & book</PrimaryButton>
      </div>
    </div>
  );
}
