"use client";

import { Label } from "@/components/ui/label";

interface QualitySliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

export function QualitySlider({
  value,
  onChange,
  disabled = false,
  min = 10,
  max = 100,
  step = 1,
}: QualitySliderProps) {
  return (
    <div className="space-y-2 mb-5">
      <Label htmlFor="quality">Quality: {value}%</Label>
      <input
        id="quality"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        disabled={disabled}
      />
    </div>
  );
}
