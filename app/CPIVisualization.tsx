// CPIVisualization.tsx
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CPICall {
  from: string;
  to: string;
  programId: string;
  date: string;
}

interface CPIVisualizationProps {
  cpiCalls: CPICall[];
}

export default function CPIVisualization({ cpiCalls }: CPIVisualizationProps) {
  if (cpiCalls.length === 0) {
    return (
      <Alert>
        <AlertDescription>No recent CPI calls found for this program</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {cpiCalls.map((call, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">From</p>
                <p className="text-xs truncate">{call.from}</p>
              </div>
              <div>
                <p className="text-sm font-medium">To</p>
                <p className="text-xs truncate">{call.to}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Program ID</p>
                <p className="text-xs truncate">{call.programId}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Date</p>
                <p className="text-xs">{call.date}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}