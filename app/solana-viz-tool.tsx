"use client"

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowRight, Box, Cpu, Loader2 } from "lucide-react"
import { Connection, PublicKey } from '@solana/web3.js'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Program, AnchorProvider, Idl } from '@project-serum/anchor'
import { useEffect } from 'react'

// Dynamically import ForceGraph2D to avoid SSR issues
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false })

// Mock data for the graph
const mockGraphData = {
  nodes: [
    { id: 'program', name: 'Main Program', color: '#ff6b6b' },
    { id: 'account1', name: 'Account 1', color: '#4ecdc4' },
    { id: 'account2', name: 'Account 2', color: '#4ecdc4' },
    { id: 'cpi1', name: 'CPI Program 1', color: '#45b7d1' },
  ],
  links: [
    { source: 'program', target: 'account1' },
    { source: 'program', target: 'account2' },
    { source: 'program', target: 'cpi1' },
    { source: 'cpi1', target: 'account2' },
  ]
}

// Mock steps for program invocation
const invocationSteps = [
  { id: 1, description: "Initialize program accounts" },
  { id: 2, description: "Prepare instruction data" },
  { id: 3, description: "Sign transaction" },
  { id: 4, description: "Submit transaction to the network" },
  { id: 5, description: "Confirm transaction" },
]

// Add this near your other constants
const CLUSTERS = {
  devnet: 'https://api.devnet.solana.com',
  testnet: 'https://api.testnet.solana.com',
  mainnet: 'https://api.mainnet-beta.solana.com'
} as const

// Add new type for IDL data
type ProgramData = {
  idl: Idl | null;
  error?: string;
}

// Add new types for memory and CPI tracking
type MemoryAllocation = {
  accountAddress: string;
  size: number;
  type: 'data' | 'program' | 'stack';
}

type CpiCall = {
  from: string;
  to: string;
  accounts: string[];
  data: string;
}

export default function Component() {
  const [programId, setProgramId] = useState('')
  const [graphData, setGraphData] = useState(mockGraphData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCluster, setSelectedCluster] = useState<keyof typeof CLUSTERS>('devnet')
  const [accountLimit, setAccountLimit] = useState(100) // Default limit of 100 accounts
  const [idl, setIdl] = useState<Idl | null>(null)
  const [memoryAllocations, setMemoryAllocations] = useState<MemoryAllocation[]>([])
  const [cpiCalls, setCpiCalls] = useState<CpiCall[]>([])

  // Add new function to analyze program memory
  const analyzeProgramMemory = async (programId: string, accounts: any[]) => {
    const memoryData: MemoryAllocation[] = accounts.map(acc => ({
      accountAddress: acc.pubkey.toString(),
      size: acc.account.data.length,
      type: acc.account.executable ? 'program' : 'data'
    }))
    setMemoryAllocations(memoryData)
  }

  const fetchProgramData = async (programId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const connection = new Connection(CLUSTERS[selectedCluster])
      
      const pubkey = new PublicKey(programId)
      
      // Add configuration object with limits
      const config = {
        limit: accountLimit,
        filters: [
          {
            dataSize: 0, // 0 means any size
          },
        ],
      }
      
      // Fetch program accounts with limits
      const accounts = await connection.getProgramAccounts(pubkey, config)
      
      // Add warning if limit was reached
      if (accounts.length >= accountLimit) {
        setError(`Showing first ${accountLimit} accounts. Use a higher limit to see more.`)
      }

      // Transform data for visualization
      const nodes = [
        { id: programId, name: 'Main Program', color: '#ff6b6b' },
        ...accounts.map((acc, i) => ({
          id: acc.pubkey.toString(),
          name: `Account ${i + 1}`,
          color: '#4ecdc4',
          size: acc.account.data.length
        }))
      ]

      const links = accounts.map(acc => ({
        source: programId,
        target: acc.pubkey.toString()
      }))

      // Add CPI detection by analyzing recent transactions
      const recentSignatures = await connection.getSignaturesForAddress(pubkey, { limit: 10 })
      const transactions = await connection.getParsedTransactions(recentSignatures.map(sig => sig.signature))
      
      const cpiData: CpiCall[] = transactions
        .filter(Boolean)
        .flatMap(tx => tx!.meta?.innerInstructions?.map(ix => ({
          from: programId,
          to: ix.instructions[0].programId.toString(),
          accounts: ix.instructions[0].accounts.map(acc => acc.toString()),
          data: ix.instructions[0].data || ''
        })) || [])

      setCpiCalls(cpiData)
      await analyzeProgramMemory(programId, accounts)

      // Update graph data to include CPI calls
      const cpiNodes = cpiData.map(cpi => ({
        id: cpi.to,
        name: `CPI Program: ${cpi.to.slice(0, 8)}...`,
        color: '#45b7d1'
      }))

      const cpiLinks = cpiData.map(cpi => ({
        source: cpi.from,
        target: cpi.to,
        type: 'cpi'
      }))

      setGraphData({
        nodes: [...nodes, ...cpiNodes],
        links: [...links, ...cpiLinks]
      })

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch program data')
    } finally {
      setLoading(false)
    }
  }

  const fetchIdl = async (programId: string) => {
    try {
      setLoading(true)
      setError(null)

      // Create connection and provider
      const connection = new Connection(CLUSTERS[selectedCluster])
      const provider = new AnchorProvider(
        connection,
        {} as any, // wallet - not needed for just fetching IDL
        { commitment: 'processed' }
      )

      // Fetch IDL
      const idl = await Program.fetchIdl(new PublicKey(programId), provider)
      
      if (!idl) {
        setError('No IDL found for this program')
        return
      }

      setIdl(idl)
      
      // Continue with account fetching
      await fetchProgramData(programId)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch IDL')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (programId) fetchIdl(programId)
  }

  // Update the Memory Allocation card
  const MemoryCard = () => (
    <Card>
      <CardHeader>
        <CardTitle>Memory Allocation</CardTitle>
        <CardDescription>Detailed program memory usage analysis</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {memoryAllocations.map((alloc, i) => (
            <div key={i} className="flex items-center justify-between p-2 border rounded">
              <div className="flex items-center">
                <Cpu className="w-4 h-4 mr-2" />
                <span className="text-sm">{alloc.accountAddress.slice(0, 8)}...</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm font-mono">{alloc.size} bytes</span>
                <div 
                  className="ml-2 h-2 bg-primary rounded"
                  style={{ width: `${Math.min(100, (alloc.size / 10000) * 100)}px` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  // Update the Data Flow card
  const DataFlowCard = () => (
    <Card>
      <CardHeader>
        <CardTitle>CPI Flow Analysis</CardTitle>
        <CardDescription>Cross-Program Invocation patterns</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {cpiCalls.map((cpi, i) => (
            <div key={i} className="p-2 border rounded">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">{cpi.from.slice(0, 8)}...</span>
                <ArrowRight className="w-4 h-4 mx-2" />
                <span className="text-sm">{cpi.to.slice(0, 8)}...</span>
              </div>
              <div className="text-xs text-gray-500">
                Accounts: {cpi.accounts.length}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Solana Developer Visualization Tool</h1>
      
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex gap-2">
          <Select
            value={selectedCluster}
            onValueChange={(value: keyof typeof CLUSTERS) => setSelectedCluster(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select cluster" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="devnet">Devnet</SelectItem>
              <SelectItem value="testnet">Testnet</SelectItem>
              <SelectItem value="mainnet">Mainnet</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="number"
            value={accountLimit}
            onChange={(e) => setAccountLimit(Number(e.target.value))}
            placeholder="Account limit"
            className="w-[150px]"
            min={1}
            max={1000}
          />
          <Input
            type="text"
            value={programId}
            onChange={(e) => setProgramId(e.target.value)}
            placeholder="Enter Program ID"
            className="flex-grow"
          />
          <Button type="submit">Visualize</Button>
        </div>
      </form>

      <Tabs defaultValue="accounts">
        <TabsList>
          <TabsTrigger value="accounts">Account Visualization</TabsTrigger>
          <TabsTrigger value="idl">IDL Details</TabsTrigger>
          <TabsTrigger value="invocation">Invocation Steps</TabsTrigger>
        </TabsList>
        
        <TabsContent value="accounts">
          <Card>
            <CardHeader>
              <CardTitle>Account and CPI Visualization</CardTitle>
              <CardDescription>Visual representation of program accounts and CPI calls</CardDescription>
            </CardHeader>
            <CardContent>
              {error && <div className="text-red-500 mb-4">{error}</div>}
              <div style={{ height: '400px' }}>
                {loading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                ) : (
                  <ForceGraph2D
                    graphData={graphData}
                    nodeLabel="name"
                    nodeColor="color"
                    nodeVal={node => (node as any).size || 1}
                    linkDirectionalArrowLength={3.5}
                    linkDirectionalArrowRelPos={1}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="idl">
          <Card>
            <CardHeader>
              <CardTitle>Program IDL</CardTitle>
              <CardDescription>Program instructions and account structures</CardDescription>
            </CardHeader>
            <CardContent>
              {idl ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">Instructions</h3>
                    <div className="space-y-2">
                      {idl.instructions.map((ix, i) => (
                        <div key={i} className="border p-4 rounded-lg">
                          <h4 className="font-medium">{ix.name}</h4>
                          <div className="text-sm">
                            <p>Accounts:</p>
                            <ul className="list-disc pl-4">
                              {ix.accounts.map((acc, j) => (
                                <li key={j}>
                                  {acc.name} ({('isMut' in acc) ? acc.isMut : false ? 'mutable' : 'readonly'})
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  No IDL loaded. Enter a program ID to fetch its IDL.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="invocation">
          <Card>
            <CardHeader>
              <CardTitle>Program Invocation Steps</CardTitle>
              <CardDescription>Step-by-step process for invoking Solana programs</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4">
                {invocationSteps.map((step) => (
                  <li key={step.id} className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground">
                      {step.id}
                    </div>
                    <span>{step.description}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <MemoryCard />
        <DataFlowCard />
      </div>
    </div>
  )
}