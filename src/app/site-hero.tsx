import { GithubIcon, TwitterIcon } from "lucide-react";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { BuyMeACoffeeButton } from "@/app/common/bmc";
import { FractionalStars } from "@/app/common/fractional-stars";

export interface SiteHeroConfig {
  heading: string;
  description: string;
  button: {
    text: string;
    url: string;
  };
  reviews: {
    isVisible: boolean;
    count: number;
    rating: number;
    avatars: {
      src: string;
      alt: string;
    }[];
  };
}

interface SiteHeroProps {
  config: SiteHeroConfig;
}

const parseBoolean = (value: string | undefined, fallback: boolean) => {
  if (!value) return fallback;
  return value.toLowerCase() === "true";
};

const parseNumber = (value: string | undefined, fallback: number) => {
  if (!value) return fallback;
  const normalized = value.trim().replace(",", ".");
  const match = normalized.match(/-?\d+(\.\d+)?/);
  if (!match) return fallback;
  const parsed = Number.parseFloat(match[0]);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const githubCtaEnabled = parseBoolean(
  process.env.NEXT_PUBLIC_ENABLE_GITHUB_CTA,
  false,
);
const githubCtaText =
  process.env.NEXT_PUBLIC_GITHUB_CTA_TEXT || "Contribute to code";
const githubCtaUrl = process.env.NEXT_PUBLIC_GITHUB_URL || "https://github.com";

export const SITE_HERO_CONFIG: SiteHeroConfig = {
  heading:
    process.env.NEXT_PUBLIC_HERO_HEADING || "Built With Open source & ❤️",
  description:
    process.env.NEXT_PUBLIC_HERO_DESCRIPTION ||
    "A collection of finely crafted utility tools built with open source and love, for private and secure use.",
  button: {
    text: process.env.NEXT_PUBLIC_HERO_BUTTON_TEXT || "Discover all tools",
    url: process.env.NEXT_PUBLIC_HERO_BUTTON_URL || "/",
  },
  reviews: {
    isVisible: parseBoolean(
      process.env.NEXT_PUBLIC_HERO_REVIEWS_VISIBLE,
      false,
    ),
    count: Math.max(
      0,
      Math.floor(parseNumber(process.env.NEXT_PUBLIC_HERO_REVIEWS_COUNT, 0)),
    ),
    rating: clamp(
      parseNumber(process.env.NEXT_PUBLIC_HERO_REVIEWS_RATING, 0),
      0,
      5,
    ),
    avatars: [
      {
        src: "https://media.licdn.com/dms/image/v2/C5603AQGTQJ6lLxRtYQ/profile-displayphoto-shrink_100_100/profile-displayphoto-shrink_100_100/0/1517008024417?e=1773273600&v=beta&t=oYSdPLi94Ojn0mKqVYQlCx7D2w4TKgewnBz5TAf6YSw",
        alt: "S",
      },
      {
        src: "https://media.licdn.com/dms/image/v2/C4D03AQGe2tvwDEBlnA/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1640000032575?e=1773273600&v=beta&t=BNVmKNMPexDASvKU5wXgzdM_LdFFFZdZy5Ap7q7SIIc",
        alt: "A",
      },
      {
        src: "https://media.licdn.com/dms/image/v2/D5603AQF6EJ_hLTHtqw/profile-displayphoto-scale_100_100/B56ZsH27Z_LMAs-/0/1765363399103?e=1773273600&v=beta&t=7iXfCLPFm4u0wvDb6dUMKGId2Uf0uRZ_V93OWs1mXys",
        alt: "M",
      },
      {
        src: "https://media.licdn.com/dms/image/v2/D5603AQFSIlqJvtj52g/profile-displayphoto-shrink_100_100/profile-displayphoto-shrink_100_100/0/1727924376497?e=1773273600&v=beta&t=p2TE90IPjiP_Z-tvjXMAF2ML9hgwzYr-43eeH2FrhfM",
        alt: "U",
      },
    ],
  },
} as const;

export function SiteHero(props: SiteHeroProps) {
  const { config } = props;
  const shoutoutUrl =
    process.env.NEXT_PUBLIC_SHOUTOUT_URL ||
    "https://twitter.com/intent/tweet?text=Shoutout%20to%20this%20tool%20%E2%80%94%20it%20is%20awesome!%20%F0%9F%9A%80";

  const { heading, description, reviews } = config;
  const visibleAvatars = reviews.avatars.slice(0, 3);
  const overflowCount = Math.max(0, reviews.count - visibleAvatars.length);
  const showReviewsInline = reviews.isVisible && !githubCtaEnabled;

  const reviewsNode = (
    <div className="flex w-fit flex-col items-center gap-2">
      <div className="inline-flex items-center -space-x-3 grayscale">
        {visibleAvatars.map((avatar, index) => (
          <Avatar
            key={index}
            className="size-10 border-2 border-background"
          >
            <AvatarImage src={avatar.src} alt={avatar.alt} />
          </Avatar>
        ))}
        {overflowCount > 0 && (
          <span className="inline-flex size-10 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-semibold text-muted-foreground">
            +{overflowCount}
          </span>
        )}
      </div>
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-1 justify-center">
          <FractionalStars rating={reviews.rating} size={16} />
          <span className="ml-1 text-sm font-semibold">
            {reviews.rating?.toFixed(1)}
          </span>
        </div>
        <p className="text-muted-foreground text-center text-xs font-medium">
          from {reviews.count}+ reviews
        </p>
      </div>
    </div>
  );

  return (
    <section className="py-32 w-full">
      <div className="mx-auto flex max-w-7xl flex-col min-h-[60vh] justify-center item-center container text-center">
        <div className="flex flex-col gap-6">
          <h1 className="text-3xl font-extrabold lg:text-6xl">{heading}</h1>
          <p className="text-muted-foreground text-balance lg:text-lg">
            {description}
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 md:gap-6 justify-center items-center mt-12">
          {showReviewsInline && (
            <div className="md:mr-2 lg:mr-4 order-1 md:order-none">
              {reviewsNode}
            </div>
          )}
          <Button variant="outline" asChild>
            <a target="_blank" rel="noopener noreferrer" href={shoutoutUrl}>
              <TwitterIcon />
              Give a shoutout
            </a>
          </Button>
          {githubCtaEnabled && (
            <Button asChild variant="outline">
              <a target="_blank" rel="noopener noreferrer" href={githubCtaUrl}>
                <GithubIcon />
                {githubCtaText}
              </a>
            </Button>
          )}
          <BuyMeACoffeeButton />
        </div>
        {reviews.isVisible && githubCtaEnabled && (
          <div className="mx-auto mt-12">{reviewsNode}</div>
        )}
      </div>
    </section>
  );
}
