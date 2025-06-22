export interface QuickBooksConfig {
  clientId: string;
  clientSecret: string;
  environment: "sandbox" | "production";
}

export interface QuickBooksEntity {
  Id: string;
  SyncToken: string;
  MetaData: {
    CreateTime: string;
    LastUpdatedTime: string;
  };
}

export interface Company extends QuickBooksEntity {
  CompanyName: string;
  LegalName?: string;
  CompanyAddr?: Address;
  CompanyEmail?: EmailAddress;
  CompanyIndustryType?: string;
  FiscalYearStartMonth?: string;
}

export interface Address {
  Id?: string;
  Line1?: string;
  Line2?: string;
  City?: string;
  CountrySubDivisionCode?: string;
  PostalCode?: string;
}

export interface EmailAddress {
  Address: string;
}

export interface QueryResponse {
  QueryResponse: {
    [entityName: string]: any;
    startPosition?: number;
    maxResults?: number;
    totalCount?: number;
  };
  time: string;
}

export interface EntityMetadata {
  fields: Array<{
    name: string;
    type: string;
    required: boolean;
    description?: string;
  }>;
  description: string;
  exampleQueries: string[];
}

export interface ReportParams {
  reportType: string;
  startDate?: string;
  endDate?: string;
  summarizeBy?: string;
  columns?: string[];
}