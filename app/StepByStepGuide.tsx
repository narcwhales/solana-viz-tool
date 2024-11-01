// StepByStepGuide.tsx
import { Card, CardContent } from "@/components/ui/card"

interface Step {
  title: string;
  description: string;
}

interface StepByStepGuideProps {
  steps: Step[];
}

export default function StepByStepGuide({ steps }: StepByStepGuideProps) {
  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <h3 className="font-medium mb-2">{step.title}</h3>
            <p className="text-sm text-gray-600">{step.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}