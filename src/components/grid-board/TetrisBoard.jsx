import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { GridBoard, CellTemplate } from "./GridBoard";
import { initializeGridData, updatedBoardCell } from "../../utils/gridUtils";

const GRID_WIDTH = 10;
const GRID_HEIGHT = 20;
const INITIAL_FALL_SPEED = 800; // milliseconds
const HIGH_SCORE_KEY = "tetrisHighScore";

// Tetris piece shapes (using coordinates relative to origin)
const TETRIS_PIECES = {
  I: {
    shape: [
      [0, 0],
      [0, 1],
      [0, 2],
      [0, 3],
    ],
    color: "tetris-cyan",
    center: [0, 1.5],
  },
  O: {
    shape: [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ],
    color: "tetris-yellow",
    center: [0.5, 0.5],
  },
  T: {
    shape: [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, 2],
    ],
    color: "tetris-purple",
    center: [1, 1],
  },
  S: {
    shape: [
      [0, 1],
      [0, 2],
      [1, 0],
      [1, 1],
    ],
    color: "tetris-green",
    center: [0.5, 1],
  },
  Z: {
    shape: [
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 2],
    ],
    color: "tetris-red",
    center: [0.5, 1],
  },
  J: {
    shape: [
      [0, 0],
      [1, 0],
      [1, 1],
      [1, 2],
    ],
    color: "tetris-blue",
    center: [1, 1],
  },
  L: {
    shape: [
      [0, 2],
      [1, 0],
      [1, 1],
      [1, 2],
    ],
    color: "tetris-orange",
    center: [1, 1],
  },
};

const PIECE_TYPES = Object.keys(TETRIS_PIECES);

// Generate random piece
const getRandomPiece = () => {
  const type = PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
  return {
    type,
    ...TETRIS_PIECES[type],
    position: [0, Math.floor(GRID_WIDTH / 2) - 1], // Start at top center
    rotation: 0,
  };
};

// Rotate piece 90 degrees clockwise
const rotatePiece = (piece) => {
  const [centerY, centerX] = piece.center;
  const rotatedShape = piece.shape.map(([y, x]) => {
    const relY = y - centerY;
    const relX = x - centerX;
    // 90-degree clockwise rotation: (x, y) -> (y, -x)
    const newY = relX + centerY;
    const newX = -relY + centerX;
    return [Math.round(newY), Math.round(newX)];
  });

  return {
    ...piece,
    shape: rotatedShape,
    rotation: (piece.rotation + 90) % 360,
  };
};

// Check if piece position is valid
const isValidPosition = (piece, board, offsetY = 0, offsetX = 0) => {
  const [pieceY, pieceX] = piece.position;

  return piece.shape.every(([shapeY, shapeX]) => {
    const boardY = pieceY + shapeY + offsetY;
    const boardX = pieceX + shapeX + offsetX;

    // Check bounds
    if (boardY < 0) return true; // Allow piece to be above board initially
    if (boardY >= GRID_HEIGHT || boardX < 0 || boardX >= GRID_WIDTH)
      return false;

    // Check collision with placed pieces
    return !board[boardY][boardX].isPlaced;
  });
};

// Place piece on board
const placePieceOnBoard = (piece, board) => {
  const [pieceY, pieceX] = piece.position;
  let newBoard = board.map((row) => row.slice());

  piece.shape.forEach(([shapeY, shapeX]) => {
    const boardY = pieceY + shapeY;
    const boardX = pieceX + shapeX;

    if (
      boardY >= 0 &&
      boardY < GRID_HEIGHT &&
      boardX >= 0 &&
      boardX < GRID_WIDTH
    ) {
      newBoard = updatedBoardCell(
        newBoard,
        [boardY, boardX],
        new CellTemplate(
          "⬛",
          `tetris-cell ${piece.color} placed`,
          false,
          true,
          0,
          true,
          false,
          false,
          false
        )
      );
      newBoard[boardY][boardX].isPlaced = true;
    }
  });

  return newBoard;
};

// Check for completed lines and remove them
const clearLines = (board) => {
  const completedLines = [];

  // Find completed lines
  for (let y = 0; y < GRID_HEIGHT; y++) {
    if (board[y].every((cell) => cell.isPlaced)) {
      completedLines.push(y);
    }
  }

  if (completedLines.length === 0) {
    return { board, linesCleared: 0 };
  }

  // Remove completed lines and add new empty lines at top
  let newBoard = board.filter((_, index) => !completedLines.includes(index));

  // Add empty lines at the top
  const emptyCell = new CellTemplate(
    "",
    "tetris-cell empty",
    false,
    true,
    0,
    true,
    false,
    false,
    false
  );
  emptyCell.isPlaced = false;

  for (let i = 0; i < completedLines.length; i++) {
    const emptyRow = Array(GRID_WIDTH)
      .fill(null)
      .map(() => ({ ...emptyCell }));
    newBoard.unshift(emptyRow);
  }

  return { board: newBoard, linesCleared: completedLines.length };
};

// Calculate score based on lines cleared
const calculateScore = (linesCleared, level) => {
  const baseScore = {
    1: 40,
    2: 100,
    3: 300,
    4: 1200,
  };
  return (baseScore[linesCleared] || 0) * (level + 1);
};

export default function TetrisBoard() {
  // Initialize empty board
  const initialBoard = useMemo(() => {
    const emptyCell = new CellTemplate(
      "",
      "tetris-cell empty",
      false,
      true,
      0,
      true,
      false,
      false,
      false
    );
    emptyCell.isPlaced = false;
    return initializeGridData(GRID_HEIGHT, GRID_WIDTH, emptyCell);
  }, []);

  const [board, setBoard] = useState(initialBoard);
  const [currentPiece, setCurrentPiece] = useState(null);
  const [nextPiece, setNextPiece] = useState(getRandomPiece());
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(0);
  const [lines, setLines] = useState(0);
  const [highScore, setHighScore] = useState(
    () => parseInt(localStorage.getItem(HIGH_SCORE_KEY)) || 0
  );
  const [gameRunning, setGameRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [fallSpeed, setFallSpeed] = useState(INITIAL_FALL_SPEED);

  // Refs for game loop
  const boardRef = useRef(board);
  const currentPieceRef = useRef(currentPiece);
  const gameRunningRef = useRef(gameRunning);
  const gameOverRef = useRef(gameOver);

  // Keep refs in sync
  useEffect(() => {
    boardRef.current = board;
  }, [board]);
  useEffect(() => {
    currentPieceRef.current = currentPiece;
  }, [currentPiece]);
  useEffect(() => {
    gameRunningRef.current = gameRunning;
  }, [gameRunning]);
  useEffect(() => {
    gameOverRef.current = gameOver;
  }, [gameOver]);

  // Update fall speed based on level
  useEffect(() => {
    setFallSpeed(Math.max(50, INITIAL_FALL_SPEED - level * 50));
  }, [level]);

  // Render current piece on board
  const getBoardWithCurrentPiece = useCallback(() => {
    if (!currentPiece) return board;

    let displayBoard = board.map((row) => row.slice());
    const [pieceY, pieceX] = currentPiece.position;

    currentPiece.shape.forEach(([shapeY, shapeX]) => {
      const boardY = pieceY + shapeY;
      const boardX = pieceX + shapeX;

      if (
        boardY >= 0 &&
        boardY < GRID_HEIGHT &&
        boardX >= 0 &&
        boardX < GRID_WIDTH
      ) {
        displayBoard = updatedBoardCell(
          displayBoard,
          [boardY, boardX],
          new CellTemplate(
            "⬛",
            `tetris-cell ${currentPiece.color} falling`,
            false,
            true,
            0,
            true,
            false,
            false,
            false
          )
        );
      }
    });

    return displayBoard;
  }, [board, currentPiece]);

  // Move piece down
  const movePieceDown = useCallback(() => {
    if (
      !currentPieceRef.current ||
      gameOverRef.current ||
      !gameRunningRef.current
    )
      return;

    const piece = currentPieceRef.current;
    if (isValidPosition(piece, boardRef.current, 1, 0)) {
      setCurrentPiece((prev) => ({
        ...prev,
        position: [prev.position[0] + 1, prev.position[1]],
      }));
    } else {
      // Piece can't move down, place it
      const newBoard = placePieceOnBoard(piece, boardRef.current);
      const { board: clearedBoard, linesCleared } = clearLines(newBoard);

      setBoard(clearedBoard);
      setCurrentPiece(null);

      if (linesCleared > 0) {
        const newLines = lines + linesCleared;
        const newLevel = Math.floor(newLines / 10);
        const scoreEarned = calculateScore(linesCleared, level);

        setLines(newLines);
        setLevel(newLevel);
        setScore((prev) => prev + scoreEarned);
      }
    }
  }, [lines, level]);

  // Spawn new piece
  const spawnNewPiece = useCallback(() => {
    if (currentPiece) return;

    const newPiece = nextPiece;
    setCurrentPiece(newPiece);
    setNextPiece(getRandomPiece());

    // Check game over
    if (!isValidPosition(newPiece, board)) {
      setGameOver(true);
      setGameRunning(false);
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem(HIGH_SCORE_KEY, score.toString());
      }
    }
  }, [currentPiece, nextPiece, board, score, highScore]);

  // Game loop
  useEffect(() => {
    if (!gameRunning || gameOver) return;

    const interval = setInterval(() => {
      if (!currentPieceRef.current) {
        spawnNewPiece();
      } else {
        movePieceDown();
      }
    }, fallSpeed);

    return () => clearInterval(interval);
  }, [gameRunning, gameOver, fallSpeed, movePieceDown, spawnNewPiece]);

  // Handle keyboard input
  const handleKeyDown = useCallback(
    (e) => {
      if (!gameRunning || gameOver || !currentPiece) return;

      e.preventDefault();

      switch (e.key) {
        case "ArrowLeft":
          if (isValidPosition(currentPiece, board, 0, -1)) {
            setCurrentPiece((prev) => ({
              ...prev,
              position: [prev.position[0], prev.position[1] - 1],
            }));
          }
          break;

        case "ArrowRight":
          if (isValidPosition(currentPiece, board, 0, 1)) {
            setCurrentPiece((prev) => ({
              ...prev,
              position: [prev.position[0], prev.position[1] + 1],
            }));
          }
          break;

        case "ArrowDown":
          movePieceDown();
          break;

        case "ArrowUp":
          const rotated = rotatePiece(currentPiece);
          if (isValidPosition(rotated, board)) {
            setCurrentPiece(rotated);
          }
          break;

        case " ": // Spacebar for hard drop
          let dropPiece = { ...currentPiece };
          while (isValidPosition(dropPiece, board, 1, 0)) {
            dropPiece = {
              ...dropPiece,
              position: [dropPiece.position[0] + 1, dropPiece.position[1]],
            };
          }
          // Place the piece directly at the correct position
          const newBoard = placePieceOnBoard(dropPiece, board);
          const { board: clearedBoard, linesCleared } = clearLines(newBoard);

          setBoard(clearedBoard);
          setCurrentPiece(null);

          if (linesCleared > 0) {
            const newLines = lines + linesCleared;
            const newLevel = Math.floor(newLines / 10);
            const scoreEarned = calculateScore(linesCleared, level);

            setLines(newLines);
            setLevel(newLevel);
            setScore((prev) => prev + scoreEarned);
          }
          break;

        default:
          break;
      }
    },
    [gameRunning, gameOver, currentPiece, board, movePieceDown]
  );

  useEffect(() => {
    if (gameRunning) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [gameRunning, handleKeyDown]);

  // Start game
  const startGame = () => {
    const emptyCell = new CellTemplate(
      "",
      "tetris-cell empty",
      false,
      true,
      0,
      true,
      false,
      false,
      false
    );
    emptyCell.isPlaced = false;
    const newBoard = initializeGridData(GRID_HEIGHT, GRID_WIDTH, emptyCell);

    setBoard(newBoard);
    setCurrentPiece(null);
    setNextPiece(getRandomPiece());
    setScore(0);
    setLevel(0);
    setLines(0);
    setGameOver(false);
    setGameRunning(true);
    setFallSpeed(INITIAL_FALL_SPEED);
  };

  const displayBoard = getBoardWithCurrentPiece();

  return (
    <div
      style={{
        padding: 20,
        textAlign: "center",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      <h2>Tetris</h2>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "20px",
        }}
      >
        {/* Game Board */}
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 15 }}>
            <p style={{ margin: "5px 0" }}>
              <strong>Score: {score}</strong> | Level: {level} | Lines: {lines}
            </p>
            <p style={{ margin: "5px 0" }}>High Score: {highScore}</p>
            {gameOver ? (
              <p style={{ color: "red", fontSize: 18, fontWeight: "bold" }}>
                💀 Game Over! Final Score: {score}
              </p>
            ) : gameRunning ? (
              <p style={{ color: "green" }}>
                🎮 Use Arrow Keys: ← → to move, ↑ to rotate, ↓ to soft drop,
                Space to hard drop
              </p>
            ) : (
              <p>Click Start Game to begin!</p>
            )}
            <button
              onClick={startGame}
              style={{
                padding: "10px 20px",
                fontSize: 16,
                backgroundColor: gameRunning ? "#ff6b6b" : "#4ecdc4",
                color: "white",
                border: "none",
                borderRadius: 5,
                cursor: "pointer",
                marginBottom: 10,
              }}
            >
              {gameRunning ? "Restart Game" : "Start Game"}
            </button>
          </div>

          <div
            style={{
              display: "inline-block",
              border: "3px solid #333",
              borderRadius: "8px",
              padding: "5px",
              backgroundColor: "#000",
            }}
          >
            <GridBoard gridData={displayBoard} />
          </div>
        </div>

        {/* Next Piece Preview */}
        <div
          style={{
            minWidth: "120px",
            border: "2px solid #333",
            borderRadius: "8px",
            padding: "10px",
            backgroundColor: "#f8f8f8",
          }}
        >
          <h4 style={{ margin: "0 0 10px 0" }}>Next Piece</h4>
          {nextPiece && (
            <div style={{ display: "grid", gap: "2px" }}>
              {/* Simple 4x4 grid to show next piece */}
              {Array.from({ length: 4 }, (_, row) => (
                <div key={row} style={{ display: "flex", gap: "2px" }}>
                  {Array.from({ length: 4 }, (_, col) => {
                    const hasBlock = nextPiece.shape.some(
                      ([y, x]) => y === row && x === col
                    );
                    return (
                      <div
                        key={col}
                        style={{
                          width: "20px",
                          height: "20px",
                          border: "1px solid #ccc",
                          backgroundColor: hasBlock ? "#333" : "transparent",
                          borderRadius: "2px",
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
