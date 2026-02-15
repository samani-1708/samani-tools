const TOOL_AREA_LAYOUT_HEIGHT = "calc(100vh)"


export function ToolAreaLayout(props: React.PropsWithChildren<unknown>) {
  return (
    <section
      className="tool bg-gray-50 h-full w-full flex flex-col justify-center items-center"
      data-component="tool-area-layout"
      style={{
        minHeight: TOOL_AREA_LAYOUT_HEIGHT,
        overflow: 'hidden',
        "--tool-layout-area-height": TOOL_AREA_LAYOUT_HEIGHT,
      } as React.CSSProperties}
    >
      <div className="w-full h-full px-4 sm:px-2 lg:px-8 py-8 lg:py-12">
        {props.children}
      </div>
    </section>
  );
}
