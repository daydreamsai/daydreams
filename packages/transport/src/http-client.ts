import { http } from "@daydreamsai/core";
import type { Handlers } from "./types";

export function createHttpClientTransport({ url }: { url: string }): Handlers {
  const client = {
    get: <T>(path: string, params?: Record<string, string>) =>
      http.get.json<T>(`${url}/api/${path}`, params),
    post: <T>(path: string, params: any) =>
      http.post.json<T>(`${url}/api/${path}`, params),
    delete: <T>(path: string, params?: any) =>
      http.json<T>(`${url}/api/${path}`, {
        method: "DELETE",
      }),
  };

  return {
    async getContext(params) {
      const args = Buffer.from(JSON.stringify(params.args)).toString("base64");
      return client.get(`context`, { type: params.context, args });
    },
    async getContextById(contextId) {
      return client.get(`context/${contextId}`);
    },
    async saveContext(contextId, state) {
      return client.post(`context/${contextId}`, state);
    },
    async deleteContext(contextId) {
      return client.delete(`context/${contextId}`);
    },
    async getWorkingMemory(contextId) {
      return client.get(`wm/${contextId}`);
    },
    async run(params) {
      return client.post("run", params);
    },
    async send(params) {
      return client.post("send", params);
    },
  };
}
