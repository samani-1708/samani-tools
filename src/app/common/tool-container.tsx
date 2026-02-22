import { Children, Fragment, isValidElement, type ReactElement } from "react";

function flattenNodes(nodes: React.ReactNode): React.ReactNode[] {
  return Children.toArray(nodes).flatMap((node) => {
    if (isValidElement(node) && node.type === Fragment) {
      return flattenNodes(
        (node as ReactElement<{ children?: React.ReactNode }>).props.children
      );
    }

    return [node];
  });
}

export function ToolContainer({ children }: { children: React.ReactNode }) {
  const childNodes = flattenNodes(children);

  if (childNodes.length <= 1) {
    return (
      <div
        className="w-full flex flex-col overflow-hidden"
        style={{ height: "calc(100vh - 64px)" }}
      >
        {children}
      </div>
    );
  }

  const [toolNode, ...seoNodes] = childNodes;

  return (
    <div className="w-full flex flex-col">
      <div
        className="w-full overflow-hidden"
        style={{ height: "calc(100vh - 64px)" }}
      >
        {toolNode}
      </div>
      <div className="w-full">
        {seoNodes.map((node, index) => (
          <Fragment key={index}>{node}</Fragment>
        ))}
      </div>
    </div>
  );
}
