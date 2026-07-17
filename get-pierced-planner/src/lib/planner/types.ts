export type PlacementId =
  | "forward-helix"
  | "helix"
  | "flat"
  | "rook"
  | "daith"
  | "conch"
  | "tragus"
  | "lobe-upper"
  | "lobe";

export type JewelryType = "Flat Back" | "Clicker Hoop";

export interface Placement {
  id: PlacementId;
  label: string;
  area: "cartilage" | "lobe";
  /** Studio service fee for piercing this placement (jewelry sold separately). */
  serviceFee: number;
  /** Typical healing window, shown so people can plan stacks realistically. */
  healing: string;
  blurb: string;
  /** Position on the EarDiagram, in its 200x260 viewBox. */
  x: number;
  y: number;
}

export interface JewelryPiece {
  id: string;
  name: string;
  metal: string;
  price: number;
  img: string;
  type: JewelryType;
  tag?: string;
  /** Placements this piece can physically be worn in. */
  fits: PlacementId[];
}

export type BookingStatus = "draft" | "confirmed";

export interface Booking {
  dateISO: string | null;
  time: string | null;
  note: string;
  status: BookingStatus;
  confirmedAtISO: string | null;
}

export interface PlanState {
  /** Bump when the shape changes; storage discards stale versions. */
  version: 1;
  /** Placements the user wants pierced, in the order they picked them. */
  selected: PlacementId[];
  /** One piece per placement — an ear hole holds one piece of jewelry. */
  assignments: Partial<Record<PlacementId, string>>;
  /** Wishlist, independent of the current plan. */
  saved: string[];
  booking: Booking;
}
