type AdsenseScriptProps = {
  enabled: boolean;
  clientId?: string;
};

export function AdsenseScript({ enabled, clientId }: AdsenseScriptProps) {
  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction || !enabled || !clientId) {
    return null;
  }

  return (
    <script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
      crossOrigin="anonymous"
    />
  );
}
