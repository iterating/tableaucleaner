import { TableauDataset, TableauRow } from '@/domain/entities/TableauData';
import Papa from 'papaparse';

export class FileRepository {
  async parseFile(file: File): Promise<TableauDataset> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          if (!results.data || results.data.length === 0) {
            reject(new Error('No data found in file'));
            return;
          }

          const headers = results.data[0] as string[];
          const rawRows = results.data.slice(1) as string[][];
          
          // Convert string[][] to TableauRow[]
          const rows = rawRows
            .filter(row => row.some(field => field?.trim() !== ''))
            .map(row => {
              const tableauRow: TableauRow = {};
              headers.forEach((header, index) => {
                tableauRow[header] = (row[index] || '').toString().trim();
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
}
