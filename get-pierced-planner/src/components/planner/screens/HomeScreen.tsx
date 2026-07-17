import earHero from "@/assets/ear-hero.jpg";
import { getPiece } from "@/lib/planner/jewelry";
import { formatDayLong } from "@/lib/planner/schedule";
import { JewelryImage } from "../JewelryImage";
import { SectionLabel, type ScreenProps } from "../shared";

export function HomeScreen({ plan, go, goTryOn }: ScreenProps) {
  const savedPieces = plan.saved.map(getPiece).filter((p) => p !== undefined);
  const assignedCount = Object.keys(plan.assignments).length;
  const { booking } = plan;

  return (
    <div className="h-full overflow-y-auto px-5 pb-6 float-in">
      <div className="mt-2">
        <SectionLabel>Get Pierced Co</SectionLabel>
        <h1 className="font-display text-3xl mt-1 text-gold-gradient">Plan your next piercing</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-[36ch]">
          Map placements on your ear, pick the jewelry, and walk into the studio with the whole
          plan already in your piercer's hands.
        </p>
      </div>

      <button
        type="button"
        onClick={() => go("map")}
        className="mt-5 w-full relative rounded-2xl overflow-hidden text-left group"
      >
        <img
          src={earHero}
          alt="Curated ear with layered jewelry"
          className="w-full h-48 object-cover"
          width={1024}
          height={1024}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-transparent" />
        <div className="absolute inset-0 p-4 flex flex-col justify-end">
          <div className="text-[11px] tracking-[0.25em] uppercase text-primary">Step 01 · Ear map</div>
          <div className="font-display text-2xl leading-tight mt-1">
            {plan.selected.length > 0 ? (
              <>
                <em className="text-gold-gradient not-italic">{plan.selected.length}</em>{" "}
                placement{plan.selected.length === 1 ? "" : "s"} planned
              </>
            ) : (
              <>
                Start your <em className="text-gold-gradient not-italic">ear map</em>
              </>
            )}
          </div>
          <div className="mt-2 inline-flex items-center gap-2 text-xs">
            <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              →
            </span>
            <span className="tracking-widest uppercase">
              {plan.selected.length > 0 ? "Edit placements" : "Choose placements"}
            </span>
          </div>
        </div>
      </button>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <TileButton
          onClick={() => goTryOn()}
          label="Try On"
          sub={assignedCount > 0 ? `${assignedCount} piece${assignedCount === 1 ? "" : "s"} placed` : "Pair jewelry to spots"}
        />
        <TileButton
          onClick={() => go("book")}
          label="Book"
          sub={booking.status === "confirmed" ? "Confirmed" : "Pick a time"}
        />
      </div>

      {booking.status === "confirmed" && booking.dateISO && booking.time ? (
        <div className="mt-5 rounded-xl border border-primary/30 p-4 bg-gradient-to-br from-primary/10 to-transparent">
          <div className="flex items-center justify-between">
            <div className="text-[11px] tracking-[0.25em] uppercase text-primary">Next appointment</div>
            <button
              type="button"
              onClick={() => go("confirmed")}
              className="min-h-11 px-2 text-[10px] tracking-widest uppercase text-primary"
            >
              View
            </button>
          </div>
          <div className="font-display text-lg mt-1">
            {formatDayLong(booking.dateISO)} · {booking.time}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {plan.selected.length} placement{plan.selected.length === 1 ? "" : "s"} · {assignedCount}{" "}
            piece{assignedCount === 1 ? "" : "s"} chosen
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-border bg-card/50 p-4">
          <div className="text-[11px] tracking-[0.25em] uppercase text-muted-foreground">How it works</div>
          <ol className="mt-2 space-y-1.5 text-xs text-muted-foreground list-none">
            <li><span className="text-primary font-mono">01</span> Tap the spots you want pierced on the ear map</li>
            <li><span className="text-primary font-mono">02</span> Try jewelry on each spot from the Vault</li>
            <li><span className="text-primary font-mono">03</span> Book — your plan is sent ahead to the studio</li>
          </ol>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between">
        <SectionLabel>Saved · The Vault</SectionLabel>
        <button
          type="button"
          onClick={() => go("vault")}
          className="min-h-11 px-2 text-[11px] tracking-[0.25em] uppercase text-primary"
        >
          See all
        </button>
      </div>
      <div className="mt-2 flex gap-3 overflow-x-auto -mx-5 px-5 pb-2">
        {savedPieces.length === 0 && (
          <div className="text-xs text-muted-foreground py-5">
            Nothing saved yet — browse the Vault and tap the heart on pieces you love.
          </div>
        )}
        {savedPieces.map((j) => (
          <button
            key={j.id}
            type="button"
            onClick={() => goTryOn(j.id)}
            className="min-w-[130px] rounded-xl bg-card border border-border overflow-hidden text-left hover:border-primary/60 transition-colors"
          >
            <div className="w-full h-24 bg-gradient-to-br from-accent/20 to-primary/10 flex items-center justify-center">
              <JewelryImage src={j.img} alt={j.name} className="max-w-[80%] max-h-[80%]" />
            </div>
            <div className="p-2.5">
              <div className="text-xs font-medium truncate">{j.name}</div>
              <div className="text-[11px] text-muted-foreground">${j.price} · tap to try on</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function TileButton({ label, sub, onClick }: { label: string; sub: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-border bg-card/60 p-4 min-h-16 text-left hover:border-primary/60 transition-colors"
    >
      <div className="text-sm font-medium">{label}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>
    </button>
  );
}
