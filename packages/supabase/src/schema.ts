import * as z from "zod/v4";

export const SupabaseVectorStoreSchema = z.object({
  url: z.string().url(),
  key: z.string(),
  tableName: z.string(),
  queryName: z.string().optional(),
  embeddingColumnName: z.string().default("embedding"),
  contentColumnName: z.string().default("content"),
  metadataColumnName: z.string().default("metadata"),
});

export const SupabaseVectorRecordSchema = z.object({
  key: z.string(),
  content: z.string(),
  embedding: z.array(z.number()),
  metadata: z.record(z.any(), z.any()).optional(),
});

export const SupabaseVectorFilterSchema = z.object({
  metadata: z.record(z.any(), z.any()).optional(),
  keys: z.array(z.string()).optional(),
});

export const SupabaseSearchResultSchema = z.object({
  key: z.string(),
  content: z.string(),
  metadata: z.record(z.any(), z.any()).optional(),
  similarity: z.number().optional(),
});
