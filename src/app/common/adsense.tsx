type AdsenseScriptProps = {
  enabled: boolean;
  clientId?: string;
};

export function AdsenseScript({ enabled, clientId }: AdsenseScriptProps) {
  if (!enabled || !clientId) {
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

