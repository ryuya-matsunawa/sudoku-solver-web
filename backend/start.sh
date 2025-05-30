#!/usr/bin/env bash

# OCRエンジン Tesseract をインストール
apt-get update && apt-get install -y tesseract-ocr

# Poetry で依存インストール
poetry install
