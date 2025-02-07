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
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        complete: (results) => {
          const headers = results.data[0] as string[];
          const rawRows = results.data.slice(1) as string[][];
          
          // Convert string[][] to TableauRow[]
          const rows = rawRows.map(row => {
            const tableauRow: TableauRow = {};
            headers.forEach((header, index) => {
              tableauRow[header] = row[index] || '';
            });
            return tableauRow;
          });
          
          resolve({
            headers,
            rows,
            metadata: {
              fileName: file.name,
              rowCount: rows.length,
              columnCount: headers.length,
              uploadDate: new Date().toISOString()
            }
          });
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }

  async getCleaningRules(): Promise<CleaningRule[]> {
    try {
      const response = await fetch('/cleaning_rules_settings.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
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
