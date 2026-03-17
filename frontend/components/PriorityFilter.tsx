'use client';

interface PriorityFilterProps {
  selected: string | null;
  onChange: (priority: string | null) => void;
}

const priorities = [
  { value: null, label: 'All', color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
  { value: 'CRITICAL', label: 'Critical', color: 'bg-red-100 text-red-700 hover:bg-red-200' },
  { value: 'ESSENTIAL', label: 'Essential', color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
  { value: 'NICE', label: 'Nice to Have', color: 'bg-green-100 text-green-700 hover:bg-green-200' },
];

export default function PriorityFilter({ selected, onChange }: PriorityFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {priorities.map((priority) => (
        <button
          key={priority.value || 'all'}
          onClick={() => onChange(priority.value)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            selected === priority.value
              ? `${priority.color} ring-2 ring-offset-2 ring-blue-500`
              : priority.color
          }`}
        >
          {priority.label}
        </button>
      ))}
    </div>
  );
}
