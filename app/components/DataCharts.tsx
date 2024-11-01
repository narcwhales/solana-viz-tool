import { Account, CPICall } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface DataChartsProps {
  accounts: Account[];
  cpiCalls: CPICall[];
}

// Define a consistent color palette that matches your theme
const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884d8',
  '#82ca9d',
  '#ffc658',
];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      className="text-xs"
    >
      {`${name} (${(percent * 100).toFixed(0)}%)`}
    </text>
  );
};

export default function DataCharts({ accounts, cpiCalls }: DataChartsProps) {
  // Prepare account size distribution data
  const sizeRanges = accounts.reduce((acc: { [key: string]: number }, account) => {
    let range;
    if (account.size < 1000) range = '< 1KB';
    else if (account.size < 10000) range = '1KB - 10KB';
    else if (account.size < 100000) range = '10KB - 100KB';
    else range = '> 100KB';
    
    acc[range] = (acc[range] || 0) + 1;
    return acc;
  }, {});

  const accountSizeData = Object.entries(sizeRanges).map(([range, count]) => ({
    name: range,
    value: count,
  }));

  // Prepare owner distribution data
  const ownerDistribution = accounts.reduce((acc: { [key: string]: number }, account) => {
    const shortOwner = account.owner.slice(0, 4) + '...' + account.owner.slice(-4);
    acc[shortOwner] = (acc[shortOwner] || 0) + 1;
    return acc;
  }, {});

  const ownerData = Object.entries(ownerDistribution).map(([owner, count]) => ({
    name: owner,
    value: count,
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Account Size Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={accountSizeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {accountSizeData.map((_, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Account Owner Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ownerData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {ownerData.map((_, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 