import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowUpIcon, CrossIcon, DeleteIcon, Loader2Icon, PlusIcon, TrashIcon } from "lucide-react";
import React from "react";

export function Mover(props: {
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  showUp: boolean;
  showDown: boolean;
  showDelete: boolean;
  orientation?: "vertical" | "horizontal";
}) {
  const {
    orientation = "vertical",
    showUp = true,
    showDown = true,
    showDelete = true,
    onMoveUp,
    onMoveDown,
    onDelete,
  } = props;

  return (
    <div className={cn("inline-flex justify-bewteen items-center gap-2", orientation === "vertical" ? "flex-col" : "flex-row")}>
      {showUp && (
        <Button
          size="icon"
          variant="secondary"
          className="h-7 w-7"
          onClick={onMoveUp}
        >
          {orientation === "vertical" ? (
            <ArrowUpIcon className="w-3 h-3" />
          ) : (
            <ArrowLeft className="w-3 h-3" />
          )}
        </Button>
      )}
      {showDown && (
        <Button
          size="icon"
          variant="secondary"
          className="h-7 w-7"
          onClick={onMoveDown}
        >
          {orientation === "vertical" ? (
            <ArrowUpIcon className="w-3 h-3 rotate-180" />
          ) : (
            <ArrowLeft className="w-3 h-3 rotate-180" />
          )}
        </Button>
      )}
      {showDelete && (
        <Button
          size="icon"
          variant="secondary"
          className="h-7 w-7"
          onClick={onDelete}
        >
          {orientation === "vertical" ? (
            <TrashIcon className="w-3 h-3" />
          ) : (
            <TrashIcon className="w-3 h-3" />
          )}
        </Button>
      )}
    </div>
  );
}

function Layout(
  props: React.PropsWithChildren<
    { pageId: string | number } & React.HtmlHTMLAttributes<HTMLDivElement>
  >,
) {
  return (
    <div
      {...props}
      data-page-id={props.id}
      className={cn(
        "group relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 w-36 sm:w-48 hover:shadow-lg transition-shadow",
        props.className,
      )}
    >
      {props.children}
    </div>
  );
}

function Thumbnail(props: React.PropsWithChildren<{}>) {
  return (
    <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-800 rounded overflow-hidden mb-2">
      {props.children}
    </div>
  );
}

function Name(props: React.PropsWithChildren<{}>) {
  return (
    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
      {props.children}
    </div>
  );
}

function Loading() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <Loader2Icon className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );
}

function Actions(props: React.PropsWithChildren<{ disabled: boolean; alwaysVisible?: boolean }>) {
  return (
    <div
      className={cn(
        "absolute top-1 right-1 flex flex-col gap-1 transition-opacity",
        props.alwaysVisible ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        props.disabled ? "pointer-events-none" : "",
      )}
    >
      {props.children}
    </div>
  );
}

const AddMorePage = (props: { onAddMore: () => void; fileInputRef: React.RefObject<HTMLInputElement>; onFileChange: React.ChangeEventHandler<HTMLInputElement>  }) => {
  const { onAddMore, fileInputRef } = props;
  return (
    <div
      onClick={onAddMore}
      className="relative bg-white dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-3 w-36 sm:w-48 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors aspect-[3/4]"
    >
      <Button className="w-12 h-12 rounded-full flex items-center justify-center mb-2">
        <PlusIcon className="w-6 h-6" />
      </Button>
      <span className="text-sm">Add more</span>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="application/pdf"
        onChange={props.onFileChange}
        className="hidden"
      />
    </div>
  );
}

export const PrintPage = {
  Layout,
  Thumbnail,
  Loading,
  Name,
  Actions,
  AddMorePage
};
