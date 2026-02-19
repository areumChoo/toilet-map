"use client";

export type MapFilterType = "all" | "free";

interface MapFilterProps {
  filter: MapFilterType;
  onFilterChange: (filter: MapFilterType) => void;
}

const options: { value: MapFilterType; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "free", label: "자유 이용" },
];

export default function MapFilter({ filter, onFilterChange }: MapFilterProps) {
  return (
    <div className="absolute left-1/2 top-3 z-30 -translate-x-1/2">
      <div className="flex gap-1.5 rounded-full bg-white/90 px-2 py-1.5 shadow-md backdrop-blur-sm">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onFilterChange(opt.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === opt.value
                ? "bg-blue-500 text-white"
                : "text-gray-600 active:bg-gray-100"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
