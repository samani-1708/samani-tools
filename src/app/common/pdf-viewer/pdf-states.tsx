import { AlertTriangleIcon, FileTextIcon, Loader2Icon } from "lucide-react";

interface MessageProps {
  header: string;
  subHeader: string;
}

export function PDFStateIdle(props: MessageProps) {
  const { header, subHeader } = props;

  return (
    <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4">
      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
        <FileTextIcon className="w-7 h-7 text-muted-foreground" />
      </div>
      <div className="text-center">
        <h3 className="text-sm font-medium mb-1">{header}</h3>
        <p className="text-xs">{subHeader}</p>
      </div>
    </div>
  );
}

export function PDFStatePending(props: MessageProps) {
  const { header, subHeader = "" } = props;

  return (
    <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4">
      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
        <Loader2Icon className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
      <div className="text-center">
        <h3 className="text-sm font-medium">{header}</h3>
        <p className="text-xs">{subHeader}</p>
      </div>
    </div>
  );
}

export function PDFStateError(props: MessageProps) {
  const { header, subHeader } = props;

  return (
    <div className="h-full flex flex-col items-center justify-center text-destructive space-y-4">
      <div className="w-16 h-16 bg-destructive/10 rounded-lg flex items-center justify-center">
        <AlertTriangleIcon className="w-6 h-6 text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="text-sm font-medium">{header}</h3>
        <p className="text-xs text-muted-foreground">{subHeader}</p>
      </div>
    </div>
  );
}
