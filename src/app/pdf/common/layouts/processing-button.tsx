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
  compactOnMobile?: boolean;
}

export function ProcessingButton({
  onClick,
  disabled,
  isProcessing,
  label,
  processingLabel = "Processing...",
  icon,
  className,
  compactOnMobile = true,
}: ProcessingButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || isProcessing}
      className={cn("w-full h-10 sm:h-12 text-sm sm:text-base font-semibold text-white rounded-lg", className)}
    >
      {isProcessing ? (
        <>
          <Loader2Icon className={cn("w-5 h-5 animate-spin", !compactOnMobile && "mr-2")} />
          <span className={cn(compactOnMobile && "hidden sm:inline", !compactOnMobile && "ml-2")}>
            {processingLabel}
          </span>
        </>
      ) : (
        <>
          {icon || <ArrowRightIcon className={cn("w-5 h-5", !compactOnMobile && "mr-2")} />}
          <span className={cn(compactOnMobile && "hidden sm:inline", !compactOnMobile && "ml-2")}>
            {label}
          </span>
        </>
      )}
    </Button>
  );
}
