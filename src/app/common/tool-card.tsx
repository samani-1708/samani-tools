import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Link from "next/link";
import { ToolInfo } from "./constants";

export interface ToolCardProps extends ToolInfo {
  isNew?: boolean;
}

export function ToolCard({
  icon: Icon,
  title,
  description,
  href,
  theme,
}: ToolCardProps) {
  return (
    <Card
      className="block h-full relative h-full hover:shadow-lg transition-shadow duration-200 cursor-pointer group  hover:bg-[var(--hover-bg)] text-left"
      style={
        {
          "--bg": theme.BG,
          "--hover-text": theme.TEXT,
          "--hover-bg": theme.HOVER_BG,
        } as React.CSSProperties
      }
    >
      <Link className="block w-full h-full" href={href}>
        <CardHeader className="pb-3">
          <div className="mb-3">
            <span className="inline-flex justify-center items-center  bg-[var(--bg)]  rounded w-12 h-12 ">
              <Icon className="w-8 h-8 text-white" />
            </span>
          </div>
          <h3 className="text-lg lg:text-xl font-semibold text-gray-900 transition-colors group-hover:text-[var(--hover-text)]">
            {title}
          </h3>
        </CardHeader>

        <CardContent className="pt-0">
          <p className="text-sm text-gray-600 leading-relaxed group-hover:text-[var(--hover-text)]">
            {description}
          </p>
        </CardContent>
      </Link>
    </Card>
  );
}