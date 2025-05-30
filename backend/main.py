from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, conlist
from fastapi.middleware.cors import CORSMiddleware
from typing import List

app = FastAPI()

origins = ["https://sudoku-solver-web-kkne.vercel.app", "http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SudokuPuzzle(BaseModel):
    puzzle: List[List[int]]


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/solve")
def solve_sudoku(data: SudokuPuzzle):
    puzzle = [row[:] for row in data.puzzle]

    # まず、パズルが有効かどうかを確認
    if not is_valid_puzzle(puzzle):
        raise HTTPException(
            status_code=400,
            detail="無効な数独パズルです。既に配置されている数字がルールに違反しています。",
        )

    # 解けるかどうか試行
    if solve(puzzle):
        return {"solution": puzzle}
    else:
        raise HTTPException(
            status_code=400,
            detail="解答が見つかりませんでした。このパズルは解けません。",
        )


# --- 解答ロジック（バックトラッキング） ---
def is_valid(grid, row, col, num):
    for i in range(9):
        if grid[row][i] == num or grid[i][col] == num:
            return False
    start_row, start_col = 3 * (row // 3), 3 * (col // 3)
    for i in range(3):
        for j in range(3):
            if grid[start_row + i][start_col + j] == num:
                return False
    return True


# 数独パズルが有効かどうかを確認する関数
def is_valid_puzzle(grid):
    # すでに配置されている数字がルールに違反していないか確認
    for row in range(9):
        for col in range(9):
            if grid[row][col] != 0:  # セルに数字がある場合
                num = grid[row][col]
                # 一時的にそのセルを0にして
                grid[row][col] = 0
                # その位置にその数字を置けるかチェック
                if not is_valid(grid, row, col, num):
                    # 元に戻して
                    grid[row][col] = num
                    return False
                # 元に戻す
                grid[row][col] = num
    return True


def solve(grid):
    for row in range(9):
        for col in range(9):
            if grid[row][col] == 0:
                for num in range(1, 10):
                    if is_valid(grid, row, col, num):
                        grid[row][col] = num
                        if solve(grid):
                            return True
                        grid[row][col] = 0
                return False
    return True
