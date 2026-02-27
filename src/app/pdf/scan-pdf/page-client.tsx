"use client";

import { usePDFUtils } from "../common/use-pdf-utils.hooks";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CameraIcon,
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  Loader2Icon,
  MonitorIcon,
  QrCodeIcon,
  RefreshCcwIcon,
  RotateCcwIcon,
  RotateCwIcon,
  ScissorsIcon,
  SmartphoneIcon,
  SwitchCameraIcon,
  Trash2Icon,
} from "lucide-react";
import { Cropper } from "react-advanced-cropper";
import type { CropperRef } from "react-advanced-cropper";
import { useSearchParams } from "next/navigation";
import QRCode from "qrcode";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { createPDFBlobURL, downloadLink } from "@/app/common/utils";
import "../../image/crop-image/cropper.css";

type CropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ScanImage = {
  id: string;
  name: string;
  originalBlob: Blob;
  url: string;
  blob: Blob;
  rotation: number;
  wasCropped?: boolean;
};

type CaptureSettings = {
  maxWidth: number;
  jpegQuality: number;
  autoCrop: boolean;
};

const ROOM_KEY = "scan-pdf-room-id-v1";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function makeRoomId() {
  return `scan-${Math.random().toString(36).slice(2, 8)}-${Math.random().toString(36).slice(2, 8)}`;
}

async function canvasToBlob(canvas: HTMLCanvasElement, type = "image/jpeg", quality = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Could not export canvas"));
        return;
      }
      resolve(blob);
    }, type, quality);
  });
}

async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Unable to load image"));
    img.src = url;
  });
}

async function renderTransformedImage(item: ScanImage): Promise<Blob> {
  const localUrl = URL.createObjectURL(item.blob);
  const img = await loadImage(localUrl).finally(() => URL.revokeObjectURL(localUrl));
  const normalizedRotation = ((item.rotation % 360) + 360) % 360;
  const radians = (normalizedRotation * Math.PI) / 180;

  const rotatedWidth = normalizedRotation % 180 === 0 ? img.width : img.height;
  const rotatedHeight = normalizedRotation % 180 === 0 ? img.height : img.width;

  const rotatedCanvas = document.createElement("canvas");
  rotatedCanvas.width = rotatedWidth;
  rotatedCanvas.height = rotatedHeight;

  const rotatedCtx = rotatedCanvas.getContext("2d");
  if (!rotatedCtx) throw new Error("Failed to prepare image editor");

  rotatedCtx.translate(rotatedWidth / 2, rotatedHeight / 2);
  rotatedCtx.rotate(radians);
  rotatedCtx.drawImage(img, -img.width / 2, -img.height / 2);
  return canvasToBlob(rotatedCanvas, "image/jpeg", 0.92);
}

function detectDocumentBox(canvas: HTMLCanvasElement): CropRect | null {
  const sampleSize = 240;
  const scale = Math.min(sampleSize / canvas.width, sampleSize / canvas.height, 1);
  const w = Math.max(48, Math.round(canvas.width * scale));
  const h = Math.max(48, Math.round(canvas.height * scale));

  const probe = document.createElement("canvas");
  probe.width = w;
  probe.height = h;
  const pctx = probe.getContext("2d", { willReadFrequently: true });
  if (!pctx) return null;
  pctx.drawImage(canvas, 0, 0, w, h);

  const data = pctx.getImageData(0, 0, w, h).data;
  const luminance = (x: number, y: number) => {
    const i = (y * w + x) * 4;
    return data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722;
  };

  let borderSum = 0;
  let borderCount = 0;
  for (let x = 0; x < w; x++) {
    borderSum += luminance(x, 0) + luminance(x, h - 1);
    borderCount += 2;
  }
  for (let y = 1; y < h - 1; y++) {
    borderSum += luminance(0, y) + luminance(w - 1, y);
    borderCount += 2;
  }
  const borderAvg = borderSum / Math.max(1, borderCount);

  const threshold = 22;
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const lum = luminance(x, y);
      if (Math.abs(lum - borderAvg) > threshold) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX <= minX || maxY <= minY) return null;

  const boxW = maxX - minX + 1;
  const boxH = maxY - minY + 1;
  const areaRatio = (boxW * boxH) / (w * h);
  if (areaRatio < 0.2) return null;

  const pad = 8;
  const sx = clamp(minX - pad, 0, w - 1);
  const sy = clamp(minY - pad, 0, h - 1);
  const ex = clamp(maxX + pad, sx + 1, w);
  const ey = clamp(maxY + pad, sy + 1, h);

  const scaleBackX = canvas.width / w;
  const scaleBackY = canvas.height / h;

  return {
    x: Math.round(sx * scaleBackX),
    y: Math.round(sy * scaleBackY),
    width: Math.round((ex - sx) * scaleBackX),
    height: Math.round((ey - sy) * scaleBackY),
  };
}

function SessionHost() {
  const [roomId, setRoomId] = useState("");
  const [mobileLink, setMobileLink] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [images, setImages] = useState<ScanImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<{ url: string; filename: string } | null>(null);
  const [isApplyingCrop, setIsApplyingCrop] = useState(false);

  const [editorId, setEditorId] = useState<string | null>(null);
  const cropperRef = useRef<CropperRef>(null);

  const seenIdsRef = useRef<Set<string>>(new Set());
  const imagesRef = useRef<ScanImage[]>([]);
  const sinceRef = useRef(0);

  const [isPdfReady, pdfUtils] = usePDFUtils();
  const editorImage = useMemo(() => images.find((item) => item.id === editorId) ?? null, [images, editorId]);
  const [editorBlobUrl, setEditorBlobUrl] = useState<string>("");

  const cleanupImageUrls = useCallback((current: ScanImage[]) => {
    for (const item of current) URL.revokeObjectURL(item.url);
  }, []);

  const updateImage = useCallback((id: string, updater: (current: ScanImage) => ScanImage) => {
    setImages((prev) => prev.map((item) => (item.id === id ? updater(item) : item)));
  }, []);

  const moveImage = useCallback((id: string, direction: "up" | "down") => {
    setImages((prev) => {
      const index = prev.findIndex((item) => item.id === id);
      if (index < 0) return prev;
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const [picked] = next.splice(index, 1);
      next.splice(target, 0, picked);
      return next;
    });
  }, []);

  const deleteImage = useCallback((id: string) => {
    setImages((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  const resetSession = useCallback(async () => {
    setImages((prev) => {
      cleanupImageUrls(prev);
      return [];
    });
    seenIdsRef.current = new Set();
    sinceRef.current = 0;
    setEditorId(null);
    if (result?.url) {
      URL.revokeObjectURL(result.url);
      setResult(null);
    }
    if (roomId) {
      await fetch(`/api/scan-pdf/session?room=${encodeURIComponent(roomId)}`, { method: "DELETE" }).catch(() => undefined);
    }
  }, [cleanupImageUrls, result?.url, roomId]);

  const applyCrop = useCallback(async () => {
    if (!editorImage) {
      setEditorId(null);
      return;
    }

    const coordinates = cropperRef.current?.getCoordinates();
    if (!coordinates) {
      setEditorId(null);
      return;
    }

    setIsApplyingCrop(true);
    try {
      const sourceUrl = URL.createObjectURL(editorImage.blob);
      const img = await loadImage(sourceUrl).finally(() => URL.revokeObjectURL(sourceUrl));

      const sx = clamp(Math.round(coordinates.left), 0, img.width - 1);
      const sy = clamp(Math.round(coordinates.top), 0, img.height - 1);
      const sw = clamp(Math.round(coordinates.width), 1, img.width - sx);
      const sh = clamp(Math.round(coordinates.height), 1, img.height - sy);

      const outCanvas = document.createElement("canvas");
      outCanvas.width = sw;
      outCanvas.height = sh;
      const outCtx = outCanvas.getContext("2d");
      if (!outCtx) throw new Error("Failed to crop image");

      outCtx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      const croppedBlob = await canvasToBlob(outCanvas, "image/jpeg", 0.92);
      const croppedUrl = URL.createObjectURL(croppedBlob);

      updateImage(editorImage.id, (current) => {
        URL.revokeObjectURL(current.url);
        return {
          ...current,
          blob: croppedBlob,
          url: croppedUrl,
          wasCropped: true,
        };
      });
      setEditorId(null);
    } catch {
      toast.error("Failed to crop image");
    } finally {
      setIsApplyingCrop(false);
    }
  }, [editorImage, updateImage]);

  const resetCrop = useCallback(() => {
    if (!editorImage) return;
    const originalUrl = URL.createObjectURL(editorImage.originalBlob);
    updateImage(editorImage.id, (current) => {
      URL.revokeObjectURL(current.url);
      return {
        ...current,
        blob: current.originalBlob,
        url: originalUrl,
        wasCropped: false,
      };
    });
    setEditorId(null);
  }, [editorImage, updateImage]);

  const exportPdf = useCallback(async () => {
    if (!isPdfReady || images.length === 0 || isGenerating) return;

    setIsGenerating(true);
    try {
      const transformed = await Promise.all(images.map((item) => renderTransformedImage(item)));
      const buffers = await Promise.all(transformed.map((blob) => blob.arrayBuffer()));
      const inputs = buffers.map((buffer, index) => ({
        buffer,
        type: transformed[index].type === "image/png" ? "image/png" : "image/jpeg",
      } as const));

      const output = await pdfUtils.embedImages(inputs, {
        orientation: "portrait",
        pageSize: "a4",
        margin: "small",
      });

      if (result?.url) URL.revokeObjectURL(result.url);
      const outputUrl = createPDFBlobURL(output);
      setResult({ url: outputUrl, filename: "scanned-pages.pdf" });
      toast.success("PDF ready to download");
    } catch {
      toast.error("Failed to build PDF. Try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [images, isGenerating, isPdfReady, pdfUtils, result?.url]);

  const initializeRoom = useCallback(async (preferred?: string) => {
    const picked = preferred || localStorage.getItem(ROOM_KEY) || makeRoomId();
    const body = JSON.stringify({ roomId: picked });
    const res = await fetch("/api/scan-pdf/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    if (!res.ok) throw new Error("Unable to initialize room");

    localStorage.setItem(ROOM_KEY, picked);
    setRoomId(picked);

    const origin = window.location.origin;
    const path = window.location.pathname;
    const url = `${origin}${path}?mobile=1&room=${encodeURIComponent(picked)}`;
    setMobileLink(url);

    const qr = await QRCode.toDataURL(url, {
      margin: 1,
      width: 240,
      color: { dark: "#0f172a", light: "#ffffff" },
    });
    setQrDataUrl(qr);
  }, []);

  useEffect(() => {
    initializeRoom().catch(() => {
      toast.error("Unable to create scan room");
    });
  }, [initializeRoom]);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    if (!result?.url) return;
    URL.revokeObjectURL(result.url);
    setResult(null);
  }, [images]);

  useEffect(() => {
    if (!editorImage) {
      setEditorBlobUrl("");
      return;
    }

    const url = URL.createObjectURL(editorImage.blob);
    setEditorBlobUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [editorImage]);

  useEffect(() => {
    if (!roomId) return;

    let timerId: number | null = null;
    let cancelled = false;
    let hasShownRoomIssue = false;
    let delayMs = 1500;

    const tick = async () => {
      if (cancelled) return;
      try {
        if (typeof document !== "undefined" && document.visibilityState !== "visible") {
          delayMs = 3000;
          return;
        }

        const res = await fetch(`/api/scan-pdf/manifest?room=${encodeURIComponent(roomId)}&since=${sinceRef.current}`, { cache: "no-store" });
        if (!res.ok) {
          if (!hasShownRoomIssue && res.status === 404) {
            hasShownRoomIssue = true;
            toast.error("Scan room expired or missing. Create a new room and reconnect your phone.");
          } else if (!hasShownRoomIssue && res.status === 400) {
            hasShownRoomIssue = true;
            toast.error("Invalid scan room id. Create a new room.");
          }
          delayMs = res.status === 404 ? 5000 : 2500;
          return;
        }
        const payload = (await res.json()) as {
          images: Array<{ id: string; name: string; createdAt: number }>;
          serverTime: number;
        };

        if (cancelled) return;

        let foundNewImage = false;
        let nextSince = Math.max(sinceRef.current, payload.serverTime || 0);

        if (Array.isArray(payload.images) && payload.images.length > 0) {
          for (const item of payload.images) {
            if (seenIdsRef.current.has(item.id)) continue;

            const imgRes = await fetch(`/api/scan-pdf/image?room=${encodeURIComponent(roomId)}&id=${encodeURIComponent(item.id)}&consume=1`, {
              cache: "no-store",
            });
            if (!imgRes.ok) continue;

            const blob = await imgRes.blob();
            const url = URL.createObjectURL(blob);
            seenIdsRef.current.add(item.id);

            setImages((prev) => [...prev, { id: item.id, name: item.name, originalBlob: blob, blob, url, rotation: 0 }]);
            nextSince = Math.max(nextSince, item.createdAt);
            foundNewImage = true;
          }
        }

        sinceRef.current = nextSince;
        delayMs = foundNewImage ? 600 : 2000;
      } catch {
        delayMs = 3000;
      } finally {
        if (!cancelled) {
          timerId = window.setTimeout(tick, delayMs);
        }
      }
    };

    tick();

    return () => {
      cancelled = true;
      if (timerId) {
        clearTimeout(timerId);
      }
    };
  }, [roomId]);

  useEffect(() => {
    return () => {
      cleanupImageUrls(imagesRef.current);
      if (result?.url) URL.revokeObjectURL(result.url);
    };
  }, [cleanupImageUrls, result?.url]);

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Scan PDF Session</h2>
              <p className="text-sm text-muted-foreground">QR pair phone, capture pages, and merge on desktop.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
              <span className="inline-block h-2 w-2 rounded-full bg-primary" />
              <MonitorIcon className="h-4 w-4" />
              Room Ready
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[300px_1fr]">
            <div className="space-y-4">
              <div className="rounded-lg border bg-background p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <QrCodeIcon className="h-4 w-4" /> Connect Phone
                </div>
                <div className="mt-3 flex min-h-60 items-center justify-center rounded-md border bg-white p-2">
                  {qrDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qrDataUrl} alt="Scan QR to connect phone" className="h-56 w-56" />
                  ) : (
                    <Loader2Icon className="h-5 w-5 animate-spin" />
                  )}
                </div>
                <div className="mt-3 text-xs break-all text-muted-foreground">Room: {roomId || "..."}</div>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      if (!mobileLink) return;
                      await navigator.clipboard.writeText(mobileLink);
                      toast.success("Mobile link copied");
                    }}
                    disabled={!mobileLink}
                    className="w-full"
                  >
                    <CopyIcon className="h-4 w-4" /> Copy Link
                  </Button>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        await resetSession();
                        await initializeRoom(makeRoomId());
                      } catch {
                        toast.error("Failed to rotate room");
                      }
                    }}
                    className="w-full border-accent bg-accent/20 text-accent-foreground hover:bg-accent/30"
                  >
                    <RefreshCcwIcon className="h-4 w-4" /> New Room
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-background p-4">
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-medium">Captured Pages</h3>
                  <p className="text-sm text-muted-foreground">{images.length} page(s) in this session</p>
                </div>
                <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-3">
                  <Button onClick={exportPdf} disabled={!isPdfReady || images.length === 0 || isGenerating} className="w-full">
                    {isGenerating ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <CheckIcon className="h-4 w-4" />}
                    Merge to PDF
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => result && downloadLink(result.url, result.filename)}
                    disabled={!result}
                    className="w-full border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
                  >
                    <DownloadIcon className="h-4 w-4" /> Download
                  </Button>
                  <Button
                    variant="outline"
                    onClick={resetSession}
                    disabled={images.length === 0}
                    className="w-full border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20"
                  >
                    <RefreshCcwIcon className="h-4 w-4" /> Clear
                  </Button>
                </div>
              </div>

              {images.length === 0 ? (
                <div className="flex min-h-56 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                  Waiting for image uploads from phone.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {images.map((item, index) => (
                    <div key={item.id} className="rounded-lg border p-2">
                      <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.url} alt={item.name} className="h-full w-full object-contain" style={{ transform: `rotate(${item.rotation}deg)` }} />
                        {item.wasCropped ? <div className="absolute right-2 top-2 rounded bg-black/60 px-2 py-1 text-[10px] text-white">Cropped</div> : null}
                      </div>
                      <div className="mt-2 truncate text-xs text-muted-foreground">{item.name}</div>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" onClick={() => moveImage(item.id, "up")} disabled={index === 0} className="h-9">
                          <ArrowUpIcon className="h-4 w-4" /> Up
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => moveImage(item.id, "down")} disabled={index === images.length - 1} className="h-9">
                          <ArrowDownIcon className="h-4 w-4" /> Down
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => updateImage(item.id, (current) => ({ ...current, rotation: (current.rotation + 270) % 360 }))} className="h-9">
                          <RotateCcwIcon className="h-4 w-4" /> Left
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => updateImage(item.id, (current) => ({ ...current, rotation: (current.rotation + 90) % 360 }))} className="h-9">
                          <RotateCwIcon className="h-4 w-4" /> Right
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setEditorId(item.id)} className="h-9 border-primary/30 bg-primary/5 text-primary hover:bg-primary/10">
                          <ScissorsIcon className="h-4 w-4" /> Crop
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => deleteImage(item.id)} className="h-9">
                          <Trash2Icon className="h-4 w-4" /> Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Sheet open={Boolean(editorImage)} onOpenChange={(open) => !open && setEditorId(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Crop Page</SheetTitle>
            <SheetDescription>Adjust crop bounds for this scanned page.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 px-4 pb-2">
            <div className="relative h-[55vh] overflow-hidden rounded-md border bg-black">
              {editorImage ? (
                <Cropper
                  ref={cropperRef}
                  key={editorImage.id}
                  src={editorBlobUrl || editorImage.url}
                  className="set-coordinates-example__cropper"
                  stencilProps={{ minAspectRatio: 1 / 2 }}
                />
              ) : null}
            </div>
          </div>
          <SheetFooter>
            <div className="flex gap-2">
              {editorImage?.wasCropped ? (
                <Button variant="outline" onClick={resetCrop} disabled={isApplyingCrop}>
                  Reset Crop
                </Button>
              ) : null}
              <Button variant="outline" onClick={() => {
                setEditorId(null);
              }} disabled={isApplyingCrop}>Cancel</Button>
              <Button onClick={() => void applyCrop()} disabled={isApplyingCrop}>
                {isApplyingCrop ? <Loader2Icon className="h-4 w-4 animate-spin" /> : null}
                Save Crop
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function MobileScanner({ room }: { room: string }) {
  const buildTag = "scan-upload-v1";
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [isSending, setIsSending] = useState(false);
  const [capturedCount, setCapturedCount] = useState(0);
  const [captureSettings, setCaptureSettings] = useState<CaptureSettings>({
    maxWidth: 1800,
    jpegQuality: 0.9,
    autoCrop: true,
  });

  const stopStream = useCallback(() => {
    if (!streamRef.current) return;
    for (const track of streamRef.current.getTracks()) track.stop();
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async (mode: "environment" | "user") => {
    stopStream();
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: mode },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
    });
    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
    }
  }, [stopStream]);

  const uploadBlob = useCallback(async (blob: Blob) => {
    const file = new File([blob], `scan-${Date.now()}.jpg`, { type: "image/jpeg" });
    const form = new FormData();
    form.append("file", file);

    const res = await fetch(`/api/scan-pdf/upload?room=${encodeURIComponent(room)}`, {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => null) as { error?: string } | null;
      throw new Error(payload?.error || "Upload failed");
    }
  }, [room]);

  const captureFrame = useCallback(async () => {
    if (isSending) return;

    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      toast.error("Camera is still warming up");
      return;
    }

    setIsSending(true);
    try {
      const maxWidth = captureSettings.maxWidth;
      const scale = video.videoWidth > maxWidth ? maxWidth / video.videoWidth : 1;
      const outWidth = Math.round(video.videoWidth * scale);
      const outHeight = Math.round(video.videoHeight * scale);

      const canvas = document.createElement("canvas");
      canvas.width = outWidth;
      canvas.height = outHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Cannot access camera buffer");

      ctx.drawImage(video, 0, 0, outWidth, outHeight);

      let sourceCanvas = canvas;
      if (captureSettings.autoCrop) {
        const autoBox = detectDocumentBox(canvas);
        if (autoBox) {
          const cropped = document.createElement("canvas");
          cropped.width = autoBox.width;
          cropped.height = autoBox.height;
          const cctx = cropped.getContext("2d");
          if (cctx) {
            cctx.drawImage(canvas, autoBox.x, autoBox.y, autoBox.width, autoBox.height, 0, 0, autoBox.width, autoBox.height);
            sourceCanvas = cropped;
          }
        }
      }

      const blob = await canvasToBlob(sourceCanvas, "image/jpeg", captureSettings.jpegQuality);
      await uploadBlob(blob);
      setCapturedCount((prev) => prev + 1);
      toast.success("Page uploaded to desktop room");
    } catch (error) {
      toast.error((error as Error).message || "Failed to capture/upload photo");
    } finally {
      setIsSending(false);
    }
  }, [captureSettings, isSending, uploadBlob]);

  useEffect(() => {
    startCamera(facingMode).catch(() => {
      toast.error("Camera permission is required");
    });
    return () => stopStream();
  }, [facingMode, startCamera, stopStream]);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-md space-y-4">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <SmartphoneIcon className="h-4 w-4" /> Mobile Scanner
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Room upload mode. Capture and send pages instantly.</p>
          <div className="mt-2 text-[11px] text-muted-foreground">Build: {buildTag}</div>
          <div className="mt-1 text-[11px] break-all text-muted-foreground">Room: {room}</div>
        </div>

        <div className="overflow-hidden rounded-xl border bg-black">
          <video ref={videoRef} autoPlay playsInline muted className="h-[62vh] w-full object-cover" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => setFacingMode((prev) => (prev === "environment" ? "user" : "environment"))}>
            <SwitchCameraIcon className="h-4 w-4" /> Switch Camera
          </Button>
          <Button onClick={captureFrame} disabled={isSending}>
            {isSending ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <CameraIcon className="h-4 w-4" />}
            Capture + Upload
          </Button>
        </div>

        <div className="rounded-lg border p-3 text-sm text-muted-foreground">
          <div>Pages uploaded: <span className="font-medium text-foreground">{capturedCount}</span></div>
          <div className="mt-1 text-xs">Quality {Math.round(captureSettings.jpegQuality * 100)}% | Width {captureSettings.maxWidth}px | Auto crop {captureSettings.autoCrop ? "on" : "off"}</div>
        </div>

        <div className="rounded-lg border bg-background p-4">
          <h3 className="text-sm font-medium">Capture Settings</h3>
          <div className="mt-3 space-y-3 text-sm">
            <div>
              <Label htmlFor="scan-setting-width-mobile">Image width: {captureSettings.maxWidth}px</Label>
              <input id="scan-setting-width-mobile" type="range" min={1000} max={2600} step={100} value={captureSettings.maxWidth} onChange={(event) => setCaptureSettings((prev) => ({ ...prev, maxWidth: Number(event.target.value) }))} className="w-full" />
            </div>
            <div>
              <Label htmlFor="scan-setting-quality-mobile">JPEG quality: {Math.round(captureSettings.jpegQuality * 100)}%</Label>
              <input id="scan-setting-quality-mobile" type="range" min={0.5} max={1} step={0.05} value={captureSettings.jpegQuality} onChange={(event) => setCaptureSettings((prev) => ({ ...prev, jpegQuality: Number(event.target.value) }))} className="w-full" />
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={captureSettings.autoCrop} onChange={(event) => setCaptureSettings((prev) => ({ ...prev, autoCrop: event.target.checked }))} />
              Auto detect + crop document
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PageClient() {
  const searchParams = useSearchParams();
  const mobile = searchParams.get("mobile") === "1";
  const room = searchParams.get("room") || "";

  if (mobile) {
    if (!room) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center p-6">
          <div className="max-w-md rounded-lg border p-6 text-center">
            <p className="text-sm text-muted-foreground">Missing room id. Open this page by scanning the desktop QR code.</p>
          </div>
        </div>
      );
    }

    return <MobileScanner room={room} />;
  }

  return <SessionHost />;
}
