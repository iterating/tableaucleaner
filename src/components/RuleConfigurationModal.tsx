'use client';
import { useState, useEffect, RefObject } from 'react';
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
  buttonRef?: RefObject<HTMLButtonElement>;
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
  className,
  buttonRef
}: RuleConfigurationModalProps) {
  const [selectedType, setSelectedType] = useState<string>(ruleTypes[0] || '');
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const selectedRule = cleaningRulesSettings.cleaningRules.find(r => r.id === selectedType);

  // Calculate position based on button ref
  useEffect(() => {
    if (buttonRef?.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      // Position the modal above the button with a small offset
      setPosition({
        top: rect.top - 10,
        left: rect.left
      });
    }
  }, [buttonRef]);

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
              "w-full px-3 py-2 bg-zinc-700 text-zinc-200 border border-zinc-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              errors[name] && "border-red-400"
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
            <p className="text-sm text-red-400 mt-1">{errors[name]}</p>
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
                "w-full px-3 py-2 bg-zinc-700 text-zinc-200 border border-zinc-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                errors[name] && "border-red-400"
              )}
              required={schema.required}
              placeholder="Enter comma-separated values"
            />
            {errors[name] && (
              <p className="text-sm text-red-400 mt-1">{errors[name]}</p>
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
                "w-full px-4 py-3 bg-zinc-700 text-zinc-200 border border-zinc-600 rounded-md font-mono text-sm",
                "min-h-[150px] resize-y transition-all duration-200",
                "focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm hover:shadow",
                errors[name] && "border-red-400 focus:ring-red-400"
              )}
              rows={6}
              spellCheck="false"
            />
            {errors[name] && (
              <p className="text-sm text-red-400 mt-1">{errors[name]}</p>
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
                "w-full px-3 py-2 bg-zinc-700 text-zinc-200 border border-zinc-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                errors[name] && "border-red-400"
              )}
              required={schema.required}
              min={schema.min}
              max={schema.max}
            />
            {errors[name] && (
              <p className="text-sm text-red-400 mt-1">{errors[name]}</p>
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
                "w-full px-3 py-2 bg-zinc-700 text-zinc-200 border border-zinc-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                errors[name] && "border-red-400"
              )}
              required={schema.required}
            />
            {errors[name] && (
              <p className="text-sm text-red-400 mt-1">{errors[name]}</p>
            )}
          </div>
        );
    }
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent 
        className={cn(
          "sm:max-w-[425px] absolute",
          "bg-zinc-800 border border-zinc-700 shadow-xl rounded-lg",
          "z-50", // Ensure high z-index to appear above other content
          className
        )}
        style={{
          position: 'fixed',
          top: `${buttonRef ? position.top : '50%'}px`,
          left: `${buttonRef ? position.left : '50%'}px`,
          transform: buttonRef ? 'translateY(-100%)' : 'translate(-50%, -50%)',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-zinc-100">Configure Cleaning Rule</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-200">Rule Type</label>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setParameters({});
                setErrors({});
              }}
              className="w-full px-3 py-2 bg-zinc-700 text-zinc-200 border border-zinc-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <label className="text-sm font-medium text-zinc-200 capitalize">
                {name.replace(/_/g, ' ')}
                {schema.required && <span className="text-red-400 ml-1">*</span>}
              </label>
              {renderParameterInput(name, schema)}
            </div>
          ))}

          {errors.form && (
            <p className="text-sm text-red-400">{errors.form}</p>
          )}

          <div className="flex justify-end space-x-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="bg-zinc-700 text-zinc-200 border-zinc-600 hover:bg-zinc-600">
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">
              Add Rule
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
