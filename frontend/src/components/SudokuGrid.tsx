'use client'

import { useState } from 'react'

interface Props {
  grid: number[][]
  setGrid: React.Dispatch<React.SetStateAction<number[][]>>
  onSolve: (grid: number[][]) => void
  solution: number[][] | null
}

export default function SudokuGrid({
  grid,
  setGrid,
  onSolve,
  solution,
}: Props) {
  const [selectedCell, setSelectedCell] = useState<{
    row: number
    col: number
  } | null>(null)

  const handleSolveClick = () => {
    onSolve(grid)
  }

  const handleCandidateClick = (num: number) => {
    if (!selectedCell) return
    const newGrid = grid.map((r) => [...r])
    newGrid[selectedCell.row][selectedCell.col] = num
    setGrid(newGrid)
    setSelectedCell(null) // 連続入力したい場合は false に
  }

  const renderCell = (row: number, col: number) => {
    const original = grid[row][col]
    const solved = solution?.[row][col] ?? original
    const isOriginal = original !== 0
    const isSelected =
      selectedCell?.row === row && selectedCell?.col === col

    const borderClasses = [
      row % 3 === 0 ? 'border-t-2' : 'border-t',
      col % 3 === 0 ? 'border-l-2' : 'border-l',
      row === 8 ? 'border-b-2' : '',
      col === 8 ? 'border-r-2' : '',
      'border-gray-400',
    ].join(' ')

    const cellClass = [
      'w-10 h-10 text-center text-lg',
      borderClasses,
      isOriginal ? 'bg-white text-black' : 'bg-blue-100 text-blue-900',
      isSelected
        ? 'outline outline-2 outline-blue-500 outline-offset-0 z-10'
        : '',
    ].join(' ')

    return (
      <button
        key={`${row}-${col}`}
        onClick={() => setSelectedCell({ row, col })}
        className={cellClass}
      >
        {solved !== 0 ? solved : ''}
      </button>
    )
  }

  return (
    <div className="flex flex-col items-center">
      {/* グリッド */}
      <div className="grid grid-cols-9">
        {grid.map((row, rowIndex) =>
          row.map((_, colIndex) => renderCell(rowIndex, colIndex))
        )}
      </div>

      {/* 候補ボタン */}
      <div className="mt-4 grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
          <button
            key={num}
            onClick={() => handleCandidateClick(num)}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            {num === 0 ? '消す' : num}
          </button>
        ))}
      </div>

      {/* 解答ボタン */}
      <button
        onClick={handleSolveClick}
        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        解答する
      </button>
    </div>
  )
}
