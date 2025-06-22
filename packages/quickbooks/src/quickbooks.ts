import { z } from "zod";
import {
  extension,
  context,
  action,
  service,
  validateEnv
} from "@daydreamsai/core";
import { QuickBooksClient } from "./client";

const envSchema = z.object({
  QUICKBOOKS_CLIENT_ID: z.string(),
  QUICKBOOKS_CLIENT_SECRET: z.string(),
  QUICKBOOKS_ENVIRONMENT: z.enum(["sandbox", "production"]).default("sandbox"),
});

const quickbooksService = service({
  register(container) {
    const env = validateEnv(envSchema);
    
    container.singleton(
      "quickbooks",
      () => new QuickBooksClient({
        clientId: env.QUICKBOOKS_CLIENT_ID,
        clientSecret: env.QUICKBOOKS_CLIENT_SECRET,
        environment: env.QUICKBOOKS_ENVIRONMENT,
      })
    );
  }
});

export const quickbooksContext = context({
  type: "quickbooks",
  schema: z.object({ 
    realmId: z.string(),
    accessToken: z.string()
  }),
  key: ({ realmId }) => realmId,
  
  async setup(args, settings, { container }) {
    const client = container.resolve<QuickBooksClient>("quickbooks");
    client.setAccessToken(args.accessToken);
    
    // Just get basic company info for context
    const company = await client.getCompanyInfo(args.realmId);
    
    return {
      company,
      realmId: args.realmId
    };
  },
  
  instructions: ({ options }) => `You have access to QuickBooks data for ${options.company.CompanyName}. 
  You can query any QuickBooks entity using SQL-like syntax. Available entities include:
  Account, Bill, Customer, Employee, Estimate, Invoice, Item, Payment, Purchase, 
  PurchaseOrder, SalesReceipt, TimeActivity, Vendor, and more.
  
  Common query patterns:
  - SELECT * FROM Invoice WHERE TxnDate >= 'YYYY-MM-DD'
  - SELECT * FROM Customer WHERE Active = true
  - SELECT * FROM Account WHERE AccountType = 'Bank'
  
  You can also fetch specific records by ID or explore the data model.`,
  
  render({ options }) {
    return `QuickBooks Company: ${options.company.CompanyName}`;
  }
})
.setActions([
  action({
    name: "query",
    description: "Execute a QuickBooks SQL query to retrieve any data",
    schema: z.object({
      query: z.string().describe("QuickBooks SQL query (e.g., SELECT * FROM Invoice WHERE Balance > 0)"),
      maxResults: z.number().optional().default(100).describe("Maximum results to return")
    }),
    
    async handler({ query, maxResults }, ctx, agent) {
      const client = agent.container.resolve<QuickBooksClient>("quickbooks");
      
      // Add MAXRESULTS if not present and not a COUNT query
      let finalQuery = query;
      if (!query.toUpperCase().includes('MAXRESULTS') && 
          !query.toUpperCase().includes('COUNT(')) {
        finalQuery = `${query} MAXRESULTS ${maxResults}`;
      }
      
      try {
        const result = await client.query(ctx.options.realmId, finalQuery);
        
        // Return the actual response structure so agent can navigate it
        return {
          query: finalQuery,
          response: result.QueryResponse,
          count: result.QueryResponse.totalCount,
          executionTime: result.time
        };
      } catch (error: any) {
        return {
          error: error.message,
          query: finalQuery,
          hint: "Check entity names and field names. Use 'getDataModel' to explore available entities."
        };
      }
    }
  }),
  
  action({
    name: "getRecord",
    description: "Get a specific record by entity type and ID",
    schema: z.object({
      entity: z.string().describe("Entity type (e.g., Invoice, Customer, Account)"),
      id: z.string().describe("Record ID")
    }),
    
    async handler({ entity, id }, ctx, agent) {
      const client = agent.container.resolve<QuickBooksClient>("quickbooks");
      
      try {
        const result = await client.getEntity(ctx.options.realmId, entity, id);
        return result;
      } catch (error: any) {
        return {
          error: error.message,
          entity,
          id
        };
      }
    }
  }),
  
  action({
    name: "getDataModel",
    description: "Get information about QuickBooks entities and their fields",
    schema: z.object({
      entity: z.string().optional().describe("Specific entity to get details for, or leave empty for list of all entities")
    }),
    
    async handler({ entity }, ctx, agent) {
      const client = agent.container.resolve<QuickBooksClient>("quickbooks");
      
      if (entity) {
        // Return field information for specific entity
        const metadata = await client.getEntityMetadata(ctx.options.realmId, entity);
        return {
          entity,
          fields: metadata.fields,
          description: metadata.description,
          exampleQueries: metadata.exampleQueries
        };
      } else {
        // Return list of all available entities
        return {
          entities: [
            { name: "Account", description: "Chart of Accounts" },
            { name: "Bill", description: "Bills from vendors" },
            { name: "BillPayment", description: "Bill payment transactions" },
            { name: "Budget", description: "Budget data" },
            { name: "Class", description: "Class tracking" },
            { name: "CreditMemo", description: "Credit memos" },
            { name: "Customer", description: "Customer records" },
            { name: "Deposit", description: "Bank deposits" },
            { name: "Employee", description: "Employee records" },
            { name: "Estimate", description: "Sales estimates" },
            { name: "Invoice", description: "Sales invoices" },
            { name: "Item", description: "Products and services" },
            { name: "JournalEntry", description: "Journal entries" },
            { name: "Payment", description: "Customer payments" },
            { name: "PaymentMethod", description: "Payment methods" },
            { name: "Purchase", description: "Expense transactions" },
            { name: "PurchaseOrder", description: "Purchase orders" },
            { name: "RefundReceipt", description: "Refund receipts" },
            { name: "SalesReceipt", description: "Sales receipts" },
            { name: "TaxCode", description: "Tax codes" },
            { name: "TaxRate", description: "Tax rates" },
            { name: "Term", description: "Payment terms" },
            { name: "TimeActivity", description: "Time tracking entries" },
            { name: "Transfer", description: "Bank transfers" },
            { name: "Vendor", description: "Vendor records" },
            { name: "VendorCredit", description: "Vendor credits" }
          ],
          hint: "Use getDataModel with a specific entity name to see its fields"
        };
      }
    }
  }),
  
  action({
    name: "getReports",
    description: "Get standard QuickBooks reports",
    schema: z.object({
      reportType: z.string().describe("Report type (e.g., ProfitAndLoss, BalanceSheet, CustomerSales, etc.)"),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      summarizeBy: z.string().optional().describe("Grouping option (e.g., Month, Customer, Class)"),
      columns: z.array(z.string()).optional().describe("Specific columns to include")
    }),
    
    async handler(params, ctx, agent) {
      const client = agent.container.resolve<QuickBooksClient>("quickbooks");
      
      try {
        const report = await client.runReport(ctx.options.realmId, params);
        return report;
      } catch (error: any) {
        return {
          error: error.message,
          availableReports: [
            "AccountList",
            "APAgingDetail",
            "APAgingSummary",
            "ARAgingDetail",
            "ARAgingSummary",
            "BalanceSheet",
            "BalanceSheetDetail",
            "CashFlow",
            "CustomerBalance",
            "CustomerBalanceDetail",
            "CustomerIncome",
            "CustomerSales",
            "DepartmentSales",
            "GeneralLedger",
            "GeneralLedgerDetail",
            "InventoryValuationSummary",
            "ItemSales",
            "JournalReport",
            "ProfitAndLoss",
            "ProfitAndLossDetail",
            "SalesByClass",
            "SalesByCustomer",
            "SalesByDepartment",
            "SalesByProduct",
            "TransactionDetailByAccount",
            "TransactionList",
            "TrialBalance",
            "VendorBalance",
            "VendorBalanceDetail",
            "VendorExpenses"
          ]
        };
      }
    }
  }),
  
  action({
    name: "batchQuery",
    description: "Execute multiple queries in one request",
    schema: z.object({
      queries: z.array(z.object({
        name: z.string().describe("Name for this query result"),
        query: z.string().describe("QuickBooks SQL query")
      }))
    }),
    
    async handler({ queries }, ctx, agent) {
      const client = agent.container.resolve<QuickBooksClient>("quickbooks");
      
      const results = await Promise.all(
        queries.map(async ({ name, query }) => {
          try {
            const result = await client.query(ctx.options.realmId, query);
            return {
              name,
              success: true,
              data: result.QueryResponse
            };
          } catch (error: any) {
            return {
              name,
              success: false,
              error: error.message
            };
          }
        })
      );
      
      return { results };
    }
  })
]);

export const quickbooks = extension({
  name: "quickbooks",
  services: [quickbooksService],
  contexts: {
    quickbooks: quickbooksContext
  }
});