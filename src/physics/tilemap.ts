// Static level geometry as a uniform grid of tile ids. Tile semantics:
//   0 = empty       — passable from every direction
//   1 = solid       — blocks every direction
//   2 = one-way up  — blocks only downward AABB motion when the AABB was above
//                     the tile's top before the step; passable from below and
//                     from the sides. Lets the player jump up through it and
//                     drop down by tapping down (drop-through arrives later).
//
// Richer tile semantics (slopes, hazards, conveyors) layer on top by extending
// the TILE enum + adding predicates here. The AABB resolver in `aabb.ts` reads
// the predicates via a callback so collision logic stays general.

export const TILE = {
  Empty: 0,
  Solid: 1,
  OneWayUp: 2,
} as const;

export type TileId = (typeof TILE)[keyof typeof TILE];

export type TileGrid = ReadonlyArray<ReadonlyArray<TileId>>;

export class Tilemap {
  constructor(
    public readonly tiles: TileGrid,
    public readonly tileSize: number,
  ) {}

  get rows(): number {
    return this.tiles.length;
  }

  get cols(): number {
    return this.tiles[0]?.length ?? 0;
  }

  get widthPx(): number {
    return this.cols * this.tileSize;
  }

  get heightPx(): number {
    return this.rows * this.tileSize;
  }

  tileAt(col: number, row: number): TileId {
    if (col < 0 || row < 0 || col >= this.cols || row >= this.rows) return TILE.Empty;
    return this.tiles[row]![col]!;
  }

  isSolid(col: number, row: number): boolean {
    return this.tileAt(col, row) === TILE.Solid;
  }

  isOneWayUp(col: number, row: number): boolean {
    return this.tileAt(col, row) === TILE.OneWayUp;
  }
}
