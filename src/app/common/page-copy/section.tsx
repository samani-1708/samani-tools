import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface SectionProps {
  header: string
  subHeader?: string
  paragraphs?: string[]
}

export function Section({ header, subHeader, paragraphs }: SectionProps) {
  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardHeader className="text-center pb-4 sm:pb-6 px-4 sm:px-6">
        {subHeader && (
          <Badge variant="outline" className="w-fit mx-auto mb-2 text-xs sm:text-sm">
            {subHeader}
          </Badge>
        )}
        <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">{header}</CardTitle>
      </CardHeader>

      {paragraphs && paragraphs.length > 0 && (
        <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              {paragraph}
            </p>
          ))}
        </CardContent>
      )}
    </Card>
  )
}
