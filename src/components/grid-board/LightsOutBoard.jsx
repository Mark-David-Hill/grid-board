import React from "react";
import { useState, useEffect } from "react";

import { GridBoard, CellTemplate } from "./GridBoard";

import {
  initializeGridData,
  getAdjacentCoordinates,
  updatedBoardCell,
  generateRandomCoordinates,
} from "../../utils/gridUtils";

const LightsOutBoard = () => {
  const initialGridData = initializeGridData(5, 5, new CellTemplate("", "lit"));
  const [gridData, setGridData] = useState(initialGridData);

  const handleCellClick = (rowIndex, colIndex) => {
    const cellsToToggle = getAdjacentCoordinates(
      [rowIndex, colIndex],
      gridData.length,
      gridData[0].length
    );

    cellsToToggle.push([rowIndex, colIndex]);

    let newGridData = gridData.map((row) => row.slice());

    cellsToToggle.forEach(([rowId, cellId]) => {
      const sourceCell = gridData[rowId][cellId];
      const newCell = new CellTemplate(
        sourceCell.text,
        sourceCell.classNames === "lit" ? "unlit" : "lit"
      );
      newGridData = updatedBoardCell(newGridData, [rowId, cellId], newCell);
    });

    setGridData(newGridData);
  };

  // Effect to randomly click 3-5 spaces when game starts
  useEffect(() => {
    const randomClickCount = Math.floor(Math.random() * 3) + 3; // 3 to 5 clicks
    const randomCoordinates = generateRandomCoordinates(
      randomClickCount,
      gridData.length,
      gridData[0].length
    );

    // Simulate clicks on random coordinates
    let newGridData = gridData.map((row) => row.slice());

    randomCoordinates.forEach(([rowIndex, colIndex]) => {
      const cellsToToggle = getAdjacentCoordinates(
        [rowIndex, colIndex],
        gridData.length,
        gridData[0].length
      );
      cellsToToggle.push([rowIndex, colIndex]);

      cellsToToggle.forEach(([rowId, cellId]) => {
        const sourceCell = newGridData[rowId][cellId];
        const newCell = new CellTemplate(
          sourceCell.text,
          sourceCell.classNames === "lit" ? "unlit" : "lit"
        );
        newGridData = updatedBoardCell(newGridData, [rowId, cellId], newCell);
      });
    });

    setGridData(newGridData);
  }, []);

  return (
    <div>
      <div></div>
      <GridBoard gridData={gridData} onCellClick={handleCellClick} />
    </div>
  );
};

export default LightsOutBoard;
