# QuickBooks Extension Example

This example demonstrates how to use the QuickBooks extension to create an AI
assistant that can help small business owners analyze their financial data.

## Features

The QuickBooks extension provides flexible data access:

- **SQL Queries**: Write any QuickBooks SQL query to retrieve data
- **Data Exploration**: Discover available entities and fields
- **Batch Operations**: Run multiple queries efficiently
- **Report Generation**: Access standard QuickBooks reports

## Setup

1. **QuickBooks App Setup**:

   - Create a QuickBooks app at https://developer.intuit.com
   - Set up OAuth 2.0 credentials
   - Note your Client ID and Client Secret

2. **Environment Variables**:

   ```bash
   export ANTHROPIC_API_KEY="your-api-key"
   export QUICKBOOKS_CLIENT_ID="your-client-id"
   export QUICKBOOKS_CLIENT_SECRET="your-client-secret"
   export QUICKBOOKS_ENVIRONMENT="sandbox" # or "production"
   ```

3. **OAuth Flow** (not included in this example):
   - In a real application, implement OAuth flow to get access tokens
   - Store tokens securely and refresh as needed

## Running the Example

```bash
bun run examples/quickbooks/example.ts
```

## Example Queries

The agent can answer questions by writing appropriate SQL queries:

```sql
-- Find top customers by revenue
SELECT * FROM Invoice
WHERE TxnDate >= '2024-01-01'
ORDER BY TotalAmt DESC
MAXRESULTS 10

-- Get unpaid invoices
SELECT * FROM Invoice
WHERE Balance > 0
AND DueDate < '2024-01-01'

-- Analyze expenses by vendor
SELECT * FROM Purchase
WHERE TxnDate >= '2024-01-01'
```

## How It Works

1. **Context Composition**: The example uses context composition to combine a
   business assistant context with the QuickBooks context
2. **Flexible Queries**: The agent can write any SQL query based on the user's
   question
3. **Data Analysis**: The agent analyzes query results to provide insights
4. **Actionable Advice**: Responses include specific recommendations based on
   the data

## Extension Design

The QuickBooks extension is designed to be:

- **Flexible**: No hardcoded queries - the agent writes SQL based on needs
- **Explorable**: Can discover available entities and fields
- **Efficient**: Batch queries for complex analysis
- **Safe**: Read-only operations for data security
