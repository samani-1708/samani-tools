export function BuyMeACoffeeButton() {
  const enabled = process.env.NEXT_PUBLIC_ENABLE_BMC === "true";
  const href = process.env.NEXT_PUBLIC_BMC_URL || "https://www.buymeacoffee.com/your-handle";
  if (!enabled) return null;
  return (
    <a href={href} target="_blank">
      {/*  eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
        alt="Buy Me A Coffee"
        style={{ maxWidth: 217, height: 36 }}
      />
    </a>
  );
}
