import { describe, it, expect, vi, beforeEach } from "vitest";
import { SupabaseVectorStore } from "./supabase";
import { createClient } from "@supabase/supabase-js";

// Mock the Supabase client
vi.mock("@supabase/supabase-js", () => {
  const mockRpc = vi.fn();
  const mockFrom = vi.fn().mockReturnValue({
    upsert: vi.fn().mockReturnValue({ error: null }),
    delete: vi.fn().mockReturnValue({
      in: vi.fn().mockReturnValue({ error: null }),
    }),
    select: vi.fn().mockReturnValue({
      in: vi.fn().mockReturnValue({
        data: [
          {
            id: "1",
            content: "test content",
            embedding: [0.1, 0.2],
            metadata: { test: "value" },
          },
        ],
        error: null,
      }),
    }),
  });

  return {
    createClient: vi.fn().mockReturnValue({
      rpc: mockRpc,
      from: mockFrom,
    }),
  };
});

describe("SupabaseVectorStore", () => {
  let vectorStore: SupabaseVectorStore;
  let mockClient: ReturnType<typeof createClient>;

  beforeEach(() => {
    mockClient = createClient("https://test.supabase.co", "test-key");
    vectorStore = new SupabaseVectorStore({
      client: mockClient,
      tableName: "test_embeddings",
    });
  });

  describe("initialize", () => {
    it("should initialize the database schema", async () => {
      await vectorStore.initialize(2);

      expect(mockClient.rpc).toHaveBeenCalledWith("enable_pgvector_extension");
      expect(mockClient.rpc).toHaveBeenCalledWith(
        "execute_sql",
        expect.objectContaining({
          query: expect.stringContaining(
            "CREATE TABLE IF NOT EXISTS test_embeddings"
          ),
        })
      );
      expect(mockClient.rpc).toHaveBeenCalledWith(
        "execute_sql",
        expect.objectContaining({
          query: expect.stringContaining(
            "CREATE OR REPLACE FUNCTION match_test_embeddings"
          ),
        })
      );
    });
  });

  describe("addVectors", () => {
    it("should add vectors to the store", async () => {
      const vectors = [
        {
          id: "1",
          content: "test content",
          embedding: [0.1, 0.2],
          metadata: { test: "value" },
        },
      ];

      await vectorStore.addVectors(vectors);

      expect(mockClient.from).toHaveBeenCalledWith("test_embeddings");
      expect(mockClient.from("test_embeddings").upsert).toHaveBeenCalledWith([
        {
          id: "1",
          content: "test content",
          embedding: [0.1, 0.2],
          metadata: { test: "value" },
        },
      ]);
    });

    it("should do nothing if no vectors are provided", async () => {
      await vectorStore.addVectors([]);

      expect(mockClient.from).not.toHaveBeenCalled();
    });
  });

  describe("deleteVectors", () => {
    it("should delete vectors from the store", async () => {
      await vectorStore.deleteVectors(["1", "2"]);

      expect(mockClient.from).toHaveBeenCalledWith("test_embeddings");
      expect(mockClient.from("test_embeddings").delete).toHaveBeenCalled();
      expect(
        mockClient.from("test_embeddings").delete().in
      ).toHaveBeenCalledWith("id", ["1", "2"]);
    });

    it("should do nothing if no ids are provided", async () => {
      await vectorStore.deleteVectors([]);

      expect(mockClient.from).not.toHaveBeenCalled();
    });
  });

  describe("similaritySearch", () => {
    it("should search for similar vectors", async () => {
      // Mock the RPC response
      mockClient.rpc = vi.fn().mockReturnValue({
        data: [
          {
            id: "1",
            content: "test content",
            metadata: { test: "value" },
            similarity: 0.9,
          },
        ],
        error: null,
      });

      const results = await vectorStore.similaritySearch([0.1, 0.2], {
        filter: { metadata: { test: "value" }, ids: ["1"] },
        matchThreshold: 0.7,
        maxResults: 5,
      });

      expect(mockClient.rpc).toHaveBeenCalledWith("match_test_embeddings", {
        query_embedding: [0.1, 0.2],
        match_threshold: 0.7,
        match_count: 5,
        filter_metadata: { test: "value" },
        filter_ids: ["1"],
      });

      expect(results).toEqual([
        {
          id: "1",
          content: "test content",
          metadata: { test: "value" },
          similarity: 0.9,
        },
      ]);
    });
  });

  describe("getVectorsByIds", () => {
    it("should get vectors by ids", async () => {
      const vectors = await vectorStore.getVectorsByIds(["1", "2"]);

      expect(mockClient.from).toHaveBeenCalledWith("test_embeddings");
      expect(mockClient.from("test_embeddings").select).toHaveBeenCalledWith(
        "id, content, embedding, metadata"
      );
      expect(
        mockClient.from("test_embeddings").select().in
      ).toHaveBeenCalledWith("id", ["1", "2"]);

      expect(vectors).toEqual([
        {
          id: "1",
          content: "test content",
          embedding: [0.1, 0.2],
          metadata: { test: "value" },
        },
      ]);
    });

    it("should return an empty array if no ids are provided", async () => {
      const vectors = await vectorStore.getVectorsByIds([]);

      expect(vectors).toEqual([]);
      expect(mockClient.from).not.toHaveBeenCalled();
    });
  });

  describe("fromConfig", () => {
    it("should create a vector store from config", () => {
      const store = SupabaseVectorStore.fromConfig({
        url: "https://test.supabase.co",
        key: "test-key",
        tableName: "test_embeddings",
        embeddingColumnName: "test_embedding",
        contentColumnName: "test_content",
        metadataColumnName: "test_metadata",
      });

      expect(createClient).toHaveBeenCalledWith(
        "https://test.supabase.co",
        "test-key"
      );
      expect(store).toBeInstanceOf(SupabaseVectorStore);
    });
  });
});
