'use client'

import React, { useState } from 'react'

type Props = {
  grid: number[][]
  setGrid: (grid: number[][]) => void
  onSolve: (grid: number[][]) => void
  solution: number[][] | null
}

export default function SudokuGrid({ grid, setGrid, onSolve, solution }: Props) {
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null)
  const [autoInputMode, setAutoInputMode] = useState<boolean>(false)
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null)

  const handleCellClick = (row: number, col: number) => {
    if (autoInputMode && selectedNumber !== null) {
      const newGrid = grid.map((r) => [...r])
      newGrid[row][col] = selectedNumber
      setGrid(newGrid)
    } else {
      setSelectedCell([row, col])
    }
  }

  const handleNumberInput = (num: number) => {
    if (autoInputMode) {
      setSelectedNumber(num)
    } else if (selectedCell) {
      const [row, col] = selectedCell
      const newGrid = grid.map((r) => [...r])
      newGrid[row][col] = num
      setGrid(newGrid)
    }
  }

  const renderCell = (row: number, col: number) => {
    const isSelected = selectedCell?.[0] === row && selectedCell?.[1] === col
    const isSolutionCell =
      solution && solution[row][col] !== 0 && grid[row][col] !== solution[row][col]

    return (
      <td
        key={`${row}-${col}`}
        onClick={() => handleCellClick(row, col)}
        className={`w-8 h-8 text-center border border-gray-300 cursor-pointer ${
          isSelected ? 'bg-yellow-200' : ''
        } ${isSolutionCell ? 'text-green-600 font-bold' : ''}`}
      >
        {grid[row][col] !== 0 ? grid[row][col] : ''}
      </td>
    )
  }

  return (
    <div className="flex flex-col items-center">
      {/* 自動入力モードトグル */}
      <button
        className={`mb-2 px-4 py-1 rounded ${
          autoInputMode ? 'bg-blue-500 text-white' : 'bg-gray-300 text-black'
        }`}
        onClick={() => {
          setAutoInputMode(!autoInputMode)
          setSelectedCell(null)
          setSelectedNumber(null)
        }}
      >
        {autoInputMode ? '自動入力モード：ON' : '自動入力モード：OFF'}
      </button>

      {/* 数字選択 */}
      <div className="mb-4 flex gap-2 flex-wrap justify-center">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleNumberInput(num)}
            className={`w-8 h-8 rounded ${
              selectedNumber === num && autoInputMode
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200'
            }`}
          >
            {num}
          </button>
        ))}
      </div>

      {/* 数独盤面 */}
      <table className="border-collapse">
        <tbody>
          {grid.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((_, colIndex) => renderCell(rowIndex, colIndex))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* 解答ボタン */}
      <button
        className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        onClick={() => onSolve(grid)}
      >
        解答
      </button>
    </div>
  )
}
