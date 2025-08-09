import React, { useState } from "react";
import Sidebar from "../nav/Sidebar";
import NavigationBoard from "../grid-board/NavigationBoard";
import LightsOutBoard from "../grid-board/LightsOutBoard";
import TopDownBoard from "../grid-board/TopDownBoard";
import SnakeBoard from "../grid-board/SnakeBoard";
import TicTacToeBoard from "../grid-board/TicTacToeBoard";
import CheckersBoard from "../grid-board/CheckersBoard";
import TetrisBoard from "../grid-board/TetrisBoard";

export default function Home() {
  const [activeBoard, setActiveBoard] = useState("tetris");

  const renderActiveBoard = () => {
    switch (activeBoard) {
      case "ticTacToe":
        return <TicTacToeBoard />;
      case "topDown":
        return <TopDownBoard />;
      case "snake":
        return <SnakeBoard />;
      case "navigation":
        return <NavigationBoard />;
      case "lightsOut":
        return <LightsOutBoard />;
      case "checkers":
        return <CheckersBoard />;
      case "tetris":
        return <TetrisBoard />;
      default:
        return <LightsOutBoard />;
    }
  };

  return (
    <div className="home-container">
      <div className="home-layout">
        <Sidebar activeBoard={activeBoard} onBoardChange={setActiveBoard} />
        <div className="game-board-wrapper">{renderActiveBoard()}</div>
      </div>
    </div>
  );
}
