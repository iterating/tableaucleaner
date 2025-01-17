import { TableauDataset, CleaningRule } from '../entities/TableauData';

export interface DataCleaningUseCase {
  cleanData(dataset: TableauDataset, rules: CleaningRule[]): Promise<TableauDataset>;
  validateData(dataset: TableauDataset): Promise<boolean>;
  exportData(dataset: TableauDataset, format: 'csv' | 'json'): Promise<Blob>;
}
