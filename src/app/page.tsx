'use client';
import { useState, useEffect } from 'react';
import { TableauDataset } from '@/domain/entities/TableauData';
import { CleaningRule, CleaningOperationType } from '@/types';
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
        console.log('Loaded rules:', rules);
        setCleaningRules(rules);
      } catch (err) {
        console.error('Failed loading rules:', err);
      }
    };

    loadCleaningRules();
  }, []);

  useEffect(() => {
    if (dataset && cleaningRules.length > 0) {
      console.log('Applying cleaning rules:', cleaningRules);
      const cleaned = applyCleaningRules(dataset, cleaningRules);
      console.log('Cleaning results:', cleaned);
      setCleanedDataset(cleaned);
    } else {
      setCleanedDataset(null); // Explicitly reset when conditions aren't met
    }
  }, [dataset, cleaningRules]);

useEffect(() => {
  console.log('Current dataset:', dataset);
  console.log('Cleaned dataset:', cleanedDataset);
}, [dataset, cleanedDataset]);


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
    <div className="min-h-screen bg-zinc-900 text-white-100">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-8">Tableau Data Cleaner</h1>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Upload Data</h2>
            <FileUpload onUpload={handleFileUpload} isProcessing={isProcessing} />
          </section>

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

          {dataset && cleaningRules.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-zinc-800 rounded-lg p-6 shadow-lg">
                <CleaningRulesConfig
                  rules={cleaningRules}
                  onRulesChange={handleRulesChange}
                />
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
                <div className="mt-4 space-x-4">
                  <Button
                    onClick={() => handleExport('csv')}
                    disabled={!cleanedDataset}
                    className={cn(
                      'bg-blue-500 hover:bg-blue-600',
                      !cleanedDataset && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    Export as CSV
                  </Button>
                  <Button
                    onClick={() => handleExport('json')}
                    disabled={!cleanedDataset}
                    className={cn(
                      'bg-green-500 hover:bg-green-600',
                      !cleanedDataset && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    Export as JSON
                  </Button>
                </div>
              </div>

              <div className="bg-zinc-800 rounded-lg p-6 shadow-lg">
                {(cleanedDataset || dataset) ? (
                  <DataPreview 
                    dataset={cleanedDataset || dataset} 
                    cleaningRules={cleaningRules} 
                  />
                ) : (
                  <div className="text-center text-muted-foreground">
                    Upload a file to see data preview
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
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
