import { Button } from "@/components/ui/button";
import { ArrowRightIcon, Loader2Icon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProcessingButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isProcessing: boolean;
  label: string;
  processingLabel?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function ProcessingButton({
  onClick,
  disabled,
  isProcessing,
  label,
  processingLabel = "Processing...",
  icon,
  className,
}: ProcessingButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || isProcessing}
      className={cn("w-full h-10 sm:h-12 text-sm sm:text-base font-semibold text-white rounded-lg", className)}
    >
      {isProcessing ? (
        <>
          {processingLabel}
          <Loader2Icon className="w-5 h-5 animate-spin ml-2" />
        </>
      ) : (
        <>
          {label}
          {icon || <ArrowRightIcon className="w-5 h-5 ml-2" />}
        </>
      )}
    </Button>
  );
}
