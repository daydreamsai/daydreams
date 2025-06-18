import { StarknetChain, type StarknetChainConfig } from "@daydreamsai/defai"

export interface Adventurer {
    [key: string]: number | string | Date | undefined;
    id?: number; // Adventurer ID
    entropy?: string; // Entropy of the adventurer
    owner?: string; // Hex address of the owner
    classType?: string; // Class of the adventurer
    homeRealm?: number; // Home Realm of the adventurer
    name?: string; // Name of the adventurer
    health?: number; // Health of the adventurer
    level?: number; // Level of the adventurer
    strength?: number; // Strength of the adventurer
    dexterity?: number; // Dexterity of the adventurer
    vitality?: number; // Vitality of the adventurer
    intelligence?: number; // Intelligence of the adventurer
    wisdom?: number; // Wisdom of the adventurer
    charisma?: number; // Charisma of the adventurer
    luck?: number; // Luck of the adventurer
    xp?: number; // Experience of the adventurer
    weapon?: string; // Weapon of the adventurer
    chest?: string; // Chest armor of the adventurer
    head?: string; // Head armor of the adventurer
    waist?: string; // Waist armor of the adventurer
    foot?: string; // Feet armor of the adventurer
    hand?: string; // Hands armor of the adventurer
    neck?: string; // Necklace of the adventure
    ring?: string; // Ring of the adventure
    beastHealth?: number; // Beast health adventurer is engaging
    statUpgrades?: number; // Stat upgrades adventurer has
    birthDate?: string; // Birth date of the adventurer
    deathDate?: string; // Death date of the adventurer
    goldenTokenId?: number; // Golden token ID of the adventurer
    customRenderer?: string; // Custom renderer of the adventurer
    battleActionCount?: number; // Battle action count of the adventurer
    gold?: number; // Gold adventurer has
    createdTime?: Date; // Block time the adventurer was created
    lastUpdatedTime?: Date; // Block time the adventurer was last updated
    timestamp?: Date; // Indexer timestamp of event process
}

export interface ItemIndexer {
    item?: string; // name
    cost?: number; // purchase cost for the item
    adventurerId: number; // Adventurer ID
    owneAddress?: string; // Hex Address of the Owner
    owner?: boolean; // Is the item owned by the adventurer?
    equipped?: boolean; // Is the item equipped by the adventurer?
    purchasedTime: Date; // Block time the item was purchased
    special1?: string; // First special on the item (i.e of Power)
    special2?: string; // Second special on the item (i.e Grasp)
    special3?: string; // Third special on the item (i.e Demon)
    xp?: number; // Experience of the item
    lastUpdatedTime: Date; // Block time the item was last updated
    timestamp?: Date; // Indexer timestamp of event process
}

export interface Item {
    [key: string]: string | number | undefined | boolean | Date;
    item?: string; // name
    cost?: number; // purchase cost for the item
    adventurerId?: number; // Adventurer ID
    ownerAddress?: string; // Hex Address of the Owner
    owner?: boolean; // Is the item owned by the adventurer?
    equipped?: boolean; // Is the item equipped by the adventurer?
    purchasedTime?: Date; // Block time the item was purchased
    special1?: string; // First special on the item (i.e of Power)
    special2?: string; // Second special on the item (i.e Grasp)
    special3?: string; // Third special on the item (i.e Demon)
    xp?: number; // Experience of the item
    level?: number;
    slot?: string; // Item slot location
    tier?: number; // Tier of the item
    type?: string; // Type of the item
    lastUpdatedTime?: Date; // Block time the item was last updated
    timestamp?: Date; // Indexer timestamp of event process
}

export interface Battle {
    adventurerId?: number; // Adventurer ID
    adventurerHealth?: number; // Health of the adventurer
    beast?: string; // Beast adventurer is engaging
    beastHealth?: number; // Beast health adventurer is engaging
    beastLevel?: number; // Beast level adventurer is engaging
    special1?: string; // First special on the beast (i.e Demon)
    special2?: string; // Second special on the beast (i.e Demon)
    special3?: string; // Third special on the beast (i.e Grasp)
    seed?: number; // Seed to generate beast
    attacker?: string; // Attacker in the battle (Adventurer or Beast)
    fled?: boolean; // Did the adventurer flee?
    damageDealt?: number; // Damage dealt to the beast
    damageTaken?: number; // Damage taken from the beast
    damageLocation?: string; // Location of the damage taken
    criticalHit?: boolean; // Was the hit critical
    xpEarnedAdventurer?: number; // Experience earned by the adventurer
    xpEarnedItems?: number; // Experience earned by the items
    goldEarned?: number; // Gold earned by the adventurer
    txHash?: string; // Transaction hash
    blockTime?: Date; // Block time of the battle
    timestamp?: Date; // Indexer timestamp of event process
    discoveryTime?: Date; // Datetime of beast discovery
}

export interface Discovery {
    adventurerId?: number; // Adventurer ID
    adventurerHealth?: number; // Health of the adventurer
    discoveryType?: string; // Type of discovery
    subDiscoveryType?: string; // Sub type of discovery
    outputAmount?: number; // Amount of the discovery finding
    obstacle?: string; // Obstacle discovered
    obstacleLevel?: number; // Obstacle level discovered
    dodgedObstacle?: boolean; // Did the adventurer dodge the obstacle?
    damageTaken?: number; // Damage taken from the obstacle
    damageLocation?: string; // Location of the damage taken
    xpEarnedAdventurer?: number; // Experience earned by the adventurer
    xpEarnedItems?: number; // Experience earned by the items
    entity?: string; // Entity discovered
    entityLevel?: number; // Entity level discovered
    entityHealth?: number; // Entity health discovered
    special1?: string; // First special on the beast (i.e Demon)
    special2?: string; // Second special on the beast (i.e Demon)
    special3?: string; // Third special on the beast (i.e Grasp)
    seed?: number; // Seed to generate beast
    ambushed?: boolean; // Did the adventurer ambush the entity?
    discoveryTime?: Date; // Block time of the discovery
    txHash?: string; // Transaction hash
    timestamp?: Date; // Indexer timestamp of event process
}

export interface Beast {
    beast?: string; // Beast type
    adventurerId?: number; // Adventurer ID
    seed?: number; // Seed to generate beast
    special1?: string; // First special on the beast (i.e Demon)
    special2?: string; // Second special on the beast (i.e Demon)
    special3?: string; // Third special on the beast (i.e Grasp)
    health?: number; // Beast health
    level?: number; // Beast level
    slainOnTime?: Date; // Block time of the beast being slayed
    createdTime?: Date; // Block time of when the beast was discovered
    lastUpdatedTime?: Date; // Block time of when the beast was last updated
    timestamp?: Date; // Indexer timestamp of event process
}

export interface Score {
    adventurerId?: number; // Adventurer ID
    owner?: string; // Hex Address of the adventurer owner
    rank?: number; // Rank of the score
    xp?: number; // Experience points of the adventurer
    txHash?: string; // Hex of the transaction hash
    blockTime?: Date; // Time of the score
    timestamp?: Date; // Indexer timestamp of event process
}

export interface ProcessedItemLeveledUp {
    item: string;
    suffixUnlocked: boolean;
    prefixesUnlocked: boolean;
    special1: string;
    special2: string;
    special3: string;
    newLevel: number;
}

export interface AdventurerDied {
    killedByBeast: number; // Beast ID that killed adventurer
    killedByObstacle: number; // Obstacle ID that killed adventurer
    callerAddress: string; // Address of the caller that killed adventurer
}

export interface SpecialBeast {
    data: Beast;
    tokenId: number;
}

export interface Metadata {
    method?: string; // Method of the transaction
    description?: string; // Description of the transaction
    items?: string[]; // Items in the transaction
}

export interface TransactionParams {
    hash: string;
    metadata?: Metadata;
}

export type FormData = {
    startingWeapon: string;
    name: string;
    homeRealmId: string;
    class: string;
};

export interface Call {
    contractAddress: string;
    entrypoint: string;
    calldata: StarknetChain;
    metadata?: string;
}

export interface ItemPurchase {
    item: string;
    equip: string;
}

export interface ItemPurchaseObject {
    tier: number;
    type: string;
    slot: string;
    equip: boolean;
}

export interface UpgradeStats {
    [key: string]: number;
    Strength: number;
    Dexterity: number;
    Vitality: number;
    Intelligence: number;
    Wisdom: number;
    Charisma: number;
}

export interface UpgradeSummary {
    Stats: {
        [key: string]: number;
    };
    Items: ItemPurchase[];
    Potions: number;
}

export type BeastType =
    | "Basilisk"
    | "Kitsune"
    | "Jiangshi"
    | "Rakshasa"
    | "Warlock"
    | "Minotaur"
    | "Dragon"
    | "Phoenix"
    | "Manticore"
    | "Griffin"
    | "Cyclops"
    | "Titan"
    | "Yeti"
    | "Colossus"
    | "Balrog"
    | "Gorgon"
    | "Anansi"
    | "Lich"
    | "Chimera"
    | "Wendigo"
    | "Harpy"
    | "Arachne"
    | "Nue"
    | "Skinwalker"
    | "Chupacabra"
    | "Oni"
    | "Ogre"
    | "Juggernaut"
    | "Bigfoot"
    | "Orc"
    | "Cerberus"
    | "Werewolf"
    | "Banshee"
    | "Draugr"
    | "Vampire"
    | "Weretiger"
    | "Wyvern"
    | "Roc"
    | "Qilin"
    | "Pegasus"
    | "Behemoth"
    | "Ent"
    | "Giant"
    | "Kraken"
    | "Leviathan"
    | "Golem"
    | "Goblin"
    | "Ghoul"
    | "Pixie"
    | "Sprite"
    | "Kappa"
    | "Hippogriff"
    | "Fenrir"
    | "Jaguar"
    | "Ammit"
    | "DireWolf"
    | "Skeleton"
    | "Nephilim"
    | "Tarrasque"
    | "Berserker"
    | "Fairy"
    | "Leprechaun"
    | "Kelpie"
    | "Wraith"
    | "Gnome"
    | "Bear"
    | "Wolf"
    | "Scorpion"
    | "Spider"
    | "Rat"
    | "Ettin"
    | "Jotunn"
    | "Hydra"
    | "NemeanLion"
    | "Troll";

export const NullAdventurer: Adventurer = {
    id: undefined,
    lastAction: undefined,
    owner: undefined,
    classType: undefined,
    homeRealm: undefined,
    name: undefined,
    health: undefined,
    level: undefined,
    strength: undefined,
    dexterity: undefined,
    vitality: undefined,
    intelligence: undefined,
    wisdom: undefined,
    charisma: undefined,
    luck: undefined,
    xp: undefined,
    weapon: undefined,
    chest: undefined,
    head: undefined,
    waist: undefined,
    feet: undefined,
    hands: undefined,
    neck: undefined,
    ring: undefined,
    beastHealth: undefined,
    statUpgrades: undefined,
    gold: undefined,
    createdTime: undefined,
    lastUpdatedTime: undefined,
};

export const NullBattle: Battle = {
    adventurerId: undefined,
    beast: undefined,
    beastHealth: undefined,
    beastLevel: undefined,
    special1: undefined,
    special2: undefined,
    special3: undefined,
    seed: undefined,
    attacker: undefined,
    fled: undefined,
    damageDealt: undefined,
    damageTaken: undefined,
    damageLocation: undefined,
    xpEarnedAdventurer: undefined,
    xpEarnedItems: undefined,
    goldEarned: undefined,
    txHash: undefined,
    timestamp: undefined,
};

export const NullDiscovery: Discovery = {
    adventurerId: undefined,
    discoveryType: undefined,
    subDiscoveryType: undefined,
    outputAmount: undefined,
    obstacle: undefined,
    obstacleLevel: undefined,
    dodgedObstacle: undefined,
    damageTaken: undefined,
    damageLocation: undefined,
    xpEarnedAdventurer: undefined,
    xpEarnedItems: undefined,
    entity: undefined,
    entityLevel: undefined,
    entityHealth: undefined,
    special1: undefined,
    special2: undefined,
    special3: undefined,
    seed: undefined,
    ambushed: undefined,
    discoveryTime: undefined,
    txHash: undefined,
};

export const NullBeast: Beast = {
    beast: undefined,
    adventurerId: undefined,
    seed: undefined,
    special1: undefined,
    special2: undefined,
    special3: undefined,
    health: undefined,
    level: undefined,
    slainOnTime: undefined,
    createdTime: undefined,
    lastUpdatedTime: undefined,
};

export const NullItem: Item = {
    item: undefined,
    cost: undefined,
    adventurerId: undefined,
    owneAddress: undefined,
    owner: undefined,
    equipped: undefined,
    purchasedTime: undefined,
    special1: undefined,
    special2: undefined,
    special3: undefined,
    xp: undefined,
    slot: undefined,
    tier: undefined,
    type: undefined,
    lastUpdatedTime: undefined,
};

export const NullScore: Score = {
    adventurerId: undefined,
    owner: undefined,
    rank: undefined,
    xp: undefined,
    txHash: undefined,
    blockTime: undefined,
    timestamp: undefined,
};

export const ZeroUpgrade: UpgradeStats = {
    Strength: 0,
    Dexterity: 0,
    Vitality: 0,
    Intelligence: 0,
    Wisdom: 0,
    Charisma: 0,
};

export type u256 = {
    low: string;
    high: string;
};

export type BurnerStorage = {
    [address: string]: {
        privateKey: string;
        publicKey: string;
        deployTx: string;
        active: boolean;
        masterAccount: string;
        masterAccountProvider: string;
        gameContract: string;
    };
};
export type KeyStorage = {
    [address: string]: {
        privateKey: string;
        publicKey: string;
        masterAccount: string;
        masterAccountProvider: string;
        gameContract: string;
        active: boolean;
    };
};

export type GameToken = {
    contract_address: string;
    id: string;
    image: string;
    name: string;
    owner: string;
    token_id: number;
};

export type GameEntropy = {
    hash: bigint;
    last_updated_block: bigint;
    last_updated_time: bigint;
    next_update_block: bigint;
};

export type BlockData = {
    block_hash: string;
    block_number: number;
    new_root: string;
    parent_hash: string;
    sequencer_address: string;
    status: string;
    timestamp: number;
};

export type IsIdleResult = {
    0: boolean;
    1: bigint;
};

export type PragmaPrice = {
    decimals: bigint;
    expiration_timestamp: any;
    last_updated_timestamp: bigint;
    num_sources_aggregated: bigint;
    price: bigint;
};

export type CollectionScore = {
    name: string;
    avatar: string;
    totalXP: number;
    gamesPlayed: number;
};