"use client";

import { UploadButtonFull } from "@/app/common/upload";
import { cn } from "@/lib/utils";
import { SettingsIcon } from "lucide-react";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface PDFToolLayoutProps {
  showUpload: boolean;
  uploadProps: {
    multiple?: boolean;
    accept?: string;
    title: string;
    subtitle: string;
    label?: string;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    triggerFileInput: () => void;
  };
  sidebarTitle: string;
  sidebarIcon?: React.ReactNode;
  sidebarWidth?: "sm" | "md";
  content: React.ReactNode;
  controls: React.ReactNode;
  /** Primary action shown in mobile bottom bar + sidebar + sheet */
  actions: React.ReactNode;
  /** Extra actions only shown in sidebar/sheet, not in mobile bottom bar */
  secondaryActions?: React.ReactNode;
  disabled?: boolean;
}

export function PDFToolLayout({
  showUpload,
  uploadProps,
  sidebarTitle,
  sidebarIcon,
  sidebarWidth = "md",
  content,
  controls,
  actions,
  secondaryActions,
  disabled,
}: PDFToolLayoutProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  if (showUpload) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <UploadButtonFull
          multiple={uploadProps.multiple ?? false}
          accept={uploadProps.accept ?? "application/pdf"}
          title={uploadProps.title}
          subtitle={uploadProps.subtitle}
          label={uploadProps.label ?? "Upload PDF"}
          fileInputRef={uploadProps.fileInputRef}
          handleFileUpload={uploadProps.handleFileUpload}
          triggerFileInput={uploadProps.triggerFileInput}
        />
      </div>
    );
  }

  const widthClass = sidebarWidth === "sm" ? "lg:w-80" : "lg:w-96";

  return (
    <div
      className={cn(
        "h-full flex flex-col lg:flex-row overflow-hidden",
        disabled && "pointer-events-none"
      )}
    >
      {/* Content area — extra bottom padding on mobile for the sticky bar */}
      <div className="flex-1 p-4 sm:p-6 overflow-auto pb-24 lg:pb-6">
        {content}
      </div>

      {/* Desktop sidebar */}
      <div
        className={cn(
          widthClass,
          "hidden lg:flex border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-6 flex-col overflow-auto"
        )}
      >
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          {sidebarIcon}
          {sidebarTitle}
        </h2>
        <div className="flex-1 flex flex-col">{controls}</div>
        <div className="mt-6 space-y-3">
          {actions}
          {secondaryActions}
        </div>
      </div>

      {/* Mobile sticky bottom bar — only primary action + settings */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center gap-3 z-40">
        <Button
          onClick={() => setSheetOpen(true)}
          variant="outline"
          size="sm"
          className="flex-shrink-0 h-10"
        >
          <SettingsIcon className="w-4 h-4 mr-1.5" />
          Settings
        </Button>
        <div className="flex-1 min-w-0">{actions}</div>
      </div>

      {/* Mobile bottom sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {sidebarIcon}
              {sidebarTitle}
            </SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="flex flex-col">{controls}</div>
            <div className="mt-6 space-y-3">
              {actions}
              {secondaryActions}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
