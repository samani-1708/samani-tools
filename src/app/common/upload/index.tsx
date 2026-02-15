"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Upload } from "lucide-react";
import { InputHTMLAttributes } from "react";

interface UploadButtonFullProps extends UploadButtonProps {
  title: string;
  subtitle: string;
  label: string;
}

export function UploadButtonFull(props: UploadButtonFullProps) {
  const {
    fileInputRef,
    handleFileUpload,
    triggerFileInput,
    title,
    subtitle,
    label,
  } = props;
  return (
    <Card className="">
      <CardContent className="pt-6">
        <div
          onClick={triggerFileInput}
          className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
        >
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className="text-muted-foreground mb-4">{subtitle}</p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {label}
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple={props.multiple}
          accept={props.accept}
          onChange={handleFileUpload}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
}

interface UploadButtonProps {
  label: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  triggerFileInput: () => void;
  accept: InputHTMLAttributes<HTMLInputElement>['accept'];
  multiple?: boolean
}

export function UploadButton(props: UploadButtonProps) {
  const { fileInputRef, handleFileUpload, triggerFileInput, label, multiple = false } = props;
  return (
    <>
      <Button onClick={triggerFileInput} variant="outline" className="mx-2">
        <Upload className="h-4 w-4 " />
        <span className="hidden sm:inline-block">{label}</span>
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={props.accept}
        onChange={handleFileUpload}
        className="hidden"
      />
    </>
  );
}
