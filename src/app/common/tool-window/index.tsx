import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@radix-ui/react-separator";
import { UnfoldHorizontalIcon, UnfoldVerticalIcon } from "lucide-react";
import React from "react";
import {
  Panel,
  PanelGroup,
  PanelGroupProps,
  PanelProps,
  PanelResizeHandle,
} from "react-resizable-panels";
import { twMerge } from "tailwind-merge";

interface ToolWindowProps {
  direction: PanelGroupProps["direction"];
  className?: PanelProps["className"];
  style?: React.CSSProperties;
}

export function ToolWindow(props: React.PropsWithChildren<ToolWindowProps>) {
  return (
    <PanelGroup
      direction={props.direction}
      className={twMerge("w-full h-full ", props.className)}
      style={{
        minHeight: "calc(var(--tool-layout-area-height))",
        height: '100%',
        maxHeight: "calc(var(--tool-layout-area-height))",
        ...props.style,
      }}
    >
      {props.children}
    </PanelGroup>
  );
}

interface ToolPanelProps {
  defaultSize?: PanelProps["defaultSize"];
  minSize?: PanelProps["minSize"];
}

export function ToolPanel(props: React.PropsWithChildren<ToolPanelProps>) {
  return (
    <Panel defaultSize={props.defaultSize} minSize={props.minSize} className="grow">
      <Card className="w-full rounded-none border-0 h-full shadow-none">
        {props.children}
      </Card>
    </Panel>
  );
}

export function ToolPanelTitle(props: React.PropsWithChildren<unknown>) {
  return (
    <CardTitle className="text-base flex justify-between">
      {props.children}
    </CardTitle>
  );
}

export function ToolPanelHeader(props: React.PropsWithChildren<unknown>) {
  return (
    <CardHeader
      className=""
      style={
        {
          "--tool-panel-header-height": "64px",
          maxHeight: "var(--tool-panel-header-height)",
        } as React.CSSProperties
      }
    >
      {props.children}
      <Separator />
    </CardHeader>
  );
}

const TOOL_PANEL_HEIGHT = "calc(var(--tool-layout-area-height) - 64px)";

export function ToolPanelContent(props: React.PropsWithChildren<unknown>) {
  return (
    <CardContent
      className={"py-2 px-4 overflow-hidden h-full overflow-y-auto"}
      style={
        {
          maxHeight: TOOL_PANEL_HEIGHT,
          "--tool-area-height": TOOL_PANEL_HEIGHT,
        } as React.CSSProperties
      }
    >
      {props.children}
    </CardContent>
  );
}

export function ToolPanelResize({
  direction,
}: {
  direction: "vertical" | "horizontal";
}) {
  return (
    <PanelResizeHandle
      className={`relative hover:bg-gray-300 ${
        direction === "horizontal" ? "w-5" : "h-5"
      }`}
    >
      {direction === "horizontal" ? (
        <UnfoldHorizontalIcon className="w-5 h-4 absolute top-1/2" />
      ) : (
        <UnfoldVerticalIcon className="w-5 h-4 absolute left-1/2" />
      )}
    </PanelResizeHandle>
  );
}

export function Toolbar(props: React.PropsWithChildren<{ title: string; }>) {
  return (
    <Card className="rounded-none border-x-0 border-t-0">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap">
          <CardTitle>{props.title}</CardTitle>
          {props.children}
        </div>
      </CardHeader>
    </Card>
  );
}
