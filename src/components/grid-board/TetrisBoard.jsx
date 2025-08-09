import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { GridBoard, CellTemplate } from "./GridBoard";
import { initializeGridData, updatedBoardCell } from "../../utils/gridUtils";

// Basic Tetris implementation using the existing GridBoard component.

const ROWS = 20;
const COLS = 10;

// Use emoji blocks so we don't depend on styles for colors.
const BLOCKS = {
  I: "🟦",
  O: "🟨",
  T: "🟪",
  S: "🟩",
  Z: "🟥",
  J: "🟦",
  L: "🟧",
};

// Rotation states: arrays of [r,c] offsets relative to piece origin
// Origins chosen to make spawn near top-center work reasonably well
const TETROMINOES = {
  I: [
    [
      [0, -1],
      [0, 0],
      [0, 1],
      [0, 2],
    ],
    [
      [-1, 1],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
    [
      [1, -1],
      [1, 0],
      [1, 1],
      [1, 2],
    ],
    [
      [-1, 0],
      [0, 0],
      [1, 0],
      [2, 0],
    ],
  ],
  O: [
    [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ],
    [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ],
    [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ],
    [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ],
  ],
  T: [
    [
      [0, -1],
      [0, 0],
      [0, 1],
      [1, 0],
    ],
    [
      [-1, 0],
      [0, 0],
      [1, 0],
      [0, 1],
    ],
    [
      [0, -1],
      [0, 0],
      [0, 1],
      [-1, 0],
    ],
    [
      [-1, 0],
      [0, 0],
      [1, 0],
      [0, -1],
    ],
  ],
  S: [
    [
      [0, 0],
      [0, 1],
      [1, -1],
      [1, 0],
    ],
    [
      [-1, 0],
      [0, 0],
      [0, 1],
      [1, 1],
    ],
    [
      [0, 0],
      [0, 1],
      [1, -1],
      [1, 0],
    ],
    [
      [-1, 0],
      [0, 0],
      [0, 1],
      [1, 1],
    ],
  ],
  Z: [
    [
      [0, -1],
      [0, 0],
      [1, 0],
      [1, 1],
    ],
    [
      [-1, 1],
      [0, 0],
      [0, 1],
      [1, 0],
    ],
    [
      [0, -1],
      [0, 0],
      [1, 0],
      [1, 1],
    ],
    [
      [-1, 1],
      [0, 0],
      [0, 1],
      [1, 0],
    ],
  ],
  J: [
    [
      [0, -1],
      [0, 0],
      [0, 1],
      [1, -1],
    ],
    [
      [-1, 0],
      [0, 0],
      [1, 0],
      [1, 1],
    ],
    [
      [0, -1],
      [0, 0],
      [0, 1],
      [-1, 1],
    ],
    [
      [-1, -1],
      [-1, 0],
      [0, 0],
      [1, 0],
    ],
  ],
  L: [
    [
      [0, -1],
      [0, 0],
      [0, 1],
      [1, 1],
    ],
    [
      [-1, 0],
      [0, 0],
      [1, 0],
      [1, -1],
    ],
    [
      [0, -1],
      [0, 0],
      [0, 1],
      [-1, -1],
    ],
    [
      [-1, 0],
      [-1, 1],
      [0, 0],
      [1, 0],
    ],
  ],
};

const SCORE_TABLE = { 1: 100, 2: 300, 3: 500, 4: 800 };

function randomPieceKey() {
  const keys = Object.keys(TETROMINOES);
  return keys[Math.floor(Math.random() * keys.length)];
}

function createEmptyFixed() {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => null)
  );
}

export default function TetrisBoard() {
  const emptyCellTemplate = useMemo(
    () => new CellTemplate("", "tetris-cell"),
    []
  );
  const initialGrid = useMemo(
    () => initializeGridData(ROWS, COLS, emptyCellTemplate),
    [emptyCellTemplate]
  );

  const [gridData, setGridData] = useState(initialGrid);
  const [fixed, setFixed] = useState(createEmptyFixed());
  const [current, setCurrent] = useState(null); // { key, rot, row, col }
  const [nextKey, setNextKey] = useState(randomPieceKey());
  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);

  const fallTimerRef = useRef(null);
  const runningRef = useRef(false);
  const currentRef = useRef(current);
  const fixedRef = useRef(fixed);

  useEffect(() => {
    currentRef.current = current;
  }, [current]);
  useEffect(() => {
    fixedRef.current = fixed;
  }, [fixed]);
  useEffect(() => {
    runningRef.current = running;
  }, [running]);

  const computeFallMs = useCallback(() => {
    const base = 800; // ms
    const step = 60; // speed-up per level
    const ms = Math.max(120, base - (level - 1) * step);
    return ms;
  }, [level]);

  const positionsFor = useCallback((piece) => {
    if (!piece) return [];
    const { key, rot, row, col } = piece;
    const shape = TETROMINOES[key][rot % 4];
    return shape.map(([dr, dc]) => [row + dr, col + dc]);
  }, []);

  const canPlace = useCallback(
    (piece, board = fixedRef.current) => {
      const cells = positionsFor(piece);
      for (const [r, c] of cells) {
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return false;
        if (board[r][c]) return false;
      }
      return true;
    },
    [positionsFor]
  );

  const mergeToGrid = useCallback(
    (fixedBoard, piece) => {
      let grid = initializeGridData(ROWS, COLS, emptyCellTemplate);

      // fixed cells
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const ch = fixedBoard[r][c];
          if (ch) {
            grid = updatedBoardCell(
              grid,
              [r, c],
              new CellTemplate(ch, "tetris-cell")
            );
          }
        }
      }

      // current piece
      if (piece) {
        const ch = BLOCKS[piece.key];
        const cells = positionsFor(piece);
        cells.forEach(([r, c]) => {
          if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
            grid = updatedBoardCell(
              grid,
              [r, c],
              new CellTemplate(ch, "tetris-cell active")
            );
          }
        });
      }

      return grid;
    },
    [emptyCellTemplate, positionsFor]
  );

  const spawnPiece = useCallback(
    (pieceKey) => {
      const start = {
        key: pieceKey,
        rot: 0,
        row: 0,
        col: Math.floor(COLS / 2) - 1,
      };
      if (!canPlace(start)) {
        setGameOver(true);
        setRunning(false);
        return null;
      }
      return start;
    },
    [canPlace]
  );

  const lockAndClear = useCallback(
    (piece) => {
      // merge piece into fixed
      const ch = BLOCKS[piece.key];
      const newFixed = fixedRef.current.map((row) => row.slice());
      positionsFor(piece).forEach(([r, c]) => {
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS) newFixed[r][c] = ch;
      });

      // clear full lines
      let cleared = 0;
      const remaining = [];
      for (let r = 0; r < ROWS; r++) {
        if (newFixed[r].every((cell) => !!cell)) {
          cleared++;
        } else {
          remaining.push(newFixed[r]);
        }
      }
      while (remaining.length < ROWS)
        remaining.unshift(Array.from({ length: COLS }, () => null));

      setFixed(remaining);

      if (cleared > 0) {
        setLines((prev) => prev + cleared);
        setScore((prev) => prev + (SCORE_TABLE[cleared] || 0));
      }

      // increase level each 10 lines
      setLevel((lv) => {
        const totalLines = lines + cleared;
        const nextLevel = Math.floor(totalLines / 10) + 1;
        return Math.max(lv, nextLevel);
      });
    },
    [positionsFor, lines]
  );

  const tryMove = useCallback(
    (dr, dc) => {
      if (!currentRef.current) return false;
      const next = {
        ...currentRef.current,
        row: currentRef.current.row + dr,
        col: currentRef.current.col + dc,
      };
      if (canPlace(next)) {
        setCurrent(next);
        return true;
      }
      return false;
    },
    [canPlace]
  );

  const tryRotate = useCallback(
    (dir = 1) => {
      if (!currentRef.current) return false;
      const base = currentRef.current;
      const rotated = { ...base, rot: (base.rot + dir + 4) % 4 };
      // simple wall-kick attempts: no kick, left, right
      const kicks = [
        [0, 0],
        [0, -1],
        [0, 1],
        [0, -2],
        [0, 2],
      ];
      for (const [dr, dc] of kicks) {
        const test = {
          ...rotated,
          row: rotated.row + dr,
          col: rotated.col + dc,
        };
        if (canPlace(test)) {
          setCurrent(test);
          return true;
        }
      }
      return false;
    },
    [canPlace]
  );

  const hardDrop = useCallback(() => {
    if (!currentRef.current) return;
    let moved = 0;
    while (tryMove(1, 0)) moved++;
    // locking
    const piece = currentRef.current;
    lockAndClear(piece);
    const next = spawnPiece(nextKey);
    setCurrent(next);
    setNextKey(randomPieceKey());
    // soft reward for hard drop distance
    if (moved > 0) setScore((s) => s + moved);
  }, [lockAndClear, spawnPiece, nextKey, tryMove]);

  const stepFall = useCallback(() => {
    if (!runningRef.current || !currentRef.current) return;
    const moved = tryMove(1, 0);
    if (!moved) {
      const piece = currentRef.current;
      lockAndClear(piece);
      const next = spawnPiece(nextKey);
      setCurrent(next);
      setNextKey(randomPieceKey());
    }
  }, [lockAndClear, spawnPiece, nextKey, tryMove]);

  // game loop timer
  useEffect(() => {
    if (!running || gameOver) return;
    if (fallTimerRef.current) clearInterval(fallTimerRef.current);
    fallTimerRef.current = setInterval(stepFall, computeFallMs());
    return () => clearInterval(fallTimerRef.current);
  }, [running, gameOver, stepFall, computeFallMs]);

  // render grid when fixed or current changes
  useEffect(() => {
    setGridData(mergeToGrid(fixed, current));
  }, [fixed, current, mergeToGrid]);

  // controls: handle keys locally (do not use GridBoard keyboard handler)
  useEffect(() => {
    const onKey = (e) => {
      if (!runningRef.current || gameOver) return;
      // prevent arrow scrolling
      if (
        ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(e.key)
      ) {
        e.preventDefault();
      }
      if (e.key === "ArrowLeft") {
        tryMove(0, -1);
      } else if (e.key === "ArrowRight") {
        tryMove(0, 1);
      } else if (e.key === "ArrowUp") {
        tryRotate(1);
      } else if (e.key === "ArrowDown") {
        if (e.shiftKey) {
          hardDrop();
        } else {
          // soft drop
          const moved = tryMove(1, 0);
          if (moved) setScore((s) => s + 1);
        }
      } else if (e.key === " ") {
        // Space: hard drop
        hardDrop();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [gameOver, tryMove, tryRotate, hardDrop]);

  const startGame = useCallback(() => {
    const firstKey = nextKey || randomPieceKey();
    const first = spawnPiece(firstKey);
    setFixed(createEmptyFixed());
    setCurrent(first);
    setNextKey(randomPieceKey());
    setScore(0);
    setLines(0);
    setLevel(1);
    setGameOver(false);
    setRunning(true);
  }, [spawnPiece, nextKey]);

  const pauseResume = useCallback(() => {
    if (gameOver) return;
    setRunning((r) => !r);
  }, [gameOver]);

  return (
    <div style={{ padding: 20, textAlign: "center" }}>
      <h2>Tetris</h2>
      <div style={{ marginBottom: 12 }}>
        <p style={{ margin: "4px 0" }}>
          <strong>Score:</strong> {score} | <strong>Lines:</strong> {lines} |{" "}
          <strong>Level:</strong> {level}
        </p>
        {gameOver ? (
          <p style={{ color: "red", fontWeight: "bold" }}>💀 Game Over</p>
        ) : running ? (
          <p style={{ color: "green" }}>
            ◀ ▶ move | ▲ rotate | ▼ soft drop (+1/step) | Shift+▼ or Space =
            hard drop
          </p>
        ) : (
          <p>Press Start to play. Speed increases every 10 cleared lines.</p>
        )}
        <div style={{ marginTop: 8 }}>
          <button
            onClick={startGame}
            style={{ padding: "8px 16px", marginRight: 8 }}
          >
            {running ? "Restart" : "Start"}
          </button>
          <button
            onClick={pauseResume}
            disabled={gameOver}
            style={{ padding: "8px 16px" }}
          >
            {running ? "Pause" : "Resume"}
          </button>
        </div>
        <div style={{ marginTop: 8 }}>
          <small>Next: {nextKey}</small>
        </div>
      </div>
      <div style={{ display: "inline-block" }}>
        <GridBoard
          gridData={gridData}
          onCellClick={() => {}}
          enableKeyboardMovement={false}
          gameRunning={false}
        />
      </div>
    </div>
  );
}
