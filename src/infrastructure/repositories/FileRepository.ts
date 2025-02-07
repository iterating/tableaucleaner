import { TableauDataset, TableauRow } from '@/domain/entities/TableauData';
import Papa from 'papaparse';

export class FileRepository {
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
}
