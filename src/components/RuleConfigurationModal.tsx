'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { cn } from '@/utils/utils';
import settings from '../../public/cleaning_rules_settings.json';
import { CleaningRuleTemplate, CleaningRulesSettings, ParameterSchema } from '@/types/cleaningRules';

const cleaningRulesSettings = settings as unknown as CleaningRulesSettings;

interface RuleConfigurationModalProps {
  ruleTypes: string[];
  onConfigure: (config: { type: string; parameters: Record<string, any> }) => void;
  onClose: () => void;
  className?: string;
}

function validateParameters(parameters: Record<string, any>, template: CleaningRuleTemplate): boolean {
  for (const [name, schema] of Object.entries(template.parameters)) {
    if (schema.required && (parameters[name] === undefined || parameters[name] === '')) {
      return false;
    }

    if (parameters[name] !== undefined) {
      const value = parameters[name];
      
      switch (schema.type.toLowerCase()) {
        case 'number':
          if (typeof value !== 'number' || 
              (schema.min !== undefined && value < schema.min) || 
              (schema.max !== undefined && value > schema.max)) {
            return false;
          }
          break;
        case 'array':
          if (!Array.isArray(value)) {
            return false;
          }
          break;
        case 'object':
          if (typeof value !== 'object' || value === null) {
            return false;
          }
          break;
      }

      if (schema.options && !schema.options.includes(value)) {
        return false;
      }
    }
  }
  return true;
}

export function RuleConfigurationModal({
  ruleTypes,
  onConfigure,
  onClose,
  className
}: RuleConfigurationModalProps) {
  const [selectedType, setSelectedType] = useState<string>(ruleTypes[0] || '');
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedRule = cleaningRulesSettings.cleaningRules.find(r => r.id === selectedType);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType || !selectedRule) return;

    // Clear previous errors
    setErrors({});

    // Validate parameters
    const newErrors: Record<string, string> = {};
    for (const [name, schema] of Object.entries(selectedRule.parameters)) {
      if (schema.required && (parameters[name] === undefined || parameters[name] === '')) {
        newErrors[name] = 'This field is required';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!validateParameters(parameters, selectedRule)) {
      setErrors({ form: 'Please check all parameter values are valid' });
      return;
    }

    onConfigure({
      type: selectedType,
      parameters: parameters
    });
    onClose();
  };

  const handleParameterChange = (name: string, value: any) => {
    setParameters(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user makes a change
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const renderParameterInput = (name: string, schema: ParameterSchema) => {
    const value = parameters[name] || '';

    if (schema.options) {
      return (
        <div>
          <select
            value={value}
            onChange={(e) => handleParameterChange(name, e.target.value)}
            className={cn(
              "w-full px-3 py-2 border rounded-md",
              errors[name] && "border-red-500"
            )}
            required={schema.required}
          >
            <option value="">Select {name.replace(/_/g, ' ')}</option>
            {schema.options.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errors[name] && (
            <p className="text-sm text-red-500 mt-1">{errors[name]}</p>
          )}
        </div>
      );
    }

    switch (schema.type.toLowerCase()) {
      case 'array':
        return (
          <div>
            <input
              type="text"
              value={Array.isArray(value) ? value.join(', ') : value}
              onChange={(e) => handleParameterChange(name, e.target.value.split(',').map(s => s.trim()))}
              className={cn(
                "w-full px-3 py-2 border rounded-md",
                errors[name] && "border-red-500"
              )}
              required={schema.required}
              placeholder="Enter comma-separated values"
            />
            {errors[name] && (
              <p className="text-sm text-red-500 mt-1">{errors[name]}</p>
            )}
          </div>
        );
      case 'object':
        // For objects, we'll use a JSON editor
        return (
          <div>
            <textarea
              value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  handleParameterChange(name, parsed);
                } catch {
                  // If it's not valid JSON yet, store as string
                  handleParameterChange(name, e.target.value);
                }
              }}
              className={cn(
                "w-full px-4 py-3 border rounded-md font-mono text-sm",
                "min-h-[150px] resize-y transition-all duration-200",
                "focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm hover:shadow",
                errors[name] && "border-red-500 focus:ring-red-400"
              )}
              rows={6}
              spellCheck="false"
            />
            {errors[name] && (
              <p className="text-sm text-red-500 mt-1">{errors[name]}</p>
            )}
          </div>
        );
      case 'number':
        return (
          <div>
            <input
              type="number"
              value={value}
              onChange={(e) => handleParameterChange(name, Number(e.target.value))}
              className={cn(
                "w-full px-3 py-2 border rounded-md",
                errors[name] && "border-red-500"
              )}
              required={schema.required}
              min={schema.min}
              max={schema.max}
            />
            {errors[name] && (
              <p className="text-sm text-red-500 mt-1">{errors[name]}</p>
            )}
          </div>
        );
      default:
        return (
          <div>
            <input
              type="text"
              value={typeof value === 'object' ? JSON.stringify(value) : value}
              onChange={(e) => handleParameterChange(name, e.target.value)}
              className={cn(
                "w-full px-3 py-2 border rounded-md",
                errors[name] && "border-red-500"
              )}
              required={schema.required}
            />
            {errors[name] && (
              <p className="text-sm text-red-500 mt-1">{errors[name]}</p>
            )}
          </div>
        );
    }
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className={cn("sm:max-w-[425px]", className)}>
        <DialogHeader>
          <DialogTitle>Configure Cleaning Rule</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Rule Type</label>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setParameters({});
                setErrors({});
              }}
              className="w-full px-3 py-2 border rounded-md"
            >
              {ruleTypes.map(type => {
                const rule = cleaningRulesSettings.cleaningRules.find(r => r.id === type);
                return (
                  <option key={type} value={type}>
                    {rule?.name || type}
                  </option>
                );
              })}
            </select>
          </div>

          {selectedRule && Object.entries(selectedRule.parameters).map(([name, schema]) => (
            <div key={name} className="space-y-2">
              <label className="text-sm font-medium capitalize">
                {name.replace(/_/g, ' ')}
                {schema.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {renderParameterInput(name, schema)}
            </div>
          ))}

          {errors.form && (
            <p className="text-sm text-red-500">{errors.form}</p>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Add Rule
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
