'use client';
import React from 'react';
import { CleaningRule } from '@/types';
import { cn } from '@/utils/utils';

interface CleaningRulesConfigProps {
  rules: CleaningRule[];
  onRulesChange: (rules: CleaningRule[]) => void;
}

interface ParameterInputProps {
  type: 'boolean' | 'number' | 'text' | 'object';
  value: any;
  onChange: (value: any) => void;
  className?: string;
}

function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

function ParameterInput({ type, value, onChange, className }: ParameterInputProps) {
  switch (type) {
    case 'boolean':
      return (
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className={cn("form-checkbox h-4 w-4", className)}
        />
      );
    case 'number':
      return (
        <input
          type="number"
          value={value ?? ''}
          onChange={(e) => onChange(Number(e.target.value))}
          className={cn("w-full px-2 py-1 border rounded", className)}
        />
      );
    case 'object':
      return (
        <textarea
          value={formatValue(value)}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              onChange(parsed);
            } catch {
              // If it's not valid JSON yet, store as string
              onChange(e.target.value);
            }
          }}
          className={cn("w-full px-2 py-1 border rounded font-mono text-sm", className)}
          rows={4}
        />
      );
    default:
      return (
        <input
          type="text"
          value={formatValue(value)}
          onChange={(e) => onChange(e.target.value)}
          className={cn("w-full px-2 py-1 border rounded", className)}
        />
      );
  }
}

function CleaningRulesConfig({ rules, onRulesChange }: CleaningRulesConfigProps) {
  const handleToggleRule = (ruleId: string) => {
    const updatedRules = rules.map((rule: CleaningRule) => 
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    );
    onRulesChange(updatedRules);
  };

  const handleParameterChange = (ruleId: string, paramName: string, value: any) => {
    const updatedRules = rules.map((rule: CleaningRule) =>
      rule.id === ruleId ? { 
        ...rule, 
        parameters: { ...rule.parameters, [paramName]: value } 
      } : rule
    );
    onRulesChange(updatedRules);
  };

  const getParameterType = (value: any): 'boolean' | 'number' | 'text' | 'object' => {
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'object' && value !== null) return 'object';
    return 'text';
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Cleaning Rules Configuration</h3>
      {rules.map((rule: CleaningRule) => (
        <div key={rule.id} className="p-4 border rounded-lg bg-zinc-900">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={rule.enabled}
                onChange={() => handleToggleRule(rule.id)}
                className="form-checkbox h-4 w-4"
              />
              <h4 className="font-medium">{rule.name}</h4>
            </div>
            <span className="text-sm text-gray-400">{rule.operation}</span>
          </div>
          <div className="space-y-4">
            {Object.entries(rule.parameters).map(([paramName, paramValue]) => (
              <div key={paramName} className="grid grid-cols-2 gap-4 items-center">
                <label className="text-sm font-medium capitalize">
                  {paramName.replace(/_/g, ' ')}
                </label>
                <ParameterInput
                  type={getParameterType(paramValue)}
                  value={paramValue}
                  onChange={(value) => handleParameterChange(rule.id, paramName, value)}
                  className="bg-zinc-800"
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default CleaningRulesConfig;
