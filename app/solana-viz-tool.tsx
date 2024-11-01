// SolanaVizTool.tsx
import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import { 
  Cluster, 
  Connection, 
  PublicKey, 
  clusterApiUrl, 
  ParsedInstruction, 
  PartiallyDecodedInstruction,
  GetProgramAccountsFilter
} from "@solana/web3.js";
import AccountVisualization from './AccountVisualization';
import CPIVisualization from './CPIVisualization';
import StepByStepGuide from './StepByStepGuide';
import { Account, CPICall, VisualizationData, SPECIAL_PROGRAMS } from './types';

export default function SolanaVizTool() {
  const [programId, setProgramId] = useState('');
  const [network, setNetwork] = useState('devnet');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [visualizationData, setVisualizationData] = useState<VisualizationData | null>(null);
  const [accountsOffset, setAccountsOffset] = useState(0);
  const [minSize,] = useState(0);
  const [allAccounts, setAllAccounts] = useState<Account[]>([]);
  const ACCOUNTS_PER_PAGE = 20;

  const getTokenProgramInfo = async (connection: Connection) => {
    try {
      // Get recent signatures for the token program
      const signatures = await connection.getSignaturesForAddress(
        new PublicKey(SPECIAL_PROGRAMS.TOKEN_PROGRAM),
        { limit: 10 }
      );

      // Get unique accounts from recent transactions
      const uniqueAccounts = new Set<string>();
      const accounts: Account[] = [];

      for (const sig of signatures) {
        const tx = await connection.getParsedTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0,
        });

        if (!tx) continue;

        tx.transaction.message.accountKeys.forEach(account => {
          if (!uniqueAccounts.has(account.pubkey.toString())) {
            uniqueAccounts.add(account.pubkey.toString());
            accounts.push({
              pubkey: account.pubkey.toString(),
              size: 165, // Standard token account size
              executable: false,
              owner: SPECIAL_PROGRAMS.TOKEN_PROGRAM,
              balance: 0,
              program: 'Token Account'
            });
          }
        });
      }

      // Get account info for the collected accounts
      const accountInfos = await Promise.all(
        accounts.map(async (account) => {
          try {
            const info = await connection.getAccountInfo(new PublicKey(account.pubkey));
            if (info) {
              account.balance = info.lamports;
              account.size = info.data.length;
            }
            return account;
          } catch (e) {
            console.log(e)
            return account;
          }
        })
      );

      return {
        accounts: accountInfos,
        hasMore: false,
        total: accountInfos.length,
        programType: 'Token Program'
      };
    } catch (error) {
      console.error('Error fetching token program info:', error);
      throw new Error('Failed to fetch token program information');
    }
  };

  const fetchProgramAccounts = async (connection: Connection, publicKey: PublicKey) => {
    // Check if this is a special program that needs alternative handling
    if (publicKey.toString() === SPECIAL_PROGRAMS.TOKEN_PROGRAM) {
      return getTokenProgramInfo(connection);
    }

    const filters: GetProgramAccountsFilter[] = [];
    
    if (minSize > 0) {
      filters.push({
        dataSize: minSize,
      });
    }

    try {
      const rawAccounts = await connection.getProgramAccounts(publicKey, {
        commitment: 'confirmed',
        filters,
      });

      const accounts = rawAccounts.map(account => ({
        pubkey: account.pubkey.toString(),
        size: account.account.data.length,
        executable: account.account.executable,
        owner: account.account.owner.toString(),
        balance: account.account.lamports
      }));

      setAllAccounts(accounts);

      const paginatedAccounts = accounts.slice(0, ACCOUNTS_PER_PAGE);

      return {
        accounts: paginatedAccounts,
        hasMore: ACCOUNTS_PER_PAGE < accounts.length,
        total: accounts.length,
        programType: 'Standard Program'
      };
    } catch (error: unknown) {
      console.error('Error fetching accounts:', error);
      
      if (error instanceof Error && error.message?.includes('excluded from account secondary indexes')) {
        throw new Error(
          'This program is excluded from account indexing. Try using a different program or check the program type guidance below.'
        );
      }
      
      throw new Error('Failed to fetch program accounts. Try adjusting filters or using a different program.');
    }
  };

  const fetchRecentTransactions = async (connection: Connection, publicKey: PublicKey) => {
    try {
      const signatures = await connection.getSignaturesForAddress(publicKey, {
        limit: 5,
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
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  };

  const handleVisualize = async () => {
    setLoading(true);
    setError('');
    setAccountsOffset(0);
    setAllAccounts([]);
    
    try {
      const connection = new Connection(clusterApiUrl(network as Cluster));
      const publicKey = new PublicKey(programId);

      const { accounts, hasMore, total, programType } = await fetchProgramAccounts(connection, publicKey);
      const cpiCalls = await fetchRecentTransactions(connection, publicKey);

      const steps = [
        {
          title: 'Program Overview',
          description: `${programType || 'Program'} showing ${accounts.length} of ${total} accounts and ${cpiCalls.length} recent CPI calls`
        },
        {
          title: 'Account Analysis',
          description: `Total accounts: ${total}, Storage used by displayed accounts: ${accounts.reduce((acc, curr) => acc + curr.size, 0)} bytes`
        },
        {
          title: 'Program Activity',
          description: `Latest activity: ${cpiCalls[0]?.date || 'No recent activity'}`
        }
      ];

      setVisualizationData({
        accounts,
        cpiCalls,
        steps,
        hasMoreAccounts: hasMore,
        totalAccounts: total,
        programType
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch program data');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreAccounts = () => {
    if (!visualizationData || loading) return;
    
    const newOffset = accountsOffset + ACCOUNTS_PER_PAGE;
    const nextAccounts = allAccounts.slice(newOffset, newOffset + ACCOUNTS_PER_PAGE);
    
    setAccountsOffset(newOffset);
    setVisualizationData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        accounts: [...prev.accounts, ...nextAccounts],
        hasMoreAccounts: newOffset + ACCOUNTS_PER_PAGE < allAccounts.length
      };
    });
  };

  // const handleFilterChange = () => {
  //   setAccountsOffset(0);
  //   handleVisualize();
  // };

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
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Alert className="mb-4">
            <AlertDescription>
              <strong>Program Type Guidance:</strong>
              <ul className="list-disc pl-4 mt-2">
                <li>Standard programs: Use any custom program ID</li>
                <li>System Program (11111111111111111111111111111111): Limited account data available</li>
                <li>Token Program (TokenkegQ...): Shows recent token account activity</li>
                <li>Other SPL programs: May have indexing limitations</li>
              </ul>
            </AlertDescription>
          </Alert>

          {visualizationData && (
            <Tabs defaultValue="accounts">
              <TabsList>
                <TabsTrigger value="accounts">Account Visualization</TabsTrigger>
                <TabsTrigger value="cpi">CPI Calls</TabsTrigger>
                <TabsTrigger value="guide">Analysis</TabsTrigger>
              </TabsList>
              <TabsContent value="accounts">
                <AccountVisualization 
                  accounts={visualizationData.accounts} 
                  hasMore={visualizationData.hasMoreAccounts} 
                  onLoadMore={loadMoreAccounts}
                  loading={loading}
                />
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
  );
}