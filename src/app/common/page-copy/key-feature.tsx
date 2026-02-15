export interface FeatureItem {
  emoji?: string
  title: string
  description: string
}

export interface KeyFeaturesSectionProps {
  header: string
  subHeader?: string
  features?: FeatureItem[]
}


export function KeyFeaturesSection({ header, subHeader, features = []}: KeyFeaturesSectionProps) {
  return (
    <section className="space-y-6 sm:space-y-8 px-4 sm:px-6 lg:px-8">
      <div className="text-center space-y-3 sm:space-y-4">
        {subHeader && (
          <div className="text-xs sm:text-sm font-medium text-muted-foreground tracking-wide uppercase">
            {subHeader}
          </div>
        )}
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold">{header}</h2>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
        {features.map((feature, i) => (
          <div
            key={i}
            className="flex items-start gap-3 sm:gap-4 bg-muted/10 p-4 sm:p-5 rounded-lg border border-border shadow-sm"
          >
            <div className="text-2xl pt-0.5">
              {feature.emoji}
            </div>
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-medium">{feature.title}</h3>
              <p className="text-sm sm:text-base text-muted-foreground">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
