import type { Handlers } from "./types";

export interface Client extends Handlers {
  transport: Handlers;
}

export function createClient(transport: Handlers): Client {
  return {
    transport,
    async getContext(params) {
      return transport.getContext(params);
    },
    async getContextById(params) {
      return transport.getContextById(params);
    },
    async deleteContext(params) {
      return transport.deleteContext(params);
    },
    async getWorkingMemory(contextId) {
      return transport.getWorkingMemory(contextId);
    },
    async saveContext(contextId, state) {
      return transport.saveContext(contextId, state);
    },
    async run(params) {
      return transport.run(params);
    },
    async send(params) {
      return transport.send(params);
    },
  };
}
