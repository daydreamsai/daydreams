import { type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { SupabaseVectorStoreSchema } from "./schema";

export type SupabaseVectorStoreConfig = z.infer<
  typeof SupabaseVectorStoreSchema
>;

export interface SupabaseVectorRecord {
  id: string;
  content: string;
  embedding: number[];
  metadata?: Record<string, any>;
}

export interface SupabaseVectorFilter {
  metadata?: Record<string, any>;
  ids?: string[];
}

export interface SupabaseVectorStoreOptions {
  client: SupabaseClient;
  tableName: string;
  queryName?: string;
  embeddingColumnName?: string;
  contentColumnName?: string;
  metadataColumnName?: string;
}

export interface SupabaseSearchResult {
  id: string;
  content: string;
  metadata?: Record<string, any>;
  similarity?: number;
}
