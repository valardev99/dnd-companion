import type { JewelryPiece, JewelryType, PlacementId } from "./types";

/**
 * Which placements each jewelry construction can physically be worn in.
 * Flat backs need a flat surface behind the ear, so no daith (and rooks take
 * curved bars — modelled here as hoop-compatible only).
 */
const FITS: Record<JewelryType, PlacementId[]> = {
  "Flat Back": ["forward-helix", "helix", "flat", "conch", "tragus", "lobe-upper", "lobe"],
  "Clicker Hoop": ["helix", "rook", "daith", "conch", "tragus", "lobe-upper", "lobe"],
};

function piece(
  p: Omit<JewelryPiece, "fits">,
): JewelryPiece {
  return { ...p, fits: FITS[p.type] };
}

/** Get Pierced Co product samples (Shopify CDN). */
export const JEWELRY: JewelryPiece[] = [
  piece({
    id: "j1",
    name: "Cherry Gingham Charm Hoops",
    metal: "Titanium",
    price: 46,
    img: "https://cdn.shopify.com/s/files/1/0661/2058/1361/files/13_80ecafc5-14e1-411c-a823-d7470ac09a65.png?v=1778656336",
    tag: "Bestseller",
    type: "Clicker Hoop",
  }),
  piece({
    id: "j2",
    name: "Pink Punch Baguette Hoops",
    metal: "Titanium",
    price: 36,
    img: "https://cdn.shopify.com/s/files/1/0661/2058/1361/files/5_1120f694-6b64-4684-bd19-e6caac6af58c.png?v=1778655780",
    tag: "New",
    type: "Clicker Hoop",
  }),
  piece({
    id: "j3",
    name: "Itsy Bitsy Spider Flat Back",
    metal: "14k Gold",
    price: 34,
    img: "https://cdn.shopify.com/s/files/1/0661/2058/1361/files/itsybitsyspiderflatbackstud_gold.png?v=1762839727",
    tag: "Editor's Pick",
    type: "Flat Back",
  }),
  piece({
    id: "j4",
    name: "Dagger Flat Back Stud",
    metal: "14k Gold",
    price: 24,
    img: "https://cdn.shopify.com/s/files/1/0661/2058/1361/files/daggerflatbackstud_gold.png?v=1762320789",
    type: "Flat Back",
  }),
  piece({
    id: "j5",
    name: "Electric Summer Hoops",
    metal: "Titanium",
    price: 46,
    img: "https://cdn.shopify.com/s/files/1/0661/2058/1361/files/11_1a5a2274-7c83-4b31-b47a-95aeac3d11bd.png?v=1778656145",
    type: "Clicker Hoop",
  }),
  piece({
    id: "j6",
    name: "Color Pop Clicker Hoops",
    metal: "Titanium",
    price: 32,
    img: "https://cdn.shopify.com/s/files/1/0661/2058/1361/files/15_a13ee243-b886-4be3-ac37-56d685cb2ac5.png?v=1778656722",
    type: "Clicker Hoop",
  }),
  piece({
    id: "j7",
    name: "Good Vibes Only Flat Back",
    metal: "14k Gold",
    price: 22,
    img: "https://cdn.shopify.com/s/files/1/0661/2058/1361/files/13.png?v=1778645669",
    type: "Flat Back",
  }),
  piece({
    id: "j8",
    name: "Onyx Classy Girl Stud",
    metal: "14k Gold · Onyx",
    price: 19,
    img: "https://cdn.shopify.com/s/files/1/0661/2058/1361/files/259.png?v=1750713966",
    type: "Flat Back",
  }),
];

const byId = new Map(JEWELRY.map((j) => [j.id, j]));

export function getPiece(id: string): JewelryPiece | undefined {
  return byId.get(id);
}

export function isJewelryId(value: unknown): value is string {
  return typeof value === "string" && byId.has(value);
}

export function pieceFits(pieceId: string, placement: PlacementId): boolean {
  return getPiece(pieceId)?.fits.includes(placement) ?? false;
}
