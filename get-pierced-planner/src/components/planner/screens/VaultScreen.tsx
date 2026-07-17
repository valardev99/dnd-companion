import { useMemo, useState } from "react";
import { JEWELRY } from "@/lib/planner/jewelry";
import { JewelryImage } from "../JewelryImage";
import { Chip, SectionLabel, type ScreenProps } from "../shared";

const FILTERS = ["All", "Saved", "Flat Back", "Clicker Hoop", "14k Gold", "Titanium"] as const;
type Filter = (typeof FILTERS)[number];

export function VaultScreen({ plan, dispatch, goTryOn, showToast }: ScreenProps) {
  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return JEWELRY.filter((j) => {
      if (q && !`${j.name} ${j.metal} ${j.type}`.toLowerCase().includes(q)) return false;
      switch (filter) {
        case "All":
          return true;
        case "Saved":
          return plan.saved.includes(j.id);
        case "Flat Back":
        case "Clicker Hoop":
          return j.type === filter;
        case "14k Gold":
          return j.metal.includes("Gold");
        case "Titanium":
          return j.metal.includes("Titanium");
      }
    });
  }, [filter, query, plan.saved]);

  const toggleSave = (id: string) => {
    const wasSaved = plan.saved.includes(id);
    dispatch({ type: "toggle-saved", pieceId: id });
    showToast(wasSaved ? "Removed from saved" : "Saved to your vault");
  };

  return (
    <div className="h-full overflow-y-auto px-5 pb-6 float-in">
      <div className="mt-2">
        <SectionLabel>The Vault</SectionLabel>
        <h1 className="font-display text-2xl mt-1">Jewelry library</h1>
      </div>

      <div className="mt-3">
        <label htmlFor="vault-search" className="sr-only">
          Search jewelry
        </label>
        <input
          id="vault-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, metal, style…"
          className="w-full min-h-11 rounded-full bg-card/60 border border-border px-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/60"
        />
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto -mx-5 px-5 pb-1">
        {FILTERS.map((f) => (
          <Chip key={f} on={filter === f} onClick={() => setFilter(f)}>
            {f}
            {f === "Saved" && plan.saved.length > 0 ? ` · ${plan.saved.length}` : ""}
          </Chip>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {items.length === 0 && (
          <div className="col-span-2 text-center text-sm text-muted-foreground py-10">
            {filter === "Saved" && !query
              ? "Nothing saved yet — tap the heart on a piece to keep it here."
              : "No pieces match — try another search or filter."}
          </div>
        )}
        {items.map((j) => {
          const saved = plan.saved.includes(j.id);
          const placed = Object.values(plan.assignments).includes(j.id);
          return (
            <div key={j.id} className="rounded-xl border border-border overflow-hidden bg-card/60">
              <div className="relative aspect-square bg-gradient-to-br from-accent/25 via-primary/10 to-transparent flex items-center justify-center">
                <JewelryImage src={j.img} alt={j.name} className="max-w-[78%] max-h-[78%]" />
                {j.tag && (
                  <span className="absolute top-2 left-2 text-[9px] tracking-widest uppercase bg-ink/80 text-primary border border-primary/30 px-2 py-1 rounded-full">
                    {j.tag}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => toggleSave(j.id)}
                  aria-pressed={saved}
                  aria-label={saved ? `Remove ${j.name} from saved` : `Save ${j.name}`}
                  className={`absolute top-1.5 right-1.5 w-9 h-9 rounded-full flex items-center justify-center border transition-colors ${
                    saved
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-ink/60 border-border text-bone hover:border-primary/60"
                  }`}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill={saved ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden
                  >
                    <path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z" />
                  </svg>
                </button>
              </div>
              <div className="p-3">
                <div className="text-xs font-medium truncate">{j.name}</div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {j.metal} · {j.type}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-gold-gradient font-medium">${j.price}</span>
                  <button
                    type="button"
                    onClick={() => goTryOn(j.id)}
                    className="min-h-9 px-2 text-[10px] tracking-widest uppercase text-primary"
                  >
                    {placed ? "On your ear ✦" : "Try on"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
