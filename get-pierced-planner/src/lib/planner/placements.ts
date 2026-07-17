import type { Placement, PlacementId } from "./types";

/**
 * Anatomy of the ear as rendered by EarDiagram (200x260 viewBox, right ear,
 * face toward the left edge). Coordinates are shared by the map screen, the
 * try-on screen and the booking summary so a placement always means the same
 * spot everywhere.
 */
export const PLACEMENTS: Placement[] = [
  {
    id: "forward-helix",
    label: "Forward Helix",
    area: "cartilage",
    serviceFee: 35,
    healing: "6–9 months",
    blurb: "The small fold where the upper rim meets your face. Loves tiny studs.",
    x: 74,
    y: 62,
  },
  {
    id: "helix",
    label: "Helix",
    area: "cartilage",
    serviceFee: 30,
    healing: "6–9 months",
    blurb: "The classic upper outer rim. Hoops and studs both sit beautifully.",
    x: 124,
    y: 38,
  },
  {
    id: "flat",
    label: "Flat",
    area: "cartilage",
    serviceFee: 35,
    healing: "6–12 months",
    blurb: "The plate of cartilage inside the upper rim. A statement-stud canvas.",
    x: 108,
    y: 78,
  },
  {
    id: "rook",
    label: "Rook",
    area: "cartilage",
    serviceFee: 40,
    healing: "6–12 months",
    blurb: "The ridge above the daith. Curved bars and snug hoops only.",
    x: 88,
    y: 92,
  },
  {
    id: "daith",
    label: "Daith",
    area: "cartilage",
    serviceFee: 40,
    healing: "6–9 months",
    blurb: "The innermost fold above your ear canal. A hoop-only placement.",
    x: 84,
    y: 120,
  },
  {
    id: "conch",
    label: "Conch",
    area: "cartilage",
    serviceFee: 35,
    healing: "6–12 months",
    blurb: "The shell of the ear. Big enough for bold studs or a wrap-around hoop.",
    x: 112,
    y: 132,
  },
  {
    id: "tragus",
    label: "Tragus",
    area: "cartilage",
    serviceFee: 35,
    healing: "6–9 months",
    blurb: "The little flap in front of your ear canal. Dainty pieces shine here.",
    x: 66,
    y: 142,
  },
  {
    id: "lobe-upper",
    label: "Upper Lobe",
    area: "lobe",
    serviceFee: 25,
    healing: "6–8 weeks",
    blurb: "A second lobe hole, stacked above the first. Fast healer.",
    x: 118,
    y: 188,
  },
  {
    id: "lobe",
    label: "Lobe",
    area: "lobe",
    serviceFee: 25,
    healing: "6–8 weeks",
    blurb: "The soft classic. Heals quickly and takes almost any jewelry.",
    x: 98,
    y: 210,
  },
];

const byId = new Map(PLACEMENTS.map((p) => [p.id, p]));

export function getPlacement(id: PlacementId): Placement {
  const found = byId.get(id);
  if (!found) throw new Error(`Unknown placement: ${id}`);
  return found;
}

export function isPlacementId(value: unknown): value is PlacementId {
  return typeof value === "string" && byId.has(value as PlacementId);
}
