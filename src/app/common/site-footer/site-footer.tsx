"use client";

import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  ChevronDownIcon,
  FileTextIcon,
  GithubIcon,
  HeartIcon,
  ImageIcon,
  LockIcon,
  MailIcon,
  SettingsIcon,
  ShieldCheckIcon,
  WrenchIcon,
  TwitterIcon,
  ZapIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { BuyMeACoffeeButton } from "../buy-me-a-coffee";
import {
  BRAND_NAME,
  IMAGE_TOOLS_HEADER,
  PDF_TOOLS_HEADER,
  UTILITY_TOOLS_HEADER,
} from "../constants";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const isSectionExpanded = (section: string) => expandedSections.includes(section);

  return (
    <footer className="w-full border-t bg-muted/30">
      <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 md:gap-8 mb-8">
          {/* Brand Section */}
          <div className="sm:col-span-2 lg:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <div>
                <h3 className="font-bold text-xl">{BRAND_NAME}</h3>
                <p className="text-sm text-muted-foreground">
                  Free Online PDF & Image Tools
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
              Professional-grade document and image processing tools that work entirely in your browser. 
              No uploads, no sign-ups, just powerful tools that respect your privacy.
            </p>
            
            {/* Trust Badges */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheckIcon className="h-4 w-4 text-green-600" />
                <span>100% Private</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ZapIcon className="h-4 w-4 text-yellow-600" />
                <span>Lightning Fast</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <LockIcon className="h-4 w-4 text-blue-600" />
                <span>Secure Processing</span>
              </div>
            </div>
          </div>

          {/* PDF Tools */}
          <div className="space-y-4">
            <button
              onClick={() => toggleSection('pdf')}
              className="flex items-center justify-between w-full md:cursor-default group"
            >
              <div className="flex items-center space-x-2">
                <FileTextIcon className="h-5 w-5 text-red-500" />
                <h4 className="font-semibold">PDF Tools</h4>
              </div>
              <ChevronDownIcon className={cn(
                "h-4 w-4 transition-transform md:hidden",
                isSectionExpanded('pdf') && "rotate-180"
              )} />
            </button>
            <ul className={cn(
              "space-y-2 md:block",
              !isSectionExpanded('pdf') && "hidden"
            )}>
              {PDF_TOOLS_HEADER.slice(0, 5).map((tool) => (
                <li key={tool.href}>
                  <Link
                    href={tool.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {tool.title}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/pdf"
                  className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  View All PDF Tools →
                </Link>
              </li>
            </ul>
          </div>

          {/* Image Tools */}
          <div className="space-y-4">
            <button
              onClick={() => toggleSection('image')}
              className="flex items-center justify-between w-full md:cursor-default group"
            >
              <div className="flex items-center space-x-2">
                <ImageIcon className="h-5 w-5 text-blue-500" />
                <h4 className="font-semibold">Image Tools</h4>
               
              </div>
              <ChevronDownIcon className={cn(
                "h-4 w-4 transition-transform md:hidden",
                isSectionExpanded('image') && "rotate-180"
              )} />
            </button>
            <ul className={cn(
              "space-y-2 md:block",
              !isSectionExpanded('image') && "hidden"
            )}>
              {IMAGE_TOOLS_HEADER.slice(0, 5).map((tool) => (
                <li key={tool.href}>
                  <Link
                    href={tool.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {tool.title}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/image"
                  className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  View All Image Tools →
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources & Support */}
          <div className="space-y-4">
            <button
              onClick={() => toggleSection('utils')}
              className="flex items-center justify-between w-full md:cursor-default group"
            >
              <div className="flex items-center space-x-2">
                <WrenchIcon className="h-5 w-5 text-violet-500" />
                <h4 className="font-semibold">Utility Tools</h4>
              </div>
              <ChevronDownIcon className={cn(
                "h-4 w-4 transition-transform md:hidden",
                isSectionExpanded('utils') && "rotate-180"
              )} />
            </button>
            <ul className={cn(
              "space-y-2 md:block",
              !isSectionExpanded('utils') && "hidden"
            )}>
              {UTILITY_TOOLS_HEADER.slice(0, 5).map((tool) => (
                <li key={tool.href}>
                  <Link
                    href={tool.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {tool.title}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/utils"
                  className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  View All Utility Tools →
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources & Support */}
          <div className="space-y-4">
            <button
              onClick={() => toggleSection('resources')}
              className="flex items-center justify-between w-full md:cursor-default group"
            >
              <h4 className="font-semibold">Resources</h4>
              <ChevronDownIcon className={cn(
                "h-4 w-4 transition-transform md:hidden",
                isSectionExpanded('resources') && "rotate-180"
              )} />
            </button>
            <ul className={cn(
              "space-y-2 md:block",
              !isSectionExpanded('resources') && "hidden"
            )}>
              <li>
                <Link
                  href="/about"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/samani-1708/samani-tools"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  Open Source
                  <GithubIcon className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="mailto:support@samanitools.com"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  Contact Support
                  <MailIcon className="h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col md:flex-row items-center gap-4 text-sm text-muted-foreground">
            <span>© {currentYear} {BRAND_NAME}. All rights reserved.</span>
            <span className="hidden md:inline">•</span>
            <span className="flex items-center gap-1">
              Made with <HeartIcon className="h-4 w-4 text-red-500 fill-red-500" /> for developers
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Social Links */}
            <a
              href="https://github.com/samani-1708/samani-tools"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="GitHub"
            >
              <GithubIcon className="h-5 w-5" />
            </a>
            <a
              href="https://x.com/samani1708"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Twitter"
            >
              <TwitterIcon className="h-5 w-5" />
            </a>
            
            {/* Support Button */}
            <BuyMeACoffeeButton />
          </div>
        </div>
      </div>
    </footer>
  );
}
