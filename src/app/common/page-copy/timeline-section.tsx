import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Circle, Clock } from "lucide-react"
import type { StepConfig } from "./page-copy"

interface TimelineSectionProps {
  header: string
  subHeader?: string
  paragraphs?: string[]
  steps: StepConfig[]
}

export function TimelineSection({ header, subHeader, paragraphs, steps }: TimelineSectionProps) {
  const getStepIcon = (status?: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-6 w-6 text-green-500" />
      case "current":
        return <Clock className="h-6 w-6 text-blue-500" />
      default:
        return <Circle className="h-6 w-6 text-muted-foreground" />
    }
  }

  const getStepStyles = (status?: string) => {
    switch (status) {
      case "completed":
        return "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
      case "current":
        return "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950"
      default:
        return "border-muted bg-muted/20"
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="text-center space-y-3 sm:space-y-4 px-4 sm:px-0">
        {subHeader && (
          <Badge variant="outline" className="w-fit mx-auto text-xs sm:text-sm">
            {subHeader}
          </Badge>
        )}
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">{header}</h2>

        {paragraphs && paragraphs.length > 0 && (
          <div className="space-y-3 sm:space-y-4 max-w-2xl lg:max-w-3xl mx-auto">
            {paragraphs.map((paragraph, index) => (
              <p key={index} className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="relative px-4 sm:px-0">
        {/* Timeline line - hidden on very small screens, visible from sm up */}
        <div className="absolute left-6 sm:left-8 top-0 bottom-0 w-0.5 bg-border hidden xs:block" />

        <div className="space-y-6 sm:space-y-8">
          {steps.map((step, index) => (
            <div key={index} className="relative flex items-start gap-4 sm:gap-6">
              {/* Timeline dot */}
              <div className="relative z-10 flex-shrink-0 mt-1">{getStepIcon(step.status)}</div>

              {/* Step content */}
              <Card className={`flex-1 ${getStepStyles(step.status)}`}>
                <CardHeader className="pb-2 sm:pb-3 p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <CardTitle className="text-lg sm:text-xl font-semibold leading-tight">{step.title}</CardTitle>
                    {step.status && (
                      <Badge
                        variant={
                          step.status === "completed" ? "default" : step.status === "current" ? "secondary" : "outline"
                        }
                        className="text-xs w-fit"
                      >
                        {step.status}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0 p-4 sm:p-6 sm:pt-0">
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{step.description}</p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
