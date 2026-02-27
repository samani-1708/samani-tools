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
  UsersIcon,
} from "lucide-react";
import Cropper, { Area } from "react-easy-crop";
import { useSearchParams } from "next/navigation";
import QRCode from "qrcode";
import { DataConnection, Peer } from "peerjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { createPDFBlobURL, downloadLink } from "@/app/common/utils";

type PeerState = "initializing" | "waiting" | "connected" | "error";

type CropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ScanImage = {
  id: string;
  name: string;
  url: string;
  blob: Blob;
  rotation: number;
  crop?: CropRect;
};

type CaptureMeta = {
  id: string;
  name: string;
  size: number;
  type: string;
  width: number;
  height: number;
  createdAt: number;
  totalChunks: number;
};

type CaptureSettings = {
  maxWidth: number;
  jpegQuality: number;
  autoCrop: boolean;
};

type WireMessage =
  | { type: "hello"; device: "mobile" | "desktop" }
  | { type: "settings"; payload: CaptureSettings }
  | { type: "capture-meta"; payload: CaptureMeta }
  | { type: "capture-chunk"; id: string; index: number; data: string }
  | { type: "capture-complete"; id: string }
  | { type: "ping" };

type IncomingBuffer = {
  meta: CaptureMeta;
  chunks: string[];
  totalChunks: number;
};

const CHUNK_SIZE = 24 * 1024;
const ROOM_KEY = "scan-pdf-room-id-v1";
const SETTINGS_KEY = "scan-pdf-capture-settings-v1";
const PEER_OPTIONS = {
  host: "0.peerjs.com",
  port: 443,
  path: "/",
  secure: true,
  debug: 2,
  config: {
    iceTransportPolicy: "relay",
    iceServers: [
      {
        urls: ["turn:eu-0.turn.peerjs.com:3478", "turn:us-0.turn.peerjs.com:3478"],
        username: "peerjs",
        credential: "peerjsp",
      },
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:openrelay.metered.ca:80" },
      {
        urls: "turn:openrelay.metered.ca:80",
        username: "openrelayproject",
        credential: "openrelayproject",
      },
      {
        urls: "turn:openrelay.metered.ca:443",
        username: "openrelayproject",
        credential: "openrelayproject",
      },
      {
        urls: "turns:openrelay.metered.ca:443",
        username: "openrelayproject",
        credential: "openrelayproject",
      },
    ],
  },
} as const;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function makeId(prefix: string) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function makeRoomId() {
  return `scan-${Math.random().toString(36).slice(2, 8)}-${Math.random().toString(36).slice(2, 8)}`;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((acc, part) => acc + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

async function blobToBytes(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer());
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
  const img = await loadImage(item.url);
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

  if (!item.crop) {
    return canvasToBlob(rotatedCanvas, "image/jpeg", 0.92);
  }

  const sx = clamp(Math.round(item.crop.x), 0, rotatedCanvas.width - 1);
  const sy = clamp(Math.round(item.crop.y), 0, rotatedCanvas.height - 1);
  const sw = clamp(Math.round(item.crop.width), 1, rotatedCanvas.width - sx);
  const sh = clamp(Math.round(item.crop.height), 1, rotatedCanvas.height - sy);

  const outCanvas = document.createElement("canvas");
  outCanvas.width = sw;
  outCanvas.height = sh;

  const outCtx = outCanvas.getContext("2d");
  if (!outCtx) throw new Error("Failed to crop image");

  outCtx.drawImage(rotatedCanvas, sx, sy, sw, sh, 0, 0, sw, sh);
  return canvasToBlob(outCanvas, "image/jpeg", 0.92);
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
  const [peerState, setPeerState] = useState<PeerState>("initializing");
  const [mobileLink, setMobileLink] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [images, setImages] = useState<ScanImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<{ url: string; filename: string } | null>(null);
  const [connectedPeers, setConnectedPeers] = useState<string[]>([]);
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const [captureSettings, setCaptureSettings] = useState<CaptureSettings>({
    maxWidth: 1800,
    jpegQuality: 0.9,
    autoCrop: true,
  });
  const captureSettingsRef = useRef<CaptureSettings>({
    maxWidth: 1800,
    jpegQuality: 0.9,
    autoCrop: true,
  });

  const [editorId, setEditorId] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropPixels, setCropPixels] = useState<Area | null>(null);

  const peerRef = useRef<Peer | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectionsRef = useRef<Map<string, DataConnection>>(new Map());
  const incomingRef = useRef<Map<string, IncomingBuffer>>(new Map());

  const [isPdfReady, pdfUtils] = usePDFUtils();

  const editorImage = useMemo(
    () => images.find((item) => item.id === editorId) ?? null,
    [images, editorId],
  );

  const cleanupImageUrls = useCallback((current: ScanImage[]) => {
    for (const item of current) {
      URL.revokeObjectURL(item.url);
    }
  }, []);

  const pushLog = useCallback((entry: string) => {
    const line = `${new Date().toLocaleTimeString()} ${entry}`;
    setDebugLog((prev) => [...prev.slice(-79), line]);
  }, []);

  const broadcast = useCallback((message: WireMessage) => {
    for (const conn of connectionsRef.current.values()) {
      if (conn.open) conn.send(message);
    }
  }, []);

  useEffect(() => {
    captureSettingsRef.current = captureSettings;
  }, [captureSettings]);

  const handleIncomingMessage = useCallback((sourcePeer: string, raw: unknown) => {
    const message = raw as WireMessage;
    if (!message || typeof message !== "object" || !("type" in message)) return;

    if (message.type === "capture-meta") {
      const key = `${sourcePeer}:${message.payload.id}`;
      incomingRef.current.set(key, {
        meta: message.payload,
        chunks: new Array(message.payload.totalChunks),
        totalChunks: message.payload.totalChunks,
      });
      return;
    }

    if (message.type === "capture-chunk") {
      const key = `${sourcePeer}:${message.id}`;
      const slot = incomingRef.current.get(key);
      if (!slot) return;
      if (message.index < 0 || message.index >= slot.totalChunks) return;
      slot.chunks[message.index] = message.data;
      return;
    }

    if (message.type === "capture-complete") {
      const key = `${sourcePeer}:${message.id}`;
      const slot = incomingRef.current.get(key);
      if (!slot) return;
      if (slot.chunks.some((chunk) => !chunk)) {
        toast.error("An image packet was incomplete. Please capture again.");
        incomingRef.current.delete(key);
        return;
      }

      const bytes = concatBytes(slot.chunks.map((chunk) => base64ToBytes(chunk)));
      const blob = new Blob([bytes], { type: slot.meta.type || "image/jpeg" });
      const url = URL.createObjectURL(blob);

      setImages((prev) => [
        ...prev,
        {
          id: `${sourcePeer}-${slot.meta.id}`,
          name: slot.meta.name,
          blob,
          url,
          rotation: 0,
        },
      ]);

      incomingRef.current.delete(key);
    }
  }, []);

  const closePeer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    for (const conn of connectionsRef.current.values()) {
      conn.close();
    }
    connectionsRef.current.clear();
    peerRef.current?.destroy();
    peerRef.current = null;
    setConnectedPeers([]);
  }, []);

  const startPeer = useCallback(async (id: string) => {
    closePeer();
    setPeerState("initializing");

    const peer = new Peer(id, PEER_OPTIONS);
    pushLog(`host peer init: ${id}`);

    peerRef.current = peer;

    peer.on("open", async (openedId) => {
      pushLog(`host peer open: ${openedId}`);
      setRoomId(openedId);
      setPeerState("waiting");
      const origin = window.location.origin;
      const path = window.location.pathname;
      const url = `${origin}${path}?mobile=1&host=${encodeURIComponent(openedId)}`;
      setMobileLink(url);
      localStorage.setItem(ROOM_KEY, openedId);

      try {
        const dataUrl = await QRCode.toDataURL(url, {
          margin: 1,
          width: 240,
          color: { dark: "#0f172a", light: "#ffffff" },
        });
        setQrDataUrl(dataUrl);
      } catch {
        setQrDataUrl("");
      }
    });

    peer.on("connection", (conn) => {
      pushLog(`incoming conn from ${conn.peer}`);
      connectionsRef.current.set(conn.peer, conn);
      setConnectedPeers(Array.from(connectionsRef.current.keys()));

      conn.on("open", () => {
        pushLog(`conn open ${conn.peer}`);
        setPeerState("connected");
        conn.send({ type: "hello", device: "desktop" } as WireMessage);
        conn.send({ type: "settings", payload: captureSettingsRef.current } as WireMessage);
      });

      conn.on("data", (raw) => handleIncomingMessage(conn.peer, raw));

      const onClosed = () => {
        pushLog(`conn closed ${conn.peer}`);
        connectionsRef.current.delete(conn.peer);
        const peers = Array.from(connectionsRef.current.keys());
        setConnectedPeers(peers);
        setPeerState(peers.length > 0 ? "connected" : "waiting");
      };

      conn.on("close", onClosed);
      conn.on("error", (error) => {
        pushLog(`conn error ${conn.peer}: ${String((error as Error).message || error)}`);
        onClosed();
      });
    });

    peer.on("error", (error) => {
      pushLog(`host peer error: ${String((error as { type?: string }).type || (error as Error).message || error)}`);
      if ((error as { type?: string }).type === "unavailable-id") {
        const next = makeRoomId();
        startPeer(next).catch(() => setPeerState("error"));
        return;
      }
      setPeerState("error");
    });

    peer.on("disconnected", () => {
      pushLog("host peer disconnected; attempting reconnect");
      setPeerState("waiting");
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = setTimeout(() => {
        if (!peer.destroyed && peer.disconnected) {
          try {
            peer.reconnect();
            pushLog("host peer reconnect() called");
          } catch {
            setPeerState("error");
          }
        }
      }, 800);
    });
  }, [closePeer, handleIncomingMessage, pushLog]);

  useEffect(() => {
    const savedRoom = localStorage.getItem(ROOM_KEY) || makeRoomId();
    const rawSettings = localStorage.getItem(SETTINGS_KEY);
    if (rawSettings) {
      try {
        const parsed = JSON.parse(rawSettings) as CaptureSettings;
        setCaptureSettings({
          maxWidth: clamp(parsed.maxWidth || 1800, 1000, 2600),
          jpegQuality: clamp(parsed.jpegQuality || 0.9, 0.5, 1),
          autoCrop: Boolean(parsed.autoCrop),
        });
      } catch {
        // ignore stale storage
      }
    }

    startPeer(savedRoom).catch(() => setPeerState("error"));
    pushLog(`boot room: ${savedRoom}`);

    return () => {
      closePeer();
    };
  }, [closePeer, pushLog, startPeer]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(captureSettings));
    broadcast({ type: "settings", payload: captureSettings });
  }, [broadcast, captureSettings]);

  useEffect(() => {
    return () => {
      cleanupImageUrls(images);
      if (result?.url) URL.revokeObjectURL(result.url);
    };
  }, [cleanupImageUrls, images, result?.url]);

  useEffect(() => {
    if (!editorImage?.crop) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCropPixels(editorImage.crop);
  }, [editorImage?.id, editorImage?.crop]);

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

  const resetSession = useCallback(() => {
    setImages((prev) => {
      cleanupImageUrls(prev);
      return [];
    });
    setEditorId(null);
    if (result?.url) {
      URL.revokeObjectURL(result.url);
      setResult(null);
    }
  }, [cleanupImageUrls, result?.url]);

  const applyCrop = useCallback(() => {
    if (!editorImage || !cropPixels) {
      setEditorId(null);
      return;
    }

    updateImage(editorImage.id, (current) => ({
      ...current,
      crop: {
        x: cropPixels.x,
        y: cropPixels.y,
        width: cropPixels.width,
        height: cropPixels.height,
      },
    }));

    setEditorId(null);
  }, [cropPixels, editorImage, updateImage]);

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

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Scan PDF Session</h2>
              <p className="text-sm text-muted-foreground">
                Pair phone and desktop, capture pages on mobile, then merge here.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
              <MonitorIcon className="h-4 w-4" />
              <span>
                {peerState === "connected"
                  ? "Phone connected"
                  : peerState === "waiting"
                    ? "Waiting for phone"
                    : peerState === "error"
                      ? "Connection issue"
                      : "Preparing session"}
              </span>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[300px_1fr]">
            <div className="space-y-4">
              <div className="rounded-lg border bg-background p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <QrCodeIcon className="h-4 w-4" />
                  Connect Phone
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
                <div className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <UsersIcon className="h-3 w-3" />
                  {connectedPeers.length} phone(s) connected
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      if (!mobileLink) return;
                      await navigator.clipboard.writeText(mobileLink);
                      toast.success("Mobile link copied");
                    }}
                    disabled={!mobileLink}
                  >
                    <CopyIcon className="h-4 w-4" />
                    Copy Link
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const fresh = makeRoomId();
                      startPeer(fresh).catch(() => setPeerState("error"));
                    }}
                  >
                    <RefreshCcwIcon className="h-4 w-4" />
                    New Room
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border bg-background p-4">
                <h3 className="text-sm font-medium">Mobile Capture Settings</h3>
                <div className="mt-3 space-y-3 text-sm">
                  <div>
                    <Label htmlFor="scan-setting-width">Image width: {captureSettings.maxWidth}px</Label>
                    <input
                      id="scan-setting-width"
                      type="range"
                      min={1000}
                      max={2600}
                      step={100}
                      value={captureSettings.maxWidth}
                      onChange={(event) =>
                        setCaptureSettings((prev) => ({ ...prev, maxWidth: Number(event.target.value) }))
                      }
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="scan-setting-quality">
                      JPEG quality: {Math.round(captureSettings.jpegQuality * 100)}%
                    </Label>
                    <input
                      id="scan-setting-quality"
                      type="range"
                      min={0.5}
                      max={1}
                      step={0.05}
                      value={captureSettings.jpegQuality}
                      onChange={(event) =>
                        setCaptureSettings((prev) => ({ ...prev, jpegQuality: Number(event.target.value) }))
                      }
                      className="w-full"
                    />
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={captureSettings.autoCrop}
                      onChange={(event) =>
                        setCaptureSettings((prev) => ({ ...prev, autoCrop: event.target.checked }))
                      }
                    />
                    Auto detect + crop document
                  </label>
                </div>
              </div>

              <div className="rounded-lg border bg-background p-4">
                <h3 className="text-sm font-medium">Connection Debug</h3>
                <div className="mt-2 max-h-40 overflow-auto rounded border bg-muted/30 p-2 text-[11px] font-mono">
                  {debugLog.length === 0 ? "No events yet." : debugLog.map((line) => <div key={line}>{line}</div>)}
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-background p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-medium">Captured Pages</h3>
                  <p className="text-sm text-muted-foreground">{images.length} page(s) in this session</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={exportPdf} disabled={!isPdfReady || images.length === 0 || isGenerating}>
                    {isGenerating ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <CheckIcon className="h-4 w-4" />}
                    Merge to PDF
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => result && downloadLink(result.url, result.filename)}
                    disabled={!result}
                  >
                    <DownloadIcon className="h-4 w-4" />
                    Download
                  </Button>
                  <Button variant="outline" onClick={resetSession} disabled={images.length === 0}>
                    <RefreshCcwIcon className="h-4 w-4" />
                    Clear Pages
                  </Button>
                </div>
              </div>

              {images.length === 0 ? (
                <div className="flex min-h-56 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                  Waiting for captured pages from connected phone(s).
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {images.map((item, index) => (
                    <div key={item.id} className="rounded-lg border p-2">
                      <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.url}
                          alt={item.name}
                          className="h-full w-full object-contain"
                          style={{ transform: `rotate(${item.rotation}deg)` }}
                        />
                        {item.crop ? (
                          <div className="absolute right-2 top-2 rounded bg-black/60 px-2 py-1 text-[10px] text-white">
                            Cropped
                          </div>
                        ) : null}
                      </div>
                      <div className="mt-2 truncate text-xs text-muted-foreground">{item.name}</div>
                      <div className="mt-2 grid grid-cols-3 gap-1">
                        <Button variant="outline" size="icon" onClick={() => moveImage(item.id, "up")} disabled={index === 0}>
                          <ArrowUpIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateImage(item.id, (current) => ({ ...current, rotation: (current.rotation + 270) % 360 }))}
                        >
                          <RotateCcwIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => moveImage(item.id, "down")}
                          disabled={index === images.length - 1}
                        >
                          <ArrowDownIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateImage(item.id, (current) => ({ ...current, rotation: (current.rotation + 90) % 360 }))}
                        >
                          <RotateCwIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => setEditorId(item.id)}>
                          <ScissorsIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="icon" onClick={() => deleteImage(item.id)}>
                          <Trash2Icon className="h-4 w-4" />
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
                  image={editorImage.url}
                  crop={crop}
                  zoom={zoom}
                  aspect={3 / 4}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_, pixels) => setCropPixels(pixels)}
                  restrictPosition={false}
                />
              ) : null}
            </div>

            <div className="mt-4 space-y-2">
              <Label htmlFor="scan-crop-zoom">Zoom</Label>
              <input
                id="scan-crop-zoom"
                type="range"
                min={1}
                max={4}
                step={0.1}
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="w-full"
              />
            </div>
          </div>

          <SheetFooter>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (!editorImage) return;
                  updateImage(editorImage.id, (current) => ({ ...current, crop: undefined }));
                  setEditorId(null);
                }}
              >
                Clear Crop
              </Button>
              <Button onClick={applyCrop}>Apply Crop</Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function MobileScanner({ host }: { host: string }) {
  const buildTag = "scan-debug-v2";
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [peerState, setPeerState] = useState<PeerState>("initializing");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [isSending, setIsSending] = useState(false);
  const [capturedCount, setCapturedCount] = useState(0);
  const [captureSettings, setCaptureSettings] = useState<CaptureSettings>({
    maxWidth: 1800,
    jpegQuality: 0.9,
    autoCrop: true,
  });
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [reconnectTick, setReconnectTick] = useState(0);

  const pushLog = useCallback((entry: string) => {
    const line = `${new Date().toLocaleTimeString()} ${entry}`;
    setDebugLog((prev) => [...prev.slice(-79), line]);
  }, []);

  const stopStream = useCallback(() => {
    if (!streamRef.current) return;
    for (const track of streamRef.current.getTracks()) {
      track.stop();
    }
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

  const sendImage = useCallback(async (blob: Blob) => {
    const conn = connRef.current;
    if (!conn || !conn.open) {
      toast.error("Phone is not connected to desktop session");
      return;
    }

    const bytes = await blobToBytes(blob);
    const captureId = makeId("scan");
    const totalChunks = Math.ceil(bytes.length / CHUNK_SIZE);

    const meta: CaptureMeta = {
      id: captureId,
      name: `scan-${capturedCount + 1}.jpg`,
      size: bytes.length,
      type: "image/jpeg",
      width: 0,
      height: 0,
      createdAt: Date.now(),
      totalChunks,
    };

    conn.send({ type: "capture-meta", payload: meta } as WireMessage);

    for (let i = 0; i < totalChunks; i++) {
      const from = i * CHUNK_SIZE;
      const to = Math.min(bytes.length, from + CHUNK_SIZE);
      const chunk = bytes.subarray(from, to);
      conn.send({ type: "capture-chunk", id: captureId, index: i, data: bytesToBase64(chunk) } as WireMessage);
    }

    conn.send({ type: "capture-complete", id: captureId } as WireMessage);
    setCapturedCount((prev) => prev + 1);
  }, [capturedCount]);

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
            cctx.drawImage(
              canvas,
              autoBox.x,
              autoBox.y,
              autoBox.width,
              autoBox.height,
              0,
              0,
              autoBox.width,
              autoBox.height,
            );
            sourceCanvas = cropped;
          }
        }
      }

      const blob = await canvasToBlob(sourceCanvas, "image/jpeg", captureSettings.jpegQuality);
      await sendImage(blob);
      toast.success("Page sent to desktop");
    } catch {
      toast.error("Failed to capture photo");
    } finally {
      setIsSending(false);
    }
  }, [captureSettings, isSending, sendImage]);

  useEffect(() => {
    startCamera(facingMode).catch(() => {
      toast.error("Camera permission is required");
      setPeerState("error");
    });
  }, [facingMode, startCamera]);

  useEffect(() => {
    let cancelled = false;

    const connect = () => {
      if (cancelled) return;
      pushLog(`mobile peer init -> host ${host}`);

      const peer = new Peer(PEER_OPTIONS);

      peerRef.current = peer;

      peer.on("open", () => {
        pushLog("mobile peer open");
        const conn = peer.connect(host, { reliable: true });
        connRef.current = conn;
        pushLog("dialing host...");

        conn.on("open", () => {
          pushLog("data channel open");
          setPeerState("connected");
          conn.send({ type: "hello", device: "mobile" } as WireMessage);
        });

        conn.on("data", (raw) => {
          const message = raw as WireMessage;
          if (!message || typeof message !== "object" || !("type" in message)) return;
          if (message.type === "settings") {
            pushLog("received capture settings");
            setCaptureSettings(message.payload);
          }
        });

        const scheduleRetry = () => {
          if (cancelled) return;
          pushLog("channel closed; scheduling reconnect");
          setPeerState("waiting");
          try {
            peer.destroy();
          } catch {
            // no-op
          }
          retryTimerRef.current = setTimeout(connect, 1500);
        };

        conn.on("close", scheduleRetry);
        conn.on("error", (error) => {
          pushLog(`channel error: ${String((error as Error).message || error)}`);
          scheduleRetry();
        });
      });

      peer.on("error", () => {
        if (cancelled) return;
        pushLog("mobile peer error; scheduling reconnect");
        setPeerState("waiting");
        try {
          peer.destroy();
        } catch {
          // no-op
        }
        retryTimerRef.current = setTimeout(connect, 1500);
      });

      peer.on("disconnected", () => {
        if (cancelled) return;
        pushLog("mobile peer disconnected; scheduling reconnect");
        setPeerState("waiting");
        try {
          peer.destroy();
        } catch {
          // no-op
        }
        retryTimerRef.current = setTimeout(connect, 1500);
      });
    };

    setPeerState("initializing");
    connect();

    return () => {
      cancelled = true;
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      connRef.current?.close();
      peerRef.current?.destroy();
      stopStream();
    };
  }, [host, pushLog, reconnectTick, stopStream]);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-md space-y-4">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <SmartphoneIcon className="h-4 w-4" />
            Mobile Scanner
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Capture pages and they appear on desktop in real time.
          </p>
          <div className="mt-2 inline-flex items-center rounded-md border px-2 py-1 text-xs">
            {peerState === "connected"
              ? "Connected"
              : peerState === "waiting"
                ? "Reconnecting..."
                : peerState === "error"
                  ? "Connection error"
                  : "Connecting..."}
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground">Build: {buildTag}</div>
        </div>

        <div className="rounded-lg border p-3">
          <div className="mb-1 text-xs font-medium">Connection Debug</div>
          <div className="max-h-36 overflow-auto rounded border bg-muted/30 p-2 text-[11px] font-mono">
            {debugLog.length === 0
              ? `No events yet (${buildTag})`
              : debugLog.map((line) => <div key={line}>{line}</div>)}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border bg-black">
          <video ref={videoRef} autoPlay playsInline muted className="h-[62vh] w-full object-cover" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={() => setFacingMode((prev) => (prev === "environment" ? "user" : "environment"))}
          >
            <SwitchCameraIcon className="h-4 w-4" />
            Switch Camera
          </Button>
          <Button onClick={captureFrame} disabled={peerState !== "connected" || isSending}>
            {isSending ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <CameraIcon className="h-4 w-4" />}
            Capture Page
          </Button>
        </div>
        <Button
          variant="outline"
          onClick={() => setReconnectTick((prev) => prev + 1)}
        >
          <RefreshCcwIcon className="h-4 w-4" />
          Reconnect
        </Button>

        <div className="rounded-lg border p-3 text-sm text-muted-foreground">
          <div>
            Pages sent: <span className="font-medium text-foreground">{capturedCount}</span>
          </div>
          <div className="mt-1 text-xs">
            Quality {Math.round(captureSettings.jpegQuality * 100)}% | Width {captureSettings.maxWidth}px | Auto crop {captureSettings.autoCrop ? "on" : "off"}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PageClient() {
  const searchParams = useSearchParams();
  const mobile = searchParams.get("mobile") === "1";
  const host = searchParams.get("host") || "";

  if (mobile) {
    if (!host) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center p-6">
          <div className="max-w-md rounded-lg border p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Missing session host. Open this page by scanning the desktop QR code.
            </p>
          </div>
        </div>
      );
    }

    return <MobileScanner host={host} />;
  }

  return <SessionHost />;
}
