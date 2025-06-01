// __tests__/SudokuGrid.test.tsx
import { render, screen } from '@testing-library/react'
import SudokuGrid from '@/components/SudokuGrid'

describe('SudokuGrid', () => {
  it('renders a 9x9 grid', () => {
    const grid = Array.from({ length: 9 }, () => Array(9).fill(0))

    render(
      <SudokuGrid
        grid={grid}
        setGrid={() => {}}
        onSolve={() => {}}
        solution={null}
      />
    )

    const cells = screen.getAllByRole('cell')
    expect(cells).toHaveLength(81)
  })
})
