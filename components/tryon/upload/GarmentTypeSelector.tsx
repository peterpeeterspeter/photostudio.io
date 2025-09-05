'use client';

import { GarmentType } from '@/types/tryon';

interface GarmentTypeSelectorProps {
  value: GarmentType;
  onChange: (type: GarmentType) => void;
}

interface GarmentOption {
  value: GarmentType;
  label: string;
  icon: string; // Emoji or icon class
}

export function GarmentTypeSelector({ value, onChange }: GarmentTypeSelectorProps) {
  const options: GarmentOption[] = [
    { value: 'shirt', label: 'Shirt/Top', icon: '👕' },
    { value: 'dress', label: 'Dress', icon: '👗' },
    { value: 'pants', label: 'Pants', icon: '👖' },
    { value: 'jacket', label: 'Jacket', icon: '🧥' },
    { value: 'hoodie', label: 'Hoodie', icon: '🥽' },
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-700">Garment Type</h3>
      <div className="grid grid-cols-5 gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`
              flex flex-col items-center justify-center p-3 rounded-lg transition-all
              ${value === option.value
                ? 'bg-blue-100 border-blue-500 border-2 text-blue-700'
                : 'bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700'}
            `}
            aria-label={`Select ${option.label}`}
            aria-pressed={value === option.value}
          >
            <span className="text-2xl mb-1">{option.icon}</span>
            <span className="text-xs font-medium">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
