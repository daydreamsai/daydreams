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

-- Function to execute arbitrary SQL (used by the memory providers for initialization)
CREATE OR REPLACE FUNCTION execute_sql(query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE query;
END;
$$;

-- Function for testing vector operations (used by health checks)
CREATE OR REPLACE FUNCTION vector_test()
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  -- Simple test to verify pgvector is working
  PERFORM '[1,2,3]'::vector <=> '[1,2,3]'::vector;
  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$;

-- -- Example table creation (this is done programmatically in the SupabaseVectorStore)
-- CREATE TABLE IF NOT EXISTS embeddings (
--   key TEXT PRIMARY KEY,
--   content TEXT,
--   embedding VECTOR(1536),
--   metadata JSONB
-- );

-- -- Example similarity search function (this is created programmatically in the SupabaseVectorStore)
-- CREATE OR REPLACE FUNCTION match_embeddings(
--   query_embedding VECTOR(1536),
--   match_threshold FLOAT,
--   match_count INT,
--   filter_metadata JSONB DEFAULT NULL,
--   filter_keys TEXT[] DEFAULT NULL
-- ) 
-- RETURNS TABLE (
--   key TEXT,
--   content TEXT,
--   metadata JSONB,
--   similarity FLOAT
-- )
-- LANGUAGE plpgsql
-- AS $$
-- BEGIN
--   RETURN QUERY
--   SELECT
--     t.key,
--     t.content,
--     t.metadata,
--     1 - (t.embedding <=> query_embedding) as similarity
--   FROM embeddings t
--   WHERE
--     (filter_metadata IS NULL OR t.metadata @> filter_metadata) AND
--     (filter_keys IS NULL OR t.key = ANY(filter_keys)) AND
--     1 - (t.embedding <=> query_embedding) > match_threshold
--   ORDER BY similarity DESC
--   LIMIT match_count;
-- END;
-- $$; 