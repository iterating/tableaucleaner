import { 
  TableauDataset,
  CleaningRule,
  TableauRow
} from '@/types';
import { format } from 'date-fns';

export interface CleaningRules {
  cleaningRules: {
    removeDuplicates: {
      enabled: boolean;
      columns: string[];
    };
    handleMissingValues: {
      enabled: boolean;
      method: string;
      columns: string[];
    };
    filterOutUnwantedRecords: {
      enabled: boolean;
      criteria: {
        age: {
          min: number;
          max: number;
        };
      };
    };
    convertDateFormats: {
      enabled: boolean;
      format: string;
    };
    trimWhitespace: {
      enabled: boolean;
      fields: string[];
    };
    categorizeAgeGroups: {
      enabled: boolean;
      ageRanges: Array<{
        label: string;
        min: number;
        max: number;
      }>;
    };
    customRegexReplacement: {
      enabled: boolean;
      pattern: string;
      replacement: string;
    };
    logCleaningActions: {
      enabled: boolean;
      logFormat: string;
    };
  };
}

export const removeDuplicates = (data: TableauRow[], columns?: string[]): TableauRow[] => {
  const validColumns = Array.isArray(columns) ? columns : [];
  const uniqueData = new Map();
  
  return data.filter(row => {
    const key = validColumns.map(col => row[col]?.toString() ?? '').join('|');
    if (!uniqueData.has(key)) {
      uniqueData.set(key, true);
      return true;
    }
    return false;
  });
};

export const handleMissingValues = (
  data: TableauRow[],
  method: string,
  columns?: string[]
): void => {
  const validColumns = Array.isArray(columns) ? columns : [];
  
  validColumns.forEach(col => {
    const values = data
      .map(row => row[col])
      .filter((value): value is number => 
        value !== null && 
        value !== undefined && 
        value !== '' && 
        !isNaN(Number(value))
      )
      .map(value => Number(value));
    
    let fillValue;
    if (method === 'mean') {
      fillValue = values.reduce((a, b) => a + b, 0) / values.length;
    } else if (method === 'median') {
      const sorted = values.slice().sort((a, b) => a - b);
      fillValue = sorted[Math.floor(sorted.length / 2)];
    } else {
      fillValue = 0;
    }

    data.forEach(row => {
      if (row[col] === null || row[col] === undefined || row[col] === '') {
        row[col] = fillValue;
      }
    });
  });
};

export const standardizeDiagnosisCodes = (data: TableauRow[]): void => {
  data.forEach(row => {
    const diagnosis = row['Diagnosis'];
    if (diagnosis && typeof diagnosis === 'string') {
      // Ensure format matches ICD-10 (e.g., E11.9)
      const code = diagnosis.trim().toUpperCase();
      if (!/^[A-Z]\d{2}\.\d{1,2}$/.test(code)) {
        row['Diagnosis'] = code.replace(/([A-Z])(\d{2})(\d{1,2})/, '$1$2.$3');
      }
    }
  });
};

export const filterOutUnwantedRecords = (
  data: TableauRow[],
  criteria: { age: { min: number; max: number } }
): TableauRow[] => {
  return data.filter(row => {
    const age = Number(row['Age']);
    return (
      age >= criteria.age.min &&
      age <= criteria.age.max
    );
  });
};

export const convertDateFormats = (data: TableauRow[], dateFormat: string): void => {
  data.forEach(row => {
    const dateStr = String(row['Date'] || '');
    
    const parsedDate = Date.parse(dateStr);
    if (isNaN(parsedDate)) throw new Error('Invalid date format');
    row['Date'] = parsedDate.toString();

    const followUpDateStr = String(row['Follow-up Date'] || '');
    const parsedFollowUpDate = Date.parse(followUpDateStr);
    if (isNaN(parsedFollowUpDate)) throw new Error('Invalid date format');
    row['Follow-up Date'] = parsedFollowUpDate.toString();
  });
};

export const trimWhitespace = (data: TableauRow[], fields: string[]): void => {
  data.forEach(row => {
    fields.forEach(field => {
      if (row[field] && typeof row[field] === 'string') {
        row[field] = row[field].trim();
      }
    });
  });
};

export const categorizeAgeGroups = (
  data: TableauRow[],
  ageRanges: Array<{ label: string; min: number; max: number }>
): void => {
  data.forEach(row => {
    const age = Number(row['Age']);
    const ageGroup = ageRanges.find(range => age >= range.min && age <= range.max);
    row['Age Group'] = ageGroup ? ageGroup.label : 'Unknown';
  });
};

export const customRegexReplacement = (data: TableauRow[], pattern: string, replacement: string): void => {
  if (!pattern) return;
  
  const regex = new RegExp(pattern, 'g');
  data.forEach(row => {
    Object.keys(row).forEach(key => {
      if (typeof row[key] === 'string') {
        row[key] = row[key].replace(regex, replacement);
      }
    });
  });
};

export const logCleaningAction = (action: string, format: string = 'text'): void => {
  const timestamp = new Date().toISOString();
  const logEntry = format === 'json' 
    ? JSON.stringify({ timestamp, action })
    : `[${timestamp}] ${action}`;
  console.log(logEntry);
};

export const applyTrimming = (data: TableauRow[], params: any): TableauRow[] => {
  return data.map(row => {
    const diagnosis = row.Diagnosis;
    return {
      ...row,
      Diagnosis: typeof diagnosis === 'string' ? diagnosis.trim() : diagnosis
    };
  });
};

export const handleMissingData = (data: TableauRow[], params: any): TableauRow[] => {
  return data.filter(row => 
    row.Age !== null && 
    row['Blood Sugar Level'] !== null
  );
};

export const applyReplacement = (data: TableauRow[], params: any): TableauRow[] => {
  if (!params?.targetValue || !params?.replacement) return data;
  
  return data.map(row => ({
    ...row,
    [params.column]: row[params.column] === params.targetValue 
      ? params.replacement 
      : row[params.column]
  }));
};

/**
 * Filters out rows with null/undefined/NaN values in specified columns
 * @param data - Array of TableauRow records
 * @param params - Configuration object:
 *   - columns: string[] - Columns to check for invalid values
 *   - strictMode?: boolean - Whether to remove rows with empty strings (default: false)
 * @returns Filtered array of valid rows
 */
export const removeNullValues = (data: TableauRow[], params: any): TableauRow[] => {
  try {
    const columns = params?.columns || [];
    const strictMode = params?.strictMode || false;

    if (!Array.isArray(columns)) {
      throw new Error('Columns parameter must be an array');
    }

    // Validate column existence in first row (if available)
    if (data.length > 0) {
      const firstRow = data[0];
      const invalidColumns = columns.filter(col => !(col in firstRow));
      if (invalidColumns.length > 0) {
        console.warn(`Columns not found in dataset: ${invalidColumns.join(', ')}`);
      }
    }

    return data.filter(row => {
      return columns.every(col => {
        const value = row[col];
        
        // Handle different invalid value types
        if (value === null || value === undefined) return false;
        if (typeof value === 'number' && Number.isNaN(value)) return false;
        if (strictMode && typeof value === 'string' && value.trim() === '') return false;
        
        return true;
      });
    });
  } catch (error) {
    console.error('Error in removeNullValues:', error);
    return data; // Return original data on error
  }
};

/**
 * Converts column values to specified data type with validation and fallbacks
 * @param data - Array of TableauRow records
 * @param params - Configuration object:
 *   - column: string - Target column name
 *   - targetType: 'number' | 'date' | 'string' | 'boolean' - Target data type
 *   - fallbackValue?: any - Value to use for failed conversions (default: null)
 * @returns New array with converted values
 */
export const convertDataTypes = (data: TableauRow[], params: any): TableauRow[] => {
  try {
    if (!params?.column || !params?.targetType) {
      throw new Error('Missing required conversion parameters');
    }

    const { column, targetType, fallbackValue = null } = params;
    const allowedTypes = ['number', 'date', 'string', 'boolean'];
    
    if (!allowedTypes.includes(targetType.toLowerCase())) {
      throw new Error(`Invalid target type: ${targetType}`);
    }

    return data.map(row => {
      const originalValue = row[column];
      
      // Initialize converted with the appropriate type based on targetType
      let converted: number | string | boolean | Date;
      switch(targetType.toLowerCase()) {
        case 'number':
          converted = fallbackValue ?? 0;
          break;
        case 'date':
          converted = fallbackValue ?? new Date(0);
          break;
        case 'boolean':
          converted = fallbackValue ?? false;
          break;
        case 'string':
          converted = fallbackValue ?? '';
          break;
        default:
          converted = fallbackValue ?? null;
      }

      if (typeof originalValue !== 'string' && typeof originalValue !== 'number') {
        return { ...row, [column]: converted };
      }

      try {
        switch(targetType.toLowerCase()) {
          case 'number':
            const numValue = Number(originalValue);
            if (isNaN(numValue)) {
              throw new Error('NaN result');
            }
            converted = numValue;
            break;

          case 'date':
            const dateValue = new Date(originalValue as string);
            if (isNaN(dateValue.getTime())) {
              throw new Error('Invalid date format');
            }
            converted = dateValue;
            break;

          case 'string':
            converted = String(originalValue ?? '');
            break;

          case 'boolean':
            converted = Boolean(originalValue);
            if (typeof originalValue === 'string') {
              converted = ['true', 'yes', '1'].includes(originalValue.toLowerCase());
            }
            break;
        }
      } catch (conversionError) {
        console.warn(`Conversion failed for value '${originalValue}' in column ${column}:`, conversionError);
        converted = fallbackValue;
      }

      return { 
        ...row, 
        [column]: converted 
      };
    });

  } catch (error) {
    console.error('Data type conversion error:', error);
    return data; // Return original data on critical errors
  }
};

/**
 * Safely renames columns while preserving critical Tableau metadata fields
 * @param data - Array of TableauRow records
 * @param params - Configuration object:
 *   - mapping: Record<string, string> - Old to new column name mapping
 *   - preserveMetadata?: boolean - Keep original metadata columns (default: true)
 * @returns New array with renamed columns
 */
export const renameColumns = (data: TableauRow[], params: any): TableauRow[] => {
  try {
    const { mapping = {}, preserveMetadata = true } = params;
    const metadataColumns = ['Patient ID', 'Date of Visit'];
    
    if (typeof mapping !== 'object') {
      throw new Error('Column mapping must be an object');
    }

    return data.map(row => {
      const newRow: Partial<TableauRow> = {};
      
      Object.entries(row).forEach(([key, value]) => {
        if (preserveMetadata && metadataColumns.includes(key)) {
          newRow[key] = value;
          return;
        }
        
        const newKey = mapping[key] || key;
        
        if (newKey in newRow) {
          console.warn(`Column conflict: ${newKey} already exists`);
          newRow[`${newKey}_merged`] = value;
        } else {
          newRow[newKey] = value;
        }
      });

      return newRow as TableauRow;
    });
  } catch (error) {
    console.error('Column renaming error:', error);
    return data;
  }
};

/**
 * Categorizes numerical values into predefined ranges with validation
 * @param data - Array of TableauRow records
 * @param params - Configuration object:
 *   - column: string - Target column name containing numerical values
 *   - categories: Array<{ label: string; min: number; max: number }> - Category definitions
 *   - defaultCategory?: string - Default label for uncategorized values (default: 'Other')
 * @returns New array with categorized values in a new column
 */
export const categorizeValues = (data: TableauRow[], params: any): TableauRow[] => {
  // Parameter validation
  if (!params?.column || !params?.categories) {
    console.error('Missing required parameters for categorization');
    return data;
  }
  
  if (!Array.isArray(params.categories)) {
    console.error('Categories must be an array of category objects');
    return data;
  }

  // Validate category structure
  const invalidCategories = params.categories.filter((cat: any) => 
    typeof cat?.label !== 'string' ||
    typeof cat?.min !== 'number' ||
    typeof cat?.max !== 'number'
  );
  
  if (invalidCategories.length > 0) {
    console.error('Invalid category format detected:', invalidCategories);
    return data;
  }

  const defaultCat = params.defaultCategory || 'Other';
  const targetColumn = params.column;

  return data.map(row => {
    try {
      const rawValue = row[targetColumn];
      const numericValue = Number(rawValue);

      // Handle non-numeric values
      if (Number.isNaN(numericValue)) {
        console.warn(`Non-numeric value in ${targetColumn}: ${rawValue}`);
        return { 
          ...row, 
          [`${targetColumn}_category`]: 'Invalid' 
        };
      }

      // Find matching category with boundary checks
      const category = params.categories.find((cat: any) => 
        numericValue >= cat.min && 
        numericValue <= cat.max
      )?.label || defaultCat;

      return { 
        ...row, 
        [`${targetColumn}_category`]: category 
      };
    } catch (error) {
      console.error(`Error categorizing row ${JSON.stringify(row)}:`, error);
      return row;
    }
  });
};

/**
 * Normalizes numerical values with outlier detection and logging
 * @param data - Array of TableauRow records
 * @param params - Configuration object:
 *   - column: string - Target column name
 *   - min: number - Manual minimum value
 *   - max: number - Manual maximum value
 *   - autoRange?: boolean - Calculate min/max from data (default: false)
 *   - clipOutliers?: boolean - Limit values to [0,1] (default: true)
 * @returns New array with normalized values
 */
export const applyNormalization = (data: TableauRow[], params: any): TableauRow[] => {
  try {
    const { column, min: manualMin, max: manualMax, autoRange = false, clipOutliers = true } = params;
    
    if (!column) throw new Error('Missing target column');
    
    // Calculate or validate range
    const values = data.map(row => {
      const value = row[column as keyof TableauRow];
      if (typeof value !== 'number') {
        throw new Error(`Non-numeric value in column ${column}`);
      }
      return value;
    });
    const [min, max] = values.reduce(
      ([currMin, currMax], value) => [
        Math.min(currMin, value),
        Math.max(currMax, value)
      ],
      [Infinity, -Infinity]
    );

    if (typeof min !== 'number' || typeof max !== 'number' || min > max) {
      throw new Error(`Invalid normalization range: min=${min}, max=${max}`);
    }

    const range = max - min;
    const epsilon = 1e-9;
    
    return data.map(row => {
      try {
        const rawValue = Number(row[column]);
        if (Number.isNaN(rawValue)) {
          console.warn(`NaN value in ${column}`);
          return row;
        }

        let normalized = (rawValue - min) / (range + epsilon);
        
        if (clipOutliers) {
          normalized = Math.max(0, Math.min(1, normalized));
        }

        if (normalized < -0.5 || normalized > 1.5) {
          console.warn(`Extreme value in ${column}: ${rawValue}`);
        }

        return { 
          ...row, 
          [column]: Number(normalized.toFixed(4)) 
        };
      } catch (error) {
        console.error(`Normalization error for row ${JSON.stringify(row)}:`, error);
        return row;
      }
    });
    
  } catch (error) {
    console.error('Normalization failed:', error);
    return data;
  }
};

export function applyCleaningRules(dataset: TableauDataset, rules: any[]): TableauDataset {
  const cleanedData = { ...dataset };

  rules.filter(rule => rule.enabled).forEach(rule => {
    try {
      switch(rule.operation) {
        case 'trim':
          cleanedData.rows = applyTrimming(cleanedData.rows, rule.parameters);
          break;
        case 'replace':
          cleanedData.rows = applyReplacement(cleanedData.rows, rule.parameters);
          break;
        case 'remove_nulls':
          cleanedData.rows = removeNullValues(cleanedData.rows, rule.parameters);
          break;
        case 'convert_type':
          cleanedData.rows = convertDataTypes(cleanedData.rows, rule.parameters);
          break;
        case 'rename':
          cleanedData.rows = renameColumns(cleanedData.rows, rule.parameters);
          break;
        case 'categorize':
          cleanedData.rows = categorizeValues(cleanedData.rows, rule.parameters);
          break;
        case 'handleMissingValues':
          cleanedData.rows = handleMissingData(cleanedData.rows, rule.parameters);
          break;
        case 'normalization':
          cleanedData.rows = applyNormalization(cleanedData.rows, rule.parameters);
          break;
        default:
          console.warn(`Unknown operation type: ${rule.operation}`);
      }
    } catch (error) {
      console.error(`Error applying rule ${rule.operation}:`, error);
    }
  });

  return cleanedData;
}
