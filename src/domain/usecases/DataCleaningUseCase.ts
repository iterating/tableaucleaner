import { TableauDataset } from '../entities/TableauData';
import { CleaningRule } from '@/types';

export interface DataCleaningUseCase {
  cleanData(dataset: TableauDataset, rules: CleaningRule[]): Promise<TableauDataset>;
  validateData(dataset: TableauDataset): Promise<boolean>;
  exportData(dataset: TableauDataset, format: 'csv' | 'json'): Promise<Blob>;
}
