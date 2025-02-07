// Parameter schema for rule templates
export interface ParameterSchema {
  type: string;
  required?: boolean;
  options?: string[];
  default?: any;
  min?: number;
  max?: number;
  [key: string]: any;
}

// All possible cleaning operations
export type CleaningOperationType = 
  | 'trim'
  | 'replace'
  | 'remove_nulls'
  | 'convert_type'
  | 'rename'
  | 'categorize'
  | 'handleMissingValues'
  | 'normalization'
  | 'logging'
  | 'deduplication'
  | 'missing_values'
  | 'standardization'
  | 'filtering';

// Template for a cleaning rule (from settings)
export interface CleaningRuleTemplate {
  id: string;
  name: string;
  operation: string;  // Raw operation from settings
  enabled: boolean;
  parameters: Record<string, ParameterSchema>;  // Parameter requirements
  description?: string;
}

// Settings file structure
export interface CleaningRulesSettings {
  cleaningRules: CleaningRuleTemplate[];
}

// Actual cleaning rule instance
export interface CleaningRule {
  id: string;
  name: string;
  operation: CleaningOperationType;  // Type-safe operation
  enabled: boolean;
  field: string;  // Target field to clean
  parameters: Record<string, any>;  // Actual parameter values
  [key: string]: any;
}

// Maps template IDs to their corresponding operation types
export const RULE_OPERATION_MAP: Record<string, CleaningOperationType> = {
  'removeDuplicates': 'deduplication',
  'handleMissingValues': 'missing_values',
  'standardizeDiagnosisCodes': 'standardization',
  'filterOutUnwantedRecords': 'filtering',
  'convertDateFormats': 'convert_type',
  'trimWhitespace': 'trim',
  'categorizeAgeGroups': 'categorize',
  'customRegexReplacement': 'replace',
  'logCleaningActions': 'logging'
} as const;

// Helper to create a cleaning rule from a template
export function createCleaningRule(
  template: CleaningRuleTemplate,
  field: string,
  parameters: Record<string, any>
): CleaningRule {
  return {
    id: `${template.id}_${Date.now()}`,
    name: `${template.name} on ${field}`,
    operation: RULE_OPERATION_MAP[template.id],
    enabled: true,
    field,
    parameters
  };
}
