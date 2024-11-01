// types.ts
export interface Account {
    pubkey: string;
    size: number;
    executable: boolean;
    owner: string;
    balance: number;
    program?: string;
  }
  
  export interface CPICall {
    from: string;
    to: string;
    programId: string;
    date: string;
  }
  
  export interface Step {
    title: string;
    description: string;
  }
  
  export interface VisualizationData {
    accounts: Account[];
    cpiCalls: CPICall[];
    steps: Step[];
    hasMoreAccounts: boolean;
    totalAccounts: number;
    programType?: string;
  }
  
  export const SPECIAL_PROGRAMS = {
    TOKEN_PROGRAM: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    SYSTEM_PROGRAM: '11111111111111111111111111111111',
    METADATA_PROGRAM: 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'
  } as const;