import { GithubIcon, Star, TwitterIcon } from "lucide-react";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { BuyMeACoffeeButton } from "./common/buy-me-a-coffee";

interface SiteHeroConfig {
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

export const SITE_HERO_CONFIG: SiteHeroConfig = {
  heading: "Built With Open source & ❤️",
  description:
    "A collection of finely crafted utility tools built with open source and love, for private and secure use.",
  button: {
    text: "Discover all tools",
    url: "https://www.shadcnblocks.com",
  },
  reviews: {
    isVisible: false,
    count: 0,
    rating: 0,
    avatars: [],
  },
} as const;

export function SiteHero(props: SiteHeroProps) {
  const { config } = props;
  
  const {
    heading ,
    description,
    reviews,
  } = config;

  return (
    <section className="py-32 w-full">
      <div className="mx-auto flex max-w-7xl flex-col min-h-[60vh] justify-center item-center container text-center">
        <div className="flex flex-col gap-6">
          <h1 className="text-3xl font-extrabold lg:text-6xl">{heading}</h1>
          <p className="text-muted-foreground text-balance lg:text-lg">
            {description}
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 justify-center items-center mt-12">
          <Button variant="outline" asChild>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://twitter.com/intent/tweet?text=Shoutout%20to%20%40samani1708%20%E2%80%94%20this%20tool%20is%20awesome!%20%F0%9F%9A%80"
            >
              <TwitterIcon />
              Give a shoutout
            </a>
          </Button>
          <Button asChild variant="outline">
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://github.com/samani-1708/samani-tools"
            >
              <GithubIcon />
              Contribute to code
            </a>
          </Button>
          <BuyMeACoffeeButton />
        </div>
        {reviews.isVisible && (
          <div className="mx-auto mt-10 flex w-fit flex-col items-center gap-4 sm:flex-row">
            <span className="mx-4 inline-flex items-center -space-x-4">
              {reviews?.avatars.map((avatar, index) => (
                <Avatar key={index} className="size-14 border">
                  <AvatarImage src={avatar.src} alt={avatar.alt} />
                </Avatar>
              ))}
            </span>
            <div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, index) => (
                  <Star
                    key={index}
                    className="size-5 fill-yellow-400 text-yellow-400"
                  />
                ))}
                <span className="mr-1 font-semibold">
                  {reviews.rating?.toFixed(1)}
                </span>
              </div>
              <p className="text-muted-foreground text-left font-medium">
                from {reviews.count}+ reviews
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
