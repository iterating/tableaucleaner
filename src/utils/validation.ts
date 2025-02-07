import { CleaningRule, CleaningOperationType } from '@/types';

export const VALID_CLEANING_OPERATIONS: CleaningOperationType[] = [
  'trim',
  'replace',
  'remove_nulls',
  'convert_type',
  'rename',
  'categorize',
  'handleMissingValues',
  'normalization'
];

export const validateNormalizationParams = (params: any): boolean => 
  typeof params?.minValue === 'number' && typeof params?.maxValue === 'number';

export const validateRemoveNullsParams = (params: any): boolean =>
  Array.isArray(params?.columns) && params.columns.every((c: any) => typeof c === 'string');

export const validateConvertTypeParams = (params: any): boolean =>
  typeof params?.column === 'string' && ['number', 'date', 'string'].includes(params?.targetType);

export const validateCleaningRule = (rule: CleaningRule): boolean => {
  if (!rule.operation || !rule.parameters) return false;
  
  if (!VALID_CLEANING_OPERATIONS.includes(rule.operation)) return false;

  switch(rule.operation) {
    case 'normalization':
      return validateNormalizationParams(rule.parameters);
    case 'remove_nulls':
      return validateRemoveNullsParams(rule.parameters);
    case 'convert_type':
      return validateConvertTypeParams(rule.parameters);
    default:
      return false;
  }
};
