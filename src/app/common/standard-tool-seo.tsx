import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, CheckIcon, ChevronDownIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AdsenseSlot } from "@/app/common/adsense-slot";

export type StandardStep = {
  title: string;
  description?: string;
};

export type StandardReasonItem = {
  icon: string;
  iconAlt: string;
  heading: string;
  text: string;
};

export type StandardResourceCard = {
  title: string;
  description?: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  iconBg?: string;
};

export type StandardFaq = {
  question: string;
  answer: string;
};

export type StandardTrustTag = {
  label: string;
  icon?: React.ReactNode;
};

export type StandardToolSeoProps = {
  hero: {
    badge: string;
    title: string;
    description: string;
    highlights?: string[];
  };
  intro: {
    heading: string;
    paragraphs: string[];
    bullets?: Array<{ icon?: React.ReactNode; text: string }>;
  };
  howTo: {
    title: string;
    description: string;
    steps: StandardStep[];
  };
  reasons: {
    title: string;
    items: StandardReasonItem[];
  };
  faq: {
    title: string;
    items: StandardFaq[];
  };
  resources: {
    title: string;
    cards: StandardResourceCard[];
  };
  trust?: {
    title: string;
    description: string;
    tags: StandardTrustTag[];
  };
};

export function StandardToolSeoSections(props: StandardToolSeoProps) {
  const { hero, intro, howTo, reasons, faq, resources, trust } = props;
  const stepBadgeBg = [
    "bg-blue-600",
    "bg-orange-500",
    "bg-red-500",
    "bg-emerald-600",
  ];

  return (
    <section className="w-full border-t border-border/70 bg-white dark:bg-background">
      <div className="container mx-auto px-4 md:px-6 py-10 md:py-14 space-y-12 md:space-y-16">
        <header className="max-w-4xl mx-auto text-center space-y-3">
          <Badge className="bg-white dark:bg-card border-border text-foreground text-[11px] md:text-xs">
            {hero.badge}
          </Badge>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight text-balance">
            {hero.title}
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed text-pretty max-w-3xl mx-auto">
            {hero.description}
          </p>
          {hero.highlights && hero.highlights.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {hero.highlights.map((highlight) => (
                <Badge
                  key={highlight}
                  variant="outline"
                  className="border-border text-foreground bg-background/70 text-[11px] md:text-xs"
                >
                  {highlight}
                </Badge>
              ))}
            </div>
          )}
        </header>

        <AdsenseSlot className="max-w-4xl mx-auto" />

        <section className="space-y-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-[-0.01em] text-balance">
            {intro.heading}
          </h2>
          {intro.paragraphs.map((paragraph) => (
            <p
              key={paragraph}
              className="text-sm sm:text-base text-muted-foreground leading-relaxed text-pretty max-w-3xl mx-auto"
            >
              {paragraph}
            </p>
          ))}
          {intro.bullets && intro.bullets.length > 0 && (
            <ul className="space-y-2 max-w-2xl mx-auto">
              {intro.bullets.map((bullet) => (
                <li
                  key={bullet.text}
                  className="grid grid-cols-[20px_1fr] items-start gap-2 text-sm sm:text-base text-foreground text-left"
                >
                  {bullet.icon || (
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white shadow-sm">
                      <CheckIcon className="h-3.5 w-3.5" />
                    </span>
                  )}
                  <span>{bullet.text}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="text-center space-y-3">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-[-0.01em]">
            {howTo.title}
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
            {howTo.description}
          </p>
        </section>

        <section>
          <ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {howTo.steps.map((step, index) => (
              <li key={step.title} className="p-4 text-center">
                <div className="flex flex-col items-center gap-2">
                  <span
                    className={`inline-flex h-7 w-7 md:h-8 md:w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${stepBadgeBg[index % stepBadgeBg.length]}`}
                  >
                    {index + 1}
                  </span>
                  <span className="block">
                    <span className="block text-sm md:text-base font-semibold leading-snug">
                      {step.title}
                    </span>
                    {step.description && (
                      <span className="block text-sm text-muted-foreground mt-1 leading-relaxed">
                        {step.description}
                      </span>
                    )}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="space-y-7 md:space-y-12 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-[-0.01em]">
            {reasons.title}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
            {reasons.items.map((item, index) => (
              <div key={item.heading} className="space-y-2 flex flex-col items-center text-center">
                <div className="flex flex-col items-center gap-3">
                  <div
                    className={`relative h-10 w-10 shrink-0 rounded-md ${
                      index % 3 === 0
                        ? "bg-sky-100 dark:bg-sky-900/40"
                        : index % 3 === 1
                          ? "bg-emerald-100 dark:bg-emerald-900/40"
                          : "bg-violet-100 dark:bg-violet-900/40"
                    }`}
                  >
                    <div className="absolute inset-1 rounded-md border border-border/70 bg-white dark:bg-slate-900">
                      <div className="relative h-full w-full">
                        <Image
                          src={item.icon}
                          alt={item.iconAlt}
                          fill
                          sizes="24px"
                          className="object-contain p-1 contrast-125"
                        />
                      </div>
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm md:text-base leading-snug">
                    {item.heading}
                  </h3>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed max-w-sm">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <AdsenseSlot
          className="max-w-4xl mx-auto"
          slotId={process.env.NEXT_PUBLIC_ADSENSE_SLOT_PAGE_COPY_MID}
        />

        <section className="space-y-5">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-[-0.01em] text-center text-balance">
            {faq.title}
          </h2>
          <div className="max-w-4xl mx-auto divide-y rounded-2xl border border-border/80 bg-white dark:bg-card">
            {faq.items.map((item) => (
              <details key={item.question} className="group p-4 md:p-6">
                <summary className="list-none cursor-pointer text-base md:text-lg font-semibold flex items-start justify-between gap-4 leading-snug">
                  <span>{item.question}</span>
                  <ChevronDownIcon className="h-5 w-5 text-muted-foreground transition-transform group-open:rotate-180 shrink-0" />
                </summary>
                <p className="text-sm md:text-base text-muted-foreground mt-3 leading-relaxed">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        <section className="space-y-5">
          <h3 className="text-xl md:text-2xl font-semibold tracking-[-0.01em] text-center">
            {resources.title}
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {resources.cards.map((card) => {
              const Icon = card.icon;
              return (
                <article
                  key={card.title}
                  className="rounded-xl border border-border/70 bg-white dark:bg-card overflow-hidden"
                >
                  <div className="p-4 space-y-2 text-center">
                    {Icon && (
                      <div
                        className="mx-auto w-10 h-10 rounded-md flex items-center justify-center"
                        style={{ backgroundColor: card.iconBg || "oklch(71.5% 0.143 215.221)" }}
                      >
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <h4 className="text-sm md:text-base font-semibold leading-snug">
                      {card.title}
                    </h4>
                    {card.description && (
                      <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                        {card.description}
                      </p>
                    )}
                    {card.href ? (
                      <Link
                        href={card.href}
                        className="mt-3 inline-flex items-center gap-1 text-sm text-primary font-medium"
                      >
                        Open tool <ArrowRightIcon className="h-4 w-4" />
                      </Link>
                    ) : (
                      <span className="mt-3 inline-flex items-center gap-1 text-sm text-muted-foreground font-medium">
                        Read more <ArrowRightIcon className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {trust && (
          <section className="text-center space-y-4">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-[-0.01em] text-balance">
              {trust.title}
            </h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {trust.description}
            </p>
            <div className="flex flex-wrap justify-center gap-3 text-xs md:text-sm text-muted-foreground">
              {trust.tags.map((tag, idx) => (
                <span
                  key={`${tag.label}-${idx}`}
                  className="inline-flex items-center gap-1"
                >
                  {tag.icon}
                  {tag.label}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>
    </section>
  );
}
