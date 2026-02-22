import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyFeaturesSection } from "@/app/common/page-copy/key-feature";
import { StepsSection } from "@/app/common/page-copy/steps-sections";
import { Section } from "@/app/common/page-copy/section";
import { SEOFAQSection, SEOPageSchema } from "@/app/common/seo-page-schema";

function FAQSection({ section }: { section: SEOFAQSection }) {
  return (
    <section className="space-y-6 sm:space-y-8 px-4 sm:px-6 lg:px-8">
      <div className="text-center space-y-3 sm:space-y-4">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
          {section.header}
        </h2>
        {section.subHeader && (
          <Badge variant="outline" className="mx-auto text-xs sm:text-sm w-fit">
            {section.subHeader}
          </Badge>
        )}
      </div>

      <div className="max-w-3xl mx-auto space-y-4">
        {section.faqs.map((faq) => (
          <Card key={faq.question} className="border-border/60">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">{faq.question}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function SEOPageContent({ schema }: { schema: SEOPageSchema }) {
  const hero = schema.hero;

  return (
    <section className="info bg-background border-t border-border/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 max-w-5xl">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
            {hero?.header || schema.title}
          </h1>

          {(hero?.subHeader || schema.description) && (
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              {hero?.subHeader || schema.description}
            </p>
          )}

          {hero?.highlights && hero.highlights.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {hero.highlights.map((highlight) => (
                <Badge key={highlight} variant="outline" className="text-xs sm:text-sm">
                  {highlight}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-10 sm:space-y-12 lg:space-y-14 mt-10 sm:mt-12">
          {schema.sections.map((section) => {
            if (section.type === "info") {
              return (
                <div key={section.header} className="space-y-4">
                  <Section
                    header={section.header}
                    subHeader={section.subHeader}
                    paragraphs={section.paragraphs}
                  />
                  {section.bullets && section.bullets.length > 0 && (
                    <ul className="max-w-3xl mx-auto space-y-2 text-muted-foreground list-disc pl-6">
                      {section.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            }

            if (section.type === "keyfeatures") {
              return (
                <KeyFeaturesSection
                  key={section.header}
                  header={section.header}
                  subHeader={section.subHeader}
                  features={section.features}
                />
              );
            }

            if (section.type === "steps") {
              return (
                <StepsSection
                  key={section.header}
                  header={section.header}
                  subHeader={section.subHeader}
                  paragraphs={section.paragraphs}
                  steps={section.steps.map((step) => ({
                    ...step,
                    description: step.description || "",
                  }))}
                />
              );
            }

            return <FAQSection key={section.header} section={section} />;
          })}
        </div>
      </div>
    </section>
  );
}
