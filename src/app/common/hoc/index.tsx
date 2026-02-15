export type IViewportProps = { viewport: "desktop" | "mobile" | "tablet" }


export function withPageViewport(
  Component: React.ComponentType<IViewportProps>
) {
  async function Page({
    searchParams: searchParamsPromise,
  }: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
  }) {
    const searchParams = await searchParamsPromise;

    let viewport: "desktop" | "mobile" | "tablet" = "desktop";

    if (searchParams.viewport === "mobile") {
      viewport = "mobile";
    } else if (searchParams.viewport === "tablet") {
      viewport = "tablet";
    } else {
      viewport = "desktop";
    }

    return <Component viewport={viewport} />;
  }

  Page.displayName = `withPageViewport(${Component.displayName || Component.name})`;

  return Page;
}
