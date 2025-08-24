import React, { useMemo } from "react";
import PropTypes from "prop-types";
import "../../styles/components/sidebar.scss";

// Constants for board options
const BOARD_OPTIONS = [
  { id: "ticTacToe", name: "Tic Tac Toe", icon: "⚡" },
  { id: "topDown", name: "Top Down", icon: "🎮" },
  { id: "snake", name: "Snake", icon: "🐍" },
  { id: "navigation", name: "Navigation", icon: "🧭" },
  { id: "lightsOut", name: "Lights Out", icon: "💡" },
  { id: "checkers", name: "Checkers", icon: "🔴" },
];

const Sidebar = ({ activeBoard, onBoardChange }) => {
  // Memoize board buttons to prevent unnecessary re-renders
  const boardButtons = useMemo(
    () =>
      BOARD_OPTIONS.map((board) => (
        <button
          key={board.id}
          className={`sidebar-button ${
            activeBoard === board.id ? "active" : ""
          }`}
          onClick={() => onBoardChange(board.id)}
          aria-label={`Switch to ${board.name} game`}
          type="button"
        >
          <span className="game-icon" role="img" aria-hidden="true">
            {board.icon}
          </span>
          <span className="game-name">{board.name}</span>
        </button>
      )),
    [activeBoard, onBoardChange]
  );

  return (
    <aside className="sidebar" role="navigation" aria-label="Game selection">
      <h3>Games</h3>
      <div className="sidebar-buttons">{boardButtons}</div>
    </aside>
  );
};

Sidebar.propTypes = {
  activeBoard: PropTypes.string.isRequired,
  onBoardChange: PropTypes.func.isRequired,
};

export default Sidebar;
