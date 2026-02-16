"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { UtilityToolLayout } from "@/app/utils/common/utility-tool-layout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  QrCodeIcon,
  DownloadIcon,
  ImagePlusIcon,
  RotateCcwIcon,
} from "lucide-react";
import QRCodeStyling, { DotType, Options } from "qr-code-styling";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";
type ExportExtension = "png" | "jpeg" | "webp" | "svg";
type QrTemplate =
  | "classic"
  | "rounded"
  | "box"
  | "pattern"
  | "circular"
  | "instagram"
  | "instagram-profile";
type QrMode = "text" | "upi";
type LogoPreset = "none" | "instagram-color" | "instagram-bw";

type QrPreset = {
  id: string;
  label: string;
  description: string;
  mode?: QrMode;
  template: QrTemplate;
  fgColor: string;
  bgColor: string;
  errorCorrection: ErrorCorrectionLevel;
  defaultLogo: LogoPreset;
  styleOverrides?: Partial<Options>;
};

const CUSTOM_PRESET_ID = "custom";

const ERROR_CORRECTION_OPTIONS: {
  value: ErrorCorrectionLevel;
  label: string;
}[] = [
  { value: "L", label: "L (Low ~7%)" },
  { value: "M", label: "M (Medium ~15%)" },
  { value: "Q", label: "Q (Quartile ~25%)" },
  { value: "H", label: "H (High ~30%)" },
];

const MODE_OPTIONS: { value: QrMode; label: string }[] = [
  { value: "text", label: "Text / URL" },
  { value: "upi", label: "UPI Payment" },
];

const TEMPLATE_OPTIONS: { value: QrTemplate; label: string }[] = [
  { value: "classic", label: "Classic" },
  { value: "rounded", label: "Rounded" },
  { value: "box", label: "Box" },
  { value: "pattern", label: "Pattern" },
  { value: "circular", label: "Circular" },
  { value: "instagram", label: "Instagram Gradient" },
  { value: "instagram-profile", label: "Instagram Profile" },
];

const EXPORT_OPTIONS: { value: ExportExtension; label: string }[] = [
  { value: "png", label: "PNG" },
  { value: "jpeg", label: "JPEG" },
  { value: "webp", label: "WEBP" },
  { value: "svg", label: "SVG" },
];

const QR_PRESETS: QrPreset[] = [
  {
    id: "modern-rounded",
    label: "Modern Rounded",
    description: "Balanced rounded style for most use cases.",
    template: "rounded",
    fgColor: "#111827",
    bgColor: "#ffffff",
    errorCorrection: "M",
    defaultLogo: "none",
  },
  {
    id: "minimal-bw",
    label: "Minimal B/W",
    description: "Clean high-contrast classic black and white.",
    template: "classic",
    fgColor: "#000000",
    bgColor: "#ffffff",
    errorCorrection: "M",
    defaultLogo: "none",
  },
  {
    id: "circular-pro",
    label: "Circular Pro",
    description: "Circular dot pattern with soft rounded eyes.",
    template: "circular",
    fgColor: "#0f172a",
    bgColor: "#f8fafc",
    errorCorrection: "Q",
    defaultLogo: "none",
  },
  {
    id: "instagram-gradient",
    label: "Instagram Gradient",
    description: "Color gradient modules + instagram center logo.",
    template: "instagram",
    fgColor: "#111111",
    bgColor: "#ffffff",
    errorCorrection: "H",
    defaultLogo: "instagram-color",
  },
  {
    id: "instagram-profile",
    label: "Instagram Profile",
    description: "Black/white instagram profile QR with logo.",
    template: "instagram-profile",
    fgColor: "#111111",
    bgColor: "#ffffff",
    errorCorrection: "H",
    defaultLogo: "instagram-bw",
  },
  {
    id: "neon-night",
    label: "Neon Night",
    description: "Dark mode QR with neon blue-violet gradient.",
    template: "pattern",
    fgColor: "#60a5fa",
    bgColor: "#0b1020",
    errorCorrection: "Q",
    defaultLogo: "none",
    styleOverrides: {
      dotsOptions: {
        type: "classy-rounded",
        gradient: {
          type: "linear",
          rotation: Math.PI / 3,
          colorStops: [
            { offset: 0, color: "#22d3ee" },
            { offset: 1, color: "#8b5cf6" },
          ],
        },
      },
      cornersSquareOptions: { color: "#93c5fd", type: "extra-rounded" },
      cornersDotOptions: { color: "#67e8f9", type: "dot" },
    },
  },
  {
    id: "brand-corporate",
    label: "Brand Corporate",
    description: "Serious box layout with navy tone for business.",
    template: "box",
    fgColor: "#1e3a8a",
    bgColor: "#ffffff",
    errorCorrection: "M",
    defaultLogo: "none",
    styleOverrides: {
      cornersSquareOptions: { color: "#1d4ed8", type: "square" },
      cornersDotOptions: { color: "#1e3a8a", type: "square" },
    },
  },
  {
    id: "ocean-wave",
    label: "Ocean Wave",
    description: "Fresh blue radial pattern and rounded edges.",
    template: "pattern",
    fgColor: "#1d4ed8",
    bgColor: "#f0f9ff",
    errorCorrection: "Q",
    defaultLogo: "none",
    styleOverrides: {
      dotsOptions: {
        type: "classy-rounded",
        gradient: {
          type: "radial",
          rotation: 0,
          colorStops: [
            { offset: 0, color: "#0ea5e9" },
            { offset: 1, color: "#1d4ed8" },
          ],
        },
      },
      cornersSquareOptions: { color: "#0369a1", type: "classy" },
      cornersDotOptions: { color: "#0284c7", type: "dot" },
    },
  },
  {
    id: "emerald-matrix",
    label: "Emerald Matrix",
    description: "Cyber-style green QR with dark background.",
    template: "circular",
    fgColor: "#22c55e",
    bgColor: "#020617",
    errorCorrection: "Q",
    defaultLogo: "none",
    styleOverrides: {
      cornersSquareOptions: { color: "#4ade80", type: "extra-rounded" },
      cornersDotOptions: { color: "#86efac", type: "dot" },
    },
  },
  {
    id: "upi-payment",
    label: "UPI Payment",
    description: "Ready-to-use reliable style for payment QR.",
    mode: "upi",
    template: "box",
    fgColor: "#111827",
    bgColor: "#ffffff",
    errorCorrection: "H",
    defaultLogo: "none",
    styleOverrides: {
      dotsOptions: { color: "#111827", type: "square" },
      cornersSquareOptions: { color: "#1f2937", type: "square" },
      cornersDotOptions: { color: "#111827", type: "square" },
    },
  },
  {
    id: "poster-bold",
    label: "Poster Bold",
    description: "High-impact bold look for print posters.",
    template: "rounded",
    fgColor: "#b91c1c",
    bgColor: "#fff7ed",
    errorCorrection: "Q",
    defaultLogo: "none",
    styleOverrides: {
      dotsOptions: {
        type: "rounded",
        gradient: {
          type: "linear",
          rotation: Math.PI / 2,
          colorStops: [
            { offset: 0, color: "#ef4444" },
            { offset: 1, color: "#b91c1c" },
          ],
        },
      },
      cornersSquareOptions: { color: "#7f1d1d", type: "extra-rounded" },
      cornersDotOptions: { color: "#b91c1c", type: "dot" },
    },
  },
];

const createInstagramLogoDataUri = () =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
  <defs>
    <linearGradient id="ig-g" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#feda75"/>
      <stop offset="35%" stop-color="#fa7e1e"/>
      <stop offset="65%" stop-color="#d62976"/>
      <stop offset="100%" stop-color="#4f5bd5"/>
    </linearGradient>
  </defs>
  <rect x="4" y="4" width="88" height="88" rx="24" fill="url(#ig-g)"/>
  <rect x="24" y="24" width="48" height="48" rx="16" fill="none" stroke="#fff" stroke-width="8"/>
  <circle cx="48" cy="48" r="12" fill="none" stroke="#fff" stroke-width="8"/>
  <circle cx="68" cy="28" r="5" fill="#fff"/>
</svg>
`)}`;

const createInstagramBwLogoDataUri = () =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
  <rect x="4" y="4" width="88" height="88" rx="24" fill="#000"/>
  <rect x="24" y="24" width="48" height="48" rx="16" fill="none" stroke="#fff" stroke-width="8"/>
  <circle cx="48" cy="48" r="12" fill="none" stroke="#fff" stroke-width="8"/>
  <circle cx="68" cy="28" r="5" fill="#fff"/>
</svg>
`)}`;

const buildUpiUri = (args: {
  vpa: string;
  name: string;
  amount: string;
  note: string;
}) => {
  const params = new URLSearchParams();
  params.set("pa", args.vpa.trim());
  params.set("pn", args.name.trim());
  params.set("cu", "INR");

  if (args.amount.trim()) params.set("am", args.amount.trim());
  if (args.note.trim()) params.set("tn", args.note.trim());

  return `upi://pay?${params.toString()}`;
};

const getTemplateOptions = (
  template: QrTemplate,
  foreground: string,
  background: string,
  logo: string | null
): Partial<Options> => {
  const base = {
    backgroundOptions: { color: background },
    imageOptions: {
      crossOrigin: "anonymous",
      margin: 6,
      imageSize: 0.32,
      hideBackgroundDots: true,
    },
  };

  switch (template) {
    case "rounded":
      return {
        ...base,
        dotsOptions: { color: foreground, type: "rounded" as DotType },
        cornersSquareOptions: { color: foreground, type: "extra-rounded" },
        cornersDotOptions: { color: foreground, type: "dot" },
        image: logo ?? undefined,
      };
    case "box":
      return {
        ...base,
        dotsOptions: { color: foreground, type: "square" as DotType },
        cornersSquareOptions: { color: foreground, type: "square" },
        cornersDotOptions: { color: foreground, type: "square" },
        image: logo ?? undefined,
      };
    case "pattern":
      return {
        ...base,
        dotsOptions: {
          type: "classy-rounded" as DotType,
          gradient: {
            type: "radial",
            rotation: 0,
            colorStops: [
              { offset: 0, color: foreground },
              { offset: 1, color: "#6366f1" },
            ],
          },
        },
        cornersSquareOptions: { color: foreground, type: "classy" },
        cornersDotOptions: { color: foreground, type: "dot" },
        image: logo ?? undefined,
      };
    case "circular":
      return {
        ...base,
        dotsOptions: { color: foreground, type: "dots" as DotType },
        cornersSquareOptions: { color: foreground, type: "extra-rounded" },
        cornersDotOptions: { color: foreground, type: "dot" },
        image: logo ?? undefined,
      };
    case "instagram":
      return {
        ...base,
        dotsOptions: {
          type: "rounded" as DotType,
          gradient: {
            type: "linear",
            rotation: Math.PI / 4,
            colorStops: [
              { offset: 0, color: "#feda75" },
              { offset: 0.35, color: "#fa7e1e" },
              { offset: 0.7, color: "#d62976" },
              { offset: 1, color: "#4f5bd5" },
            ],
          },
        },
        cornersSquareOptions: { color: "#4f5bd5", type: "extra-rounded" },
        cornersDotOptions: { color: "#d62976", type: "dot" },
        image: logo ?? createInstagramLogoDataUri(),
      };
    case "instagram-profile":
      return {
        ...base,
        dotsOptions: { color: "#111111", type: "rounded" as DotType },
        cornersSquareOptions: { color: "#111111", type: "extra-rounded" },
        cornersDotOptions: { color: "#111111", type: "dot" },
        image: logo ?? createInstagramBwLogoDataUri(),
      };
    case "classic":
    default:
      return {
        ...base,
        dotsOptions: { color: foreground, type: "square" as DotType },
        cornersSquareOptions: { color: foreground, type: "square" },
        cornersDotOptions: { color: foreground, type: "square" },
        image: logo ?? undefined,
      };
  }
};

const mergeOptions = (base: Partial<Options>, override?: Partial<Options>): Partial<Options> => {
  if (!override) return base;

  return {
    ...base,
    ...override,
    image: override.image ?? base.image,
    dotsOptions: {
      ...base.dotsOptions,
      ...override.dotsOptions,
      gradient: override.dotsOptions?.gradient ?? base.dotsOptions?.gradient,
    },
    cornersSquareOptions: {
      ...base.cornersSquareOptions,
      ...override.cornersSquareOptions,
    },
    cornersDotOptions: {
      ...base.cornersDotOptions,
      ...override.cornersDotOptions,
    },
    backgroundOptions: {
      ...base.backgroundOptions,
      ...override.backgroundOptions,
      gradient:
        override.backgroundOptions?.gradient ?? base.backgroundOptions?.gradient,
    },
    imageOptions: {
      ...base.imageOptions,
      ...override.imageOptions,
    },
  };
};

const getLogoByPreset = (logoPreset: LogoPreset): string | null => {
  if (logoPreset === "instagram-color") return createInstagramLogoDataUri();
  if (logoPreset === "instagram-bw") return createInstagramBwLogoDataUri();
  return null;
};

export function PageClient() {
  // State
  const [mode, setMode] = useState<QrMode>("text");
  const [selectedPresetId, setSelectedPresetId] = useState<string>("modern-rounded");
  const [text, setText] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [upiVpa, setUpiVpa] = useState("");
  const [upiName, setUpiName] = useState("");
  const [upiAmount, setUpiAmount] = useState("");
  const [upiNote, setUpiNote] = useState("");

  const [size, setSize] = useState(512);
  const [errorCorrection, setErrorCorrection] =
    useState<ErrorCorrectionLevel>("M");
  const [template, setTemplate] = useState<QrTemplate>("rounded");
  const [fgColor, setFgColor] = useState("#111111");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [presetStyleOverrides, setPresetStyleOverrides] = useState<Partial<Options> | undefined>(
    undefined
  );
  const [exportFormat, setExportFormat] = useState<ExportExtension>("png");

  // Refs
  const previewRef = useRef<HTMLDivElement>(null);
  const qrCodeRef = useRef<QRCodeStyling | null>(null);
  const pendingLogoObjectUrl = useRef<string | null>(null);

  // Derived state
  const normalizedInstagramHandle = useMemo(
    () => instagramHandle.trim().replace(/^@+/, ""),
    [instagramHandle]
  );

  const upiData = useMemo(() => {
    if (!upiVpa.trim() || !upiName.trim()) return "";
    return buildUpiUri({
      vpa: upiVpa,
      name: upiName,
      amount: upiAmount,
      note: upiNote,
    });
  }, [upiVpa, upiName, upiAmount, upiNote]);

  const textData = useMemo(() => {
    if (template === "instagram-profile") {
      return normalizedInstagramHandle
        ? `https://instagram.com/${normalizedInstagramHandle}`
        : "";
    }

    return text.trim();
  }, [text, template, normalizedInstagramHandle]);

  const qrData = useMemo(
    () => (mode === "upi" ? upiData : textData),
    [mode, textData, upiData]
  );

  const hasData = useMemo(() => Boolean(qrData), [qrData]);

  const baseTemplateOptions = useMemo(
    () => getTemplateOptions(template, fgColor, bgColor, logoUrl),
    [template, fgColor, bgColor, logoUrl]
  );

  const mergedTemplateOptions = useMemo(
    () => mergeOptions(baseTemplateOptions, presetStyleOverrides),
    [baseTemplateOptions, presetStyleOverrides]
  );

  const activePreset = useMemo(
    () => QR_PRESETS.find((preset) => preset.id === selectedPresetId),
    [selectedPresetId]
  );

  const isCircularTemplate = useMemo(() => template === "circular", [template]);

  // Utils
  const revokeCustomLogo = useCallback(() => {
    if (pendingLogoObjectUrl.current) {
      URL.revokeObjectURL(pendingLogoObjectUrl.current);
      pendingLogoObjectUrl.current = null;
    }
  }, []);

  // Handlers
  const markAsCustom = useCallback(() => {
    setSelectedPresetId(CUSTOM_PRESET_ID);
    setPresetStyleOverrides(undefined);
  }, []);

  const applyPreset = useCallback(
    (preset: QrPreset) => {
      setSelectedPresetId(preset.id);
      setMode(preset.mode ?? "text");
      setTemplate(preset.template);
      setFgColor(preset.fgColor);
      setBgColor(preset.bgColor);
      setErrorCorrection(preset.errorCorrection);
      setPresetStyleOverrides(preset.styleOverrides);

      revokeCustomLogo();
      setLogoUrl(getLogoByPreset(preset.defaultLogo));
    },
    [revokeCustomLogo]
  );

  const handleDownload = useCallback(() => {
    if (!qrCodeRef.current || !hasData) return;

    try {
      qrCodeRef.current.download({
        name: mode === "upi" ? "upi-qr" : "qrcode",
        extension: exportFormat,
      });
    } catch {
      toast.error("Failed to download QR code");
    }
  }, [exportFormat, hasData, mode]);

  const handleLogoUpload = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const objectUrl = URL.createObjectURL(file);
      revokeCustomLogo();
      pendingLogoObjectUrl.current = objectUrl;
      setLogoUrl(objectUrl);
      markAsCustom();
      event.target.value = "";
    },
    [markAsCustom, revokeCustomLogo]
  );

  const handleTemplateChange = useCallback(
    (value: QrTemplate) => {
      setTemplate(value);
      if (value === "instagram" || value === "instagram-profile") {
        setErrorCorrection("H");
      }
      markAsCustom();
    },
    [markAsCustom]
  );

  const clearLogo = useCallback(() => {
    revokeCustomLogo();
    setLogoUrl(null);
    markAsCustom();
  }, [markAsCustom, revokeCustomLogo]);

  const resetStyle = useCallback(() => {
    setMode("text");
    setText("");
    setInstagramHandle("");
    setUpiVpa("");
    setUpiName("");
    setUpiAmount("");
    setUpiNote("");
    setSize(512);
    setExportFormat("png");
    applyPreset(QR_PRESETS[0]);
  }, [applyPreset]);

  // Effects
  useEffect(() => {
    applyPreset(QR_PRESETS[0]);
  }, [applyPreset]);

  useEffect(() => {
    if (qrCodeRef.current || !previewRef.current) return;

    const qrCode = new QRCodeStyling({
      width: size,
      height: size,
      data: " ",
      margin: 2,
      qrOptions: { errorCorrectionLevel: errorCorrection },
      ...mergedTemplateOptions,
    });

    qrCode.append(previewRef.current);
    qrCodeRef.current = qrCode;
  }, [errorCorrection, mergedTemplateOptions, size]);

  useEffect(() => {
    if (!qrCodeRef.current) return;

    qrCodeRef.current.update({
      width: size,
      height: size,
      data: hasData ? qrData : " ",
      margin: 2,
      qrOptions: { errorCorrectionLevel: errorCorrection },
      ...mergedTemplateOptions,
    });
  }, [qrData, size, errorCorrection, hasData, mergedTemplateOptions]);

  useEffect(
    () => () => {
      revokeCustomLogo();
    },
    [revokeCustomLogo]
  );

  // Render
  const content = (
    <div className="h-full flex flex-col items-center justify-center gap-3">
      <div className="w-full max-w-[620px] aspect-square rounded-xl border border-border bg-card/50 p-4 flex items-center justify-center">
        <div
          ref={previewRef}
          className={cn(
            "[&>canvas]:max-w-full [&>canvas]:h-auto [&>canvas]:rounded-lg [&>img]:max-w-full [&>img]:h-auto [&>img]:rounded-lg",
            isCircularTemplate && "[&>canvas]:rounded-full [&>img]:rounded-full"
          )}
        />
      </div>
      {!hasData && (
        <p className="text-muted-foreground text-sm text-center">
          {mode === "upi"
            ? "Fill UPI VPA and payee name to generate UPI QR."
            : template === "instagram-profile"
              ? "Enter Instagram username to generate profile QR."
              : "Enter text or URL to generate a QR code."}
        </p>
      )}
    </div>
  );

  const controls = (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="qr-preset">Preset Library</Label>
        <Select
          value={selectedPresetId}
          onValueChange={(value) => {
            const preset = QR_PRESETS.find((item) => item.id === value);
            if (preset) applyPreset(preset);
          }}
        >
          <SelectTrigger id="qr-preset">
            <SelectValue placeholder="Select preset" />
          </SelectTrigger>
          <SelectContent>
            {QR_PRESETS.map((preset) => (
              <SelectItem key={preset.id} value={preset.id}>
                {preset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedPresetId === CUSTOM_PRESET_ID ? (
          <p className="text-xs text-muted-foreground">Preset: Custom (manual edits)</p>
        ) : activePreset ? (
          <p className="text-xs text-muted-foreground">{activePreset.description}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="qr-mode">Mode</Label>
        <Select
          value={mode}
          onValueChange={(value) => {
            setMode(value as QrMode);
            markAsCustom();
          }}
        >
          <SelectTrigger id="qr-mode">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MODE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {mode === "text" ? (
        <>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="qr-template">Template</Label>
            <Select value={template} onValueChange={(value) => handleTemplateChange(value as QrTemplate)}>
              <SelectTrigger id="qr-template">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {template === "instagram-profile" ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="instagram-handle">Instagram Username</Label>
              <Input
                id="instagram-handle"
                placeholder="e.g. nasa"
                value={instagramHandle}
                onChange={(e) => setInstagramHandle(e.target.value)}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="qr-text">Text / URL</Label>
              <Textarea
                id="qr-text"
                rows={3}
                placeholder="Enter text or URL..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="upi-vpa">UPI ID (VPA)</Label>
            <Input
              id="upi-vpa"
              placeholder="name@bank"
              value={upiVpa}
              onChange={(e) => setUpiVpa(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="upi-name">Payee Name</Label>
            <Input
              id="upi-name"
              placeholder="Merchant / Person Name"
              value={upiName}
              onChange={(e) => setUpiName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="upi-amount">Amount (Optional)</Label>
              <Input
                id="upi-amount"
                placeholder="100.00"
                value={upiAmount}
                onChange={(e) => setUpiAmount(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="upi-note">Note (Optional)</Label>
              <Input
                id="upi-note"
                placeholder="Payment note"
                value={upiNote}
                onChange={(e) => setUpiNote(e.target.value)}
              />
            </div>
          </div>
        </>
      )}

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="qr-size">Size</Label>
          <span className="text-xs text-muted-foreground">{size}px</span>
        </div>
        <input
          id="qr-size"
          type="range"
          min={128}
          max={1024}
          step={32}
          value={size}
          onChange={(e) => {
            setSize(Number(e.target.value));
            markAsCustom();
          }}
          className="w-full accent-primary"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="qr-error-correction">Error Correction</Label>
        <Select
          value={errorCorrection}
          onValueChange={(value) => {
            setErrorCorrection(value as ErrorCorrectionLevel);
            markAsCustom();
          }}
        >
          <SelectTrigger id="qr-error-correction">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ERROR_CORRECTION_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="qr-fg-color">Foreground Color</Label>
        <div className="flex items-center gap-2">
          <input
            id="qr-fg-color"
            type="color"
            value={fgColor}
            onChange={(e) => {
              setFgColor(e.target.value);
              markAsCustom();
            }}
            className="w-10 h-10 rounded border border-input cursor-pointer"
          />
          <Input
            value={fgColor}
            onChange={(e) => {
              setFgColor(e.target.value);
              markAsCustom();
            }}
            className="flex-1 font-mono text-sm"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="qr-bg-color">Background Color</Label>
        <div className="flex items-center gap-2">
          <input
            id="qr-bg-color"
            type="color"
            value={bgColor}
            onChange={(e) => {
              setBgColor(e.target.value);
              markAsCustom();
            }}
            className="w-10 h-10 rounded border border-input cursor-pointer"
          />
          <Input
            value={bgColor}
            onChange={(e) => {
              setBgColor(e.target.value);
              markAsCustom();
            }}
            className="flex-1 font-mono text-sm"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="qr-logo-upload">Center Image / Logo</Label>
        <div className="flex items-center gap-2">
          <Input
            id="qr-logo-upload"
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="cursor-pointer"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={clearLogo}
            disabled={!logoUrl}
            aria-label="Clear logo"
          >
            <RotateCcwIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="qr-export-format">Download Format</Label>
        <Select value={exportFormat} onValueChange={(value) => setExportFormat(value as ExportExtension)}>
          <SelectTrigger id="qr-export-format">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EXPORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const actions = (
    <div className="flex gap-2">
      <Button className="flex-1" variant="outline" onClick={resetStyle}>
        Reset
      </Button>
      <Button className="flex-1" disabled={!hasData} onClick={handleDownload}>
        <DownloadIcon className="w-4 h-4 mr-2" />
        Download
      </Button>
    </div>
  );

  const secondaryActions = (
    <Button type="button" variant="ghost" className="w-full" asChild>
      <label htmlFor="qr-logo-upload" className="cursor-pointer">
        <ImagePlusIcon className="w-4 h-4 mr-2" />
        Add Center Image
      </label>
    </Button>
  );

  return (
    <UtilityToolLayout
      sidebarTitle="QR Code Generator"
      sidebarIcon={<QrCodeIcon className="w-5 h-5" />}
      sidebarWidth="sm"
      content={content}
      controls={controls}
      actions={actions}
      secondaryActions={secondaryActions}
    />
  );
}
