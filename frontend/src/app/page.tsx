'use client'

import { useState } from 'react'
import SudokuGrid from '@/components/SudokuGrid'

export default function Home() {
  const [grid, setGrid] = useState<number[][]>(
    Array.from({ length: 9 }, () => Array(9).fill(0))
  )
  const [solution, setSolution] = useState<number[][] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [executionTime, setExecutionTime] = useState<number | null>(null)

  const samplePuzzle: number[][] = [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9],
  ]

  const handleSolve = async (grid: number[][]) => {
    try {
      setError(null)
      setExecutionTime(null)
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/solve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ puzzle: grid }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'サーバーエラー')
      }

      const data = await res.json()
      setSolution(data.solution)
      setExecutionTime(data.execution_time_seconds)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(`解答に失敗しました: ${err.message}`)
      } else {
        setError('解答に失敗しました')
      }
    }
  }

  const applySample = () => {
    setGrid(samplePuzzle.map((row) => [...row]))
    setSolution(null)
  }

  const resetGrid = () => {
    setGrid(Array.from({ length: 9 }, () => Array(9).fill(0)))
    setSolution(null)
    setError(null)
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      {/* タイトル */}
      <h1 className="text-2xl font-bold mb-6 text-gray-900 whitespace-nowrap">
        数独（ナンプレ）自動解答ツール
      </h1>

      {/* 盤面＋操作UI */}
      <SudokuGrid
        grid={grid}
        setGrid={setGrid}
        onSolve={handleSolve}
        solution={solution}
      />

      {/* エラー表示 */}
      {error && (
        <p className="mt-2 text-red-500 text-sm">{error}</p>
      )}

      {/* 処理時間表示 */}
      {executionTime !== null && (
        <p className="mt-2 text-green-600 font-medium">
          処理時間: {executionTime.toFixed(3)} 秒
        </p>
      )}

      {/* サンプルとリセット */}
      <div className="flex gap-4 mt-6">
        <button
          onClick={applySample}
          className="px-4 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          サンプル問題を入力
        </button>

        <button
          onClick={resetGrid}
          className="px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600"
        >
          リセット
        </button>
      </div>
    </main>
  )
}
