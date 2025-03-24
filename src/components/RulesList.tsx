'use client';
import { TableauDataset, CleaningRule } from '@/types';
import { Button } from './ui/button';
import { useState, useRef } from 'react';
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
  const addRuleButtonRef = useRef<HTMLButtonElement>(null);

  const handleAddRule = (config: { type: string; parameters: any }) => {
    const defaultField = dataset.headers.length > 0 ? dataset.headers[0] : 'unknown_field';
    const ruleTemplate = cleaningRulesSettings.cleaningRules.find(r => r.id === config.type);
    
    if (!ruleTemplate) return;

    onAddRule(createCleaningRule(ruleTemplate, defaultField, config.parameters));
  };

  return (
    <div>
      {rules.length > 0 ? (
        <ul className="space-y-3 mb-4">
          {rules.map(rule => (
            <li 
              key={rule.id} 
              className="flex items-center justify-between p-3 rounded-md bg-zinc-700/40 border border-zinc-600/50 hover:bg-zinc-700/70 transition-colors shadow-sm"
            >
              <div className="flex items-center">
                <div className={`w-2 h-full min-h-[2rem] rounded-l-md mr-3 ${rule.enabled ? 'bg-blue-500' : 'bg-zinc-500'}`}></div>
                <span className="text-sm font-medium text-zinc-200">{rule.name}</span>
              </div>
              <div className="flex flex-col md:flex-row gap-2 text-zinc-400">
                <span className="text-xs px-2 py-1 rounded-full bg-zinc-800">Field: {rule.field}</span>
                <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 capitalize">{rule.operation.replace(/_/g, ' ')}</span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-8 mb-4 bg-zinc-700/20 border border-dashed border-zinc-700 rounded-md">
          <p className="text-zinc-400 text-sm">No cleaning rules added yet</p>
          <p className="text-zinc-500 text-xs mt-1">Add your first rule to start cleaning the data</p>
        </div>
      )}
      
      <Button
        onClick={() => setShowConfigModal(true)}
        variant="default"
        className="w-full justify-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all"
        ref={addRuleButtonRef}
      >
        Add Rule
      </Button>
      
      {showConfigModal && (
        <RuleConfigurationModal
          ruleTypes={cleaningRulesSettings.cleaningRules.map(r => r.id)}
          onConfigure={handleAddRule}
          onClose={() => setShowConfigModal(false)}
          buttonRef={addRuleButtonRef}
        />
      )}
    </div>
  );
}
