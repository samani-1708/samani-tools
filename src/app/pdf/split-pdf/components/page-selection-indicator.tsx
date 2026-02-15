"use client";

import { Check } from "lucide-react";

interface PageSelectionIndicatorProps {
  isSelected?: boolean;
  onToggle?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
}

export function PageSelectionIndicator(props: PageSelectionIndicatorProps) {
  const { isSelected = false, onToggle } = props;

  const handleClick = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
    console.log("PageSelectionIndicator clicked", isSelected);
    onToggle?.(e);
  };

  return (
    <div
      onClick={handleClick}
      className="absolute top-2 left-2 cursor-pointer rounded-full w-8 h-8 inline-flex items-center justify-center"
      style={{
        width: "32px",
        height: "32px",
        borderRadius: "8px",
        backgroundColor: isSelected ? "#22c55e" : "transparent",
        border: isSelected ? "none" : "2px solid #d1d5db",
        transition: "all 0.2s ease",
      }}
    >
      {isSelected && <Check size={20} color="white" strokeWidth={3} />}
    </div>
  );
}
