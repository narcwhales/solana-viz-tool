// AccountVisualization.tsx
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Account {
  pubkey: string;
  size: number;
  executable: boolean;
  owner: string;
  balance: number;
  program?: string;
}

interface AccountVisualizationProps {
  accounts: Account[];
  hasMore: boolean;
  onLoadMore?: () => void;
  loading?: boolean;
}

export default function AccountVisualization({ 
  accounts, 
  hasMore, 
  onLoadMore,
  loading 
}: AccountVisualizationProps) {
  return (
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
              {account.program && (
                <div className="col-span-2">
                  <p className="text-sm font-medium">Program Type</p>
                  <p className="text-xs">{account.program}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
      
      {hasMore && onLoadMore && (
        <Button 
          onClick={onLoadMore} 
          disabled={loading}
          className="w-full mt-4"
        >
          {loading ? 'Loading More...' : 'Load More Accounts'}
        </Button>
      )}
    </div>
  )
}