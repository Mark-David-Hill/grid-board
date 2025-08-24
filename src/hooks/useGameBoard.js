import { useState, useCallback } from "react";

/**
 * Custom hook for managing game board state
 * @param {string} defaultBoard - The default board type to display
 * @param {Array} validBoards - Array of valid board types
 * @returns {Object} - Board state and handlers
 */
export const useGameBoard = (defaultBoard, validBoards = []) => {
  const [activeBoard, setActiveBoard] = useState(defaultBoard);

  const handleBoardChange = useCallback(
    (boardType) => {
      if (validBoards.length === 0 || validBoards.includes(boardType)) {
        setActiveBoard(boardType);
      } else {
        console.warn(`Invalid board type: ${boardType}`);
      }
    },
    [validBoards]
  );

  const resetToDefault = useCallback(() => {
    setActiveBoard(defaultBoard);
  }, [defaultBoard]);

  return {
    activeBoard,
    handleBoardChange,
    resetToDefault,
  };
};

export default useGameBoard;
