import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { BottomNav } from "@/components/planner/BottomNav";
import { Toast, type ScreenId, type ScreenProps } from "@/components/planner/shared";
import { BookScreen } from "@/components/planner/screens/BookScreen";
import { ConfirmedScreen } from "@/components/planner/screens/ConfirmedScreen";
import { HomeScreen } from "@/components/planner/screens/HomeScreen";
import { MapScreen } from "@/components/planner/screens/MapScreen";
import { TryOnScreen } from "@/components/planner/screens/TryOnScreen";
import { VaultScreen } from "@/components/planner/screens/VaultScreen";
import { usePlanner } from "@/hooks/usePlanner";
import { useToast } from "@/hooks/useToast";

export const Route = createFileRoute("/")({
  component: PlannerApp,
});

/**
 * Get Pierced Planner — plan placements on an ear map, pair jewelry from the
 * studio catalog, and book with the whole plan sent ahead. State lives in a
 * single reducer (src/lib/planner/reducer.ts) and persists to localStorage.
 */
function PlannerApp() {
  const { plan, dispatch } = usePlanner();
  const { toast, show: showToast } = useToast();
  const [screen, setScreen] = useState<ScreenId>("home");
  const [incomingPieceId, setIncomingPieceId] = useState<string | null>(null);

  const go = useCallback((s: ScreenId) => setScreen(s), []);
  const goTryOn = useCallback((pieceId?: string) => {
    setIncomingPieceId(pieceId ?? null);
    setScreen("tryon");
  }, []);
  const onIncomingConsumed = useCallback(() => setIncomingPieceId(null), []);

  const screenProps: ScreenProps = { plan, dispatch, go, goTryOn, showToast };

  return (
    <main className="min-h-dvh flex flex-col items-center">
      <Toast message={toast} />
      <div className="w-full max-w-md flex-1 flex flex-col md:my-6 md:rounded-3xl md:border md:border-border/60 md:bg-ink/60 md:shadow-2xl md:overflow-hidden md:max-h-[900px]">
        <header className="shrink-0 px-5 pt-[max(env(safe-area-inset-top),12px)] pb-3 flex items-center justify-between border-b border-border/40">
          <Logo />
          <span className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
            Piercing Planner
          </span>
        </header>

        <div className="flex-1 min-h-0 relative">
          <div className="absolute inset-0" key={screen}>
            {screen === "home" && <HomeScreen {...screenProps} />}
            {screen === "map" && <MapScreen {...screenProps} />}
            {screen === "tryon" && (
              <TryOnScreen
                {...screenProps}
                incomingPieceId={incomingPieceId}
                onIncomingConsumed={onIncomingConsumed}
              />
            )}
            {screen === "vault" && <VaultScreen {...screenProps} />}
            {screen === "book" && <BookScreen {...screenProps} />}
            {screen === "confirmed" && <ConfirmedScreen {...screenProps} />}
          </div>
        </div>

        <BottomNav
          screen={screen}
          go={go}
          mapCount={plan.selected.length}
          vaultCount={plan.saved.length}
        />
      </div>
    </main>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden>
        <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.2" className="text-primary" />
        <circle cx="16" cy="16" r="4" fill="currentColor" className="text-primary" />
        <circle cx="16" cy="6" r="1.4" fill="currentColor" className="text-primary" />
      </svg>
      <div className="leading-none">
        <div className="font-display text-base tracking-tight text-gold-gradient">Get Pierced</div>
        <div className="text-[8px] tracking-[0.4em] uppercase text-muted-foreground">Co · Est. 2019</div>
      </div>
    </div>
  );
}
