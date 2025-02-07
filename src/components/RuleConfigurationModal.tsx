import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
const settings = require('../../public/cleaning_rules_settings.json') as {
  cleaningRules: Record<string, {
    type: string;
    parameters: Record<string, ParameterSchema>;
  }>;
};

interface RuleConfigurationModalProps {
  ruleTypes: string[];
  onConfigure: (config: { type: string; parameters: any }) => void;
  onClose: () => void;
  className?: string;
}

interface ParameterSchema {
  type: 'string' | 'number' | 'array' | 'object';
  required?: boolean;
  options?: string[];
  properties?: Record<string, ParameterSchema>;
}

function isParameterSchema(obj: any): obj is ParameterSchema {
  return obj && typeof obj.type === 'string';
}

export function RuleConfigurationModal({
  ruleTypes,
  onConfigure,
  onClose,
  className
}: RuleConfigurationModalProps) {
  const [selectedType, setSelectedType] = useState('');
  const [parameters, setParameters] = useState<Record<string, any>>({});

  const ruleConfig = selectedType 
    ? (settings.cleaningRules as Record<string, any>)[selectedType] 
    : null;

  const handleSubmit = () => {
    if (!selectedType || !ruleConfig) return;
    onConfigure({
      type: ruleConfig.type,
      parameters
    });
    onClose();
  };

  return (
    <Dialog 
      open={true} 
      onOpenChange={(open: boolean) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="text-center sm:text-left">
          <DialogTitle className="text-lg font-semibold">
            Configure Cleaning Rule
          </DialogTitle>
        </DialogHeader>
        
        <div className={`mt-4 space-y-4 ${className || ''}`}>
          <select 
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full p-2 border rounded"
          >
              <option value="">Select Rule Type</option>
              {ruleTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            {ruleConfig && Object.entries(ruleConfig.parameters).map(([param, schema]) => {
              const typedSchema = schema as ParameterSchema;
              return (
                <div key={param} className="space-y-2">
                  <label className="block text-sm font-medium">{param}{typedSchema.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}</label>
                  <input
                    type={typedSchema.type === 'number' ? 'number' : 'text'}
                    className="w-full p-2 border rounded"
                    onChange={(e) => setParameters(prev => ({
                      ...prev,
                      [param]: typedSchema.type === 'number' 
                        ? Number(e.target.value) 
                        : e.target.value
                    }))}
                  />
                </div>
              );
            })}

            <Button 
              onClick={handleSubmit}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            >
              Add Rule
            </Button>
          </div>
      </DialogContent>
    </Dialog>
  );
}
