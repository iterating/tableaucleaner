export interface CleaningRule {
  id: string;
  name: string;
  field: string;
  operation: CleaningOperationType;
  parameters: Record<string, any>;
  enabled: boolean;
}

export type CleaningOperationType = 
  | 'replace' | 'trim' | 'remove_nulls' | 'convert_type'
  | 'rename' | 'categorize' | 'handleMissingValues';
