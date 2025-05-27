'use client'

import React, { useState, useEffect } from 'react'

type Props = {
  grid: number[][]
  setGrid: (grid: number[][]) => void
  onSolve: (grid: number[][]) => void
  solution: number[][] | null
}

type ConflictingCell = {
  row: number
  col: number
  conflictsWith: Array<[number, number]>
}

export default function SudokuGrid({ grid, setGrid, onSolve, solution }: Props) {
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null)
  const [autoInputMode, setAutoInputMode] = useState<boolean>(false)
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null)
  const [conflictingCells, setConflictingCells] = useState<ConflictingCell[]>([])

  // 数独のルール違反を検出する関数
  const detectConflicts = () => {
    const conflicts: ConflictingCell[] = []
    const conflictMap = new Map<string, ConflictingCell>()

    // 行ごとのチェック
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] === 0) continue

        const cellKey = `${row}-${col}`
        let currentConflict = conflictMap.get(cellKey) || {
          row,
          col,
          conflictsWith: []
        }

        // 同じ行のチェック
        for (let c = 0; c < 9; c++) {
          if (c !== col && grid[row][col] === grid[row][c]) {
            currentConflict.conflictsWith.push([row, c])

            // 反対側のセルにも競合を記録
            const otherCellKey = `${row}-${c}`
            let otherConflict = conflictMap.get(otherCellKey) || {
              row,
              col: c,
              conflictsWith: []
            }
            otherConflict.conflictsWith.push([row, col])
            conflictMap.set(otherCellKey, otherConflict)
          }
        }

        // 同じ列のチェック
        for (let r = 0; r < 9; r++) {
          if (r !== row && grid[row][col] === grid[r][col]) {
            currentConflict.conflictsWith.push([r, col])

            // 反対側のセルにも競合を記録
            const otherCellKey = `${r}-${col}`
            let otherConflict = conflictMap.get(otherCellKey) || {
              row: r,
              col,
              conflictsWith: []
            }
            otherConflict.conflictsWith.push([row, col])
            conflictMap.set(otherCellKey, otherConflict)
          }
        }

        // 同じ3x3ブロック内のチェック
        const blockRow = Math.floor(row / 3) * 3
        const blockCol = Math.floor(col / 3) * 3

        for (let r = blockRow; r < blockRow + 3; r++) {
          for (let c = blockCol; c < blockCol + 3; c++) {
            if ((r !== row || c !== col) && grid[row][col] === grid[r][c]) {
              currentConflict.conflictsWith.push([r, c])

              // 反対側のセルにも競合を記録
              const otherCellKey = `${r}-${c}`
              let otherConflict = conflictMap.get(otherCellKey) || {
                row: r,
                col: c,
                conflictsWith: []
              }
              otherConflict.conflictsWith.push([row, col])
              conflictMap.set(otherCellKey, otherConflict)
            }
          }
        }

        if (currentConflict.conflictsWith.length > 0) {
          conflictMap.set(cellKey, currentConflict)
        }
      }
    }

    // Mapからリストに変換
    const conflictList = Array.from(conflictMap.values());
    setConflictingCells(conflictList)
  }

  // グリッドが変更されるたびにルール違反をチェック
  useEffect(() => {
    detectConflicts()
  }, [grid])

  // セルがコンフリクト状態かどうかを確認する関数
  const isCellConflicting = (row: number, col: number): boolean => {
    return conflictingCells.some(
      conflict => (
        conflict.row === row && conflict.col === col) ||
        conflict.conflictsWith.some(([r, c]) => r === row && c === col)
    )
  }

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
    const isConflicting = isCellConflicting(row, col)

    const displayValue = solution ? solution[row][col] : grid[row][col]

    const borderClass = `
      border border-gray-600
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
            ${isConflicting ? 'bg-red-400 font-bold' :
               isSelected ? 'bg-yellow-200' :
               isSolutionCell ? 'bg-green-200' : 'bg-white'
            }
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

      {/* 数字ボタン（2行に分割） */}
      <div className="mb-4 space-y-2">
        <div className="flex gap-2 justify-center">
          {[1, 2, 3, 4, 5].map((num) => (
            <button
              key={num}
              onClick={() => handleNumberInput(num)}
              className={`w-8 h-8 rounded text-black font-medium ${
                selectedNumber === num && autoInputMode
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200'
              }`}
            >
              {num}
            </button>
          ))}
        </div>

        <div className="flex gap-2 justify-center">
          {[6, 7, 8, 9, 0].map((num) => (
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
      </div>

      {/* 解答ボタン */}
      <button
        className={`mt-2 px-4 py-2 ${
          conflictingCells.length > 0
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-green-500 hover:bg-green-600'
        } text-white rounded font-semibold`}
        onClick={() => onSolve(grid)}
        disabled={conflictingCells.length > 0}
      >
        解答
      </button>
    </div>
  )
}
