import { EventEmitter } from "node:events";

export function createEventEmitter() {
  return new EventEmitter();
}
