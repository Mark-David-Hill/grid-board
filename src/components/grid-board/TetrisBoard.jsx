import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { GridBoard, CellTemplate } from "./GridBoard";
import { initializeGridData, updatedBoardCell } from "../../utils/gridUtils";

// Basic Tetris implementation using GridBoard

const ROWS = 20;
const COLS = 10;

// Emoji colors for blocks (avoids needing CSS)
const COLORS = {
  I: "🟦",
  O: "🟨",
  T: "🟪",
  S: "🟩",
  Z: "🟥",
  J: "🟦",
  L: "🟧",
};

// Tetromino rotation states as arrays of [r, c] offsets from the piece origin
const SHAPES = {
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

const PIECE_TYPES = Object.keys(SHAPES);

const BASE_INTERVAL_MS = 800; // starting fall speed
const MIN_INTERVAL_MS = 120; // minimum speed cap

const scoreForClears = (cleared) => {
  switch (cleared) {
    case 1:
      return 100;
    case 2:
      return 300;
    case 3:
      return 500;
    case 4:
      return 800;
    default:
      return 0;
  }
};

export default function TetrisBoard() {
  const initialGrid = useMemo(
    () => initializeGridData(ROWS, COLS, new CellTemplate("", "tetris-cell")),
    []
  );

  // Board of locked blocks as 2D array of chars (emoji) or null
  const [board, setBoard] = useState(
    Array.from({ length: ROWS }, () => Array(COLS).fill(null))
  );
  const [gridData, setGridData] = useState(initialGrid);

  const [current, setCurrent] = useState(null); // { type, row, col, rot }
  const [nextType, setNextType] = useState(
    PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)]
  );
  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [direction, setDirection] = useState("DOWN"); // for GridBoard

  const intervalRef = useRef(null);
  const stateRef = useRef({});
  const boardRef = useRef(board);

  // keep latest board for interval/handlers to avoid stale captures
  useEffect(() => {
    boardRef.current = board;
  }, [board]);

  const getIntervalForLevel = useCallback((lvl) => {
    const speed = Math.max(MIN_INTERVAL_MS, BASE_INTERVAL_MS - (lvl - 1) * 70);
    return speed;
  }, []);

  const randomType = () =>
    PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];

  const makePiece = useCallback((type) => {
    // Start near the top center; origin is at row 0, col center
    return { type, row: 0, col: Math.floor(COLS / 2) - 1, rot: 0 };
  }, []);

  const eachBlock = useCallback((piece, fn) => {
    const shape = SHAPES[piece.type][piece.rot];
    for (const [dr, dc] of shape) {
      const r = piece.row + dr;
      const c = piece.col + dc;
      fn(r, c);
    }
  }, []);

  const isValid = useCallback(
    (piece) => {
      let ok = true;
      eachBlock(piece, (r, c) => {
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS) {
          ok = false;
          return;
        }
        if (boardRef.current[r][c]) ok = false;
      });
      return ok;
    },
    [eachBlock]
  );

  const mergeBoardAndCurrent = useCallback(
    (b, piece) => {
      let grid = initialGrid;
      // locked blocks
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const val = b[r][c];
          if (val) {
            grid = updatedBoardCell(
              grid,
              [r, c],
              new CellTemplate(val, "tetris-cell filled")
            );
          }
        }
      }
      // current piece overlay
      if (piece) {
        const ch = COLORS[piece.type] || "🟪";
        eachBlock(piece, (r, c) => {
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
    [eachBlock, initialGrid]
  );

  const spawn = useCallback(() => {
    const type = nextType || randomType();
    const piece = makePiece(type);
    // If initial spawn collides, game over
    if (!isValid(piece)) {
      setGameOver(true);
      setRunning(false);
      return null;
    }
    setCurrent(piece);
    setNextType(randomType());
    return piece;
  }, [isValid, makePiece, nextType]);

  const lockPiece = useCallback(
    (piece) => {
      // merge piece into board
      const ch = COLORS[piece.type] || "🟪";
      const newBoard = boardRef.current.map((row) => row.slice());
      eachBlock(piece, (r, c) => {
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
          newBoard[r][c] = ch;
        }
      });

      // clear lines
      let cleared = 0;
      const remaining = [];
      for (let r = 0; r < ROWS; r++) {
        const full = newBoard[r].every((cell) => !!cell);
        if (full) {
          cleared++;
        } else {
          remaining.push(newBoard[r]);
        }
      }
      while (remaining.length < ROWS) {
        remaining.unshift(Array(COLS).fill(null));
      }

      if (cleared > 0) {
        setLines((prev) => prev + cleared);
        setScore((prev) => prev + scoreForClears(cleared));
      }

      setBoard(remaining);
      boardRef.current = remaining;
      return remaining;
    },
    [eachBlock]
  );

  const updateGrid = useCallback(
    (b, p) => {
      const g = mergeBoardAndCurrent(b, p);
      setGridData(g);
    },
    [mergeBoardAndCurrent]
  );

  const tryMove = useCallback(
    (dr, dc) => {
      if (!current || !running || gameOver) return false;
      const next = { ...current, row: current.row + dr, col: current.col + dc };
      if (isValid(next)) {
        setCurrent(next);
        updateGrid(boardRef.current, next);
        return true;
      }
      return false;
    },
    [current, running, gameOver, isValid, updateGrid]
  );

  const tryRotate = useCallback(() => {
    if (!current || !running || gameOver) return;
    const next = { ...current, rot: (current.rot + 1) % 4 };
    // Basic wall kick: try nudging left/right if rotation collides
    const kicks = [
      [0, 0],
      [0, -1],
      [0, 1],
      [1, 0],
      [-1, 0],
    ];
    for (const [dr, dc] of kicks) {
      const candidate = { ...next, row: next.row + dr, col: next.col + dc };
      if (isValid(candidate)) {
        setCurrent(candidate);
        updateGrid(boardRef.current, candidate);
        return;
      }
    }
  }, [current, running, gameOver, isValid, updateGrid]);

  const softDrop = useCallback(() => {
    if (!current || !running || gameOver) return;
    const moved = tryMove(1, 0);
    if (!moved) {
      const newB = lockPiece(current);
      const spawned = spawn();
      updateGrid(newB, spawned);
    } else {
      // small score reward for manual soft drop
      setScore((s) => s + 1);
    }
  }, [current, running, gameOver, tryMove, lockPiece, spawn, updateGrid]);

  const hardDrop = useCallback(() => {
    if (!current || !running || gameOver) return;
    let steps = 0;
    let temp = { ...current };
    while (true) {
      const next = { ...temp, row: temp.row + 1 };
      if (isValid(next)) {
        temp = next;
        steps++;
      } else {
        break;
      }
    }
    setCurrent(temp);
    setScore((s) => s + steps * 2); // reward for hard drop distance
    const newB = lockPiece(temp);
    const spawned = spawn();
    updateGrid(newB, spawned);
  }, [current, running, gameOver, isValid, lockPiece, spawn, updateGrid]);

  // Main gravity loop
  const startLoop = useCallback(
    (lvl) => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      const ms = getIntervalForLevel(lvl);
      intervalRef.current = setInterval(() => {
        // gravity tick
        setCurrent((curr) => {
          if (!curr) return curr;
          const next = { ...curr, row: curr.row + 1 };
          if (isValid(next)) {
            updateGrid(boardRef.current, next);
            return next;
          }
          const newB = lockPiece(curr);
          const spawned = spawn();
          updateGrid(newB, spawned);
          return spawned;
        });
      }, ms);
    },
    [getIntervalForLevel, isValid, lockPiece, spawn, updateGrid]
  );

  // Handle level from lines
  useEffect(() => {
    const newLevel = Math.floor(lines / 10) + 1;
    if (newLevel !== level) {
      setLevel(newLevel);
      if (running && !gameOver) startLoop(newLevel);
    }
  }, [lines, level, running, gameOver, startLoop]);

  // Initialize / restart
  const startGame = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const empty = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    setBoard(empty);
    setScore(0);
    setLines(0);
    setLevel(1);
    setGameOver(false);
    setRunning(true);
    const piece = makePiece(randomType());
    if (!isValid(piece)) {
      setGameOver(true);
      setRunning(false);
      setCurrent(null);
      updateGrid(empty, null);
      return;
    }
    setCurrent(piece);
    updateGrid(empty, piece);
    startLoop(1);
  }, [makePiece, isValid, updateGrid, startLoop]);

  // Stop/cleanup
  useEffect(
    () => () => intervalRef.current && clearInterval(intervalRef.current),
    []
  );

  // Controls via GridBoard directions
  const onDirectionChange = useCallback(
    (dir) => {
      if (!running || gameOver) return;
      setDirection(dir);
      if (dir === "LEFT") tryMove(0, -1);
      else if (dir === "RIGHT") tryMove(0, 1);
      else if (dir === "DOWN") softDrop();
      else if (dir === "UP") tryRotate();
    },
    [running, gameOver, tryMove, softDrop, tryRotate]
  );

  // Repeated key in same direction (use for extra soft drop acceleration)
  const onContinueForward = useCallback(() => {
    if (!running || gameOver) return;
    if (direction === "DOWN") softDrop();
    else if (direction === "UP") tryRotate();
  }, [running, gameOver, direction, softDrop, tryRotate]);

  // Additional key listener for Hard Drop (Space)
  useEffect(() => {
    const handler = (e) => {
      if (!running || gameOver) return;
      if (e.code === "Space") {
        e.preventDefault();
        hardDrop();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [running, gameOver, hardDrop]);

  return (
    <div style={{ padding: 20, textAlign: "center" }}>
      <h2>Tetris</h2>
      <div style={{ marginBottom: 15 }}>
        <p style={{ margin: "5px 0" }}>
          <strong>Score:</strong> {score} | <strong>Lines:</strong> {lines} |{" "}
          <strong>Level:</strong> {level}
        </p>
        {gameOver ? (
          <p style={{ color: "red", fontSize: 18, fontWeight: "bold" }}>
            💀 Game Over! Final Score: {score}
          </p>
        ) : running ? (
          <p style={{ color: "green" }}>
            Use Arrow Keys: Left/Right to move, Up to rotate, Down to soft drop.
            Press Space to hard drop.
          </p>
        ) : (
          <p>Click Start to begin!</p>
        )}
        <button
          onClick={startGame}
          style={{
            padding: "10px 20px",
            fontSize: 16,
            backgroundColor: running ? "#ff6b6b" : "#4ecdc4",
            color: "white",
            border: "none",
            borderRadius: 5,
            cursor: "pointer",
          }}
        >
          {running ? "Restart" : "Start"}
        </button>
      </div>
      <div style={{ display: "inline-block" }}>
        <GridBoard
          gridData={gridData}
          enableKeyboardMovement
          onDirectionChange={onDirectionChange}
          onContinueForward={onContinueForward}
          gameRunning={running && !gameOver}
          direction={direction}
        />
      </div>
    </div>
  );
}
