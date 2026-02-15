import { Badge } from "@/components/ui/badge";

export interface StepConfig {
  emoji?: string;
  title: string;
  description: string;
}

interface StepsSectionProps {
  header: string;
  subHeader?: string;
  paragraphs?: string[];
  steps: StepConfig[];
}

const numberedEmojis = [
  "1️⃣",
  "2️⃣",
  "3️⃣",
  "4️⃣",
  "5️⃣",
  "6️⃣",
  "7️⃣",
  "8️⃣",
  "9️⃣",
  "🔟",
];

export function StepsSection({
  header,
  subHeader,
  paragraphs = [],
  steps,
}: StepsSectionProps) {
  return (
    <section className="space-y-6 sm:space-y-8 px-4 sm:px-6 lg:px-8">
      <div className="text-center space-y-3 sm:space-y-4">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
          {header}
        </h2>
        {subHeader && (
          <Badge variant="outline" className="mx-auto text-xs sm:text-sm w-fit">
            {subHeader}
          </Badge>
        )}
        {paragraphs?.length > 0 && (
          <div className="space-y-3 max-w-2xl mx-auto text-muted-foreground text-base sm:text-lg">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
        {steps.map((step, i) => (
          <div
            key={i}
            className="flex items-start gap-3 sm:gap-4 bg-muted/10 rounded-lg p-4 sm:p-5"
          >
            <div className="text-2xl pt-0.5">
              {step.emoji || numberedEmojis[i] || "🔘"}
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="text-lg sm:text-xl font-medium">{step.title}</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
