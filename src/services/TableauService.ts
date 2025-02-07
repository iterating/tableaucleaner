import { FileRepository } from '@/infrastructure/repositories/FileRepository';
import { DataCleaningService } from '@/services/DataCleaningService';
import { TableauDataset, TableauRow } from '@/domain/entities/TableauData';
import { CleaningRule } from '@/types';
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/cleaning_rules_settings.json`);
      if (!response.ok) {
        throw new Error(`Failed to load rules: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      if (!data?.cleaningRules?.length) {
        throw new Error('No cleaning rules found in settings');
      }
      return data.cleaningRules;
    } catch (error) {
      console.error('Error loading cleaning rules:', error);
      throw error;
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
