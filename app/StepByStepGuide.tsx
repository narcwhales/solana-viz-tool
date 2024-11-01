import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Step {
  title: string;
  description: string;
}

export default function StepByStepGuide({ steps }: { steps: Step[] }) {
  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle>Step {index + 1}: {step.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{step.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}