"use client";

import { FileUploaded, useFileUpload } from "@/app/common/hooks";
import { PDFStatePending } from "@/app/common/pdf-viewer/pdf-states";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EyeIcon, EyeOffIcon, LockIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { toast } from "sonner";
import { usePDFUtils } from "../common/use-pdf-utils.hooks";
import { downloadLink } from "@/app/common/utils";
import { EncryptionMode, EncryptionPermissions } from "../common/types";
import { PDFToolLayout } from "../common/layouts/pdf-tool-layout";
import { ProcessingButton } from "../common/layouts/processing-button";

// WASM pdfcpu only supports 40 and 128-bit keys
type WasmKeyLength = 40 | 128;

const ViewPDF = dynamic(() => import("@/app/common/pdf-viewer/pdf-viewer"), {
  ssr: false,
  loading: () => <PDFStatePending header="Loading" subHeader="" />,
});

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
  const [ownerPassword, setOwnerPassword] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [showOwnerPassword, setShowOwnerPassword] = useState(false);
  const [showUserPassword, setShowUserPassword] = useState(false);
  const [encryptionMode, setEncryptionMode] = useState<EncryptionMode>("aes");
  const [keyLength, setKeyLength] = useState<WasmKeyLength>(128);
  const [permissions, setPermissions] = useState<EncryptionPermissions>("none");

  const fileUploaded: FileUploaded | null = files?.[0] || null;

  async function handleApplyLock() {
    if (!fileUploaded || isProcessing) return;

    if (!ownerPassword) {
      toast.error("Owner password is required");
      return;
    }

    setIsProcessing(true);

    try {
      const buffer = await fileUploaded.file.arrayBuffer();

      const encryptedBytes = await utils.encrypt(buffer, {
        ownerPassword,
        userPassword: userPassword || undefined,
        mode: encryptionMode,
        keyLength,
        permissions,
      });

      const blob = new Blob([encryptedBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      downloadLink(url, `locked-${fileUploaded.name}`);

      toast.success("PDF locked successfully!");
      handleReset();
    } catch (error) {
      console.error(error);
      toast.error("Failed to lock PDF");
    } finally {
      setIsProcessing(false);
    }
  }

  function handleReset() {
    resetInput();
    setOwnerPassword("");
    setUserPassword("");
  }

  return (
    <PDFToolLayout
      showUpload={files.length === 0}
      uploadProps={{
        title: "Upload PDF File",
        subtitle: "Click to select a PDF to lock",
        label: "Upload PDF",
        fileInputRef,
        handleFileUpload,
        triggerFileInput,
      }}
      sidebarTitle="Lock PDF"
      sidebarIcon={<LockIcon className="w-5 h-5" />}
      content={
        fileUploaded ? (
          <div className="flex flex-col items-center gap-4">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-800 rounded overflow-hidden mb-3 w-full max-w-[300px] mx-auto">
                <ViewPDF
                  src={fileUploaded.file}
                  range={[0]}
                  width={300}
                  forceRefresh
                  defaultOverrides={{
                    pageBetweenMargin: "0px",
                    pageBoxShadow: "none",
                  }}
                />
              </div>
              <p className="text-sm text-center truncate text-gray-700 dark:text-gray-300 max-w-[300px] mx-auto">
                {fileUploaded.name}
              </p>
            </div>
          </div>
        ) : null
      }
      controls={
        <form className="flex-1 space-y-6" onSubmit={(e) => { e.preventDefault(); handleApplyLock(); }}>
          {/* Owner Password */}
          <div>
            <Label htmlFor="ownerPassword" className="text-sm font-medium">
              Owner Password (Required)
            </Label>
            <p className="text-xs text-muted-foreground mb-2">
              Used to modify security settings
            </p>
            <div className="relative">
              <Input
                id="ownerPassword"
                type={showOwnerPassword ? "text" : "password"}
                value={ownerPassword}
                onChange={(e) => setOwnerPassword(e.target.value)}
                placeholder="Enter owner password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowOwnerPassword(!showOwnerPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showOwnerPassword ? (
                  <EyeOffIcon className="w-4 h-4" />
                ) : (
                  <EyeIcon className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* User Password */}
          <div>
            <Label htmlFor="userPassword" className="text-sm font-medium">
              User Password (Optional)
            </Label>
            <p className="text-xs text-muted-foreground mb-2">
              Required to open the PDF
            </p>
            <div className="relative">
              <Input
                id="userPassword"
                type={showUserPassword ? "text" : "password"}
                value={userPassword}
                onChange={(e) => setUserPassword(e.target.value)}
                placeholder="Enter user password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowUserPassword(!showUserPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showUserPassword ? (
                  <EyeOffIcon className="w-4 h-4" />
                ) : (
                  <EyeIcon className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Encryption Mode */}
          <div>
            <Label className="text-sm font-medium">Encryption Mode</Label>
            <Select value={encryptionMode} onValueChange={(v) => setEncryptionMode(v as EncryptionMode)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aes">AES (Recommended)</SelectItem>
                <SelectItem value="rc4">RC4 (Legacy)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Key Length */}
          <div>
            <Label className="text-sm font-medium">Key Length</Label>
            <Select value={keyLength.toString()} onValueChange={(v) => setKeyLength(parseInt(v) as WasmKeyLength)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="128">128-bit (Recommended)</SelectItem>
                <SelectItem value="40">40-bit (Legacy)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Permissions */}
          <div>
            <Label className="text-sm font-medium">Permissions</Label>
            <Select value={permissions} onValueChange={(v) => setPermissions(v as EncryptionPermissions)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Permissions</SelectItem>
                <SelectItem value="print">Allow Printing</SelectItem>
                <SelectItem value="all">All Permissions</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </form>
      }
      actions={
        <ProcessingButton
          onClick={handleApplyLock}
          disabled={!ownerPassword}
          isProcessing={isProcessing}
          label="Lock PDF"
          processingLabel="Locking..."
        />
      }
    />
  );
}
