import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Account {
  name: string;
  size: number;
  type: string;
}

export default function AccountVisualization({ accounts }: { accounts: Account[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {accounts.map((account, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle>{account.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Size: {account.size} bytes</p>
            <p>Type: {account.type}</p>
            <div 
              className="mt-2 bg-blue-200 dark:bg-blue-800" 
              style={{ height: '20px', width: `${(account.size / 2048) * 100}%` }}
            ></div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}