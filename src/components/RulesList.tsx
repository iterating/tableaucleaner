import { TableauDataset } from '@/domain/entities/TableauData';
import { CleaningRule, CleaningOperationType } from '@/types';
import { Button } from './ui/button';
import { useState } from 'react';
import { RuleConfigurationModal } from './RuleConfigurationModal'; 
import settings from '../../public/cleaning_rules_settings.json';

interface RulesListProps {
  rules: CleaningRule[];
  dataset: TableauDataset;
  onAddRule: (rule: CleaningRule) => void;
}

export function RulesList({ rules, dataset, onAddRule }: RulesListProps) {
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedRuleType, setSelectedRuleType] = useState<string>('');

  const handleAddRule = (config: any) => {
    onAddRule({
      id: String(Date.now()),
      name: `${config.operation} on ${dataset.headers[0]}`,
      field: dataset.headers[0],
      operation: config.operation as CleaningOperationType,
      parameters: config.parameters,
      enabled: true
    });
  };

  return (
    <div className="bg-muted/50 p-4 rounded-lg border">
      <h2 className="text-2xl font-semibold mb-4">
       <span className="w-2 h-6 bg-blue-500 rounded mr-2"></span>
       Cleaning Rules</h2>
      <ul className="space-y-2">
        {rules.map(rule => (
          <li 
            key={rule.id} 
            className="flex items-center justify-between p-2 rounded bg-background hover:bg-muted/20 transition-colors"
          >
            <span className="text-sm">Rule {rules.indexOf(rule) + 1}</span>
            <span className="text-sm">Field: {rule.field}</span>
            <span className="text-sm">Operation: {rule.operation}</span>
          </li>
        ))}
      </ul>
      <Button
        onClick={() => setShowConfigModal(true)}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
      >
        Add Rule
      </Button>
      {showConfigModal && (
        <RuleConfigurationModal
          ruleTypes={Object.keys(settings.cleaningRules)}
          onConfigure={handleAddRule}
          onClose={() => setShowConfigModal(false)}
        />
      )}
    </div>
  );
}
