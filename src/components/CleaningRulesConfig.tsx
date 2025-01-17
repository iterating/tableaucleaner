'use client';
import React from 'react';
import { CleaningRules } from '@/domain/entities/TableauData';

interface CleaningRulesConfigProps {
  rules: CleaningRules;
  onRulesChange: (rules: CleaningRules) => void;
}

const CleaningRulesConfig: React.FC<CleaningRulesConfigProps> = ({
  rules,
  onRulesChange,
}) => {
  const handleToggleRule = (ruleName: string) => {
    const updatedRules = {
      ...rules,
      cleaningRules: {
        ...rules.cleaningRules,
        [ruleName]: {
          ...rules.cleaningRules[ruleName as keyof typeof rules.cleaningRules],
          enabled: !rules.cleaningRules[ruleName as keyof typeof rules.cleaningRules].enabled,
        },
      },
    };
    onRulesChange(updatedRules);
  };

  const handleNumberChange = (
    ruleName: string,
    field: string,
    value: string
  ) => {
    const numValue = value === '' ? 0 : Number(value);
    const updatedRules = {
      ...rules,
      cleaningRules: {
        ...rules.cleaningRules,
        [ruleName]: {
          ...rules.cleaningRules[ruleName as keyof typeof rules.cleaningRules],
          [field]: numValue,
        },
      },
    };
    onRulesChange(updatedRules);
  };

  const handleArrayChange = (
    ruleName: string,
    field: string,
    value: string
  ) => {
    const arrayValue = value.split(',').map((item) => item.trim());
    const updatedRules = {
      ...rules,
      cleaningRules: {
        ...rules.cleaningRules,
        [ruleName]: {
          ...rules.cleaningRules[ruleName as keyof typeof rules.cleaningRules],
          [field]: arrayValue,
        },
      },
    };
    onRulesChange(updatedRules);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Cleaning Rules Configuration</h2>

      <div className="space-y-6">
        {/* Remove Duplicates */}
        <div className="border-b pb-4">
          <div className="flex items-center justify-between">
            <label className="font-semibold">Remove Duplicates</label>
            <input
              type="checkbox"
              checked={rules.cleaningRules.removeDuplicates.enabled}
              onChange={() => handleToggleRule('removeDuplicates')}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
          </div>
          {rules.cleaningRules.removeDuplicates.enabled && (
            <div className="mt-2">
              <label className="block text-sm">Columns (comma-separated)</label>
              <input
                type="text"
                value={rules.cleaningRules.removeDuplicates.columns.join(', ')}
                onChange={(e) =>
                  handleArrayChange('removeDuplicates', 'columns', e.target.value)
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
            </div>
          )}
        </div>

        {/* Handle Missing Values */}
        <div className="border-b pb-4">
          <div className="flex items-center justify-between">
            <label className="font-semibold">Handle Missing Values</label>
            <input
              type="checkbox"
              checked={rules.cleaningRules.handleMissingValues.enabled}
              onChange={() => handleToggleRule('handleMissingValues')}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
          </div>
          {rules.cleaningRules.handleMissingValues.enabled && (
            <div className="mt-2 space-y-2">
              <div>
                <label className="block text-sm">Method</label>
                <select
                  value={rules.cleaningRules.handleMissingValues.method}
                  onChange={(e) =>
                    handleArrayChange('handleMissingValues', 'method', e.target.value)
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                >
                  <option value="mean">Mean</option>
                  <option value="median">Median</option>
                </select>
              </div>
              <div>
                <label className="block text-sm">Columns (comma-separated)</label>
                <input
                  type="text"
                  value={rules.cleaningRules.handleMissingValues.columns.join(', ')}
                  onChange={(e) =>
                    handleArrayChange('handleMissingValues', 'columns', e.target.value)
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
              </div>
            </div>
          )}
        </div>

        {/* Normalize Blood Sugar Levels */}
        <div className="border-b pb-4">
          <div className="flex items-center justify-between">
            <label className="font-semibold">Normalize Blood Sugar Levels</label>
            <input
              type="checkbox"
              checked={rules.cleaningRules.normalizeBloodSugarLevels.enabled}
              onChange={() => handleToggleRule('normalizeBloodSugarLevels')}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
          </div>
          {rules.cleaningRules.normalizeBloodSugarLevels.enabled && (
            <div className="mt-2 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm">Min Value</label>
                <input
                  type="number"
                  value={rules.cleaningRules.normalizeBloodSugarLevels.minValue}
                  onChange={(e) =>
                    handleNumberChange(
                      'normalizeBloodSugarLevels',
                      'minValue',
                      e.target.value
                    )
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm">Max Value</label>
                <input
                  type="number"
                  value={rules.cleaningRules.normalizeBloodSugarLevels.maxValue}
                  onChange={(e) =>
                    handleNumberChange(
                      'normalizeBloodSugarLevels',
                      'maxValue',
                      e.target.value
                    )
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
              </div>
            </div>
          )}
        </div>

        {/* Add more rule configurations here */}
      </div>

      <div className="mt-6">
        <button
          onClick={() => onRulesChange(rules)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Apply Rules
        </button>
      </div>
    </div>
  );
};

export default CleaningRulesConfig;
