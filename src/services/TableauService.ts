import { FileRepository } from '@/infrastructure/repositories/FileRepository';
import { DataCleaningService } from '@/services/DataCleaningService';
import { TableauDataset, TableauRow } from '@/domain/entities/TableauData';
import { CleaningOperationType, CleaningRule } from '@/types';
import Papa from 'papaparse';

class TableauService {
  private fileRepo: FileRepository;
  private cleaningService: DataCleaningService;

  constructor() {
    this.fileRepo = new FileRepository();
    this.cleaningService = new DataCleaningService();
  }

  async parseFile(file: File): Promise<TableauDataset> {
    return this.fileRepo.parseFile(file);
  }

  async getCleaningRules(): Promise<CleaningRule[]> {
    try {
      const response = await fetch('/cleaning_rules_settings.json');
      
      if (!response.ok) {
        throw new Error(`Failed to load rules: ${response.status} ${response.statusText}`);
      }
  
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('Invalid content type - expected JSON');
      }
  
      const data = await response.json();
      
      if (!Array.isArray(data?.cleaningRules)) {
        throw new Error('Invalid format - cleaningRules must be an array');
      }
  
      const isCleaningOperation = (op: string): boolean => {
        return [
          'trim',
          'replace',
          'remove_nulls',
          'convert_type',
          'rename',
          'categorize',
          'handleMissingValues',
          'normalization'
        ].includes(op);
      };

      const rawRules = data.cleaningRules.map((rule: any) => ({
        ...rule,
        operation: isCleaningOperation(rule.operation) ? rule.operation : 'logging',
        enabled: rule.enabled ?? true
      }));
  
      return rawRules;
      
    } catch (error) {
      console.error('Error loading cleaning rules:', error);
      throw new Error(`Failed to load cleaning rules configuration. ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async cleanData(dataset: TableauDataset, rules: CleaningRule[]): Promise<TableauDataset> {
    try {
      return await this.cleaningService.cleanData(dataset, rules);
    } catch (error) {
      console.error('Error cleaning data:', error);
      throw error;
    }
  }

  async exportToCSV(dataset: TableauDataset): Promise<Blob> {
    const csvData = [
      dataset.headers,
      ...dataset.rows.map(row => 
        dataset.headers.map(header => row[header]?.toString() || '')
      )
    ];
    
    const csv = Papa.unparse(csvData);
    return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  }

  async exportToJSON(dataset: TableauDataset): Promise<Blob> {
    const jsonData = {
      headers: dataset.headers,
      rows: dataset.rows,
      metadata: dataset.metadata
    };
    
    return new Blob([JSON.stringify(jsonData, null, 2)], {
      type: 'application/json'
    });
  }

  async exportToTableau(dataset: TableauDataset): Promise<Blob> {
    const tdeData = {
      version: "1.0",
      dataset: {
        headers: dataset.headers,
        rows: dataset.rows,
        metadata: dataset.metadata
      }
    };
    
    return new Blob([JSON.stringify(tdeData, null, 2)], {
      type: 'application/vnd.tableau.extract'
    });
  }
}

export const tableauService = new TableauService();
