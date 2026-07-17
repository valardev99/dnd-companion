/**
 * Real scheduling data derived from the actual clock — the original mock
 * shipped hardcoded strings like "Fri 14" that were wrong the day after it
 * was generated. When a booking backend exists, `upcomingDays`/`slotsFor`
 * become the fetch layer; the shapes below are the contract.
 */

export interface DayOption {
  /** YYYY-MM-DD in local time — stable storage key. */
  iso: string;
  weekday: string; // "Fri"
  dayNum: string; // "14"
  monthShort: string; // "Jul"
  isToday: boolean;
}

export interface SlotOption {
  time: string; // "3:30 PM"
  /** False for slots already in the past (today only). */
  available: boolean;
}

const OPEN_SLOTS = [
  { hour: 11, minute: 0 },
  { hour: 12, minute: 30 },
  { hour: 14, minute: 0 },
  { hour: 15, minute: 30 },
  { hour: 17, minute: 0 },
  { hour: 18, minute: 30 },
];

export function toLocalISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function upcomingDays(count = 14, from: Date = new Date()): DayOption[] {
  const days: DayOption[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
    days.push({
      iso: toLocalISO(d),
      weekday: d.toLocaleDateString("en-US", { weekday: "short" }),
      dayNum: String(d.getDate()),
      monthShort: d.toLocaleDateString("en-US", { month: "short" }),
      isToday: i === 0,
    });
  }
  return days;
}

function formatSlot(hour: number, minute: number): string {
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const ampm = hour < 12 ? "AM" : "PM";
  return `${h12}:${String(minute).padStart(2, "0")} ${ampm}`;
}

export function slotsFor(iso: string, now: Date = new Date()): SlotOption[] {
  const isToday = iso === toLocalISO(now);
  return OPEN_SLOTS.map(({ hour, minute }) => ({
    time: formatSlot(hour, minute),
    available: !isToday || hour * 60 + minute > now.getHours() * 60 + now.getMinutes(),
  }));
}

export function formatDayLong(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
