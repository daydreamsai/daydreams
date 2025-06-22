import { Logger, LogLevel } from "@daydreamsai/core";
import type { 
  QuickBooksConfig, 
  Company, 
  QueryResponse, 
  EntityMetadata,
  ReportParams 
} from "./types";

export class QuickBooksClient {
  private accessToken?: string;
  private logger: Logger;
  private baseUrl: string;
  
  constructor(
    private config: QuickBooksConfig,
    logLevel: LogLevel = LogLevel.INFO
  ) {
    this.logger = new Logger({ level: logLevel });
    this.baseUrl = config.environment === "sandbox" 
      ? "https://sandbox-quickbooks.api.intuit.com"
      : "https://quickbooks.api.intuit.com";
  }
  
  setAccessToken(token: string) {
    this.accessToken = token;
  }
  
  private async makeRequest(
    path: string, 
    method: string = "GET", 
    body?: any
  ): Promise<any> {
    if (!this.accessToken) {
      throw new Error("Access token not set");
    }
    
    const url = `${this.baseUrl}${path}`;
    const headers = {
      "Authorization": `Bearer ${this.accessToken}`,
      "Accept": "application/json",
      "Content-Type": "application/json"
    };
    
    this.logger.debug("QuickBooksClient", `${method} ${url}`);
    
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        error: response.statusText 
      }));
      throw new Error(`QuickBooks API error: ${JSON.stringify(error)}`);
    }
    
    return response.json();
  }
  
  async getCompanyInfo(realmId: string): Promise<Company> {
    const result = await this.makeRequest(
      `/v3/company/${realmId}/companyinfo/1`
    );
    return result.CompanyInfo;
  }
  
  async query(realmId: string, query: string): Promise<QueryResponse> {
    const encodedQuery = encodeURIComponent(query);
    return this.makeRequest(
      `/v3/company/${realmId}/query?query=${encodedQuery}`
    );
  }
  
  async getEntity(realmId: string, entity: string, id: string): Promise<any> {
    const result = await this.makeRequest(
      `/v3/company/${realmId}/${entity.toLowerCase()}/${id}`
    );
    return result[entity];
  }
  
  async getEntityMetadata(
    realmId: string, 
    entity: string
  ): Promise<EntityMetadata> {
    // In a real implementation, this would fetch actual metadata
    // For now, return common fields based on entity type
    const commonFields = [
      { name: "Id", type: "string", required: true },
      { name: "SyncToken", type: "string", required: true },
      { name: "MetaData.CreateTime", type: "datetime", required: true },
      { name: "MetaData.LastUpdatedTime", type: "datetime", required: true }
    ];
    
    const entityFields: Record<string, EntityMetadata> = {
      Invoice: {
        fields: [
          ...commonFields,
          { name: "DocNumber", type: "string", required: false },
          { name: "TxnDate", type: "date", required: true },
          { name: "DueDate", type: "date", required: false },
          { name: "CustomerRef", type: "reference", required: true },
          { name: "TotalAmt", type: "decimal", required: true },
          { name: "Balance", type: "decimal", required: true },
          { name: "Line", type: "array", required: true }
        ],
        description: "Sales invoices sent to customers",
        exampleQueries: [
          "SELECT * FROM Invoice WHERE Balance > 0",
          "SELECT * FROM Invoice WHERE CustomerRef = '123'",
          "SELECT * FROM Invoice WHERE TxnDate >= '2024-01-01'"
        ]
      },
      Customer: {
        fields: [
          ...commonFields,
          { name: "DisplayName", type: "string", required: true },
          { name: "CompanyName", type: "string", required: false },
          { name: "Active", type: "boolean", required: true },
          { name: "Balance", type: "decimal", required: true },
          { name: "PrimaryEmailAddr", type: "object", required: false },
          { name: "PrimaryPhone", type: "object", required: false }
        ],
        description: "Customer records",
        exampleQueries: [
          "SELECT * FROM Customer WHERE Active = true",
          "SELECT * FROM Customer WHERE Balance > 0",
          "SELECT * FROM Customer WHERE DisplayName LIKE '%Smith%'"
        ]
      },
      Account: {
        fields: [
          ...commonFields,
          { name: "Name", type: "string", required: true },
          { name: "AccountType", type: "string", required: true },
          { name: "AccountSubType", type: "string", required: false },
          { name: "CurrentBalance", type: "decimal", required: true },
          { name: "Active", type: "boolean", required: true },
          { name: "Classification", type: "string", required: false }
        ],
        description: "Chart of Accounts",
        exampleQueries: [
          "SELECT * FROM Account WHERE AccountType = 'Bank'",
          "SELECT * FROM Account WHERE AccountType = 'Income'",
          "SELECT * FROM Account WHERE Active = true"
        ]
      }
    };
    
    return entityFields[entity] || {
      fields: commonFields,
      description: `${entity} entity`,
      exampleQueries: [`SELECT * FROM ${entity}`]
    };
  }
  
  async runReport(
    realmId: string, 
    params: ReportParams
  ): Promise<any> {
    const queryParams = new URLSearchParams();
    
    if (params.startDate) queryParams.append("start_date", params.startDate);
    if (params.endDate) queryParams.append("end_date", params.endDate);
    if (params.summarizeBy) queryParams.append("summarize_column_by", params.summarizeBy);
    if (params.columns) queryParams.append("columns", params.columns.join(","));
    
    const queryString = queryParams.toString();
    const url = `/v3/company/${realmId}/reports/${params.reportType}${queryString ? `?${queryString}` : ""}`;
    
    return this.makeRequest(url);
  }
}