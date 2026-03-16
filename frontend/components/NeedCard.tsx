import { NeedItem, priorityColors, priorityLabels, unitLabels } from '@/lib/api';

interface NeedCardProps {
  need: NeedItem;
  showSection?: boolean;
  sectionName?: string;
}

export default function NeedCard({ need, showSection, sectionName }: NeedCardProps) {
  const progress = need.quantity_required > 0 
    ? Math.min((need.quantity_received / need.quantity_required) * 100, 100) 
    : 0;
  
  const remaining = need.quantity_required - need.quantity_received;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{need.name}</h3>
          {showSection && sectionName && (
            <p className="text-sm text-gray-500">{sectionName}</p>
          )}
        </div>
        <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${priorityColors[need.priority]}`}>
          {priorityLabels[need.priority]}
        </span>
      </div>

      {need.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{need.description}</p>
      )}

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Progress</span>
          <span className="font-medium text-gray-900">{progress.toFixed(0)}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all ${
              progress >= 100 ? 'bg-green-500' : 
              progress >= 50 ? 'bg-blue-500' : 
              progress >= 25 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Quantities */}
      <div className="flex justify-between text-sm">
        <div>
          <span className="text-gray-500">Received: </span>
          <span className="font-medium text-green-600">
            {need.quantity_received} {unitLabels[need.unit]}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Needed: </span>
          <span className={`font-medium ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {remaining > 0 ? remaining : 0} {unitLabels[need.unit]}
          </span>
        </div>
      </div>
    </div>
  );
}
