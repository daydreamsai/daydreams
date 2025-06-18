import type { AdventurerState } from "../app/types/events";

export interface LootSurvivorMemory {
    lastResult: string | null;
    adventurer: AdventurerState | null;
}

export type UpdateAdventurerStateSuccess = {
    success: true;
    adventurer: AdventurerState;
};

export type UpdateAdventurerStateError = {
    success: false;
    error: string;
};

export type UpdateAdventurerStateResult =
    | UpdateAdventurerStateSuccess
    | UpdateAdventurerStateError; 