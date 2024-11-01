import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight } from "lucide-react"

export default function CPIVisualization({ cpiCalls }: { cpiCalls: Array<{
  from: string;
  to: string;
  data: string;
}> }) {
  return (
    <div className="space-y-4">
      {cpiCalls.map((call, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle>CPI Call {index + 1}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="font-semibold">{call.from}</div>
              <ArrowRight className="w-4 h-4" />
              <div className="font-semibold">{call.to}</div>
            </div>
            <p className="mt-2">Data: {call.data}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}