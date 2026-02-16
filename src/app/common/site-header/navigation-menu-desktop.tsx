"use client";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import {
  IMAGE_TOOLS_HEADER,
  PDF_TOOLS_HEADER,
  ToolInfo,
  UTILITY_TOOLS_HEADER,
} from "../constants";
import React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a"> & Omit<ToolInfo, "description">
>(({ className, title, children, icon: Icon, theme, ...props }, ref) => {
  return (
    <div>
      <NavigationMenuLink
        asChild
        style={
          {
            "--bg": theme.BG,
            "--hover-bg": theme.HOVER_BG,
            "--hover-text": theme.TEXT,
          } as React.CSSProperties
        }
      >
        <Link
          ref={ref}
          className={cn(
            " group gap-2 block flex flex-row justify-center items-start select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors focus:bg-[var(--hover-bg)] focus:text-[var(--hover-text)] hover:bg-[var(--hover-bg)]",
            className
          )}
          {...props}
        >
          <div className="bg-[var(--bg)] w-10 h-10 px-2 rounded-md flex flex-row justify-center items-center">
            <Icon className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-medium leading-none group-hover:text-[var(--hover-text)]">
              {title}
            </div>
            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground group-hover:text-[var(--hover-text)]">
              {children}
            </p>
          </div>
        </Link>
      </NavigationMenuLink>
    </div>
  );
});
ListItem.displayName = "ListItem";

export function NavigationMenuDesktop() {
  return (
    <NavigationMenu className="hidden md:flex">
      <NavigationMenuList>
        {/* PDF Tools - Mega Menu */}
        <NavigationMenuItem>
          <NavigationMenuTrigger>PDF tools</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid gap-3 p-4 md:w-[400px] lg:w-[600px] lg:grid-cols-2">
              {PDF_TOOLS_HEADER.map((product) => (
                <ListItem
                  key={product.title}
                  title={product.title}
                  href={product.href}
                  icon={product.icon}
                  theme={product.theme}
                >
                  {product.description}
                </ListItem>
              ))}
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Image Tools - Regular Dropdown */}
        <NavigationMenuItem>
          <NavigationMenuTrigger>Image Tools</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[600px] lg:grid-cols-2">
              {IMAGE_TOOLS_HEADER.map((product) => (
                <ListItem
                  key={product.title}
                  title={product.title}
                  href={product.href}
                  icon={product.icon}
                  theme={product.theme}
                >
                  {product.description}
                </ListItem>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger>Utility Tools</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[600px] lg:grid-cols-2">
              {UTILITY_TOOLS_HEADER.map((product) => (
                <ListItem
                  key={product.title}
                  title={product.title}
                  href={product.href}
                  icon={product.icon}
                  theme={product.theme}
                >
                  {product.description}
                </ListItem>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Resources - Simple Dropdown */}
        {/* <NavigationMenuItem>
              <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                  {resources.map((resource) => (
                    <ListItem
                      key={resource.title}
                      title={resource.title}
                      href={resource.href}
                    />
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem> */}

        {/* Pricing - Single Link */}
        {/* <NavigationMenuItem>
              <NavigationMenuLink
                className={navigationMenuTriggerStyle()}
                asChild
              >
                <Link href="/pricing">Pricing</Link>
              </NavigationMenuLink>
            </NavigationMenuItem> */}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
