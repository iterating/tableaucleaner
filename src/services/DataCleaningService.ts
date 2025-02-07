import { TableauDataset, TableauRow, AgeRange } from '@/domain/entities/TableauData';
import { DataCleaningUseCase } from '@/domain/usecases/DataCleaningUseCase';
import { CleaningRule } from '@/types';
import Papa from 'papaparse';

export class DataCleaningService implements DataCleaningUseCase {
  async cleanData(dataset: TableauDataset, rules: CleaningRule[]): Promise<TableauDataset> {
    let cleanedData = { ...dataset };

    for (const rule of rules) {
      if (!this.validateRuleParameters(rule)) {
        throw new Error(`Invalid parameters for rule: ${rule.operation}`);
      }
      cleanedData = this.applyRule(cleanedData, rule);
    }

    return cleanedData;
  }

  async validateData(dataset: TableauDataset): Promise<boolean> {
    return dataset.headers.length > 0 && dataset.rows.length > 0;
  }

  async exportData(dataset: TableauDataset, format: 'csv' | 'json'): Promise<Blob> {
    if (format === 'csv') {
      const csv = Papa.unparse(dataset.rows);
      return new Blob([csv], { type: 'text/csv' });
    } else {
      const json = JSON.stringify(dataset, null, 2);
      return new Blob([json], { type: 'application/json' });
    }
  }

  private validateRuleParameters(rule: CleaningRule): boolean {
    const { operation, parameters } = rule;
    
    switch (operation) {
      case 'trim':
        return true; // No parameters needed
        
      case 'replace':
        return typeof parameters?.pattern === 'string' 
          && typeof parameters?.replacement === 'string';
        
      case 'remove_nulls':
        return true; // No parameters needed
        
      case 'convert_type':
        return parameters?.type 
          && ['number', 'boolean', 'string'].includes(parameters.type);
        
      case 'rename':
        return typeof parameters?.newName === 'string' 
          && parameters.newName.length > 0;
        
      case 'categorize':
        return Array.isArray(parameters?.ranges) 
          && parameters.ranges.every((range: AgeRange) => 
            typeof range.min === 'number' 
            && typeof range.max === 'number'
            && typeof range.label === 'string'
            && range.min <= range.max
          );
        
      case 'handleMissingValues':
        return parameters?.method 
          && ['mean', 'median', 'mode'].includes(parameters.method);
        
      default:
        return false;
    }
  }

  private calculateMean(values: (string | number | boolean | null)[]): number {
    const numbers = values
      .filter((v): v is string | number => v !== null && typeof v !== 'boolean')
      .map(v => Number(v));
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }

  private calculateMedian(values: (string | number | boolean | null)[]): number {
    const numbers = values
      .filter((v): v is string | number => v !== null && typeof v !== 'boolean')
      .map(v => Number(v))
      .sort((a, b) => a - b);
    const mid = Math.floor(numbers.length / 2);
    return numbers.length % 2 !== 0
      ? numbers[mid]
      : (numbers[mid - 1] + numbers[mid]) / 2;
  }

  private calculateMode(values: (string | number | boolean | null)[]): string | number {
    const validValues = values.filter((v): v is string | number => 
      v !== null && typeof v !== 'boolean'
    );
    
    const frequency: { [key: string]: number } = {};
    let maxFreq = 0;
    let mode: string | number = validValues[0];

    validValues.forEach(value => {
      const key = String(value);
      frequency[key] = (frequency[key] || 0) + 1;
      if (frequency[key] > maxFreq) {
        maxFreq = frequency[key];
        mode = value;
      }
    });

    return mode;
  }

  private applyRule(dataset: TableauDataset, rule: CleaningRule): TableauDataset {
    const { field, operation, parameters } = rule;
    const rows = [...dataset.rows];
    
    switch (operation) {
      case 'trim':
        rows.forEach(row => {
          if (row[field] && typeof row[field] === 'string') {
            row[field] = (row[field] as string).trim();
          }
        });
        break;
        
      case 'replace':
        rows.forEach(row => {
          if (row[field] && typeof row[field] === 'string') {
            row[field] = (row[field] as string).replace(
              parameters.pattern,
              parameters.replacement
            );
          }
        });
        break;
        
      case 'remove_nulls':
        return {
          ...dataset,
          rows: rows.filter(row => row[field] !== null && row[field] !== '')
        };
        
      case 'convert_type':
        rows.forEach(row => {
          if (row[field] !== null && row[field] !== '') {
            try {
              switch (parameters.type) {
                case 'number':
                  const num = Number(row[field]);
                  if (!isNaN(num)) row[field] = num;
                  break;
                case 'boolean':
                  row[field] = Boolean(row[field]);
                  break;
                case 'string':
                  row[field] = String(row[field]);
                  break;
              }
            } catch (error) {
              console.error(`Error converting value: ${row[field]} to type: ${parameters.type}`);
            }
          }
        });
        break;
        
      case 'rename':
        return {
          headers: dataset.headers.map(h => h === field ? parameters.newName : h),
          rows: rows.map(row => {
            const newRow = { ...row };
            if (field in newRow) {
              newRow[parameters.newName] = newRow[field];
              delete newRow[field];
            }
            return newRow;
          }),
          metadata: dataset.metadata
        };

      case 'categorize':
        rows.forEach(row => {
          if (row[field] && !isNaN(Number(row[field]))) {
            const value = Number(row[field]);
            const range = parameters.ranges.find(
              (r: AgeRange) => value >= r.min && value <= r.max
            );
            row[field] = range ? range.label : 'Unknown';
          }
        });
        break;

      case 'handleMissingValues':
        const values = rows
          .map(row => row[field])
          .filter(val => val !== null && val !== '');
        
        let replacement: any;
        switch (parameters.method) {
          case 'mean':
            replacement = this.calculateMean(values);
            break;
          case 'median':
            replacement = this.calculateMedian(values);
            break;
          case 'mode':
            replacement = this.calculateMode(values);
            break;
        }
        
        rows.forEach(row => {
          if (row[field] === null || row[field] === '') {
            row[field] = replacement;
          }
        });
        break;
    }
    
    return {
      ...dataset,
      rows
    };
  }
}
