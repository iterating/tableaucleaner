'use client';
import React from 'react';

export interface FileUploadProps {
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  isProcessing: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onUpload, isProcessing }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center space-x-4">
        <input
          type="file"
          accept=".csv"
          onChange={onUpload}
          disabled={isProcessing}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-violet-50 file:text-violet-700
            hover:file:bg-violet-100
            disabled:opacity-50"
        />
        {isProcessing && (
          <div className="text-sm text-gray-500">
            Processing...
          </div>
        )}
      </div>
    </div>
  );
};
