import { PLACEMENTS } from "@/lib/planner/placements";
import { getPiece } from "@/lib/planner/jewelry";
import type { PlacementId, PlanState } from "@/lib/planner/types";

interface EarDiagramProps {
  selected: PlacementId[];
  assignments: PlanState["assignments"];
  /** Placement currently being edited (try-on screen). */
  active?: PlacementId | null;
  onSelectPlacement?: (id: PlacementId) => void;
  showLabels?: boolean;
  className?: string;
}

/**
 * One shared, resolution-independent ear. The map, try-on and summary all
 * render placements from the same PLACEMENTS coordinates, so "helix" is the
 * same dot on every screen — the original mock used two different photos with
 * hand-tuned percentage offsets that didn't line up between screens.
 */
export function EarDiagram({
  selected,
  assignments,
  active = null,
  onSelectPlacement,
  showLabels = true,
  className = "",
}: EarDiagramProps) {
  const interactive = Boolean(onSelectPlacement);
  return (
    <svg
      viewBox="0 0 200 260"
      role={interactive ? "group" : "img"}
      aria-label="Ear diagram with piercing placements"
      className={`select-none ${className}`}
    >
      {/* Stylized right ear, face toward the left edge */}
      <g fill="none" stroke="currentColor" className="text-accent/50" strokeWidth="2" strokeLinecap="round">
        <path d="M72 62 C68 28 106 10 130 22 C158 37 154 82 149 112 C145 142 143 172 138 196 C132 228 107 244 87 233 C66 222 58 190 61 164 C63 148 57 128 59 108 C61 87 66 76 72 62 Z" />
        <path d="M80 64 C84 42 106 30 122 40 C138 50 138 76 133 98" strokeWidth="1.5" className="text-accent/35" />
        <path d="M128 102 C121 122 119 142 123 162" strokeWidth="1.5" className="text-accent/35" />
        <path d="M82 102 C94 97 102 106 100 119 C98 131 87 134 81 127" strokeWidth="1.5" className="text-accent/35" />
        <path d="M62 132 C72 133 77 143 71 153" strokeWidth="1.5" className="text-accent/35" />
        <path d="M127 192 C119 212 104 224 90 220" strokeWidth="1.5" className="text-accent/35" />
      </g>

      {PLACEMENTS.map((p) => {
        const isSelected = selected.includes(p.id);
        const isActive = active === p.id;
        const pieceId = assignments[p.id];
        const piece = pieceId ? getPiece(pieceId) : undefined;
        const labelOnLeft = p.x < 95;

        return (
          <g
            key={p.id}
            role={interactive ? "button" : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-label={`${p.label}${piece ? ` — ${piece.name}` : ""}${isSelected ? " (selected)" : ""}`}
            aria-pressed={interactive ? isSelected : undefined}
            onClick={() => onSelectPlacement?.(p.id)}
            onKeyDown={(e) => {
              if (interactive && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                onSelectPlacement?.(p.id);
              }
            }}
            className={interactive ? "cursor-pointer focus:outline-none" : undefined}
            // Chromium honors bounding-box, making the node + its label one
            // solid tap target; elsewhere the transparent hit circle carries it.
            style={interactive ? { pointerEvents: "bounding-box" as never } : undefined}
          >
            {/* Invisible hit area — keeps the touch target ~44px on a phone */}
            {interactive && <circle cx={p.x} cy={p.y} r="15" fill="transparent" />}

            {isActive && (
              <circle cx={p.x} cy={p.y} r="13" fill="none" strokeWidth="1.5" className="stroke-primary" strokeDasharray="3 3" />
            )}

            {piece ? (
              <>
                <circle cx={p.x} cy={p.y} r="10" className={isSelected ? "fill-primary/25" : "fill-muted"} />
                <image
                  href={piece.img}
                  x={p.x - 9}
                  y={p.y - 9}
                  width="18"
                  height="18"
                  preserveAspectRatio="xMidYMid meet"
                  pointerEvents="none"
                />
                <circle cx={p.x} cy={p.y} r="10" fill="none" strokeWidth="1.2" className="stroke-gold" />
              </>
            ) : (
              <circle
                cx={p.x}
                cy={p.y}
                r={isSelected ? 5.5 : 4}
                strokeWidth="1.2"
                className={
                  isSelected
                    ? "fill-primary stroke-primary" + (interactive ? " pulse-dot" : "")
                    : "fill-bone/20 stroke-bone/60"
                }
              />
            )}

            {showLabels && (
              <text
                x={labelOnLeft ? p.x - 20 : p.x + 20}
                y={p.y + 3}
                textAnchor={labelOnLeft ? "end" : "start"}
                className={`font-mono uppercase ${isSelected || isActive ? "fill-primary" : "fill-muted-foreground"}`}
                style={{ fontSize: 8, letterSpacing: "0.08em" }}
              >
                {p.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
