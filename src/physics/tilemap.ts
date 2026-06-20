// Static level geometry as a uniform grid of tile ids. Tile id 0 means empty;
// any non-zero id is solid for AABB collision. Richer tile semantics
// (one-way platforms, hazard tiles, slopes) layer on top in later subtasks;
// for now we only need solid / empty.

export type TileGrid = ReadonlyArray<ReadonlyArray<number>>;

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

  tileAt(col: number, row: number): number {
    if (col < 0 || row < 0 || col >= this.cols || row >= this.rows) return 0;
    return this.tiles[row]![col]!;
  }

  isSolid(col: number, row: number): boolean {
    return this.tileAt(col, row) !== 0;
  }
}
