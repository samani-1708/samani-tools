/* eslint-disable @typescript-eslint/no-unsafe-function-type */

import {
  type FileUploaded,
  type UseDragListFnReturnType
} from "@/app/common/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowDownIcon, ArrowUpIcon, TrashIcon } from "lucide-react";
import { createContext, useContext } from "react";
import { twMerge } from "tailwind-merge";
// import { ImageListItemPreview } from "./image-list-item-preview"

export type FileEventHandler = (
  event: React.MouseEvent<HTMLElement, MouseEvent>
) => void;

export type FileEventHandlerEnhanced = (
  event: React.MouseEvent<HTMLElement, MouseEvent>,
  id: string
) => void;

export interface FileItemProps {
  file: FileUploaded;
  isSelected?: boolean;
  onSelect?: FileEventHandlerEnhanced;
  draggable?: boolean;
}

export function FileListItem(props: React.PropsWithChildren<FileItemProps>) {
  const { file, isSelected = false, onSelect, children } = props;

  const handleOnClick: React.MouseEventHandler<HTMLDivElement> = (event) => {
    onSelect?.(event, file.id);
  };

  const getDragProps = useContext(DragListContext);
  const dragProps = getDragProps?.(file);
  const draggable = props.draggable || dragProps?.draggable || false;

  return (
    <Card
      data-item-id={file.id}
      onClick={handleOnClick}
      className={`transition-colors hover:bg-accent group py-0 ${
        isSelected ? "ring-2 ring-primary bg-accent" : ""
      }`}
      {...dragProps}
      draggable={draggable}
    >
      <CardContent className="p-3 max-w-full">{children}</CardContent>
    </Card>
  );
}

export function FileItemLayout(
  props: React.PropsWithChildren<{ className?: string }>
) {
  return (
    <div className="flex items-center space-y-3">
      <div
        className={twMerge(
          "relative w-full object-contain h-20 rounded-md overflow-hidden bg-muted flex-shrink-0",
          props.className
        )}
      >
        {props.children}
      </div>
    </div>
  );
}

export interface FileItemCommonOperationsProps {
  haPrevious?: boolean;
  hasNext?: boolean;
  onMoveUp: FileEventHandler;
  onMoveDown: FileEventHandler;
  onDelete: FileEventHandler;
}

export function FileItemCommonOperations(props: FileItemCommonOperationsProps) {
  const {
    haPrevious = false,
    hasNext = false,
    onMoveDown,
    onMoveUp,
    onDelete,
  } = props;

  return (
    <div className="w-full h-full z-10 space-x-2 flex justify-center items-center">
      {haPrevious && (
        <Button
          className="pointer-events-auto"
          variant="secondary"
          onClick={onMoveUp}
        >
          <ArrowUpIcon className="w-4 h-4" />
        </Button>
      )}
      {hasNext && (
        <Button
          className="pointer-events-auto"
          variant="secondary"
          onClick={onMoveDown}
        >
          <ArrowDownIcon className="w-4 h-4" />
        </Button>
      )}
      <Button
        variant="secondary"
        className="pointer-events-auto"
        onClick={onDelete}
      >
        <TrashIcon className="w-4 h-4" />
      </Button>
    </div>
  );
}

const DragListContext = createContext<
  UseDragListFnReturnType["getDragProps"] | null
>(null);

export function FileList(
  props: React.PropsWithChildren<unknown>
) {
  // const { getDragProps } = useDragList(props.onSwap ? props.onSwap : () => {});

  return <div className="flex flex-col space-y-4">{props.children}</div>;
}

export function withFileDataEventHandler<T extends Function>(
  fn: T,
  id: string
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((event: any) => {
    return fn(event, id);
  }) as unknown as FileEventHandler;
}
