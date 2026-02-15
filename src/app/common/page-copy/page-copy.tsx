import { FeatureItem, KeyFeaturesSection } from "./key-feature"
import { PageHeader } from "./page-header"
import { Section } from "./section"
import { StepsSection } from "./steps-sections"

export interface PageConfig {
  header: string
  subHeader?: string
  description?: string
  sections: SectionConfig[]
}

export interface SectionConfig {
  type: "info" | "steps" | "keyfeatures"
  header: string
  subHeader?: string
  paragraphs?: string[]
  steps?: StepConfig[];
  features?: FeatureItem[];
}

export interface StepConfig {
  emoji?: string;
  title: string
  description: string
  status?: "completed" | "current" | "upcoming"
}

interface PageCopyProps {
  config: PageConfig
}

export function PageCopy({ config }: PageCopyProps) {
  return (
    <section className="info min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 max-w-4xl">
        <PageHeader header={config.header} subHeader={config.subHeader} description={config.description} />

        <div className="space-y-8 sm:space-y-12 lg:space-y-16 mt-8 sm:mt-12">
          {config.sections.map((section, index) => {
            if (section.type === "steps") {
              return (
                <StepsSection
                  key={index}
                  header={section.header}
                  subHeader={section.subHeader}
                  paragraphs={section.paragraphs}
                  steps={section.steps || []}
                />
              )
            }

            if (section.type === "keyfeatures") {
              return <KeyFeaturesSection key={index} header={section.header} subHeader={section.subHeader} features={section.features} />
            }

            return (
              <Section
                key={index}
                header={section.header}
                subHeader={section.subHeader}
                paragraphs={section.paragraphs}
              />
            )
          })}
        </div>
      </div>
    </section>
  )
}
