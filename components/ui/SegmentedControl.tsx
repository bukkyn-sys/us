"use client";

interface SegmentedControlProps<T extends string> {
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div className="flex bg-cream2 rounded-[10px] p-[3px] gap-[2px]">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex-1 py-1.5 rounded-[8px] text-[12px] font-[500] transition-colors duration-100 ${
              active
                ? "bg-card text-ink border-[0.5px] border-[rgba(44,40,32,0.10)]"
                : "text-ink3"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
