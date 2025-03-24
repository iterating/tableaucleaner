'use client';
import { useState, useEffect } from 'react';
import { TableauDataset, CleaningRule, CleaningOperationType } from '@/types';
import { tableauService } from '@/services/TableauService';
import { DataCleaningService } from '@/services/DataCleaningService';
import { FileUpload } from '@/components/FileUpload';
import DataPreview from '@/components/DataPreview';
import CleaningRulesConfig from '@/components/CleaningRulesConfig';
import { RulesList } from '@/components/RulesList';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/utils';
import { applyCleaningRules } from '@/utils/cleaningRules';

export default function Home() {
  const [dataset, setDataset] = useState<TableauDataset | null>(null);
  const [cleaningRules, setCleaningRules] = useState<CleaningRule[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [cleanedDataset, setCleanedDataset] = useState<TableauDataset | null>(null);
  const cleaningService = new DataCleaningService();

  useEffect(() => {
    const loadCleaningRules = async () => {
      try {
        const rules = await tableauService.getCleaningRules();
        setCleaningRules(rules);
        setError(null);
      } catch (err) {
        console.error('Error loading cleaning rules:', err);
        setError('Error loading cleaning rules configuration. Please try refreshing the page.');
        setCleaningRules([]);
      }
    };

    loadCleaningRules();
  }, []);

  useEffect(() => {
    if (dataset && cleaningRules.length > 0) {
      const cleaned = applyCleaningRules(dataset, cleaningRules);
      setCleanedDataset(cleaned);
    }
  }, [dataset, cleaningRules]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      const newDataset = await tableauService.parseFile(file);
      setDataset(newDataset);
      setError(null);
      setSuccessMessage('File uploaded successfully!');
    } catch (err) {
      console.error('Error processing file:', err);
      setError('Error processing file. Please check the file format and try again.');
      setDataset(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    if (!cleanedDataset) return;

    try {
      const blob = await cleaningService.exportData(cleanedDataset, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cleaned_data.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setSuccessMessage(`Data exported successfully as ${format.toUpperCase()}!`);
    } catch (err) {
      console.error('Error exporting data:', err);
      setError(`Error exporting data as ${format.toUpperCase()}. Please try again.`);
    }
  };

  const addRule = (rule: CleaningRule) => {
    setCleaningRules((prevRules) => [...prevRules, rule]);
  };

  const handleRulesChange = (updatedRules: CleaningRule[]) => {
    setCleaningRules(updatedRules);
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white-100 pb-16">
      <header className="bg-zinc-800 border-b border-zinc-700 py-6 mb-8 shadow-md">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Tableau Data Cleaner
          </h1>
          <p className="text-zinc-400 mt-2">Upload, clean, and export your Tableau data files with ease</p>
        </div>
      </header>

      <main className="container mx-auto px-4 max-w-7xl">
        <section className="bg-zinc-800 rounded-lg p-6 shadow-lg mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Upload Data
          </h2>
          <FileUpload onUpload={handleFileUpload} isProcessing={isProcessing} />
        </section>

        {error && (
          <div className="bg-red-900/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-md mb-6 shadow-sm backdrop-blur-sm">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-900/20 border border-green-500/50 text-green-200 px-4 py-3 rounded-md mb-6 shadow-sm backdrop-blur-sm">
            {successMessage}
          </div>
        )}

        {dataset && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-1">
              <div className="bg-zinc-800 rounded-lg shadow-lg h-full flex flex-col">
                <div className="border-b border-zinc-700 p-4">
                  <h2 className="text-xl font-semibold">
                    Cleaning Rules
                  </h2>
                </div>
                
                <div className="p-4 flex-grow overflow-auto">
                  <RulesList 
                    rules={cleaningRules} 
                    dataset={dataset} 
                    onAddRule={(rule: CleaningRule) => {
                      const newRule = {
                        ...rule,
                        type: rule.operation as CleaningOperationType,
                        enabled: true
                      };
                      addRule(newRule);
                    }} 
                  />
                </div>
                
                <div className="border-t border-zinc-700 p-4">
                  <CleaningRulesConfig
                    rules={cleaningRules}
                    onRulesChange={handleRulesChange}
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-zinc-800 rounded-lg shadow-lg h-full flex flex-col">
                <div className="border-b border-zinc-700 p-4">
                  <h2 className="text-xl font-semibold">
                    Data Preview
                  </h2>
                </div>
                
                <div className="p-4 flex-grow overflow-auto">
                  <DataPreview 
                    dataset={cleanedDataset || dataset} 
                    cleaningRules={cleaningRules} 
                  />
                </div>
                
                <div className="border-t border-zinc-700 p-4 flex flex-wrap gap-3">
                  <Button
                    onClick={() => handleExport('csv')}
                    disabled={!cleanedDataset}
                    className={cn(
                      'bg-blue-600 hover:bg-blue-700 transition-colors',
                      !cleanedDataset && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    Export as CSV
                  </Button>
                  <Button
                    onClick={() => handleExport('json')}
                    disabled={!cleanedDataset}
                    className={cn(
                      'bg-green-600 hover:bg-green-700 transition-colors',
                      !cleanedDataset && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    Export as JSON
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 w-full bg-zinc-800 border-t border-zinc-700 py-3 shadow-lg z-10">
        <div className="container mx-auto px-4 text-center">
          <a 
            href="https://github.com/iterating" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-zinc-400 hover:text-zinc-100 transition-colors text-sm mr-2"
          >
            Designed and Built by Jonathan Young (iterating)
          </a>
          <a 
            href="https://querybuilder.vercel.app/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-zinc-400 hover:text-zinc-100 transition-colors text-sm"
          >
            | Query Builder Sandbox App
          </a>
        </div>
      </footer>
    </div>
  );
}
