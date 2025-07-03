from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Tuple
import time

app = FastAPI()

origins = ["https://sudoku-solver.xyz", "http://localhost:3000"]

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

    candidates_map = get_candidates_map(puzzle)
    if candidates_map is None:
        raise HTTPException(
            status_code=400,
            detail="パズルが数独のルールに違反しています。",
        )

    if solve_with_candidates(puzzle, candidates_map):
        execution_time = time.time() - start_time
        return {"solution": puzzle, "execution_time_seconds": execution_time}
    else:
        raise HTTPException(
            status_code=400,
            detail="解答が見つかりませんでした。このパズルは解けません。",
        )


def is_valid(grid, row, col, num):
    """
    指定されたセルに数字を配置できるかどうかをチェック

    Args:
        grid: 9x9の数独グリッド
        row: 行番号 (0-8)
        col: 列番号 (0-8)
        num: 配置する数字 (1-9)

    Returns:
        bool: 配置可能ならTrue、そうでなければFalse
    """
    if num in grid[row]:
        return False
    if num in [grid[r][col] for r in range(9)]:
        return False
    start_row, start_col = 3 * (row // 3), 3 * (col // 3)
    return all(
        grid[start_row + i][start_col + j] != num
        for i in range(3) for j in range(3)
    )


def get_candidates(grid, row, col):
    """
    指定されたセルに配置可能な数字の候補を取得

    Args:
        grid: 9x9の数独グリッド
        row: 行番号 (0-8)
        col: 列番号 (0-8)

    Returns:
        List[int]: 配置可能な数字のリスト (1-9)
    """
    if grid[row][col] != 0:
        return []

    candidates = set(range(1, 10))
    candidates -= set(grid[row])
    candidates -= {grid[r][col] for r in range(9)}
    start_row, start_col = 3 * (row // 3), 3 * (col // 3)
    for i in range(3):
        for j in range(3):
            candidates.discard(grid[start_row + i][start_col + j])
    return list(candidates)


def get_candidates_map(grid: List[List[int]]) -> Dict[Tuple[int, int], List[int]] | None:
    """
    グリッドの各セルに対して候補数字を取得するマップを作成

    Args:
        grid: 9x9の数独グリッド

    Returns:
        各セルの座標をキー、候補数字のリストを値とする辞書
        もし無効な数独パズルであればNoneを返す
    """
    candidates_map = {}
    for row in range(9):
        for col in range(9):
            num = grid[row][col]
            if num != 0:
                grid[row][col] = 0
                if not is_valid(grid, row, col, num):
                    return None
                grid[row][col] = num
            else:
                candidates = get_candidates(grid, row, col)
                candidates_map[(row, col)] = candidates
    return candidates_map


def solve_with_candidates(
    grid: List[List[int]],
    candidates_map: Dict[Tuple[int, int], List[int]]
) -> bool:
    """
    数独パズルを解くための再帰的なバックトラッキングアルゴリズム

    Args:
        grid: 9x9の数独グリッド
        candidates_map: 各セルの候補数字を含む辞書

    Returns:
        bool: 解答が見つかった場合はTrue、そうでなければFalse
    """
    if not candidates_map:
        return True  # 全てのセルが埋まった

    # 候補が最も少ないセルを優先
    cell = min(candidates_map, key=lambda k: len(candidates_map[k]))
    row, col = cell

    for num in candidates_map[cell]:
        grid[row][col] = num

        # 残りの候補マップを更新
        new_candidates_map = {}
        for (r, c), candidates in candidates_map.items():
            if (r, c) == cell:
                continue
            if grid[r][c] == 0:
                new_list = [n for n in candidates if is_valid(grid, r, c, n)]
                if not new_list:
                    break  # 候補がなくなったのでこの分岐は失敗
                new_candidates_map[(r, c)] = new_list
        else:
            if solve_with_candidates(grid, new_candidates_map):
                return True

        grid[row][col] = 0  # 戻す

    return False
