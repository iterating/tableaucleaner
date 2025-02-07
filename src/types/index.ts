// Export all types needed for Tableau data cleaning
export interface CleaningRule {
  id: string;
  name: string;
  operation: CleaningOperationType;
  enabled: boolean;
  parameters: Record<string, any>;
  [key: string]: any;
}

export type CleaningOperationType = 
  | 'trim'
  | 'replace'
  | 'remove_nulls'
  | 'convert_type'
  | 'rename'
  | 'categorize'
  | 'handleMissingValues'
  | 'normalization';

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
