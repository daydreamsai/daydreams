-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Function to enable pgvector extension (used by the SupabaseVectorStore)
CREATE OR REPLACE FUNCTION enable_pgvector_extension()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS vector;
END;
$$;

-- Function to execute arbitrary SQL (used by the SupabaseVectorStore for initialization)
CREATE OR REPLACE FUNCTION execute_sql(query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE query;
END;
$$;

-- Example table creation (this is done programmatically in the SupabaseVectorStore)
-- CREATE TABLE IF NOT EXISTS embeddings (
--   id TEXT PRIMARY KEY,
--   content TEXT,
--   embedding VECTOR(1536),
--   metadata JSONB
-- );

-- Example similarity search function (this is created programmatically in the SupabaseVectorStore)
-- CREATE OR REPLACE FUNCTION match_embeddings(
--   query_embedding VECTOR(1536),
--   match_threshold FLOAT,
--   match_count INT,
--   filter_metadata JSONB DEFAULT NULL,
--   filter_ids TEXT[] DEFAULT NULL
-- ) 
-- RETURNS TABLE (
--   id TEXT,
--   content TEXT,
--   metadata JSONB,
--   similarity FLOAT
-- )
-- LANGUAGE plpgsql
-- AS $$
-- BEGIN
--   RETURN QUERY
--   SELECT
--     t.id,
--     t.content,
--     t.metadata,
--     1 - (t.embedding <=> query_embedding) as similarity
--   FROM embeddings t
--   WHERE
--     (filter_metadata IS NULL OR t.metadata @> filter_metadata) AND
--     (filter_ids IS NULL OR t.id = ANY(filter_ids)) AND
--     1 - (t.embedding <=> query_embedding) > match_threshold
--   ORDER BY similarity DESC
--   LIMIT match_count;
-- END;
-- $$; 