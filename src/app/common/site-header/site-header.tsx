import Link from "next/link";

import { BRAND_NAME } from "../constants";
import { BuyMeACoffeeButton } from "@/app/common/bmc";
import { NavigationMenuDesktop } from "./navigation-menu-desktop";
import { NavigationMenuMobile } from "./navigation-menu-mobile";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader() {
  return (
    <header className="px-4 flex justify-center sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="space-x-6 container flex h-16 items-center">
        {/* Logo */}
        <div className="hidden md:flex">
          <Link href="/" className="flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block">
              {BRAND_NAME}
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <NavigationMenuDesktop />

        {/* Mobile menu button */}
        <NavigationMenuMobile />

        {/* Mobile Logo */}
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <Link href="/" className="flex items-center space-x-2 md:hidden">
              <span className="font-bold">{BRAND_NAME}</span>
            </Link>
          </div>
          <nav className="flex items-center">
            <ThemeToggle />
            <BuyMeACoffeeButton />
          </nav>
        </div>
      </div>
    </header>
  );
}
