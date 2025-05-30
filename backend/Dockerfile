# ベースイメージ（軽量でPython 3.11入り）
FROM python:3.11-slim

# 必要なLinuxパッケージをインストール
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    gcc \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Poetryのインストール（公式推奨の方法）
ENV POETRY_VERSION=1.8.2
RUN pip install "poetry==$POETRY_VERSION"

# 作業ディレクトリ作成
WORKDIR /app

# Poetry設定ファイルを先にコピーして依存解決を早める
COPY pyproject.toml poetry.lock ./
RUN poetry config virtualenvs.create false && \
    poetry install --no-interaction --no-ansi

# アプリケーションコードをコピー
COPY . .

# 本番環境ではreloadを外す。開発用には "--reload" を追加してもOK
CMD ["poetry", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "10000"]
