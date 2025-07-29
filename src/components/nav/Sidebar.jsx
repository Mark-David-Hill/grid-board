import React from "react";
import "../../styles/components/sidebar.scss";

const Sidebar = ({ activeBoard, onBoardChange }) => {
  const boardOptions = [
    { id: "ticTacToe", name: "Tic Tac Toe", component: "TicTacToeBoard" },
    { id: "topDown", name: "Top Down", component: "TopDownBoard" },
    { id: "snake", name: "Snake", component: "SnakeBoard" },
    { id: "navigation", name: "Navigation", component: "NavigationBoard" },
    { id: "lightsOut", name: "Lights Out", component: "LightsOutBoard" },
    { id: "checkers", name: "Checkers", component: "CheckersBoard" },
  ];

  return (
    <div className="sidebar">
      <h3>Games</h3>
      <div className="sidebar-buttons">
        {boardOptions.map((board) => (
          <button
            key={board.id}
            className={`sidebar-button ${
              activeBoard === board.id ? "active" : ""
            }`}
            onClick={() => onBoardChange(board.id)}
          >
            {board.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
