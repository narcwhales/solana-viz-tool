"use client"

import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { Cluster, Connection, PublicKey, clusterApiUrl, ParsedInstruction, PartiallyDecodedInstruction } from "@solana/web3.js";

interface Account {
  pubkey: string;
  size: number;
  executable: boolean;
  owner: string;
  balance: number;
}

interface CPICall {
  from: string;
  to: string;
  programId: string;
  date: string;
}

interface VisualizationData {
  accounts: Account[];
  cpiCalls: CPICall[];
  steps: Array<{ title: string; description: string }>;
}

export default function Dashboard() {
  const [programId, setProgramId] = useState('');
  const [network, setNetwork] = useState('devnet');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [visualizationData, setVisualizationData] = useState<VisualizationData | null>(null);

  const fetchProgramAccounts = async (connection: Connection, publicKey: PublicKey) => {
    const accounts = await connection.getProgramAccounts(publicKey, {
      commitment: 'confirmed',
    });

    return accounts.map(account => ({
      pubkey: account.pubkey.toString(),
      size: account.account.data.length,
      executable: account.account.executable,
      owner: account.account.owner.toString(),
      balance: account.account.lamports
    }));
  };

  const fetchRecentTransactions = async (connection: Connection, publicKey: PublicKey) => {
    const signatures = await connection.getSignaturesForAddress(publicKey, {
      limit: 10,
    });

    const transactions = await Promise.all(
      signatures.map(async (sig) => {
        const tx = await connection.getParsedTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0,
        });
        return tx;
      })
    );

    const cpiCalls: CPICall[] = [];
    
    transactions.forEach(tx => {
      if (!tx) return;
      
      tx.transaction.message.instructions.forEach((ix: ParsedInstruction | PartiallyDecodedInstruction) => {
        if ('programId' in ix) {
          cpiCalls.push({
            from: tx.transaction.message.accountKeys[0].pubkey.toString(),
            to: ix.programId.toString(),
            programId: ix.programId.toString(),
            date: new Date(tx.blockTime! * 1000).toLocaleString(),
          });
        }
      });
    });

    return cpiCalls;
  };

  const handleVisualize = async () => {
    setLoading(true);
    setError('');
    
    try {
      const connection = new Connection(clusterApiUrl(network as Cluster));
      const publicKey = new PublicKey(programId);

      // Fetch program accounts
      const accounts = await fetchProgramAccounts(connection, publicKey);
      
      // Fetch recent transactions and CPI calls
      const cpiCalls = await fetchRecentTransactions(connection, publicKey);

      // Generate visualization steps based on the data
      const steps = [
        {
          title: 'Program Overview',
          description: `Program has ${accounts.length} associated accounts and ${cpiCalls.length} recent CPI calls`
        },
        {
          title: 'Account Analysis',
          description: `Total storage used: ${accounts.reduce((acc, curr) => acc + curr.size, 0)} bytes`
        },
        {
          title: 'Program Activity',
          description: `Latest activity: ${cpiCalls[0]?.date || 'No recent activity'}`
        }
      ];

      setVisualizationData({
        accounts,
        cpiCalls,
        steps
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch program data');
    } finally {
      setLoading(false);
    }
  };

  const AccountVisualization = ({ accounts }: { accounts: Account[] }) => (
    <div className="space-y-4">
      {accounts.map((account, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Public Key</p>
                <p className="text-xs truncate">{account.pubkey}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Size</p>
                <p className="text-xs">{account.size} bytes</p>
              </div>
              <div>
                <p className="text-sm font-medium">Owner</p>
                <p className="text-xs truncate">{account.owner}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Balance</p>
                <p className="text-xs">{account.balance / 1e9} SOL</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const CPIVisualization = ({ cpiCalls }: { cpiCalls: CPICall[] }) => (
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
  );

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Solana Developer Visualization Tool</CardTitle>
          <CardDescription>
            Visualize Solana&apos;s memory management and CPI calls for on-chain programs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2 mb-4">
            <Input
              placeholder="Enter Program ID"
              value={programId}
              onChange={(e) => setProgramId(e.target.value)}
            />
            <select 
              value={network} 
              onChange={(e) => setNetwork(e.target.value)}
              className="border rounded-md px-3 py-2"
            >
              <option value="mainnet-beta">Mainnet</option>
              <option value="devnet">Devnet</option>
              <option value="testnet">Testnet</option>
            </select>
            <Button 
              onClick={handleVisualize}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading
                </>
              ) : (
                'Visualize'
              )}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {visualizationData && (
            <Tabs defaultValue="accounts">
              <TabsList>
                <TabsTrigger value="accounts">Account Visualization</TabsTrigger>
                <TabsTrigger value="cpi">CPI Calls</TabsTrigger>
                <TabsTrigger value="guide">Analysis</TabsTrigger>
              </TabsList>
              <TabsContent value="accounts">
                <AccountVisualization accounts={visualizationData.accounts} />
              </TabsContent>
              <TabsContent value="cpi">
                <CPIVisualization cpiCalls={visualizationData.cpiCalls} />
              </TabsContent>
              <TabsContent value="guide">
                <div className="space-y-4">
                  {visualizationData.steps.map((step, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <h3 className="font-medium mb-2">{step.title}</h3>
                        <p className="text-sm text-gray-600">{step.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}