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
      solution && grid[row][col] === 0 && solution[row][col] !== 0

    const displayValue = solution ? solution[row][col] : grid[row][col]

    const borderClass = `
      border border-gray-300
      ${row % 3 === 0 ? 'border-t-2' : ''}
      ${col % 3 === 0 ? 'border-l-2' : ''}
      ${row === 8 ? 'border-b-2' : ''}
      ${col === 8 ? 'border-r-2' : ''}
    `

    return (
      <td
        key={`${row}-${col}`}
        onClick={() => handleCellClick(row, col)}
        className={`p-0 align-top cursor-pointer ${borderClass}`}
      >
        <div
          className={`
            w-10 aspect-square flex items-center justify-center text-lg select-none
            ${isSelected ? 'bg-yellow-200' : isSolutionCell ? 'bg-green-200' : 'bg-white'}
            text-black hover:bg-blue-100 transition
          `}
        >
          {displayValue !== 0 ? displayValue : ''}
        </div>
      </td>
    )
  }

  return (
    <div className="flex flex-col items-center">
      {/* 数独盤面 */}
      <table className="border-collapse mb-4">
        <tbody>
          {grid.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((_, colIndex) => renderCell(rowIndex, colIndex))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* 自動入力モード切替 */}
      <button
        className={`mb-1 px-4 py-1 rounded font-medium ${
          autoInputMode ? 'bg-blue-500 text-white' : 'bg-gray-300 text-black'
        }`}
        onClick={() => {
          const newMode = !autoInputMode
          setAutoInputMode(newMode)
          setSelectedCell(null)
          if (!newMode) setSelectedNumber(null)
        }}
      >
        {autoInputMode ? '自動入力モード：ON' : '自動入力モード：OFF'}
      </button>

      {/* 自動入力モードの説明 */}
      <p className="text-sm text-gray-600 mb-2 max-w-sm text-center">
        自動入力モードでは、数字を選んでからマスをクリックするとその数字が入力されます。
        通常モードでは、マスを選んでから数字を入力してください。
      </p>

      {/* 数字ボタン */}
      <div className="mb-4 flex gap-2 justify-center flex-nowrap overflow-x-auto">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
          <button
            key={num}
            onClick={() => handleNumberInput(num)}
            className={`w-8 h-8 rounded text-black font-medium ${
              selectedNumber === num && autoInputMode
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200'
            }`}
          >
            {num === 0 ? '×' : num}
          </button>
        ))}
      </div>

      {/* 解答ボタン */}
      <button
        className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 font-semibold"
        onClick={() => onSolve(grid)}
      >
        解答
      </button>
    </div>
  )
}
