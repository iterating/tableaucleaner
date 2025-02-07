import { CleaningRules } from '@/utils/cleaningRules';

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

export interface AgeRange {
  min: number;
  max: number;
  label: string;
}

export interface FilterCondition {
  min?: number;
  max?: number;
  values?: string[];
  pattern?: string;
}

export interface RegexPattern {
  pattern: string;
  replacement: string;
  columns: string[];
}

export interface TableauData {
  dataset: TableauDataset;
  cleaningRules: import('@/types').CleaningRule[];
}
