import { Account } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AccountSizeChartProps {
  accounts: Account[];
}

export default function AccountSizeChart({ accounts }: AccountSizeChartProps) {
  // Prepare data for the chart
  const chartData = accounts.map(account => ({
    pubkey: account.pubkey.slice(0, 4) + '...' + account.pubkey.slice(-4),
    size: account.size,
    balance: account.balance / 1e9, // Convert lamports to SOL
  }));

  return (
    <Card className="w-full mt-4">
      <CardHeader>
        <CardTitle>Account Size Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis 
                dataKey="pubkey" 
                tick={{ fontSize: 12 }}
                interval={0}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                label={{ 
                  value: 'Size (bytes)', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { fontSize: '12px' }
                }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid #ccc'
                }}
              />
              <Bar 
                dataKey="size" 
                fill="hsl(var(--primary))" 
                name="Size (bytes)"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 