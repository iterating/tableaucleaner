'use client';
import React, { useState, useEffect } from 'react';
import { TableauDataset } from '@/domain/entities/TableauData';
import { CleaningRule } from '@/types';
import { ChevronLeft, ChevronRight, Filter, Database, LayoutGrid, Info } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/utils/utils';

interface DataPreviewProps {
  dataset: TableauDataset;
  cleaningRules: CleaningRule[] | null;
}

const DataPreview: React.FC<DataPreviewProps> = ({ dataset, cleaningRules }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);
  const [showDataTypes, setShowDataTypes] = useState(false);
  const rowsPerPage = 10;
  
  // Calculate total pages
  const totalPages = Math.ceil(dataset.rows.length / rowsPerPage);
  
  // Handle sorting
  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    
    setSortConfig({ key, direction });
  };
  
  // Get sorted and paginated data
  const getSortedRows = () => {
    let sortableRows = [...dataset.rows];
    
    if (sortConfig !== null) {
      sortableRows.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue === null || aValue === undefined) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (bValue === null || bValue === undefined) return sortConfig.direction === 'ascending' ? 1 : -1;
        
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    
    // Get current page rows
    const startIndex = (currentPage - 1) * rowsPerPage;
    return sortableRows.slice(startIndex, startIndex + rowsPerPage);
  };

  // Detect data types in columns
  const getDataTypeInfo = () => {
    const dataTypes: Record<string, { type: string; icon: React.ReactNode }> = {};
    
    dataset.headers.forEach(header => {
      // Sample a few rows to determine data type
      const sampleSize = Math.min(10, dataset.rows.length);
      const samples = dataset.rows.slice(0, sampleSize).map(row => row[header]);
      
      // Determine most likely data type
      let type = 'text';
      let icon = <span className="text-zinc-400">Aa</span>;
      
      const nonNullSamples = samples.filter(s => s !== null && s !== undefined && s !== '');
      
      if (nonNullSamples.length > 0) {
        // Check if all samples are numbers
        if (nonNullSamples.every(s => !isNaN(Number(s)))) {
          type = 'number';
          icon = <span className="text-blue-400">#</span>;
        }
        // Check if all samples look like dates
        else if (nonNullSamples.every(s => !isNaN(Date.parse(String(s))))) {
          type = 'date';
          icon = <span className="text-green-400">📅</span>;
        }
        // Check if all samples are boolean
        else if (nonNullSamples.every(s => ['true', 'false', '0', '1'].includes(String(s).toLowerCase()))) {
          type = 'boolean';
          icon = <span className="text-purple-400">□</span>;
        }
      }
      
      dataTypes[header] = { type, icon };
    });
    
    return dataTypes;
  };

  useEffect(() => {
    setIsLoading(false);
    // Reset to first page when dataset changes
    setCurrentPage(1);
  }, [dataset, cleaningRules]);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Handle empty dataset case
  if (dataset.rows.length === 0) {
    return (
      <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-8">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <Database className="h-12 w-12 text-zinc-600" />
          <h3 className="text-xl font-semibold text-zinc-300">No Data Available</h3>
          <p className="text-zinc-500 max-w-md">
            There are no rows in the current dataset. Upload a file or add data to see the preview.
          </p>
        </div>
      </div>
    );
  }

  const sortedRows = getSortedRows();
  const dataTypes = getDataTypeInfo();

  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-700 overflow-hidden">
      <div className="bg-zinc-800 border-b border-zinc-700 p-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-1 bg-blue-500 rounded-r"></div>
          <h2 className="text-lg font-semibold text-zinc-200">Data Preview</h2>
          <div className="flex items-center">
            <span className="text-xs px-2 py-1 rounded-full bg-zinc-700 text-zinc-300">
              {dataset.headers.length} columns
            </span>
            <span className="text-xs ml-2 px-2 py-1 rounded-full bg-zinc-700 text-zinc-300">
              {dataset.rows.length} rows
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setShowDataTypes(!showDataTypes)}
            variant="outline"
            size="sm"
            className={cn(
              "h-8 px-2 border-zinc-600 text-zinc-300 hover:bg-zinc-700",
              showDataTypes ? "bg-zinc-700 text-blue-300" : "bg-zinc-800"
            )}
          >
            <Info className="h-4 w-4 mr-1" />
            Data Types
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto" style={{ scrollBehavior: 'smooth' }}>
        <table className="w-full border-collapse">
          <thead className="bg-zinc-800 sticky top-0 z-10">
            <tr>
              {dataset.headers.map((header) => (
                <th
                  key={header}
                  onClick={() => requestSort(header)}
                  className="px-4 py-3 text-left text-sm font-semibold text-zinc-200 border-b border-zinc-700 cursor-pointer hover:bg-zinc-700 transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>{header}</span>
                    {sortConfig?.key === header && (
                      <span className="text-blue-400 ml-1">
                        {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                  {showDataTypes && (
                    <div className="mt-1 text-xs text-zinc-400 flex items-center">
                      {dataTypes[header]?.icon}
                      <span className="ml-1 capitalize">{dataTypes[header]?.type}</span>
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors"
              >
                {dataset.headers.map((header) => {
                  // Determine if this cell might have been affected by a cleaning rule
                  const isModified = cleaningRules?.some(rule => 
                    rule.enabled && rule.field === header
                  );
                  
                  const value = row[header];
                  let formattedValue = value?.toString() || '';
                  
                  // Apply special formatting based on data type
                  if (dataTypes[header]?.type === 'date' && value) {
                    try {
                      const date = new Date(value.toString());
                      if (!isNaN(date.getTime())) {
                        formattedValue = date.toLocaleDateString();
                      }
                    } catch (e) {
                      // Keep original formatting if date parsing fails
                    }
                  }
                  
                  return (
                    <td
                      key={`${rowIndex}-${header}`}
                      className={cn(
                        "px-4 py-3 text-sm transition-colors",
                        isModified ? "text-blue-300 font-medium" : "text-zinc-300",
                        dataTypes[header]?.type === 'number' && "font-mono tabular-nums",
                        !value && "text-zinc-500 italic"
                      )}
                    >
                      {formattedValue || 'null'}
                    </td>
                  );
                })}
              </tr>
            ))}
            
            {/* Empty rows for consistency when less than rowsPerPage */}
            {sortedRows.length < rowsPerPage && Array(rowsPerPage - sortedRows.length).fill(0).map((_, idx) => (
              <tr key={`empty-${idx}`} className="h-[43px]">
                {dataset.headers.map((header, colIdx) => (
                  <td key={`empty-${idx}-${colIdx}`} className="px-4 py-3 border-b border-zinc-800"></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-zinc-800 border-t border-zinc-700 p-3 flex items-center justify-between">
        <div className="text-sm text-zinc-400">
          {dataset.rows.length > 0 
            ? `Showing ${(currentPage - 1) * rowsPerPage + 1} to ${Math.min(currentPage * rowsPerPage, dataset.rows.length)} of ${dataset.rows.length} rows` 
            : 'No data available'}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            onClick={handlePrevPage} 
            disabled={currentPage === 1}
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 bg-zinc-700 border-zinc-600 text-zinc-200 hover:bg-zinc-600 disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="text-sm font-medium text-zinc-300">
            Page {currentPage} of {totalPages || 1}
          </div>
          
          <Button 
            onClick={handleNextPage} 
            disabled={currentPage >= totalPages}
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 bg-zinc-700 border-zinc-600 text-zinc-200 hover:bg-zinc-600 disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DataPreview;
