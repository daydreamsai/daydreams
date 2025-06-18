type u256 = {
  low: u128;
  high: u128;
};

type u128 = number;
type u64 = number;
type u32 = number;
type u16 = number;
type u8 = number;

type AdventurerMetadata = {
  birthDate: string;
  deathDate: string;
  adventurerEntropy: u64;
  itemSpecialsSeed: u16;
  rankAtDeath: u8;
  delayStatReveal: boolean;
  goldenTokenId: u8;
  launchTournamentWinnerTokenId: u32;
};

type Stats = {
  strength: u8;
  dexterity: u8;
  vitality: u8;
  intelligence: u8;
  wisdom: u8;
  charisma: u8;
  luck: u8;
};

type Equipment = {
  weapon: LootStatistics;
  chest: LootStatistics;
  head: LootStatistics;
  waist: LootStatistics;
  foot: LootStatistics;
  hand: LootStatistics;
  neck: LootStatistics;
  ring: LootStatistics;
};

type LootStatistics = {
  id: u8;
  xp: u16;
};

type Adventurer = {
  health: u16;
  xp: u16;
  gold: u16;
  beastHealth: u16;
  statUpgradesAvailable: u8;
  stats: Stats;
  equipment: Equipment;
  battleActionCount: u8;
  mutated: boolean;
  awaitingItemSpecials: boolean;
};

type Bag = {
  item1: LootStatistics;
  item2: LootStatistics;
  item3: LootStatistics;
  item4: LootStatistics;
  item5: LootStatistics;
  item6: LootStatistics;
  item7: LootStatistics;
  item8: LootStatistics;
  item9: LootStatistics;
  item10: LootStatistics;
  item11: LootStatistics;
  item12: LootStatistics;
  item13: LootStatistics;
  item14: LootStatistics;
  item15: LootStatistics;
  mutated: boolean;
};

type LootWithPrice = {
  item: Loot;
  price: u16;
};

enum Tier {
  None,
  T1,
  T2,
  T3,
  T4,
  T5,
}

enum Slot {
  None,
  Weapon,
  Chest,
  Head,
  Waist,
  Foot,
  Hand,
  Neck,
  Ring,
}

enum Type {
  None,
  Magic_or_Cloth,
  Blade_or_Hide,
  Bludgeon_or_Metal,
  Necklace,
  Ring,
}

type Loot = {
  id: u8;
  tier: Tier;
  itemType: Type;
  slot: Slot;
};

type ContractAddress = string;

export type AdventurerState = {
  owner: ContractAddress;
  adventurerId: u128;
  adventurerEntropy: string;
  adventurer: Adventurer;
};

type SpecialPowers = {
  special1: u8;
  special2: u8;
  special3: u8;
};

type CombatSpec = {
  tier: Tier;
  itemType: Type;
  level: u16;
  specials: SpecialPowers;
};

type AdventurerStateWithBag = {
  adventurerState: AdventurerState;
  bag: Bag;
};

// Events
export type StartGameEvent = {
  adventurerState: AdventurerState;
  adventurerMeta: AdventurerMetadata;
  name: number;
  customRenderer: ContractAddress;
};

export type DiscoveredHealthEvent = {
  adventurerState: AdventurerState;
  healthAmount: u16;
};

export type DiscoveredGoldEvent = {
  adventurerState: AdventurerState;
  goldAmount: u16;
};

export type DiscoveredXPEvent = {
  adventurerState: AdventurerState;
  xpAmount: u16;
};

export type DiscoveredLootEvent = {
  adventurerState: AdventurerState;
  itemId: u16;
};

export type EquipmentChangedEvent = {
  adventurerStateWithBag: AdventurerStateWithBag;
  equippedItems: u8[];
  baggedItems: u8[];
  droppedItems: u8[];
};

export type DodgedObstacleEvent = {
  adventurerState: AdventurerState;
  id: u8;
  level: u16;
  damageTaken: u16;
  damageLocation: u8;
  xpEarnedAdventurer: u16;
  xpEarnedItems: u16;
};

export type HitByObstacleEvent = {
  adventurerState: AdventurerState;
  id: u8;
  level: u16;
  damageTaken: u16;
  damageLocation: u8;
  xpEarnedAdventurer: u16;
  xpEarnedItems: u16;
};

export type AmbushedByBeastEvent = {
  adventurerState: AdventurerState;
  seed: u128;
  id: u8;
  beastSpecs: CombatSpec;
  damage: u16;
  criticalHit: boolean;
  location: u8;
};

export type DiscoveredBeastEvent = {
  adventurerState: AdventurerState;
  seed: u128;
  id: u8;
  beastSpecs: CombatSpec;
};

export type AttackedBeastEvent = {
  adventurerState: AdventurerState;
  seed: u128;
  id: u8;
  beastSpecs: CombatSpec;
  damage: u16;
  criticalHit: boolean;
  location: u8;
};

export type AttackedByBeastEvent = {
  adventurerState: AdventurerState;
  seed: u128;
  id: u8;
  beastSpecs: CombatSpec;
  damage: u16;
  criticalHit: boolean;
  location: u8;
};

export type SlayedBeastEvent = {
  adventurerState: AdventurerState;
  seed: u128;
  id: u8;
  beastSpecs: CombatSpec;
  damageDealt: u16;
  criticalHit: boolean;
  xpEarnedAdventurer: u16;
  xpEarnedItems: u16;
  goldEarned: u16;
};

export type FleeFailedEvent = {
  adventurerState: AdventurerState;
  seed: u128;
  id: u8;
  beastSpecs: CombatSpec;
};

export type FleeSucceededEvent = {
  adventurerState: AdventurerState;
  seed: u128;
  id: u8;
  beastSpecs: CombatSpec;
};

export type PurchasedItemsEvent = {
  adventurerStateWithBag: AdventurerStateWithBag;
  purchases: LootWithPrice[];
};

export type PurchasedPotionsEvent = {
  adventurerState: AdventurerState;
  quantity: u8;
  cost: u16;
  health: u16;
};

export type EquippedItemsEvent = {
  adventurerStateWithBag: AdventurerStateWithBag;
  equippedItems: u8[];
  unequippedItems: u8[];
};

export type DroppedItemsEvent = {
  adventurerStateWithBag: AdventurerStateWithBag;
  itemIds: u8[];
};

export type GreatnessIncreasedEvent = {
  adventurerState: AdventurerState;
  itemId: u8;
  previousLevel: u8;
  newLevel: u8;
};

export type ItemLeveledUp = {
  itemId: u8;
  previousLevel: u8;
  newLevel: u8;
  suffixUnlocked: boolean;
  prefixesUnlocked: boolean;
  specials: SpecialPowers;
};

export type ItemsLeveledUpEvent = {
  adventurerState: AdventurerState;
  items: ItemLeveledUp[];
};

export type NewHighScoreEvent = {
  adventurerState: AdventurerState;
  rank: u8;
};

export type AdventurerDiedEvent = {
  adventurerState: AdventurerState;
  killedByBeast: u8;
  killedByObstacle: u8;
  callerAddress: ContractAddress;
};

export type AdventurerLeveledUpEvent = {
  adventurerState: AdventurerState;
  previousLevel: u8;
  newLevel: u8;
};

export type UpgradesAvailableEvent = {
  adventurerState: AdventurerState;
  items: number[];
};

export type AdventurerUpgradedEvent = {
  adventurerStateWithBag: AdventurerStateWithBag;
  strengthIncrease: u8;
  dexterityIncrease: u8;
  vitalityIncrease: u8;
  intelligenceIncrease: u8;
  wisdomIncrease: u8;
  charismaIncrease: u8;
};

export type ERC721TransferEvent = {
  from: ContractAddress;
  to: ContractAddress;
  tokenId: u256;
};
