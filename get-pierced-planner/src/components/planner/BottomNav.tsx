import type { ReactNode } from "react";
import type { ScreenId } from "./shared";

interface NavItem {
  id: ScreenId;
  label: string;
  icon: ReactNode;
  badge?: number;
}

export function BottomNav({
  screen,
  go,
  mapCount,
  vaultCount,
}: {
  screen: ScreenId;
  go: (s: ScreenId) => void;
  mapCount: number;
  vaultCount: number;
}) {
  const items: NavItem[] = [
    { id: "home", label: "Home", icon: <IconHome /> },
    { id: "map", label: "Map", icon: <IconScan />, badge: mapCount },
    { id: "tryon", label: "Try On", icon: <IconSparkle /> },
    { id: "vault", label: "Vault", icon: <IconDiamond />, badge: vaultCount },
    { id: "book", label: "Book", icon: <IconCal /> },
  ];

  return (
    <nav
      aria-label="Planner sections"
      className="shrink-0 border-t border-border/60 bg-ink/95 backdrop-blur-sm flex items-stretch justify-around px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2"
    >
      {items.map((it) => {
        const active = screen === it.id || (it.id === "book" && screen === "confirmed");
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => go(it.id)}
            aria-current={active ? "page" : undefined}
            className={`relative flex flex-col items-center gap-1 px-3 py-1.5 min-h-11 min-w-14 rounded-lg transition-colors ${
              active ? "text-primary" : "text-muted-foreground hover:text-bone"
            }`}
          >
            <span className={active ? "scale-110 transition-transform" : "transition-transform"}>
              {it.icon}
            </span>
            <span className="text-[10px] tracking-[0.15em] uppercase">{it.label}</span>
            {it.badge ? (
              <span className="absolute top-0 right-1.5 min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-mono flex items-center justify-center">
                {it.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}

/* ---------- icons ---------- */

function IconHome() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
    </svg>
  );
}
function IconScan() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M3 7V4h3M21 7V4h-3M3 17v3h3M21 17v3h-3" />
      <circle cx="12" cy="12" r="3.5" />
      <circle cx="12" cy="12" r="0.5" fill="currentColor" />
    </svg>
  );
}
function IconSparkle() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M12 3v6M12 15v6M3 12h6M15 12h6M5.5 5.5l4 4M14.5 14.5l4 4M18.5 5.5l-4 4M9.5 14.5l-4 4" />
    </svg>
  );
}
function IconDiamond() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M6 3h12l4 6-10 12L2 9z" />
      <path d="M2 9h20M9 3l3 6 3-6M8 9l4 12 4-12" />
    </svg>
  );
}
function IconCal() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 3v4M16 3v4" />
    </svg>
  );
}
