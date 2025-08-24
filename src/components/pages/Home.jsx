import React, { useMemo } from "react";
import Sidebar from "../nav/Sidebar";
import NavigationBoard from "../grid-board/NavigationBoard";
import LightsOutBoard from "../grid-board/LightsOutBoard";
import TopDownBoard from "../grid-board/TopDownBoard";
import SnakeBoard from "../grid-board/SnakeBoard";
import TicTacToeBoard from "../grid-board/TicTacToeBoard";
import CheckersBoard from "../grid-board/CheckersBoard";
import { useGameBoard } from "../../hooks/useGameBoard";

// Constants for better maintainability
const BOARD_TYPES = {
  TIC_TAC_TOE: "ticTacToe",
  TOP_DOWN: "topDown",
  SNAKE: "snake",
  NAVIGATION: "navigation",
  LIGHTS_OUT: "lightsOut",
  CHECKERS: "checkers",
};

const DEFAULT_BOARD = BOARD_TYPES.LIGHTS_OUT;
const VALID_BOARDS = Object.values(BOARD_TYPES);

export default function Home() {
  const { activeBoard, handleBoardChange } = useGameBoard(
    DEFAULT_BOARD,
    VALID_BOARDS
  );

  // Memoized board components to prevent unnecessary re-renders
  const boardComponents = useMemo(
    () => ({
      [BOARD_TYPES.TIC_TAC_TOE]: <TicTacToeBoard />,
      [BOARD_TYPES.TOP_DOWN]: <TopDownBoard />,
      [BOARD_TYPES.SNAKE]: <SnakeBoard />,
      [BOARD_TYPES.NAVIGATION]: <NavigationBoard />,
      [BOARD_TYPES.LIGHTS_OUT]: <LightsOutBoard />,
      [BOARD_TYPES.CHECKERS]: <CheckersBoard />,
    }),
    []
  );

  // Get the active board component
  const activeComponent = useMemo(
    () => boardComponents[activeBoard] || boardComponents[DEFAULT_BOARD],
    [activeBoard, boardComponents]
  );

  return (
    <div className="home-container">
      <div className="home-layout">
        <Sidebar activeBoard={activeBoard} onBoardChange={handleBoardChange} />
        <div className="game-board-wrapper">{activeComponent}</div>
      </div>
    </div>
  );
}
