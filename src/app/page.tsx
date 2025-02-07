'use client';
import { useState, useEffect } from 'react';
import { TableauDataset, CleaningRule, CleaningRules } from '@/domain/entities/TableauData';
import { tableauService } from '@/services/TableauService';
import { FileUpload } from '@/components/FileUpload';
import DataPreview from '@/components/DataPreview';
import { RulesList } from '@/components/RulesList';
import CleaningRulesConfig from '@/components/CleaningRulesConfig';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/utils';


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
    <div className="min-h-screen bg-zinc-900 text-white-100">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-8">Tableau Data Cleaner</h1>

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
            <div className="bg-zinc-800 rounded-lg p-6 shadow-lg">
              <CleaningRulesConfig
                rules={cleaningRules}
                onRulesChange={handleRulesChange}
              />
              <RulesList rules={rules} dataset={dataset} onAddRule={addRule} />
              <div className="mt-4 space-x-4">
                <Button
                  onClick={() => handleExport('csv')}
                  variant="secondary"
                  size="sm"
                  disabled={isProcessing || !dataset}
                >
                  Export CSV
                </Button>
                <Button
                  onClick={() => handleExport('json')}
                  variant="secondary"
                  size="sm"
                  disabled={isProcessing || !dataset}
                >
                  Export JSON
                </Button>
                <Button
                  onClick={() => handleExport('tableau')}
                  variant="secondary"
                  size="sm"
                  disabled={isProcessing || !dataset}
                >
                  Export Tableau
                </Button>
              </div>
            </div>
            <div className="bg-zinc-800 rounded-lg p-6 shadow-lg">
              <DataPreview dataset={dataset} cleaningRules={cleaningRules} />
            </div>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 w-full bg-zinc-800 border-t border-zinc-700 py-4">
  <div className="container mx-auto px-4 text-center">
    <a 
      href="https://github.com/iterating" 
      target="_blank" 
      rel="noopener noreferrer"
      className="text-zinc-300 hover:text-zinc-100 transition-colors text-sm mr-2"
    >
      Designed and Built by Jonathan Young (iterating)
    </a>
    <a 
      href="https://querybuilder.vercel.app/" 
      target="_blank" 
      rel="noopener noreferrer"
      className="text-zinc-300 hover:text-zinc-100 transition-colors text-sm"
    >
      Query Builder Sandbox App
    </a>
  </div>
</footer>
    </div>
  );
}
