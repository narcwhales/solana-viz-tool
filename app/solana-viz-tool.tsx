"use client"

import { useState } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AccountVisualization from './AccountVisualization'
import CPIVisualization from './CPIVisualization'
import StepByStepGuide from './StepByStepGuide'
import { Connection, PublicKey } from '@solana/web3.js';

interface VisualizationData {
  accounts: Array<{ name: string; size: number; type: string }>;
  cpiCalls: Array<{ from: string; to: string; data: string }>;
  steps: Array<{ title: string; description: string }>;
}

export default function Dashboard() {
  const [programId, setProgramId] = useState('')
  const [visualizationData, setVisualizationData] = useState<VisualizationData | null>(null)

  const handleVisualize = async () => {
    const connection = new Connection('https://api.mainnet-beta.solana.com');
    try {
      const publicKey = new PublicKey(programId);
      const accountInfo = await connection.getAccountInfo(publicKey);

      if (accountInfo) {
        setVisualizationData({
          accounts: [
            { name: 'Account 1', size: accountInfo.data.length, type: 'Data' },
            // Add more accounts as needed
          ],
          cpiCalls: [
            // Fetch and populate CPI calls data
          ],
          steps: [
            // Define steps based on fetched data
          ]
        });
      } else {
        console.error('Account not found');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Solana Developer Visualization Tool</CardTitle>
          <CardDescription>Visualize Solana's memory management and CPI calls for on-chain programs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2 mb-4">
            <Input
              placeholder="Enter Program ID or Transaction ID"
              value={programId}
              onChange={(e) => setProgramId(e.target.value)}
            />
            <Button onClick={handleVisualize}>Visualize</Button>
          </div>
          {visualizationData && (
            <Tabs defaultValue="accounts">
              <TabsList>
                <TabsTrigger value="accounts">Account Visualization</TabsTrigger>
                <TabsTrigger value="cpi">CPI Calls</TabsTrigger>
                <TabsTrigger value="guide">Step-by-Step Guide</TabsTrigger>
              </TabsList>
              <TabsContent value="accounts">
                <AccountVisualization accounts={visualizationData.accounts} />
              </TabsContent>
              <TabsContent value="cpi">
                <CPIVisualization cpiCalls={visualizationData.cpiCalls} />
              </TabsContent>
              <TabsContent value="guide">
                <StepByStepGuide steps={visualizationData.steps} />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  )
}