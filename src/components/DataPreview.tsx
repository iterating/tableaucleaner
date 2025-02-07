'use client';
import React, { useState, useEffect } from 'react';
import { TableauDataset, CleaningRules } from '@/domain/entities/TableauData';

interface DataPreviewProps {
  dataset: TableauDataset;
  cleaningRules: CleaningRules | null;
}

const DataPreview: React.FC<DataPreviewProps> = ({ dataset, cleaningRules }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, [dataset, cleaningRules]);

  if (isLoading) {
    return <div className="text-white-100">Loading...</div>;
  }

  return (
    <div className="bg-muted/50 rounded-lg p-4 border">
      <h2 className="text-base font-medium mb-3">
      <span className="w-2 h-6 bg-blue-500 rounded mr-2"></span>
      Data Preview</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-background border">
          <thead>
            <tr>
              {dataset.headers.map((header) => (
                <th
                  key={header}
                  className="px-4 py-2 text-left text-sm font-medium text-muted-foreground border-b"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataset.rows.slice(0, 5).map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="hover:bg-muted/20 border-b"
              >
                {dataset.headers.map((header) => (
                  <td
                    key={`${rowIndex}-${header}`}
                    className="px-4 py-2 text-sm whitespace-nowrap"
                  >
                    {row[header]?.toString() || ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-2 text-sm text-muted-foreground">
          Showing first 5 rows of {dataset.metadata.rowCount} total rows
        </div>
      </div>
    </div>
  )
}
export default DataPreview;
