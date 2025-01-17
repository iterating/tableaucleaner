import { CleaningRule, TableauDataset } from '@/domain/entities/TableauData';

interface RulesListProps {
  rules: CleaningRule[];
  dataset: TableauDataset;
  onAddRule: (rule: CleaningRule) => void;
}

export function RulesList({ rules, dataset, onAddRule }: RulesListProps) {
  return (
    <div className="rules-section">
      <h2 className="text-2xl font-semibold mb-4">Cleaning Rules</h2>
      <div className="space-y-4">
        {rules.map((rule, index) => (
          <div key={index} className="rule-item">
            <p className="font-semibold">Rule {index + 1}</p>
            <p>Field: {rule.field}</p>
            <p>Operation: {rule.operation}</p>
          </div>
        ))}
        <button
          onClick={() => onAddRule({
            id: String(Date.now()),
            field: dataset.headers[0],
            operation: 'trim',
            parameters: {}
          })}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add Rule
        </button>
      </div>
    </div>
  );
}
