export function PageLayout(props: React.PropsWithChildren<unknown>) {
  return <div className="w-full h-full flex flex-col" data-component="page-layout">{props.children}</div>;
}
