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

export interface CleaningRule {
  id: string;
  field: string;
  operation: 'trim' | 'replace' | 'remove_nulls' | 'convert_type' | 'rename' | 'categorize' | 'handleMissingValues';
  parameters: Record<string, any>;
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

export interface CleaningRules {
  cleaningRules: {
    removeDuplicates: {
      enabled: boolean;
      columns: string[];
    };
    handleMissingValues: {
      enabled: boolean;
      method: 'mean' | 'median' | 'mode' | 'custom';
      columns: string[];
      customValue?: string | number;
    };
    normalizeBloodSugarLevels: {
      enabled: boolean;
      minValue: number;
      maxValue: number;
    };
    standardizeDiagnosisCodes: {
      enabled: boolean;
      format: string;
    };
    filterRecords: {
      enabled: boolean;
      conditions: {
        [key: string]: FilterCondition;
      };
    };
    convertDateFormats: {
      enabled: boolean;
      format: string;
      columns: string[];
    };
    trimWhitespace: {
      enabled: boolean;
      columns: string[];
    };
    categorizeAge: {
      enabled: boolean;
      ranges: AgeRange[];
    };
    customRegexReplacements: {
      enabled: boolean;
      patterns: RegexPattern[];
    };
  };
}

export interface TableauData {
  dataset: TableauDataset;
  cleaningRules: CleaningRules;
}
