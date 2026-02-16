"use client";

import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  ClipboardPasteIcon,
  CopyIcon,
  EraserIcon,
  KeyRoundIcon,
  RefreshCcwIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  SignJWT,
  UnsecuredJWT,
  decodeJwt,
  decodeProtectedHeader,
  importPKCS8,
  importSPKI,
  jwtVerify,
  type JWTPayload,
} from "jose";

type Tab = "decode" | "encode";
type SignatureStatus = "idle" | "verified" | "invalid" | "unsupported" | "missing-key";
type JwtHeaderObject = Record<string, unknown>;
type JwtPayloadObject = Record<string, unknown>;
type JwtAlg =
  | "HS256"
  | "HS384"
  | "HS512"
  | "RS256"
  | "RS384"
  | "RS512"
  | "ES256"
  | "ES384"
  | "ES512"
  | "PS256"
  | "PS384"
  | "PS512"
  | "none";
type AlgMode = "hmac" | "asymmetric" | "none";

const JWT_ALGORITHMS: Array<{ value: JwtAlg; label: string; mode: AlgMode }> = [
  { value: "HS256", label: "HS256 (HMAC SHA-256)", mode: "hmac" },
  { value: "HS384", label: "HS384 (HMAC SHA-384)", mode: "hmac" },
  { value: "HS512", label: "HS512 (HMAC SHA-512)", mode: "hmac" },
  { value: "RS256", label: "RS256 (RSA PKCS1 SHA-256)", mode: "asymmetric" },
  { value: "RS384", label: "RS384 (RSA PKCS1 SHA-384)", mode: "asymmetric" },
  { value: "RS512", label: "RS512 (RSA PKCS1 SHA-512)", mode: "asymmetric" },
  { value: "ES256", label: "ES256 (ECDSA P-256 SHA-256)", mode: "asymmetric" },
  { value: "ES384", label: "ES384 (ECDSA P-384 SHA-384)", mode: "asymmetric" },
  { value: "ES512", label: "ES512 (ECDSA P-521 SHA-512)", mode: "asymmetric" },
  { value: "PS256", label: "PS256 (RSA-PSS SHA-256)", mode: "asymmetric" },
  { value: "PS384", label: "PS384 (RSA-PSS SHA-384)", mode: "asymmetric" },
  { value: "PS512", label: "PS512 (RSA-PSS SHA-512)", mode: "asymmetric" },
  { value: "none", label: "none (Unsecured JWT)", mode: "none" },
];

const HMAC_ALGORITHMS: JwtAlg[] = ["HS256", "HS384", "HS512"];
const ASYMMETRIC_ALGORITHMS: JwtAlg[] = [
  "RS256",
  "RS384",
  "RS512",
  "ES256",
  "ES384",
  "ES512",
  "PS256",
  "PS384",
  "PS512",
];

function isJwtAlg(alg: unknown): alg is JwtAlg {
  return typeof alg === "string" && JWT_ALGORITHMS.some((x) => x.value === alg);
}

function getAlgMode(alg: JwtAlg): AlgMode {
  return JWT_ALGORITHMS.find((x) => x.value === alg)?.mode ?? "none";
}

function hmacHashForAlg(alg: JwtAlg): "SHA-256" | "SHA-384" | "SHA-512" {
  if (alg === "HS256") return "SHA-256";
  if (alg === "HS384") return "SHA-384";
  return "SHA-512";
}

async function createHmacKey(secret: string, alg: JwtAlg): Promise<CryptoKey> {
  const bytes = new TextEncoder().encode(secret);
  return crypto.subtle.importKey(
    "raw",
    bytes,
    { name: "HMAC", hash: hmacHashForAlg(alg) },
    false,
    ["sign", "verify"]
  );
}

function formatEpoch(epochSeconds: number): string {
  return new Date(epochSeconds * 1000).toLocaleString();
}

export function PageClient() {
  const [activeTab, setActiveTab] = useState<Tab>("decode");
  const [tokenInput, setTokenInput] = useState("");
  const [decodeSecret, setDecodeSecret] = useState("");
  const [decodePublicKey, setDecodePublicKey] = useState("");
  const [signatureStatus, setSignatureStatus] = useState<SignatureStatus>("idle");
  const [signatureMessage, setSignatureMessage] = useState("");

  const [encodeAlgorithm, setEncodeAlgorithm] = useState<JwtAlg>("HS256");
  const [encodePayload, setEncodePayload] = useState(
    '{\n  "sub": "1234567890",\n  "name": "John Doe",\n  "iat": 1516239022\n}'
  );
  const [encodeSecret, setEncodeSecret] = useState("");
  const [encodePrivateKey, setEncodePrivateKey] = useState("");
  const [encodedToken, setEncodedToken] = useState("");
  const [isEncoding, setIsEncoding] = useState(false);
  const [encodeError, setEncodeError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const cleanToken = tokenInput.trim().replace(/^bearer\s+/i, "");

  const decodeResult = useMemo(() => {
    if (!cleanToken) {
      return {
        header: null as JwtHeaderObject | null,
        payload: null as JwtPayloadObject | null,
        signature: "",
        error: "",
      };
    }

    try {
      const parts = cleanToken.split(".");
      if (parts.length !== 3) {
        throw new Error("Invalid JWT format: expected 3 dot-separated parts.");
      }

      const header = decodeProtectedHeader(cleanToken) as JwtHeaderObject;
      const payload = decodeJwt(cleanToken) as JwtPayloadObject;

      return {
        header,
        payload,
        signature: parts[2],
        error: "",
      };
    } catch (error) {
      return {
        header: null as JwtHeaderObject | null,
        payload: null as JwtPayloadObject | null,
        signature: "",
        error: error instanceof Error ? error.message : "Invalid JWT token.",
      };
    }
  }, [cleanToken]);

  const header = decodeResult.header;
  const payload = decodeResult.payload;
  const decodeError = decodeResult.error;
  const hasDecodedToken = Boolean(header && payload && !decodeError);
  const detectedAlg: JwtAlg | null = isJwtAlg(header?.alg) ? (header?.alg as JwtAlg) : null;
  const detectedAlgMode: AlgMode | null = detectedAlg ? getAlgMode(detectedAlg) : null;

  const nowEpoch = Math.floor(Date.now() / 1000);
  const exp = typeof payload?.exp === "number" ? payload.exp : undefined;
  const nbf = typeof payload?.nbf === "number" ? payload.nbf : undefined;
  const iat = typeof payload?.iat === "number" ? payload.iat : undefined;

  const tokenTimeStatus = useMemo(() => {
    if (!payload) return "unknown" as const;
    if (typeof nbf === "number" && nbf > nowEpoch) return "not-active" as const;
    if (typeof exp === "number" && exp <= nowEpoch) return "expired" as const;
    if (typeof exp === "number" || typeof nbf === "number") return "active" as const;
    return "unknown" as const;
  }, [exp, nbf, nowEpoch, payload]);

  const encodeAlgMode = useMemo(() => getAlgMode(encodeAlgorithm), [encodeAlgorithm]);

  const copyToClipboard = useCallback(async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Failed to copy");
    }
  }, []);

  const clearDecodeState = useCallback(() => {
    setTokenInput("");
    setDecodeSecret("");
    setDecodePublicKey("");
    setSignatureStatus("idle");
    setSignatureMessage("");
  }, []);

  const clearEncodeState = useCallback(() => {
    setEncodePayload(
      '{\n  "sub": "1234567890",\n  "name": "John Doe",\n  "iat": 1516239022\n}'
    );
    setEncodeSecret("");
    setEncodePrivateKey("");
    setEncodedToken("");
    setEncodeError("");
    setEncodeAlgorithm("HS256");
  }, []);

  const handlePasteToken = useCallback(async () => {
    try {
      const value = await navigator.clipboard.readText();
      setTokenInput(value);
      setActiveTab("decode");
      setSignatureStatus("idle");
      setSignatureMessage("");
      toast.success("Token pasted");
    } catch {
      toast.error("Clipboard access denied");
    }
  }, []);

  const handleVerifySignature = useCallback(async () => {
    if (!cleanToken || !header) return;

    const alg = header.alg;
    if (!isJwtAlg(alg)) {
      setSignatureStatus("unsupported");
      setSignatureMessage(`Unsupported alg in token header: ${String(alg)}`);
      return;
    }

    if (alg === "none") {
      const signaturePart = cleanToken.split(".")[2] ?? "";
      const noSignature = signaturePart.length === 0;
      setSignatureStatus(noSignature ? "verified" : "invalid");
      setSignatureMessage(
        noSignature
          ? "Unsecured JWT (alg=none) has no signature as expected."
          : "alg=none token should not include a signature."
      );
      return;
    }

    setIsVerifying(true);
    try {
      if (HMAC_ALGORITHMS.includes(alg)) {
        if (!decodeSecret) {
          setSignatureStatus("missing-key");
          setSignatureMessage("Enter shared secret to verify this token.");
          return;
        }
        const key = await createHmacKey(decodeSecret, alg);
        await jwtVerify(cleanToken, key, { algorithms: [alg] });
      } else if (ASYMMETRIC_ALGORITHMS.includes(alg)) {
        if (!decodePublicKey.trim()) {
          setSignatureStatus("missing-key");
          setSignatureMessage("Enter public key (PEM/SPKI) to verify this token.");
          return;
        }
        const key = await importSPKI(decodePublicKey, alg);
        await jwtVerify(cleanToken, key, { algorithms: [alg] });
      } else {
        setSignatureStatus("unsupported");
        setSignatureMessage(`Unsupported algorithm: ${alg}`);
        return;
      }

      setSignatureStatus("verified");
      setSignatureMessage("Signature verified successfully.");
      toast.success("Signature verified");
    } catch (error) {
      setSignatureStatus("invalid");
      setSignatureMessage(
        error instanceof Error ? error.message : "Signature verification failed."
      );
      toast.error("Signature invalid");
    } finally {
      setIsVerifying(false);
    }
  }, [cleanToken, decodePublicKey, decodeSecret, header]);

  const handleEncodeToken = useCallback(async () => {
    setEncodeError("");
    setEncodedToken("");

    let parsedPayload: JwtPayloadObject;
    try {
      const parsed = JSON.parse(encodePayload);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Payload must be a JSON object.");
      }
      parsedPayload = parsed as JwtPayloadObject;
    } catch (error) {
      setEncodeError(error instanceof Error ? error.message : "Invalid payload JSON.");
      return;
    }

    setIsEncoding(true);
    try {
      if (encodeAlgorithm === "none") {
        const token = new UnsecuredJWT(parsedPayload as JWTPayload).encode();
        setEncodedToken(token);
        toast.success("Unsecured JWT encoded");
        return;
      }

      if (HMAC_ALGORITHMS.includes(encodeAlgorithm)) {
        if (!encodeSecret) {
          setEncodeError("Secret is required for HMAC signing.");
          return;
        }
        const key = await createHmacKey(encodeSecret, encodeAlgorithm);
        const token = await new SignJWT(parsedPayload as JWTPayload)
          .setProtectedHeader({ alg: encodeAlgorithm, typ: "JWT" })
          .sign(key);
        setEncodedToken(token);
        toast.success("JWT encoded");
        return;
      }

      if (ASYMMETRIC_ALGORITHMS.includes(encodeAlgorithm)) {
        if (!encodePrivateKey.trim()) {
          setEncodeError("Private key (PEM/PKCS8) is required for this algorithm.");
          return;
        }
        const key = await importPKCS8(encodePrivateKey, encodeAlgorithm);
        const token = await new SignJWT(parsedPayload as JWTPayload)
          .setProtectedHeader({ alg: encodeAlgorithm, typ: "JWT" })
          .sign(key);
        setEncodedToken(token);
        toast.success("JWT encoded");
        return;
      }

      setEncodeError(`Unsupported algorithm: ${encodeAlgorithm}`);
    } catch (error) {
      setEncodeError(error instanceof Error ? error.message : "Failed to encode token.");
    } finally {
      setIsEncoding(false);
    }
  }, [encodeAlgorithm, encodePayload, encodePrivateKey, encodeSecret]);

  const moveEncodedToDecode = useCallback(() => {
    if (!encodedToken) return;
    setTokenInput(encodedToken);
    setActiveTab("decode");
    setSignatureStatus("idle");
    setSignatureMessage("");
  }, [encodedToken]);

  return (
    <div className="h-full overflow-auto p-4 sm:p-6">
      <div className="mx-auto w-full max-w-7xl space-y-4">
        <div className="flex items-center gap-2">
          <KeyRoundIcon className="w-5 h-5" />
          <h1 className="text-lg font-semibold">jwt-decode-encode</h1>
        </div>

        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
          <button
            onClick={() => setActiveTab("decode")}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
              activeTab === "decode"
                ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            )}
          >
            Decode / Verify
          </button>
          <button
            onClick={() => setActiveTab("encode")}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
              activeTab === "encode"
                ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            )}
          >
            Encode / Sign
          </button>
        </div>

        {activeTab === "decode" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="jwt-input">JWT Token</Label>
                <textarea
                  id="jwt-input"
                  className="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none font-mono"
                  placeholder="Paste JWT (or Bearer token) here..."
                  value={tokenInput}
                  onChange={(e) => {
                    setTokenInput(e.target.value);
                    setSignatureStatus("idle");
                    setSignatureMessage("");
                  }}
                />
              </div>

              {detectedAlgMode === "hmac" && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="jwt-secret">Shared Secret</Label>
                  <Input
                    id="jwt-secret"
                    type="text"
                    value={decodeSecret}
                    onChange={(e) => {
                      setDecodeSecret(e.target.value);
                      setSignatureStatus("idle");
                      setSignatureMessage("");
                    }}
                    placeholder="Enter shared secret"
                    className="font-mono"
                  />
                </div>
              )}

              {detectedAlgMode === "asymmetric" && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="jwt-public-key">Public Key (PEM / SPKI)</Label>
                  <textarea
                    id="jwt-public-key"
                    className="min-h-[140px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none font-mono"
                    value={decodePublicKey}
                    onChange={(e) => {
                      setDecodePublicKey(e.target.value);
                      setSignatureStatus("idle");
                      setSignatureMessage("");
                    }}
                    placeholder="-----BEGIN PUBLIC KEY-----"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Button
                  onClick={handleVerifySignature}
                  disabled={isVerifying || !hasDecodedToken}
                >
                  {isVerifying ? "Verifying..." : "Verify"}
                </Button>
                <Button variant="outline" onClick={handlePasteToken}>
                  <ClipboardPasteIcon className="w-4 h-4 mr-2" />
                  Paste
                </Button>
                <Button variant="outline" onClick={clearDecodeState} disabled={!tokenInput}>
                  <EraserIcon className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {decodeError && (
                <div className="rounded-md border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                  {decodeError}
                </div>
              )}

              {hasDecodedToken && (
                <>
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
                        tokenTimeStatus === "active" &&
                          "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
                        tokenTimeStatus === "expired" &&
                          "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
                        tokenTimeStatus === "not-active" &&
                          "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
                        tokenTimeStatus === "unknown" &&
                          "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      )}
                    >
                      {tokenTimeStatus === "active" && "Token Active"}
                      {tokenTimeStatus === "expired" && "Token Expired"}
                      {tokenTimeStatus === "not-active" && "Token Not Active Yet"}
                      {tokenTimeStatus === "unknown" && "No Time Claims"}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      Alg: {String(detectedAlg ?? "unknown")} | Mode:{" "}
                      {detectedAlgMode ?? "unknown"}
                    </span>
                  </div>

                  {(signatureStatus !== "idle" || signatureMessage) && (
                    <div
                      className={cn(
                        "rounded-md border px-4 py-3 text-sm",
                        signatureStatus === "verified" &&
                          "border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-950/30 dark:text-green-400",
                        signatureStatus === "invalid" &&
                          "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950/30 dark:text-red-400",
                        (signatureStatus === "unsupported" ||
                          signatureStatus === "missing-key") &&
                          "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/20 dark:text-amber-300"
                      )}
                    >
                      {signatureMessage}
                    </div>
                  )}

                  <section className="rounded-md border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-semibold">Header</h2>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() =>
                          copyToClipboard(JSON.stringify(header, null, 2), "Header")
                        }
                      >
                        <CopyIcon className="w-3.5 h-3.5 mr-1.5" />
                        Copy
                      </Button>
                    </div>
                    <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                      {JSON.stringify(header, null, 2)}
                    </pre>
                  </section>

                  <section className="rounded-md border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-semibold">Payload</h2>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() =>
                          copyToClipboard(JSON.stringify(payload, null, 2), "Payload")
                        }
                      >
                        <CopyIcon className="w-3.5 h-3.5 mr-1.5" />
                        Copy
                      </Button>
                    </div>
                    <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                      {JSON.stringify(payload, null, 2)}
                    </pre>
                  </section>

                  <section className="rounded-md border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-semibold">Signature</h2>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => copyToClipboard(decodeResult.signature, "Signature")}
                      >
                        <CopyIcon className="w-3.5 h-3.5 mr-1.5" />
                        Copy
                      </Button>
                    </div>
                    <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                      {decodeResult.signature}
                    </pre>
                  </section>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
                    {typeof iat === "number" && <span>Issued: {formatEpoch(iat)}</span>}
                    {typeof exp === "number" && <span>Expires: {formatEpoch(exp)}</span>}
                    {typeof nbf === "number" && <span>Not Before: {formatEpoch(nbf)}</span>}
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="alg-select">Algorithm</Label>
                <select
                  id="alg-select"
                  value={encodeAlgorithm}
                  onChange={(e) => setEncodeAlgorithm(e.target.value as JwtAlg)}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {JWT_ALGORITHMS.map((alg) => (
                    <option key={alg.value} value={alg.value}>
                      {alg.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="payload-json">Payload JSON</Label>
                <textarea
                  id="payload-json"
                  className="min-h-[220px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none font-mono"
                  placeholder='{\n  "sub": "123",\n  "name": "Alice"\n}'
                  value={encodePayload}
                  onChange={(e) => setEncodePayload(e.target.value)}
                />
              </div>

              {encodeAlgMode === "hmac" && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="encode-secret">Secret</Label>
                  <Input
                    id="encode-secret"
                    type="text"
                    className="font-mono"
                    value={encodeSecret}
                    onChange={(e) => setEncodeSecret(e.target.value)}
                    placeholder="Enter shared secret"
                  />
                </div>
              )}

              {encodeAlgMode === "asymmetric" && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="encode-private-key">Private Key (PEM / PKCS8)</Label>
                  <textarea
                    id="encode-private-key"
                    className="min-h-[140px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none font-mono"
                    value={encodePrivateKey}
                    onChange={(e) => setEncodePrivateKey(e.target.value)}
                    placeholder="-----BEGIN PRIVATE KEY-----"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button onClick={handleEncodeToken} disabled={isEncoding}>
                  {isEncoding ? "Encoding..." : "Encode JWT"}
                </Button>
                <Button variant="outline" onClick={clearEncodeState} disabled={isEncoding}>
                  <RefreshCcwIcon className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {encodeError && (
                <div className="rounded-md border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                  {encodeError}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="encoded-token">JWT Output</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    disabled={!encodedToken}
                    onClick={() => copyToClipboard(encodedToken, "JWT")}
                  >
                    <CopyIcon className="w-3.5 h-3.5 mr-1.5" />
                    Copy
                  </Button>
                </div>
                <textarea
                  id="encoded-token"
                  className="min-h-[220px] w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm shadow-xs resize-none font-mono"
                  value={encodedToken}
                  readOnly
                  placeholder="Encoded JWT will appear here..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  disabled={!encodedToken}
                  onClick={() => copyToClipboard(encodedToken, "JWT")}
                >
                  <CopyIcon className="w-4 h-4 mr-2" />
                  Copy JWT
                </Button>
                <Button variant="outline" disabled={!encodedToken} onClick={moveEncodedToDecode}>
                  Use In Decode
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
