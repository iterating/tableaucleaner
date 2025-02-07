// Export all types needed for Tableau data cleaning
export * from './cleaningRules';

export interface TableauRow {
  [key: string]: string | number | boolean | null;
}

export interface TableauMetadata {
  fileName: string;
  rowCount: number;
  columnCount: number;
  uploadDate: string;
}

export interface TableauDataset {
  headers: string[];
  rows: TableauRow[];
  metadata: TableauMetadata;
}
