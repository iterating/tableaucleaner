'use client';
import { TableauDataset, CleaningRule } from '@/types';
import { Button } from './ui/button';
import { useState } from 'react';
import { RuleConfigurationModal } from './RuleConfigurationModal'; 
import settings from '../../public/cleaning_rules_settings.json';
import { CleaningRulesSettings, createCleaningRule } from '@/types/cleaningRules';

const cleaningRulesSettings = settings as unknown as CleaningRulesSettings;

interface RulesListProps {
  rules: CleaningRule[];
  dataset: TableauDataset;
  onAddRule: (rule: CleaningRule) => void;
}

export function RulesList({ rules, dataset, onAddRule }: RulesListProps) {
  const [showConfigModal, setShowConfigModal] = useState(false);

  const handleAddRule = (config: { type: string; parameters: any }) => {
    const defaultField = dataset.headers.length > 0 ? dataset.headers[0] : 'unknown_field';
    const ruleTemplate = cleaningRulesSettings.cleaningRules.find(r => r.id === config.type);
    
    if (!ruleTemplate) return;

    onAddRule(createCleaningRule(ruleTemplate, defaultField, config.parameters));
  };

  return (
    <div className="bg-muted/50 p-4 rounded-lg border">
      <h2 className="text-2xl font-semibold mb-4 flex items-center">
        <span className="w-2 h-6 bg-blue-500 rounded mr-2"></span>
        Cleaning Rules
      </h2>
      <ul className="space-y-2">
        {rules.map(rule => (
          <li 
            key={rule.id} 
            className="flex items-center justify-between p-3 rounded bg-background hover:bg-muted/20 transition-colors gap-4"
          >
            <span className="text-sm font-medium">{rule.name}</span>
            <div className="flex gap-2 text-muted-foreground">
              <span className="text-sm">Field: {rule.field}</span>
              <span className="text-sm">•</span>
              <span className="text-sm capitalize">{rule.operation.replace(/_/g, ' ')}</span>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <Button
          onClick={() => setShowConfigModal(true)}
          variant="default"
          className="w-full justify-center"
        >
          Add Rule
        </Button>
      </div>
      {showConfigModal && (
        <RuleConfigurationModal
          ruleTypes={cleaningRulesSettings.cleaningRules.map(r => r.id)}
          onConfigure={handleAddRule}
          onClose={() => setShowConfigModal(false)}
        />
      )}
    </div>
  );
}
