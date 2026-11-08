import {
  createGame,
  hasWon,
  neighbours,
  placeStone,
  undoMove,
  BOARD_SIZE,
  Cell,
  GameState,
  Player,
} from './hexGrid';

/** Plays a sequence of moves in order, failing loudly on any rejected move. */
const play = (state: GameState, cells: Cell[]): GameState =>
  cells.reduce((s, c) => {
    const result = placeStone(s, c);
    if (!result.ok) throw new Error(`Move ${c.q},${c.r} rejected: ${result.reason}`);
    return result.state;
  }, state);

/** Builds a move list that alternates A and B, with `a` and `b` as the two sides' cells. */
const alternate = (a: Cell[], b: Cell[]): Cell[] => {
  const out: Cell[] = [];
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) {
    if (i < a.length) out.push(a[i]);
    if (i < b.length) out.push(b[i]);
  }
  return out;
};

// A's winning column (q = 0, top to bottom) and B's blocking column (q = 6).
const aColumn: Cell[] = [0, 1, 2, 3, 4, 5, 6].map((r) => ({ q: 0, r }));
// B's winning row (r = 3, left to right).
const bRow: Cell[] = [0, 1, 2, 3, 4, 5, 6].map((q) => ({ q, r: 3 }));

describe('createGame', () => {
  it('starts empty with player A to move', () => {
    const g = createGame();
    expect(g.size).toBe(BOARD_SIZE);
    expect(g.stones.size).toBe(0);
    expect(g.turn).toBe('A');
    expect(g.winner).toBeNull();
  });

  it('rejects invalid sizes', () => {
    expect(() => createGame(0)).toThrow(RangeError);
    expect(() => createGame(2.5)).toThrow(RangeError);
  });
});

describe('neighbours', () => {
  it('gives six neighbours in the middle of the board', () => {
    expect(neighbours({ q: 3, r: 3 }, 7)).toHaveLength(6);
  });

  it('clips neighbours at a corner', () => {
    const keys = neighbours({ q: 0, r: 0 }, 7).map((c) => `${c.q},${c.r}`).sort();
    expect(keys).toEqual(['0,1', '1,0']);
  });
});

describe('placeStone', () => {
  it('alternates turns', () => {
    const result = placeStone(createGame(), { q: 0, r: 0 });
    if (!result.ok) throw new Error('unexpected rejection');
    expect(result.state.turn).toBe('B');
  });

  it('rejects an occupied cell', () => {
    const s = play(createGame(), [{ q: 1, r: 1 }]);
    expect(placeStone(s, { q: 1, r: 1 })).toEqual({ ok: false, reason: 'occupied' });
  });

  it('rejects out-of-bounds cells', () => {
    expect(placeStone(createGame(), { q: 7, r: 0 })).toEqual({
      ok: false,
      reason: 'out-of-bounds',
    });
  });

  it('does not mutate the previous state', () => {
    const before = createGame();
    placeStone(before, { q: 2, r: 2 });
    expect(before.stones.size).toBe(0);
    expect(before.moves).toHaveLength(0);
  });
});

describe('win detection', () => {
  it('player A wins by connecting top to bottom', () => {
    const bBlock: Cell[] = [0, 1, 2, 3, 4, 5].map((r) => ({ q: 6, r }));
    const g = play(createGame(), alternate(aColumn, bBlock));
    expect(g.winner).toBe('A');
  });

  it('player B wins by connecting left to right', () => {
    // A fills its own top row (harmless to A, which needs top-to-bottom).
    const aTopRow: Cell[] = [0, 1, 2, 3, 4, 5, 6].map((q) => ({ q, r: 0 }));
    const g = play(createGame(), alternate(aTopRow, bRow));
    expect(g.winner).toBe('B');
  });

  it('a diagonal chain counts as connected (hex adjacency)', () => {
    // Steps of (-1, +1) are hex neighbours, so this diagonal runs top to bottom.
    const diagonal: Cell[] = [
      { q: 6, r: 0 }, { q: 5, r: 1 }, { q: 4, r: 2 }, { q: 3, r: 3 },
      { q: 2, r: 4 }, { q: 1, r: 5 }, { q: 0, r: 6 },
    ];
    // B's filler cells never connect left to right, and none overlap A's diagonal.
    const bFiller: Cell[] = [
      { q: 0, r: 0 }, { q: 0, r: 1 }, { q: 0, r: 2 }, { q: 0, r: 3 },
      { q: 0, r: 4 }, { q: 0, r: 5 }, { q: 1, r: 0 },
    ];
    // A wins on its seventh move, so stop before B's seventh move would be rejected.
    const g = play(createGame(), alternate(diagonal, bFiller).slice(0, 13));
    expect(g.winner).toBe('A');
  });

  it('a gap in the chain means no win', () => {
    const aGap = aColumn.filter((c) => c.r !== 3); // missing r = 3
    const bBlock: Cell[] = [0, 1, 2, 3, 4, 5].map((r) => ({ q: 6, r }));
    const g = play(createGame(), alternate(aGap, bBlock));
    expect(g.winner).toBeNull();
  });

  it('rejects moves after a win', () => {
    const bBlock: Cell[] = [0, 1, 2, 3, 4, 5].map((r) => ({ q: 6, r }));
    const g = play(createGame(), alternate(aColumn, bBlock));
    expect(g.winner).toBe('A');
    expect(placeStone(g, { q: 3, r: 3 })).toEqual({ ok: false, reason: 'game-over' });
  });

  it('hasWon reports only the given player', () => {
    const g = play(createGame(), alternate(aColumn, [0, 1, 2, 3, 4, 5].map((r) => ({ q: 6, r }))));
    const a: Player = 'A';
    const b: Player = 'B';
    expect(hasWon(g, a)).toBe(true);
    expect(hasWon(g, b)).toBe(false);
  });
});

describe('undoMove', () => {
  it('restores the previous position and turn', () => {
    const g = play(createGame(), [{ q: 1, r: 1 }, { q: 2, r: 2 }]);
    const u = undoMove(g);
    expect(u.stones.has('2,2')).toBe(false);
    expect(u.stones.get('1,1')).toBe('A');
    expect(u.turn).toBe('B');
    expect(u.moves).toHaveLength(1);
  });

  it('clears a win when undoing the winning move', () => {
    const bBlock: Cell[] = [0, 1, 2, 3, 4, 5].map((r) => ({ q: 6, r }));
    const won = play(createGame(), alternate(aColumn, bBlock));
    expect(won.winner).toBe('A');
    const undone = undoMove(won);
    expect(undone.winner).toBeNull();
    expect(placeStone(undone, { q: 0, r: 6 }).ok).toBe(true);
  });

  it('is a no-op on an empty game', () => {
    const g = createGame();
    expect(undoMove(g)).toBe(g);
  });
});
