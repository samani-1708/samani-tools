"use client";

import { FileUploaded, useFileUpload } from "@/app/common/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EyeIcon, EyeOffIcon, UnlockIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { usePDFUtils } from "../common/use-pdf-utils.hooks";
import { downloadLink } from "@/app/common/utils";
import { PDFToolLayout } from "../common/layouts/pdf-tool-layout";
import { ProcessingButton } from "../common/layouts/processing-button";

export function PageClient() {
  const {
    files,
    fileInputRef,
    handleFileUpload,
    triggerFileInput,
    resetInput,
  } = useFileUpload((f) =>
    Array.from(f).filter((file) => file.type === "application/pdf"),
  );

  const [isLoaded, utils] = usePDFUtils();
  const [isProcessing, setIsProcessing] = useState(false);

  // Password settings
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const fileUploaded: FileUploaded | null = files?.[0] || null;

  async function handleApplyUnlock() {
    if (!fileUploaded || isProcessing) return;

    if (!password) {
      toast.error("Password is required to unlock the PDF");
      return;
    }

    setIsProcessing(true);

    try {
      const buffer = await fileUploaded.file.arrayBuffer();

      const decryptedBytes = await utils.decrypt(buffer, {
        ownerPassword: password,
        userPassword: password,
      });

      const blob = new Blob([decryptedBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      downloadLink(url, `unlocked-${fileUploaded.name}`);

      toast.success("PDF unlocked successfully!");
      handleReset();
    } catch (error) {
      console.error(error);
      toast.error("Failed to unlock PDF. Please check the password.");
    } finally {
      setIsProcessing(false);
    }
  }

  function handleReset() {
    resetInput();
    setPassword("");
  }

  return (
    <PDFToolLayout
      showUpload={files.length === 0}
      uploadProps={{
        title: "Upload Protected PDF",
        subtitle: "Click to select a password-protected PDF",
        label: "Upload PDF",
        fileInputRef,
        handleFileUpload,
        triggerFileInput,
      }}
      sidebarTitle="Unlock PDF"
      sidebarIcon={<UnlockIcon className="w-5 h-5" />}
      content={
        <div className="flex flex-col items-center gap-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-800 rounded overflow-hidden mb-3 flex items-center justify-center w-full max-w-[300px] mx-auto">
              <div className="text-center p-4">
                <UnlockIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  PDF is password protected
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Enter password to unlock
                </p>
              </div>
            </div>
            <p className="text-sm text-center truncate text-gray-700 dark:text-gray-300 max-w-[300px]">
              {fileUploaded?.name}
            </p>
          </div>
        </div>
      }
      controls={
        <>
          {/* Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Enter the password used to protect this PDF. The password will be used to remove encryption and allow full access to the document.
            </p>
          </div>

          {/* Password settings */}
          <form className="flex-1 space-y-6" onSubmit={(e) => { e.preventDefault(); handleApplyUnlock(); }}>
            {/* Password */}
            <div>
              <Label htmlFor="password" className="text-sm font-medium">
                PDF Password
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Enter the password to unlock this PDF
              </p>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? (
                    <EyeOffIcon className="w-4 h-4" />
                  ) : (
                    <EyeIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </form>
        </>
      }
      actions={
        <ProcessingButton
          onClick={handleApplyUnlock}
          disabled={!password}
          isProcessing={isProcessing}
          label="Unlock PDF"
          processingLabel="Unlocking..."
        />
      }
    />
  );
}
