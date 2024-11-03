# Solana Program Visualization Tool Documentation

## Overview

The Solana Program Visualization Tool is a developer utility designed to help understand and analyze on-chain Solana programs. It provides insights into program accounts, Cross-Program Invocation (CPI) patterns, and memory management through an interactive interface.

## Key Features

- Account visualization and analysis
- CPI call tracking and visualization
- Step-by-step program analysis
- Support for different Solana clusters (Mainnet, Devnet, Testnet)
- Special handling for system and token programs

## Getting Started

### Basic Usage

1. Enter a Program ID in the input field
2. Select the appropriate network (Mainnet-beta, Devnet, or Testnet)
3. Click "Visualize" to analyze the program

### Supported Program Types

| Program Type | Description | Usage Notes |
|-------------|-------------|-------------|
| Standard Programs | Custom programs deployed on Solana | Full account and CPI analysis available |
| System Program | Native Solana program (11111111111111111111111111111111) | Limited account data due to indexing |
| Token Program | SPL Token Program (TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA) | Shows recent token account activity |
| Other SPL Programs | Standard Program Library programs | May have indexing limitations |

## Tool Components

### 1. Account Visualization Tab

Displays program-owned accounts with key metrics:
- Account public key
- Data size (in bytes)
- Executable status
- Owner information
- Account balance (in lamports)

Features:
- Pagination support (20 accounts per page)
- Load more functionality for programs with many accounts
- Visual representation of account relationships

### 2. CPI Visualization Tab

Shows recent Cross-Program Invocations:
- Source account/program
- Target program
- Timestamp of interaction
- Visual representation of call patterns

### 3. Analysis Tab

Provides detailed program insights:
- Program type identification
- Account usage statistics
- Storage utilization metrics
- Recent activity summary

## Use Cases

### 1. Program Development and Debugging

- Verify account creation and management
- Track program interactions through CPIs
- Monitor program storage usage

```typescript
// Example: Analyzing a custom program
const programId = "Your_Program_ID";
// Set network to devnet for testing
setNetwork("devnet");
// Visualize program behavior
handleVisualize();
```

### 2. Token Program Analysis

- Monitor token account creation
- Track token transfers and operations
- Analyze token program usage patterns

```typescript
// Example: Analyzing token program
const tokenProgramId = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
// Set network to mainnet for production analysis
setNetwork("mainnet-beta");
// Visualize token program behavior
handleVisualize();
```

### 3. Memory Management Analysis

- Track account sizes and data usage
- Monitor program storage efficiency
- Identify potential memory optimization opportunities

## Best Practices

1. **Network Selection**
   - Use devnet for development and testing
   - Switch to mainnet-beta for production analysis
   - Consider rate limits when making frequent requests

2. **Program Analysis**
   - Start with small programs for faster analysis
   - Use filters to focus on relevant accounts
   - Monitor CPI patterns for program optimization

3. **Performance Considerations**
   - Large programs may take longer to analyze
   - Consider using account filters for better performance
   - Monitor RPC node responses for rate limiting

## Error Handling

Common error scenarios and solutions:

1. **Account Indexing Error**
   ```
   "Program is excluded from account secondary indexes"
   ```
   Solution: Try using a different program or check program type guidance

2. **Invalid Program ID**
   ```
   "Failed to fetch program accounts"
   ```
   Solution: Verify the program ID and network selection

3. **RPC Node Limitations**
   ```
   "Rate limit exceeded" or timeout errors
   ```
   Solution: Implement request throttling or switch RPC endpoints

## Advanced Usage

### Custom Analysis Patterns

1. **Memory Usage Analysis**
```typescript
// Calculate total program storage
const totalStorage = accounts.reduce((acc, curr) => acc + curr.size, 0);
```

2. **CPI Pattern Analysis**
```typescript
// Track frequent program interactions
const cpiPatterns = cpiCalls.reduce((acc, call) => {
  acc[call.to] = (acc[call.to] || 0) + 1;
  return acc;
}, {});
```

## Future Improvements

1. Additional visualization options
2. Enhanced filtering capabilities
3. Historical data analysis
4. Transaction simulation support
5. Integration with development tools

## Support

For issues and feature requests, please contact the development team or submit an issue in the repository.

Remember to keep your program IDs secure and never share private keys or sensitive information while using the tool.