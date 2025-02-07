'use client';
import React from 'react';

export interface FileUploadProps {
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  isProcessing: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onUpload, isProcessing }) => {
  return (
    <div className="bg-muted/50 p-4 rounded-lg border space-y-3">
      <input
        type="file"
        accept=".csv"
        onChange={onUpload}
        disabled={isProcessing}
        className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      />

      {isProcessing && (
        <div className="text-sm text-white-400">
          Processing...
        </div>
      )}
    </div>
  );
};
