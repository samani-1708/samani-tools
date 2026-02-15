import { Badge } from "@/components/ui/badge";

interface PageHeaderProps {
  header: string;
  subHeader?: string;
  description?: string;
}

export function PageHeader({
  header,
  subHeader,
  description,
}: PageHeaderProps) {
  return (
    <div className="text-center space-y-3 sm:space-y-4 lg:space-y-6">
      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-tight">
        {header}
      </h1>
      {subHeader && (
        <Badge variant="secondary" className="inline-flex text-wrap text-xs sm:text-sm font-medium" style={{ textWrap: 'wrap'}}>
          {subHeader}
        </Badge>
      )}
      {description && (
        <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl lg:max-w-3xl mx-auto leading-relaxed px-4 sm:px-0">
          {description}
        </p>
      )}
    </div>
  );
}
