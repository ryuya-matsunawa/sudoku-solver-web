from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_solve_valid_puzzle():
    puzzle = {
        "puzzle": [
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
    }

    response = client.post("/api/solve", json=puzzle)
    assert response.status_code == 200
    result = response.json()
    assert "solution" in result
    assert isinstance(result["solution"], list)
    assert all(len(row) == 9 for row in result["solution"])
    assert all(isinstance(cell, int) for row in result["solution"] for cell in row)


def test_solve_invalid_puzzle():
    puzzle = {"puzzle": [[1] * 9] * 9}  # 無効なパズル（同じ数字が行に存在）

    response = client.post("/api/solve", json=puzzle)
    assert response.status_code == 400
    assert "detail" in response.json()
