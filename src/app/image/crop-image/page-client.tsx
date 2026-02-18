"use client";

import { UploadButtonFull } from "@/app/common/upload";
import { useFileUpload } from "@/app/common/hooks";
import { filterImageFiles } from "@/app/image/common/filter-image-files";
import { useImageUtils } from "@/app/image/common/use-image-utils.hooks";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Cropper } from "react-advanced-cropper";
import type { CropperRef } from "react-advanced-cropper";
import {
  DownloadIcon,
  FlipHorizontal,
  FlipVertical,
  ImagePlus,
  Maximize,
  RotateCcw,
  RotateCw,
  Scissors,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { type WheelEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  EncodableImageFormat,
  downloadBlob,
  formatBytes,
  getBaseName,
} from "../common/image-utils";
import { QualitySlider } from "../common/quality-slider";
import "./cropper.css";

type FlipMode = "none" | "horizontal" | "vertical" | "both";

export function PageClient() {
  // 1) Props
  // No props for this page component.

  // 2) State
  const cropperRef = useRef<CropperRef>(null);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [quality, setQuality] = useState(100);
  const [isCropping, setIsCropping] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; url: string } | null>(null);

  // 3) Custom hooks
  const [isLoaded, imageUtils] = useImageUtils();
  const { files, fileInputRef, handleFileUpload, triggerFileInput, resetInput } = useFileUpload(filterImageFiles);

  // 4) Derived props and state
  const file = files[0]?.file;
  const isPng = file?.type === "image/png";
  const flipMode: FlipMode =
    flipH && flipV ? "both" : flipH ? "horizontal" : flipV ? "vertical" : "none";

  // 5) Utils
  function resizeStencil(widthMultiplier = 1, heightMultiplier = 1) {
    const cropper = cropperRef.current;
    if (!cropper) return;

    const initialCoordinates = cropper.getCoordinates();
    if (!initialCoordinates) return;

    cropper.setCoordinates([
      ({ coordinates }) =>
        coordinates && {
          width: coordinates.width * widthMultiplier,
          height: coordinates.height * heightMultiplier,
        },
      ({ coordinates, imageSize }) =>
        coordinates &&
        (coordinates.width >= imageSize.width || coordinates.height >= imageSize.height
          ? { left: 0, top: 0 }
          : {
              left:
                initialCoordinates.left +
                (initialCoordinates.width - coordinates.width) / 2,
              top:
                initialCoordinates.top +
                (initialCoordinates.height - coordinates.height) / 2,
            }),
    ]);
  }

  // 6) Handlers
  function handleZoomIn() {
    resizeStencil(0.85, 0.85);
  }

  function handleZoomOut() {
    resizeStencil(1.2, 1.2);
  }

  function preventWheelZoom(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();
  }

  function handleFit() {
    cropperRef.current?.reset();
    setFlipH(false);
    setFlipV(false);
    setRotation(0);
  }

  function handleRotate(delta: number) {
    cropperRef.current?.rotateImage(delta);
    setRotation((prev) => (prev + delta + 360) % 360);
  }

  function handleFlipHorizontal() {
    cropperRef.current?.flipImage(true, false);
    setFlipH((prev) => !prev);
  }

  function handleFlipVertical() {
    cropperRef.current?.flipImage(false, true);
    setFlipV((prev) => !prev);
  }

  async function handleCrop() {
    if (!file || isCropping) return;

    const coordinates = cropperRef.current?.getCoordinates();
    if (!coordinates) {
      toast.error("Crop area is not ready yet");
      return;
    }

    setIsCropping(true);
    if (result?.url) URL.revokeObjectURL(result.url);
    setResult(null);

    try {
      const format: EncodableImageFormat = isPng ? "image/png" : "image/jpeg";
      const blob = await imageUtils.crop(file, {
        area: {
          x: coordinates.left,
          y: coordinates.top,
          width: coordinates.width,
          height: coordinates.height,
        },
        format,
        quality: isPng ? undefined : quality / 100,
        rotation: rotation !== 0 ? rotation : undefined,
        flip: flipMode !== "none" ? flipMode : undefined,
      });

      const url = URL.createObjectURL(blob);
      setResult({ blob, url });
      toast.success("Image cropped successfully");
    } catch (error) {
      toast.error((error as Error).message || "Crop failed");
    } finally {
      setIsCropping(false);
    }
  }

  function handleDownload() {
    if (!file || !result) return;
    const ext = isPng ? "png" : "jpg";
    downloadBlob(result.blob, `${getBaseName(file.name)}-cropped.${ext}`);
  }

  function handleStartOver() {
    if (result?.url) URL.revokeObjectURL(result.url);
    setResult(null);
    setFlipH(false);
    setFlipV(false);
    setRotation(0);
    setQuality(100);
    resetInput();
  }

  // 7) Effects
  useEffect(() => {
    setResult((previous) => {
      if (previous?.url) URL.revokeObjectURL(previous.url);
      return null;
    });
  }, [file, flipH, flipV, rotation]);

  useEffect(() => {
    return () => {
      if (result?.url) URL.revokeObjectURL(result.url);
    };
  }, [result?.url]);

  useEffect(() => {
    cropperRef.current?.reset();
    setFlipH(false);
    setFlipV(false);
    setRotation(0);
  }, [file]);

  // 8) Render
  if (!file) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <UploadButtonFull
          title="Upload Image"
          subtitle="Choose one image to crop"
          label="Upload Image"
          accept="image/*,.heic,.heif"
          fileInputRef={fileInputRef}
          handleFileUpload={handleFileUpload}
          triggerFileInput={triggerFileInput}
        />
      </div>
    );
  }

  return (
    <div className="h-full overflow-x-hidden">
      <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 space-y-4">
        {!result ? (
          <>
            <div
              className={`set-coordinates-example`}
              onWheel={preventWheelZoom}
              onWheelCapture={preventWheelZoom}
            >
              <Cropper
                ref={cropperRef}
                src={files[0].url}
                className="set-coordinates-example__cropper"
                stencilProps={{ minAspectRatio: 1 / 2 }}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={handleZoomIn} aria-label="Zoom in">
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent sideOffset={8}>Zoom In</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={handleZoomOut} aria-label="Zoom out">
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent sideOffset={8}>Zoom Out</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={handleFit} aria-label="Fit to image">
                    <Maximize className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent sideOffset={8}>Fit</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={() => handleRotate(-45)} aria-label="Rotate left">
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent sideOffset={8}>Rotate -45</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={() => handleRotate(45)} aria-label="Rotate right">
                    <RotateCw className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent sideOffset={8}>Rotate +45</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={flipH ? "default" : "outline"}
                    size="icon"
                    onClick={handleFlipHorizontal}
                    aria-label="Flip horizontal"
                  >
                    <FlipHorizontal className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent sideOffset={8}>Flip Horizontal</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={flipV ? "default" : "outline"}
                    size="icon"
                    onClick={handleFlipVertical}
                    aria-label="Flip vertical"
                  >
                    <FlipVertical className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent sideOffset={8}>Flip Vertical</TooltipContent>
              </Tooltip>
              <Button
                size="sm"
                onClick={handleCrop}
                disabled={isCropping || !isLoaded}
                className="ml-auto"
              >
                <Scissors className="w-4 h-4 mr-2" />
                {isCropping ? "Cropping..." : "Crop Image"}
              </Button>
            </div>

            {!isPng && (
              <QualitySlider value={quality} onChange={setQuality} disabled={isCropping} />
            )}
          </>
        ) : (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center w-full gap-3">
                <img
                  src={result.url}
                  alt="Cropped"
                  className="max-h-[70vh] max-w-full rounded-lg border bg-muted"
                />
                <p className="text-sm text-muted-foreground">{formatBytes(result.blob.size)}</p>
              </div>

            <div className="flex flex-wrap gap-2 justify-end">
              <Button variant="outline" onClick={handleStartOver}>
                <ImagePlus className="w-4 h-4 mr-2" />
                Crop Another
              </Button>
              <Button onClick={handleDownload}>
                <DownloadIcon className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
