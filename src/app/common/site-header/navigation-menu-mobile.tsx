"use client";

import {
  MenuIcon,
  FileTextIcon,
  ImageIcon,
  LayoutGridIcon,
  WrenchIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  BRAND_NAME,
  IMAGE_TOOLS_HEADER,
  PDF_TOOLS_HEADER,
  UTILITY_TOOLS_HEADER,
} from "../constants";
import { BuyMeACoffeeMobileCard } from "@/app/common/bmc";

export function NavigationMenuMobile() {
  const [isOpen, setIsOpen] = React.useState(false);
  const pathname = usePathname();

  // Close sidebar when route changes
  React.useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
        >
          <MenuIcon className="h-6 w-6" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 pr-0 overflow-y-auto">
        <MobileNav currentPath={pathname} onNavigate={() => setIsOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}

function MobileNav({
  currentPath,
  onNavigate,
}: {
  currentPath: string;
  onNavigate: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <SheetHeader className="px-4 py-6 border-b">
        <SheetTitle className="flex items-center space-x-3">
          <Link
            href="/"
            onNavigate={onNavigate}
            className="inline-flex items-center space-x-2"
          >
            <div>
              <div className="font-bold text-xl">{BRAND_NAME}</div>
              <div className="text-sm text-muted-foreground">
                PDF & Image Tools
              </div>
            </div>
          </Link>
        </SheetTitle>
      </SheetHeader>

      <div className="flex-1 px-4 py-6 space-y-6">
        {/* PDF Tools Section */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 px-3">
            <FileTextIcon className="h-5 w-5 text-red-500" />
            <h4 className="font-semibold text-base">PDF Tools</h4>
          </div>
          <div className="space-y-1">
            {PDF_TOOLS_HEADER.filter((tool) => tool.href !== "/pdf").slice(0, 5).map(
              (tool) => {
                const Icon = tool.icon;
                const isActive = currentPath === tool.href;
                return (
                  <Link
                    key={tool.title}
                    href={tool.href}
                    onClick={onNavigate}
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <div
                      className="p-1.5 rounded"
                      style={{ backgroundColor: tool.theme.HOVER_BG }}
                    >
                      <Icon
                        className="h-4 w-4"
                        style={{ color: tool.theme.BG }}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{tool.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {tool.description}
                      </div>
                    </div>
                    {isActive && (
                      <Badge variant="secondary" className="text-xs">
                        Current
                      </Badge>
                    )}
                  </Link>
                );
              }
            )}
            <Link
              href="/pdf"
              onClick={onNavigate}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                currentPath === "/pdf"
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <div className="p-1.5 rounded bg-cyan-50">
                <LayoutGridIcon className="h-4 w-4 text-cyan-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">All PDF Tools</div>
                <div className="text-xs text-muted-foreground">
                  Browse complete collection
                </div>
              </div>
              {currentPath === "/pdf" && (
                <Badge variant="secondary" className="text-xs">
                  Current
                </Badge>
              )}
            </Link>
          </div>
        </div>

        <Separator />

        {/* Image Tools Section */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 px-3">
            <ImageIcon className="h-5 w-5 text-blue-500" />
            <h4 className="font-semibold text-base">Image Tools</h4>
          </div>
          <div className="space-y-1">
            {IMAGE_TOOLS_HEADER.slice(0, 5).map((tool) => {
              const Icon = tool.icon;
              const isActive = currentPath === tool.href;
              return (
                <Link
                  key={tool.title}
                  href={tool.href}
                  onClick={onNavigate}
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <div
                    className="p-1.5 rounded"
                    style={{ backgroundColor: tool.theme.HOVER_BG }}
                  >
                    <Icon
                      className="h-4 w-4"
                      style={{ color: tool.theme.BG }}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{tool.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">
                      {tool.description}
                    </div>
                  </div>
                  {isActive && (
                    <Badge variant="secondary" className="text-xs">
                      Current
                    </Badge>
                  )}
                </Link>
              );
            })}
            <Link
              href="/image"
              onClick={onNavigate}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                currentPath === "/image"
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <div className="p-1.5 rounded bg-blue-50">
                <LayoutGridIcon className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">All Image Tools</div>
                <div className="text-xs text-muted-foreground">
                  Browse complete collection
                </div>
              </div>
              {currentPath === "/image" && (
                <Badge variant="secondary" className="text-xs">
                  Current
                </Badge>
              )}
            </Link>
          </div>
        </div>

        <Separator />

        {/* Utility Tools Section */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 px-3">
            <WrenchIcon className="h-5 w-5 text-violet-500" />
            <h4 className="font-semibold text-base">Utility Tools</h4>
          </div>
          <div className="space-y-1">
            {UTILITY_TOOLS_HEADER.slice(0, 5).map((tool) => {
              const Icon = tool.icon;
              const isActive = currentPath === tool.href;
              return (
                <Link
                  key={tool.title}
                  href={tool.href}
                  onClick={onNavigate}
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <div
                    className="p-1.5 rounded"
                    style={{ backgroundColor: tool.theme.HOVER_BG }}
                  >
                    <Icon className="h-4 w-4" style={{ color: tool.theme.BG }} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{tool.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">
                      {tool.description}
                    </div>
                  </div>
                  {isActive && (
                    <Badge variant="secondary" className="text-xs">
                      Current
                    </Badge>
                  )}
                </Link>
              );
            })}
            <Link
              href="/utils"
              onClick={onNavigate}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                currentPath === "/utils"
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <div className="p-1.5 rounded bg-violet-50">
                <LayoutGridIcon className="h-4 w-4 text-violet-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">All Utility Tools</div>
                <div className="text-xs text-muted-foreground">
                  Browse complete collection
                </div>
              </div>
              {currentPath === "/utils" && (
                <Badge variant="secondary" className="text-xs">
                  Current
                </Badge>
              )}
            </Link>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 border-t bg-muted/20">
        <BuyMeACoffeeMobileCard />
      </div>
    </div>
  );
}
