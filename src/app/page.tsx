'use client';
import { useState, useEffect } from 'react';
import { TableauDataset, CleaningRule, CleaningRules } from '@/domain/entities/TableauData';
import { tableauService } from '@/services/TableauService';
import { FileUpload } from '@/components/FileUpload';
import DataPreview from '@/components/DataPreview';
import { RulesList } from '@/components/RulesList';
import CleaningRulesConfig from '@/components/CleaningRulesConfig';

export default function Home() {
  const [dataset, setDataset] = useState<TableauDataset | null>(null);
  const [rules, setRules] = useState<CleaningRule[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cleaningRules, setCleaningRules] = useState<CleaningRules | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadCleaningRules = async () => {
      try {
        const response = await fetch('/cleaning_rules_settings.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const rules = await response.json();
        setCleaningRules(rules);
        setError(null);
      } catch (err) {
        console.error('Error loading cleaning rules:', err);
        setError('Error loading cleaning rules configuration. Please try refreshing the page.');
        setCleaningRules(null);
      }
    };

    loadCleaningRules();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      setError(null);
      setSuccessMessage(null);
      const newDataset = await tableauService.parseFile(file);
      setDataset(newDataset);
      setSuccessMessage('File uploaded successfully');
    } catch (error) {
      console.error('Error processing file:', error);
      setError('Error processing file. Please ensure it is a valid CSV file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const addRule = (rule: CleaningRule) => {
    setRules((prevRules) => [...prevRules, rule]);
  };

  const handleRulesChange = (updatedRules: CleaningRules) => {
    setCleaningRules(updatedRules);
  };

  const handleExport = async (format: 'csv' | 'json' | 'tableau') => {
    if (!dataset) return;

    try {
      setIsProcessing(true);
      setError(null);
      setSuccessMessage(null);

      let blob: Blob;
      let fileName: string;

      switch (format) {
        case 'csv':
          blob = await tableauService.exportToCSV(dataset);
          fileName = 'cleaned_data.csv';
          break;
        case 'json':
          blob = await tableauService.exportToJSON(dataset);
          fileName = 'cleaned_data.json';
          break;
        case 'tableau':
          blob = await tableauService.exportToTableau(dataset);
          fileName = 'cleaned_data.tde';
          break;
        default:
          throw new Error('Unsupported format');
      }

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccessMessage(`Data exported successfully as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting data:', error);
      setError(`Error exporting data as ${format.toUpperCase()}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Tableau Data Cleaner</h1>

        <FileUpload onUpload={handleFileUpload} isProcessing={isProcessing} />

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {successMessage}
          </div>
        )}

        {dataset && cleaningRules && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <CleaningRulesConfig
                rules={cleaningRules}
                onRulesChange={handleRulesChange}
              />
              <RulesList rules={rules} onAddRule={addRule} />
              <div className="mt-4 space-x-4">
                <button
                  onClick={() => handleExport('csv')}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  disabled={isProcessing}
                >
                  Export CSV
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  disabled={isProcessing}
                >
                  Export JSON
                </button>
                <button
                  onClick={() => handleExport('tableau')}
                  className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
                  disabled={isProcessing}
                >
                  Export Tableau
                </button>
              </div>
            </div>
            <div>
              <DataPreview dataset={dataset} cleaningRules={cleaningRules} />
            </div>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 w-full bg-gray-100 border-t border-gray-200 py-4">
        <div className="container mx-auto px-4 text-center">
          <a 
            href="https://github.com/iterating" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            GitHub: @iterating
          </a>
        </div>
      </footer>
    </div>
  );
}
