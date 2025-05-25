'use client'

import { useState } from 'react'
import SudokuGrid from '@/components/SudokuGrid'

export default function Home() {
  const [grid, setGrid] = useState<number[][]>(
    Array.from({ length: 9 }, () => Array(9).fill(0))
  )
  const [solution, setSolution] = useState<number[][] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

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
    setLoading(true)
    setError(null)

    const maxRetries = 3
    const retryDelay = 2000 // 2秒待つ

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/solve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ puzzle: grid }),
        })

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.detail || `エラー（HTTP ${res.status}）`)
        }

        const data = await res.json()
        setSolution(data.solution)
        return
      } catch (err: unknown) {
        if (attempt === maxRetries) {
          if (err instanceof Error) {
            setError(`解答に失敗しました: ${err.message}`)
          } else {
            setError('解答に失敗しました')
          }
        } else {
          // スリープ解除待ちのため少し待つ
          await new Promise((resolve) => setTimeout(resolve, retryDelay))
        }
      } finally {
        if (attempt === maxRetries) {
          setLoading(false)
        }
      }
    }
  }

  const applySample = () => {
    setGrid(samplePuzzle.map((row) => [...row]))
    setSolution(null)
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">
        数独 自動解答ツール
      </h1>

      <button
        onClick={applySample}
        className="mb-4 px-4 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
      >
        サンプル問題を入力
      </button>

      <SudokuGrid
        grid={grid}
        setGrid={setGrid}
        onSolve={handleSolve}
        solution={solution}
      />

      {/* ローディング表示 */}
      {loading && (
        <p className="mt-4 text-blue-500 text-sm animate-pulse">
          解答中です...（RenderのAPIが起きるまで少々お待ちください）
        </p>
      )}

      {/* エラー表示 */}
      {error && (
        <p className="mt-2 text-red-500 text-sm">
          {error}
        </p>
      )}
    </main>
  )
}
