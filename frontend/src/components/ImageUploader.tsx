'use client';

import React, { useState, useRef } from 'react';

type Props = {
  onPuzzleExtracted: (grid: number[][]) => void;
  setError: (error: string | null) => void;
};

export default function ImageUploader({ onPuzzleExtracted, setError }: Props) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // プレビュー用のURLを生成
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!fileInputRef.current?.files?.length) {
      setError('画像ファイルを選択してください');
      return;
    }

    const file = fileInputRef.current.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      setError(null);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/extract-sudoku`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '画像の処理中にエラーが発生しました');
      }

      const data = await response.json();

      if (data.puzzle) {
        onPuzzleExtracted(data.puzzle);
      } else {
        throw new Error('数独パズルを抽出できませんでした');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(`画像処理エラー: ${err.message}`);
      } else {
        setError('予期しないエラーが発生しました');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleClearFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setPreviewUrl(null);
  };

  return (
    <div className="w-full max-w-md p-4 bg-white rounded-lg shadow mb-6">
      <h2 className="text-lg font-medium mb-3 text-gray-900">画像から数独を読み込む</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          数独の画像をアップロード
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
        />
      </div>

      {previewUrl && (
        <div className="mb-4">
          <div className="relative">
            <img
              src={previewUrl}
              alt="数独画像プレビュー"
              className="w-full h-auto rounded border border-gray-200"
            />
            <button
              onClick={handleClearFile}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              title="画像を削除"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleUpload}
          disabled={uploading}
          className={`
            px-4 py-2 rounded text-white
            ${uploading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}
          `}
        >
          {uploading ? '処理中...' : '画像から読み取る'}
        </button>
      </div>

      <p className="mt-3 text-sm text-gray-600 italic">
        読み込みが正しくない場合はセルを選択して正しい数字を入力してください
      </p>
    </div>
  );
}
