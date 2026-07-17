import type { ReactNode } from "react";
import type { PlanAction } from "@/lib/planner/reducer";
import type { PlanState } from "@/lib/planner/types";

export type ScreenId = "home" | "map" | "tryon" | "vault" | "book" | "confirmed";

export interface ScreenProps {
  plan: PlanState;
  dispatch: React.Dispatch<PlanAction>;
  go: (screen: ScreenId) => void;
  /** Jump to try-on with a specific piece ready to place. */
  goTryOn: (pieceId?: string) => void;
  showToast: (message: string) => void;
}

/* ---------- small presentational primitives ---------- */

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="text-[11px] tracking-[0.25em] uppercase text-muted-foreground">{children}</div>
  );
}

export function Chip({
  on,
  onClick,
  children,
  disabled = false,
}: {
  on: boolean;
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={on}
      className={`shrink-0 min-h-11 text-[11px] tracking-widest uppercase px-4 rounded-full border transition-colors ${
        on
          ? "bg-primary text-primary-foreground border-primary"
          : "border-border text-muted-foreground hover:border-primary/60"
      } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
    >
      {children}
    </button>
  );
}

export function PrimaryButton({
  onClick,
  children,
  disabled = false,
}: {
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full min-h-12 rounded-full text-sm tracking-widest uppercase font-medium transition-opacity ${
        disabled
          ? "bg-card text-muted-foreground opacity-60 cursor-not-allowed"
          : "bg-gold-gradient text-primary-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export function GhostButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full min-h-12 rounded-full border border-border text-[12px] tracking-widest uppercase text-muted-foreground hover:border-primary/60 hover:text-bone transition-colors"
    >
      {children}
    </button>
  );
}

export function Toast({ message }: { message: string | null }) {
  return (
    <div aria-live="polite" className="pointer-events-none fixed top-4 inset-x-0 z-50 flex justify-center">
      {message && (
        <div className="float-in bg-primary text-primary-foreground text-[11px] tracking-widest uppercase px-4 py-2 rounded-full shadow-glow">
          {message}
        </div>
      )}
    </div>
  );
}
