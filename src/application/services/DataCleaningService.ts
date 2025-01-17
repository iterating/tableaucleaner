import { TableauDataset, CleaningRule, TableauRow } from '@/domain/entities/TableauData';
import { DataCleaningUseCase } from '@/domain/usecases/DataCleaningUseCase';

export class DataCleaningService implements DataCleaningUseCase {
  async cleanData(dataset: TableauDataset, rules: CleaningRule[]): Promise<TableauDataset> {
    let cleanedData = { ...dataset };

    for (const rule of rules) {
      cleanedData = this.applyRule(cleanedData, rule);
    }

    return cleanedData;
  }

  async validateData(dataset: TableauDataset): Promise<boolean> {
    return dataset.headers.length > 0 && dataset.rows.length > 0;
  }

  async exportData(dataset: TableauDataset, format: 'csv' | 'json'): Promise<Blob> {
    if (format === 'json') {
      return new Blob([JSON.stringify(dataset, null, 2)], { type: 'application/json' });
    }

    // CSV export
    const csvContent = [
      dataset.headers.join(','),
      ...dataset.rows.map(row => 
        dataset.headers.map(header => row[header]).join(',')
      )
    ].join('\n');

    return new Blob([csvContent], { type: 'text/csv' });
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
            switch (parameters.type) {
              case 'number':
                row[field] = Number(row[field]);
                break;
              case 'boolean':
                row[field] = Boolean(row[field]);
                break;
              // Add more type conversions as needed
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
    }
    
    return {
      ...dataset,
      rows
    };
  }

  private convertType(value: any, targetType: string): any {
    switch (targetType) {
      case 'number':
        return Number(value);
      case 'boolean':
        return Boolean(value);
      case 'string':
        return String(value);
      default:
        return value;
    }
  }
}
