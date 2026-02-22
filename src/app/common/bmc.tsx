import Script from "next/script";

const bmcUrl = process.env.NEXT_PUBLIC_BMC_URL || "https://www.buymeacoffee.com/your-handle";
const bmcSlug = process.env.NEXT_PUBLIC_BMC_SLUG || "your-handle";

export function BuyMeACoffeeButton() {
  return (
    <a href={bmcUrl} target="_blank" rel="noopener noreferrer">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
        alt="Buy Me A Coffee"
        style={{ maxWidth: 217, height: 36 }}
      />
    </a>
  );
}

export function BuyMeACoffeeMobileCard() {
  return (
    <a
      href={bmcUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center space-x-2 p-3 rounded-lg bg-yellow-50 hover:bg-yellow-100 transition-colors"
    >
      <div className="text-2xl">☕</div>
      <div className="flex-1">
        <div className="font-medium text-sm">Support Us</div>
        <div className="text-xs text-muted-foreground">Buy me a coffee</div>
      </div>
    </a>
  );
}

export function BuyMeACoffeeFloatingScript() {
  return (
    <Script
      type="text/javascript"
      src="https://cdnjs.buymeacoffee.com/1.0.0/button.prod.min.js"
      data-name="bmc-button"
      data-slug={bmcSlug}
      data-color="#FFDD00"
      data-emoji="☕"
      data-font="Cookie"
      data-text="Buy me a coffee"
      data-outline-color="#000000"
      data-font-color="#000000"
      data-coffee-color="#ffffff"
      strategy="lazyOnload"
    />
  );
}

