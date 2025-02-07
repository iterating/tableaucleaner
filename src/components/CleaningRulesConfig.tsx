'use client';
import React from 'react';
import { CleaningRule, CleaningOperationType } from '@/types';

interface CleaningRulesConfigProps {
  rules: CleaningRule[];
  onRulesChange: (rules: CleaningRule[]) => void;
}

const CleaningRulesConfig: React.FC<CleaningRulesConfigProps> = ({
  rules,
  onRulesChange,
}) => {
  const handleToggleRule = (ruleId: string) => {
    const updatedRules = rules.map(rule => 
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    );
    onRulesChange(updatedRules);
  };

  const handleParameterChange = (ruleId: string, paramName: string, value: any) => {
    const updatedRules = rules.map(rule =>
      rule.id === ruleId ? { 
        ...rule, 
        parameters: { ...rule.parameters, [paramName]: value } 
      } : rule
    );
    onRulesChange(updatedRules);
  };

  const getParameterInput = (rule: CleaningRule, paramName: string, value: any) => {
    if (typeof value === 'boolean') {
      return (
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => handleParameterChange(rule.id, paramName, e.target.checked)}
          className="rounded border-gray-300"
        />
      );
    }

    if (typeof value === 'number') {
      return (
        <input
          type="number"
          value={value}
          onChange={(e) => handleParameterChange(rule.id, paramName, Number(e.target.value))}
          className="border rounded px-2 py-1 text-sm w-24"
        />
      );
    }

    return (
      <input
        type="text"
        value={value}
        onChange={(e) => handleParameterChange(rule.id, paramName, e.target.value)}
        className="border rounded px-2 py-1 text-sm flex-1"
      />
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Cleaning Rules Configuration</h3>
      {rules.map((rule) => (
        <div key={rule.id} className="p-4 border rounded-lg bg-zinc-900">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={rule.enabled}
                onChange={() => handleToggleRule(rule.id)}
                className="rounded border-gray-300"
              />
              <span className="font-medium">{rule.name}</span>
            </div>
            <span className="text-sm text-zinc-400">{rule.field}</span>
          </div>
          
          {rule.enabled && rule.parameters && (
            <div className="mt-3 space-y-3 pl-6">
              {Object.entries(rule.parameters).map(([paramName, value]) => (
                <div key={paramName} className="flex items-center space-x-3">
                  <label className="text-sm min-w-[100px]">
                    {paramName.replace(/_/g, ' ')}:
                  </label>
                  {getParameterInput(rule, paramName, value)}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default CleaningRulesConfig;
