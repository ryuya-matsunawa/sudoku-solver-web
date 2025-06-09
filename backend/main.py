from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, conlist
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import time

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
    """
    数独パズルを表現するモデルクラス

    Attributes:
        puzzle: 9x9の数独グリッドを表す二次元配列。0は空白のセルを表す
    """

    puzzle: List[List[int]]


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/solve")
def solve_sudoku(data: SudokuPuzzle):
    """
    数独パズルを解く処理を実行するAPIエンドポイント

    Args:
        data: 解くべき数独パズルのデータ

    Returns:
        解答が見つかった場合は解答と処理時間を含むオブジェクト

    Raises:
        HTTPException: パズルが無効である場合や解答が存在しない場合に発生
    """
    start_time = time.time()
    puzzle = [row[:] for row in data.puzzle]

    if not is_valid_puzzle(puzzle):
        raise HTTPException(
            status_code=400,
            detail="パズルが数独のルールに違反しています。",
        )

    if solve(puzzle):
        execution_time = time.time() - start_time
        return {"solution": puzzle, "execution_time_seconds": execution_time}
    else:
        raise HTTPException(
            status_code=400,
            detail="解答が見つかりませんでした。このパズルは解けません。",
        )


def is_valid_puzzle(grid):
    """
    数独の盤面が有効かどうかをチェックする関数
    数独のルールに従い、各行、列、3x3のブロックに同じ数字が存在しないかを確認します。

    Args:
        grid: 数独の盤面を表す9x9のグリッド

    Returns:
        bool: 盤面が有効な場合はTrue、無効な場合はFalse
    """
    for row in range(9):
        for col in range(9):
            num = grid[row][col]
            if num != 0:
                grid[row][col] = 0  # 一時的に除外してチェック
                if not is_valid(grid, row, col, num):
                    return False
                grid[row][col] = num
    return True


def is_valid(grid, row, col, num):
    """
    数独のルールに従って、特定のセルに数字を配置できるかどうかをチェックする関数

    Args:
        grid: 数独の盤面を表す9x9のグリッド
        row: 行のインデックス（0-8）
        col: 列のインデックス（0-8）
        num: 配置を試みる数字（1-9）

    Returns:
        bool: 数字の配置が妥当な場合はTrue、そうでない場合はFalse
    """
    # 行のチェック
    if num in grid[row]:
        return False

    # 列のチェック
    if num in [grid[i][col] for i in range(9)]:
        return False

    # 3x3のブロックのチェック
    start_row, start_col = 3 * (row // 3), 3 * (col // 3)
    return all(
        grid[start_row + i][start_col + j] != num for i in range(3) for j in range(3)
    )


def solve(grid):
    """
    バックトラッキングアルゴリズムを使用して数独パズルを解く再帰関数

    空白のセル（値が0）に1から9までの数字を試し、
    そのセルに配置可能な数字を見つけたら、次のセルに進みます。
    全てのセルが埋まったら成功、解が存在しない場合は失敗を返します。

    Args:
        grid: 数独の盤面を表す9x9のグリッド

    Returns:
        bool: 解が見つかった場合はTrue、見つからなかった場合はFalse
    """
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
