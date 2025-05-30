import difflib
from fastapi import FastAPI, HTTPException, File, UploadFile
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import cv2
import numpy as np
import pytesseract
from PIL import Image
import logging
import os
import time

# ロギングの設定
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(
            os.path.join(os.path.dirname(__file__), "sudoku_extractor.log")
        ),
    ],
)
logger = logging.getLogger("sudoku-extractor")

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


@app.post("/api/extract-sudoku")
async def extract_sudoku_from_image(file: UploadFile = File(...)):
    """
    数独の画像から9x9のグリッドを抽出するエンドポイント
    """
    start_time = time.time()
    logger.info(f"数独画像抽出処理開始: ファイル名={file.filename}")

    try:
        # 画像の読み込み
        logger.info("ステップ1: 画像の読み込み開始")
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            logger.error("画像の読み込みに失敗しました")
            raise HTTPException(status_code=400, detail="画像の読み込みに失敗しました")

        # グレースケールに変換
        logger.info("ステップ2: グレースケール変換")
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # ぼかしを適用してノイズを減らす
        logger.info("ステップ3: ガウスぼかし適用")
        blur = cv2.GaussianBlur(gray, (5, 5), 0)

        # 適応的閾値処理を適用して2値化
        logger.info("ステップ4: 適応的閾値処理で2値化")
        thresh = cv2.adaptiveThreshold(
            blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 11, 2
        )

        # 輪郭を検出
        logger.info("ステップ5: 輪郭検出")
        contours, _ = cv2.findContours(
            thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
        )

        # 輪郭を描画した画像を作成
        logger.info("ステップ6: 検出した輪郭を可視化")
        contour_img = img.copy()
        cv2.drawContours(contour_img, contours, -1, (0, 255, 0), 3)

        # 最大の輪郭を見つける（数独グリッド全体）
        logger.info("ステップ7: 最大輪郭の検索（数独グリッド全体）")
        max_area = 0
        biggest_contour = None

        for contour in contours:
            area = cv2.contourArea(contour)
            if area > max_area:
                max_area = area
                biggest_contour = contour

        # 最大輪郭を描画
        max_contour_img = img.copy()
        cv2.drawContours(max_contour_img, [biggest_contour], 0, (0, 0, 255), 3)

        if biggest_contour is None:
            logger.error("数独グリッドを検出できませんでした")
            raise HTTPException(
                status_code=400, detail="数独グリッドを検出できませんでした"
            )

        # 近似多角形を取得
        peri = cv2.arcLength(biggest_contour, True)
        approx = cv2.approxPolyDP(biggest_contour, 0.02 * peri, True)

        # 4つの頂点が見つからない場合はエラー
        if len(approx) != 4:
            raise HTTPException(
                status_code=400,
                detail=f"数独グリッドの4つの角を正しく検出できませんでした（検出された頂点数: {len(approx)}）",
            )

        # 角点を可視化
        corner_img = img.copy()
        for point in approx:
            cv2.circle(corner_img, tuple(point[0]), 10, (255, 0, 0), -1)

        # 頂点を並び替え（左上、右上、右下、左下）
        pts = np.float32([approx[0][0], approx[1][0], approx[2][0], approx[3][0]])
        sum_pts = pts.sum(axis=1)
        pts_ordered = np.zeros((4, 2), dtype=np.float32)

        pts_ordered[0] = pts[np.argmin(sum_pts)]  # 左上
        pts_ordered[2] = pts[np.argmax(sum_pts)]  # 右下

        diff_pts = np.diff(pts, axis=1)
        pts_ordered[1] = pts[np.argmin(diff_pts)]  # 右上
        pts_ordered[3] = pts[np.argmax(diff_pts)]  # 左下

        # パースペクティブ変換のための目標点
        width = height = 450  # 出力画像のサイズ
        dst_pts = np.float32([[0, 0], [width, 0], [width, height], [0, height]])

        # パースペクティブ変換行列を計算
        matrix = cv2.getPerspectiveTransform(pts_ordered, dst_pts)
        # 変換を適用
        warped = cv2.warpPerspective(gray, matrix, (width, height))

        # グリッドのサイズを取得
        warped_height, warped_width = warped.shape[:2]

        # セルサイズを計算
        cell_width = warped_width // 9
        cell_height = warped_height // 9

        # 数独グリッドを格納する2次元配列
        sudoku_grid = [[0 for _ in range(9)] for _ in range(9)]

        white_cnt = 0

        # 各セルを処理
        for i in range(9):
            for j in range(9):
                cell_x = j * cell_width
                cell_y = i * cell_height
                cell = warped[
                    cell_y : cell_y + cell_height, cell_x : cell_x + cell_width
                ]

                # パディングの相対値による調整
                padding_ratio = 0.1
                padding_x = int(cell_width * padding_ratio)
                padding_y = int(cell_height * padding_ratio)

                cell = cell[
                    max(0, padding_y) : max(0, cell_height - padding_y),
                    max(0, padding_x) : max(0, cell_width - padding_x),
                ]
                # cell = cv2.convertScaleAbs(cell, alpha=1.5, beta=30)

                # しきい値処理を改善（OTSUアルゴリズム）
                _, cell_thresh = cv2.threshold(
                    cell, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU
                )

                # ノイズを除去するためのモルフォロジー演算
                kernel = np.ones((2, 2), np.uint8)
                cell_thresh = cv2.morphologyEx(cell_thresh, cv2.MORPH_OPEN, kernel)

                # リサイズ前に余白を追加する（OCR精度向上のため）
                padding_before_resize = 8  # リサイズ前の余白サイズ
                cell_thresh_padded = cv2.copyMakeBorder(
                    cell_thresh,
                    padding_before_resize,
                    padding_before_resize,
                    padding_before_resize,
                    padding_before_resize,
                    cv2.BORDER_CONSTANT,
                    value=0,  # 黒色
                )

                # リサイズして画像を大きくする（OCR精度向上のため）
                cell_thresh_resized = cv2.resize(
                    cell_thresh_padded,
                    (0, 0),
                    fx=1.5,
                    fy=1.5,
                    interpolation=cv2.INTER_CUBIC,
                )

                # リサイズ後にさらに余白を追加
                padding_after_resize = 12  # リサイズ後の余白サイズ
                cell_thresh_resized = cv2.copyMakeBorder(
                    cell_thresh_resized,
                    padding_after_resize,
                    padding_after_resize,
                    padding_after_resize,
                    padding_after_resize,
                    cv2.BORDER_CONSTANT,
                    value=0,  # 黒色
                )

                # 白ピクセルの割合を計算
                white_pixel_count = cv2.countNonZero(cell_thresh_resized)
                total_pixels = (
                    cell_thresh_resized.shape[0] * cell_thresh_resized.shape[1]
                )
                white_pixel_ratio = white_pixel_count / total_pixels

                # 空のセルはスキップ（白ピクセルの割合が少ない場合は空と見なす）
                if white_pixel_ratio < 0.01:
                    sudoku_grid[i][j] = 0
                    continue

                # セルを少しだけ膨張させて数字を太くする（OCR精度向上のため）
                dilation_kernel = np.ones((2, 2), np.uint8)
                cell_thresh_dilated = cv2.dilate(
                    cell_thresh_resized, dilation_kernel, iterations=1
                )

                # テキスト認識のための前処理
                ocr_ready = prepare_ocr_image(
                    cell_thresh_dilated, target_size=(100, 100), scale=1.5
                )
                cell_pil = Image.fromarray(ocr_ready)

                # OCRを適用（設定を最適化）
                try:
                    # psm=10: 1文字のみ認識、oem=3: LSTMニューラルネットワーク
                    result = pytesseract.image_to_string(
                        cell_pil,
                        config="--psm 10 --oem 3 -c tessedit_char_whitelist=123456789",
                    )

                    # 結果をクリーンアップ
                    result = result.strip()

                    if not result:
                        # OCR結果が空の場合、画像を強調して再OCR
                        enhanced = cv2.convertScaleAbs(ocr_ready, alpha=1.8, beta=30)
                        enhanced = cv2.GaussianBlur(
                            enhanced, (3, 3), 0
                        )  # 軽くノイズ除去
                        enhanced_pil = Image.fromarray(enhanced)

                        # 再OCR psm=13: 数字の行認識、oem=3: LSTMニューラルネットワーク
                        result = pytesseract.image_to_string(
                            enhanced_pil,
                            config="--psm 10 --oem 3 -c tessedit_char_whitelist=123456789",
                        ).strip()

                    if result:
                        # closest_digit関数を使用して最も近い数字を取得
                        recognized_digit = closest_digit(result[0])
                        sudoku_grid[i][j] = recognized_digit
                    else:
                        sudoku_grid[i][j] = 0
                except Exception as e:
                    sudoku_grid[i][j] = 0

        logger.info(f"空のセル数: {white_cnt} / 81")
        # 最終的な認識結果の視覚化
        final_grid = np.zeros((450, 450, 3), dtype=np.uint8)
        final_grid.fill(255)  # 白い背景

        # グリッド線を描画
        for i in range(10):
            line_thickness = 3 if i % 3 == 0 else 1
            # 横線
            cv2.line(final_grid, (0, i * 50), (450, i * 50), (0, 0, 0), line_thickness)
            # 縦線
            cv2.line(final_grid, (i * 50, 0), (i * 50, 450), (0, 0, 0), line_thickness)

        # 認識した数字を描画
        font = cv2.FONT_HERSHEY_SIMPLEX
        for i in range(9):
            for j in range(9):
                if sudoku_grid[i][j] != 0:
                    cv2.putText(
                        final_grid,
                        str(sudoku_grid[i][j]),
                        (j * 50 + 15, i * 50 + 35),
                        font,
                        1.5,
                        (0, 0, 0),
                        2,
                    )

        # 結果を返す
        result = {"puzzle": sudoku_grid}

        # 処理時間をログに記録
        process_time = time.time() - start_time
        logger.info(f"数独画像抽出処理完了: 処理時間={process_time:.2f}秒")

        return result

    except Exception as e:
        logger.error(f"画像処理中にエラーが発生しました: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"画像処理中にエラーが発生しました: {str(e)}"
        )


def closest_digit(text: str) -> int:
    """
    文字列を入力として受け取り、最も近い数字（1-9）を返します
    """
    digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9"]
    matches = difflib.get_close_matches(text, digits, n=1, cutoff=0.0)
    return int(matches[0]) if matches else 0


# OCR用前処理：リサイズ＋中央寄せ＋パディング付きのキャンバスに配置
def prepare_ocr_image(image, target_size=(100, 100), scale=3.0):
    # リサイズ（拡大）
    resized = cv2.resize(
        image, (0, 0), fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC
    )

    # 中央寄せキャンバス作成
    h, w = resized.shape[:2]
    canvas = np.zeros(target_size, dtype=np.uint8)
    y_offset = (target_size[0] - h) // 2
    x_offset = (target_size[1] - w) // 2

    # はみ出さないように調整（小さい画像用）
    if y_offset < 0 or x_offset < 0:
        resized = cv2.resize(resized, target_size, interpolation=cv2.INTER_AREA)
        return resized

    canvas[y_offset : y_offset + h, x_offset : x_offset + w] = resized
    return canvas
