/**
 * Pure Hex game core. No React or native imports, so it runs under Jest.
 *
 * Coordinates are axial (q, r) on an N x N rhombus board, with q and r in [0, N).
 * Player A connects the top edge (r = 0) to the bottom edge (r = N - 1).
 * Player B connects the left edge (q = 0) to the right edge (q = N - 1).
 * Hex has no draws: one player always completes a chain.
 */

export const BOARD_SIZE = 7;

export type Player = 'A' | 'B';

export interface Cell {
  readonly q: number;
  readonly r: number;
}

export interface GameState {
  readonly size: number;
  /** Occupied cells keyed by "q,r". */
  readonly stones: ReadonlyMap<string, Player>;
  /** Move history, in order. Used for undo. */
  readonly moves: readonly Cell[];
  readonly turn: Player;
  readonly winner: Player | null;
}

export type PlaceResult =
  | { ok: true; state: GameState }
  | { ok: false; reason: 'out-of-bounds' | 'occupied' | 'game-over' };

/** Six axial neighbour offsets. */
const DIRECTIONS: readonly Cell[] = [
  { q: 1, r: 0 },
  { q: -1, r: 0 },
  { q: 0, r: 1 },
  { q: 0, r: -1 },
  { q: 1, r: -1 },
  { q: -1, r: 1 },
];

export const cellKey = (cell: Cell): string => `${cell.q},${cell.r}`;

export const inBounds = (cell: Cell, size: number): boolean =>
  cell.q >= 0 && cell.q < size && cell.r >= 0 && cell.r < size;

export function neighbours(cell: Cell, size: number): Cell[] {
  return DIRECTIONS.map((d) => ({ q: cell.q + d.q, r: cell.r + d.r })).filter((c) =>
    inBounds(c, size),
  );
}

export function createGame(size: number = BOARD_SIZE): GameState {
  if (!Number.isInteger(size) || size < 1) {
    throw new RangeError(`Board size must be a positive integer, got ${size}`);
  }
  return { size, stones: new Map(), moves: [], turn: 'A', winner: null };
}

/** True if `player`'s stones connect their two edges. */
export function hasWon(state: GameState, player: Player): boolean {
  const { size, stones } = state;
  const isStart = (c: Cell) => (player === 'A' ? c.r === 0 : c.q === 0);
  const isGoal = (c: Cell) => (player === 'A' ? c.r === size - 1 : c.q === size - 1);

  const queue: Cell[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < size; i++) {
    const start: Cell = player === 'A' ? { q: i, r: 0 } : { q: 0, r: i };
    if (stones.get(cellKey(start)) === player) {
      queue.push(start);
      seen.add(cellKey(start));
    }
  }

  while (queue.length > 0) {
    const current = queue.shift() as Cell;
    if (isGoal(current)) return true;
    for (const next of neighbours(current, size)) {
      const key = cellKey(next);
      if (!seen.has(key) && stones.get(key) === player) {
        seen.add(key);
        queue.push(next);
      }
    }
  }
  return false;
}

export function placeStone(state: GameState, cell: Cell): PlaceResult {
  if (state.winner !== null) return { ok: false, reason: 'game-over' };
  if (!inBounds(cell, state.size)) return { ok: false, reason: 'out-of-bounds' };

  const key = cellKey(cell);
  if (state.stones.has(key)) return { ok: false, reason: 'occupied' };

  const stones = new Map(state.stones);
  stones.set(key, state.turn);

  const next: GameState = {
    size: state.size,
    stones,
    moves: [...state.moves, { q: cell.q, r: cell.r }],
    turn: state.turn === 'A' ? 'B' : 'A',
    winner: null,
  };

  const winner = hasWon({ ...next, stones }, state.turn) ? state.turn : null;
  return { ok: true, state: { ...next, winner } };
}

/** Removes the last move. Returns the same state if there is nothing to undo. */
export function undoMove(state: GameState): GameState {
  if (state.moves.length === 0) return state;

  const moves = state.moves.slice(0, -1);
  const stones = new Map<string, Player>();
  let turn: Player = 'A';
  for (const move of moves) {
    stones.set(cellKey(move), turn);
    turn = turn === 'A' ? 'B' : 'A';
  }
  return { size: state.size, stones, moves, turn, winner: null };
}
