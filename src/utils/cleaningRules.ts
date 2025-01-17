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
    normalizeBloodSugarLevels: {
      enabled: boolean;
      minValue: number;
      maxValue: number;
    };
    standardizeDiagnosisCodes: {
      enabled: boolean;
      format: string;
    };
    filterOutUnwantedRecords: {
      enabled: boolean;
      criteria: {
        age: {
          min: number;
          max: number;
        };
        bloodSugarLevel: {
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

export interface DataRow {
  [key: string]: any;
}

export const removeDuplicates = (data: DataRow[], columns: string[]): DataRow[] => {
  const uniqueData = new Map();
  return data.filter(row => {
    const key = columns.map(col => row[col]).join('|');
    if (!uniqueData.has(key)) {
      uniqueData.set(key, true);
      return true;
    }
    return false;
  });
};

export const handleMissingValues = (data: DataRow[], method: string, columns: string[]): void => {
  columns.forEach(col => {
    const values = data
      .map(row => row[col])
      .filter(value => value !== null && value !== undefined && value !== '');
    
    let fillValue;
    if (method === 'mean') {
      fillValue = values.reduce((a: number, b: number) => a + b, 0) / values.length;
    } else if (method === 'median') {
      values.sort((a: number, b: number) => a - b);
      fillValue = values[Math.floor(values.length / 2)];
    } else {
      fillValue = 0;
    }

    data.forEach(row => {
      if (!row[col] || row[col] === '') {
        row[col] = fillValue;
      }
    });
  });
};

export const normalizeBloodSugarLevels = (data: DataRow[], minValue: number, maxValue: number): void => {
  data.forEach(row => {
    const level = Number(row['Blood Sugar Level']);
    if (level < minValue) {
      row['Blood Sugar Level'] = minValue;
    } else if (level > maxValue) {
      row['Blood Sugar Level'] = maxValue;
    }
  });
};

export const standardizeDiagnosisCodes = (data: DataRow[]): void => {
  data.forEach(row => {
    if (row['Diagnosis Code']) {
      // Ensure format matches ICD-10 (e.g., E11.9)
      const code = row['Diagnosis Code'].trim().toUpperCase();
      if (!/^[A-Z]\d{2}\.\d{1,2}$/.test(code)) {
        row['Diagnosis Code'] = code.replace(/([A-Z])(\d{2})(\d{1,2})/, '$1$2.$3');
      }
    }
  });
};

export const filterOutUnwantedRecords = (
  data: DataRow[],
  criteria: { age: { min: number; max: number }; bloodSugarLevel: { max: number } }
): DataRow[] => {
  return data.filter(row => {
    const age = Number(row['Age']);
    const bloodSugar = Number(row['Blood Sugar Level']);
    return (
      age >= criteria.age.min &&
      age <= criteria.age.max &&
      bloodSugar <= criteria.bloodSugarLevel.max
    );
  });
};

export const convertDateFormats = (data: DataRow[], dateFormat: string): void => {
  data.forEach(row => {
    if (row['Date of Visit']) {
      const date = new Date(row['Date of Visit']);
      row['Date of Visit'] = format(date, dateFormat);
    }
    if (row['Follow-up Date']) {
      const date = new Date(row['Follow-up Date']);
      row['Follow-up Date'] = format(date, dateFormat);
    }
  });
};

export const trimWhitespace = (data: DataRow[], fields: string[]): void => {
  data.forEach(row => {
    fields.forEach(field => {
      if (row[field] && typeof row[field] === 'string') {
        row[field] = row[field].trim();
      }
    });
  });
};

export const categorizeAgeGroups = (
  data: DataRow[],
  ageRanges: Array<{ label: string; min: number; max: number }>
): void => {
  data.forEach(row => {
    const age = Number(row['Age']);
    const ageGroup = ageRanges.find(range => age >= range.min && age <= range.max);
    row['Age Group'] = ageGroup ? ageGroup.label : 'Unknown';
  });
};

export const customRegexReplacement = (data: DataRow[], pattern: string, replacement: string): void => {
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

export const applyCleaningRules = (data: DataRow[], rules: CleaningRules): DataRow[] => {
  let cleanedData = [...data];
  const { cleaningRules } = rules;

  if (cleaningRules.logCleaningActions.enabled) {
    logCleaningAction('Starting data cleaning process', cleaningRules.logCleaningActions.logFormat);
  }

  if (cleaningRules.removeDuplicates.enabled) {
    cleanedData = removeDuplicates(cleanedData, cleaningRules.removeDuplicates.columns);
    if (cleaningRules.logCleaningActions.enabled) {
      logCleaningAction('Removed duplicates', cleaningRules.logCleaningActions.logFormat);
    }
  }

  if (cleaningRules.handleMissingValues.enabled) {
    handleMissingValues(
      cleanedData,
      cleaningRules.handleMissingValues.method,
      cleaningRules.handleMissingValues.columns
    );
    if (cleaningRules.logCleaningActions.enabled) {
      logCleaningAction('Handled missing values', cleaningRules.logCleaningActions.logFormat);
    }
  }

  if (cleaningRules.normalizeBloodSugarLevels.enabled) {
    normalizeBloodSugarLevels(
      cleanedData,
      cleaningRules.normalizeBloodSugarLevels.minValue,
      cleaningRules.normalizeBloodSugarLevels.maxValue
    );
    if (cleaningRules.logCleaningActions.enabled) {
      logCleaningAction('Normalized blood sugar levels', cleaningRules.logCleaningActions.logFormat);
    }
  }

  if (cleaningRules.standardizeDiagnosisCodes.enabled) {
    standardizeDiagnosisCodes(cleanedData);
    if (cleaningRules.logCleaningActions.enabled) {
      logCleaningAction('Standardized diagnosis codes', cleaningRules.logCleaningActions.logFormat);
    }
  }

  if (cleaningRules.filterOutUnwantedRecords.enabled) {
    cleanedData = filterOutUnwantedRecords(cleanedData, cleaningRules.filterOutUnwantedRecords.criteria);
    if (cleaningRules.logCleaningActions.enabled) {
      logCleaningAction('Filtered out unwanted records', cleaningRules.logCleaningActions.logFormat);
    }
  }

  if (cleaningRules.convertDateFormats.enabled) {
    convertDateFormats(cleanedData, cleaningRules.convertDateFormats.format);
    if (cleaningRules.logCleaningActions.enabled) {
      logCleaningAction('Converted date formats', cleaningRules.logCleaningActions.logFormat);
    }
  }

  if (cleaningRules.trimWhitespace.enabled) {
    trimWhitespace(cleanedData, cleaningRules.trimWhitespace.fields);
    if (cleaningRules.logCleaningActions.enabled) {
      logCleaningAction('Trimmed whitespace', cleaningRules.logCleaningActions.logFormat);
    }
  }

  if (cleaningRules.categorizeAgeGroups.enabled) {
    categorizeAgeGroups(cleanedData, cleaningRules.categorizeAgeGroups.ageRanges);
    if (cleaningRules.logCleaningActions.enabled) {
      logCleaningAction('Categorized age groups', cleaningRules.logCleaningActions.logFormat);
    }
  }

  if (cleaningRules.customRegexReplacement.enabled) {
    customRegexReplacement(
      cleanedData,
      cleaningRules.customRegexReplacement.pattern,
      cleaningRules.customRegexReplacement.replacement
    );
    if (cleaningRules.logCleaningActions.enabled) {
      logCleaningAction('Applied custom regex replacement', cleaningRules.logCleaningActions.logFormat);
    }
  }

  if (cleaningRules.logCleaningActions.enabled) {
    logCleaningAction('Completed data cleaning process', cleaningRules.logCleaningActions.logFormat);
  }

  return cleanedData;
};
