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
    <>
      <script
        async
        custom-element="amp-auto-ads"
        src="https://cdn.ampproject.org/v0/amp-auto-ads-0.1.js"
      ></script>
      <script
        async
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
        crossOrigin="anonymous"
      />
    </>
  );
}
