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
    return <div>Loading...</div>;
  }

  return (
    <div className="preview-section">
      <h2 className="text-2xl font-semibold mb-4">Data Preview</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr>
              {dataset.headers.map((header) => (
                <th
                  key={header}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b"
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
                className={rowIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
              >
                {dataset.headers.map((header) => (
                  <td
                    key={`${rowIndex}-${header}`}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b"
                  >
                    {row[header]?.toString() || ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-2 text-sm text-gray-500">
          Showing first 5 rows of {dataset.metadata.rowCount} total rows
        </div>
      </div>
    </div>
  );
};

export default DataPreview;
