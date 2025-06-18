import type { InvokeTransactionReceiptResponse } from "starknet";
import { GameData } from "../data/GameData";
import { getKeyFromValue, convertToBoolean, chunkArray } from "../utils";
import type {
  DiscoveredHealthEvent,
  DiscoveredGoldEvent,
  StartGameEvent,
  DiscoveredXPEvent,
  DiscoveredLootEvent,
  EquipmentChangedEvent,
  DodgedObstacleEvent,
  HitByObstacleEvent,
  DiscoveredBeastEvent,
  AmbushedByBeastEvent,
  AttackedBeastEvent,
  AttackedByBeastEvent,
  SlayedBeastEvent,
  FleeFailedEvent,
  FleeSucceededEvent,
  PurchasedItemsEvent,
  PurchasedPotionsEvent,
  EquippedItemsEvent,
  DroppedItemsEvent,
  GreatnessIncreasedEvent,
  ItemsLeveledUpEvent,
  NewHighScoreEvent,
  AdventurerDiedEvent,
  AdventurerLeveledUpEvent,
  UpgradesAvailableEvent,
  AdventurerUpgradedEvent,
  ERC721TransferEvent,
} from "../../types/events";
import { processData } from "./processData";

export function parseAdventurerState(data: string[]) {
  return {
    owner: data[0],
    adventurerId: parseInt(data[1]),
    adventurerEntropy: data[2],
    adventurer: {
      health: parseInt(data[3]),
      xp: parseInt(data[4]),
      gold: parseInt(data[5]),
      beastHealth: parseInt(data[6]),
      statUpgradesAvailable: parseInt(data[7]),
      stats: {
        strength: parseInt(data[8]),
        dexterity: parseInt(data[9]),
        vitality: parseInt(data[10]),
        intelligence: parseInt(data[11]),
        wisdom: parseInt(data[12]),
        charisma: parseInt(data[13]),
        luck: parseInt(data[14]),
      },
      equipment: {
        weapon: {
          id: parseInt(data[15]),
          xp: parseInt(data[16]),
        },
        chest: {
          id: parseInt(data[17]),
          xp: parseInt(data[18]),
        },
        head: {
          id: parseInt(data[19]),
          xp: parseInt(data[20]),
        },
        waist: {
          id: parseInt(data[21]),
          xp: parseInt(data[22]),
        },
        foot: {
          id: parseInt(data[23]),
          xp: parseInt(data[24]),
        },
        hand: {
          id: parseInt(data[25]),
          xp: parseInt(data[26]),
        },
        neck: {
          id: parseInt(data[27]),
          xp: parseInt(data[28]),
        },
        ring: {
          id: parseInt(data[29]),
          xp: parseInt(data[30]),
        },
      },
      battleActionCount: parseInt(data[31]),
      mutated: convertToBoolean(parseInt(data[32])),
      awaitingItemSpecials: convertToBoolean(parseInt(data[33])),
    },
  };
}

function parseBag(data: string[]) {
  return {
    item1: {
      id: parseInt(data[0]),
      xp: parseInt(data[1]),
    },
    item2: {
      id: parseInt(data[2]),
      xp: parseInt(data[3]),
    },
    item3: {
      id: parseInt(data[4]),
      xp: parseInt(data[5]),
    },
    item4: {
      id: parseInt(data[6]),
      xp: parseInt(data[7]),
    },
    item5: {
      id: parseInt(data[8]),
      xp: parseInt(data[9]),
    },
    item6: {
      id: parseInt(data[10]),
      xp: parseInt(data[11]),
    },
    item7: {
      id: parseInt(data[12]),
      xp: parseInt(data[13]),
    },
    item8: {
      id: parseInt(data[14]),
      xp: parseInt(data[15]),
    },
    item9: {
      id: parseInt(data[16]),
      xp: parseInt(data[17]),
    },
    item10: {
      id: parseInt(data[18]),
      xp: parseInt(data[19]),
    },
    item11: {
      id: parseInt(data[20]),
      xp: parseInt(data[21]),
    },
    item12: {
      id: parseInt(data[22]),
      xp: parseInt(data[23]),
    },
    item13: {
      id: parseInt(data[24]),
      xp: parseInt(data[25]),
    },
    item14: {
      id: parseInt(data[26]),
      xp: parseInt(data[27]),
    },
    item15: {
      id: parseInt(data[28]),
      xp: parseInt(data[29]),
    },
    mutated: convertToBoolean(parseInt(data[30])),
  };
}

function parseItems(data: string[]) {
  const purchases = [];
  const chunkedArray = chunkArray(data, 5);
  for (let i = 0; i < chunkedArray.length; i++) {
    purchases.push({
      item: {
        id: parseInt(chunkedArray[i][0]),
        tier: parseInt(chunkedArray[i][1]),
        itemType: parseInt(chunkedArray[i][2]),
        slot: parseInt(chunkedArray[i][3]),
      },
      price: parseInt(chunkedArray[i][4]),
    });
  }
  return purchases;
}

function parseItemLevels(data: string[]) {
  const itemLevels = [];
  const chunkedArray = chunkArray(data, 8);
  for (let i = 0; i < chunkedArray.length; i++) {
    itemLevels.push({
      itemId: parseInt(chunkedArray[i][0]),
      previousLevel: parseInt(chunkedArray[i][1]),
      newLevel: parseInt(chunkedArray[i][2]),
      suffixUnlocked: convertToBoolean(parseInt(chunkedArray[i][3])),
      prefixesUnlocked: convertToBoolean(parseInt(chunkedArray[i][4])),
      specials: {
        special1: parseInt(chunkedArray[i][5]),
        special2: parseInt(chunkedArray[i][6]),
        special3: parseInt(chunkedArray[i][7]),
      },
    });
  }
  return itemLevels;
}

function parseEquippedItems(data: string[]) {
  const equippedLength = parseInt(data[0]);
  const equippedItems = [];
  const unequippedItems = [];
  for (let i = 1; i <= equippedLength; i++) {
    equippedItems.push(parseInt(data[i]));
  }
  const unequippedLength = parseInt(data[equippedLength + 1]);
  for (let i = 2; i <= unequippedLength + 1; i++) {
    unequippedItems.push(parseInt(data[i + equippedLength]));
  }
  return { equippedItems, unequippedItems };
}

function parseEquipmentChanged(data: string[]) {
  const equippedLength = parseInt(data[0]);
  const equippedItems = [];
  const baggedItems = [];
  const droppedItems = [];
  for (let i = 1; i <= equippedLength; i++) {
    equippedItems.push(parseInt(data[i]));
  }
  const baggedLength = parseInt(data[equippedLength + 1]);
  for (let i = 2; i <= baggedLength + 1; i++) {
    baggedItems.push(parseInt(data[i + equippedLength]));
  }
  const droppedLength = parseInt(data[baggedLength + 1]);
  for (let i = 2; i <= droppedLength + 1; i++) {
    droppedItems.push(parseInt(data[i + baggedLength]));
  }
  return { equippedItems, baggedItems, droppedItems };
}

export async function parseEvents(
  receipt: InvokeTransactionReceiptResponse,
  currentAdventurer?: any,
  beastsContract?: string,
  event?: string
) {
  if (!receipt.events) {
    throw new Error(`No events found`);
  }
  const gameData = new GameData();

  let events: Array<any> = [];

  for (let raw of receipt.events) {
    let eventName: string | null = "";
    // If event is a Transfer, make sure it is just the beast contract that
    if (getKeyFromValue(gameData.SELECTOR_KEYS, raw.keys[0]) == "Transfer") {
      if (raw.from_address == beastsContract) {
        eventName = "Transfer";
      } else {
        eventName = null;
      }
    } else {
      if (event) {
        const eventFromKey = getKeyFromValue(
          gameData.SELECTOR_KEYS,
          raw.keys[0]
        )!;
        if (event == eventFromKey) {
          eventName = event;
        } else {
          eventName = null;
        }
      } else {
        eventName = getKeyFromValue(gameData.SELECTOR_KEYS, raw.keys[0]);
      }
    }

    switch (eventName) {
      case "StartGame":
        const startGameData: StartGameEvent = {
          adventurerState: parseAdventurerState(raw.data.slice(0, 33)),
          adventurerMeta: {
            birthDate: raw.data[34],
            deathDate: raw.data[35],
            adventurerEntropy: parseInt(raw.data[36]),
            itemSpecialsSeed: parseInt(raw.data[37]),
            rankAtDeath: parseInt(raw.data[38]),
            delayStatReveal: convertToBoolean(parseInt(raw.data[39])),
            goldenTokenId: parseInt(raw.data[40]),
            launchTournamentWinnerTokenId: parseInt(raw.data[41]),
          },
          name: parseInt(raw.data[42]),
          customRenderer: raw.data[43],
        };
        const startGameEvent = processData(
          startGameData,
          eventName,
          receipt.transaction_hash
        );
        events.push({ name: eventName, data: startGameEvent });
        break;
      case "AdventurerUpgraded":
        const upgradeAvailableData: AdventurerUpgradedEvent = {
          adventurerStateWithBag: {
            adventurerState: parseAdventurerState(raw.data.slice(0, 33)),
            bag: parseBag(raw.data.slice(34, 65)),
          },
          strengthIncrease: parseInt(raw.data[66]),
          dexterityIncrease: parseInt(raw.data[67]),
          vitalityIncrease: parseInt(raw.data[68]),
          intelligenceIncrease: parseInt(raw.data[69]),
          wisdomIncrease: parseInt(raw.data[70]),
          charismaIncrease: parseInt(raw.data[71]),
        };
        const upgradeAvailableEvent = processData(
          upgradeAvailableData,
          eventName,
          receipt.transaction_hash,
          currentAdventurer
        );
        events.push({ name: eventName, data: upgradeAvailableEvent });
        break;
      case "DiscoveredHealth":
        const discoveredHealthData: DiscoveredHealthEvent = {
          adventurerState: parseAdventurerState(raw.data.slice(0, 33)),
          healthAmount: parseInt(raw.data[34]),
        };
        const discoveredHealthEvent = processData(
          discoveredHealthData,
          eventName,
          receipt.transaction_hash,
          currentAdventurer
        );
        events.push({ name: eventName, data: discoveredHealthEvent });
        break;
      case "DiscoveredGold":
        const discoveredGoldData: DiscoveredGoldEvent = {
          adventurerState: parseAdventurerState(raw.data.slice(0, 33)),
          goldAmount: parseInt(raw.data[34]),
        };
        const discoveredGoldEvent = processData(
          discoveredGoldData,
          eventName,
          receipt.transaction_hash,
          currentAdventurer
        );
        events.push({ name: eventName, data: discoveredGoldEvent });
        break;
      case "DiscoveredXP":
        const discoveredXPData: DiscoveredXPEvent = {
          adventurerState: parseAdventurerState(raw.data.slice(0, 33)),
          xpAmount: parseInt(raw.data[34]),
        };
        const discoveredXPEvent = processData(
          discoveredXPData,
          eventName,
          receipt.transaction_hash,
          currentAdventurer
        );
        events.push({ name: eventName, data: discoveredXPEvent });
        break;
      case "DiscoveredLoot":
        const discoveredLootData: DiscoveredLootEvent = {
          adventurerState: parseAdventurerState(raw.data.slice(0, 33)),
          itemId: parseInt(raw.data[34]),
        };
        const discoveredLootEvent = processData(
          discoveredLootData,
          eventName,
          receipt.transaction_hash,
          currentAdventurer
        );
        events.push({ name: eventName, data: discoveredLootEvent });
        break;
      case "EquipmentChanged":
        const {
          equippedItems: equipmentChangedEquippedItems,
          baggedItems: equipmentChangedBaggedItems,
          droppedItems: equipmentChangedDroppedItems,
        } = parseEquipmentChanged(
          // Include equipped array length
          raw.data.slice(65)
        );
        const equipmentChangedData: EquipmentChangedEvent = {
          adventurerStateWithBag: {
            adventurerState: parseAdventurerState(raw.data.slice(0, 33)),
            bag: parseBag(raw.data.slice(34, 65)),
          },
          equippedItems: equipmentChangedEquippedItems,
          baggedItems: equipmentChangedBaggedItems,
          droppedItems: equipmentChangedDroppedItems,
        };
        const equipmentChangedEvent = processData(
          equipmentChangedData,
          eventName,
          receipt.transaction_hash,
          currentAdventurer
        );
        events.push({ name: eventName, data: equipmentChangedEvent });
        break;
      case "DodgedObstacle":
        const dodgedObstacleData: DodgedObstacleEvent = {
          adventurerState: parseAdventurerState(raw.data.slice(0, 33)),
          id: parseInt(raw.data[34]),
          level: parseInt(raw.data[35]),
          damageTaken: parseInt(raw.data[36]),
          damageLocation: parseInt(raw.data[37]),
          xpEarnedAdventurer: parseInt(raw.data[38]),
          xpEarnedItems: parseInt(raw.data[39]),
        };
        const dodgedObstacleEvent = processData(
          dodgedObstacleData,
          eventName,
          receipt.transaction_hash,
          currentAdventurer
        );
        events.push({ name: eventName, data: dodgedObstacleEvent });
        break;
      case "HitByObstacle":
        const hitByObstacleData: HitByObstacleEvent = {
          adventurerState: parseAdventurerState(raw.data.slice(0, 33)),
          id: parseInt(raw.data[34]),
          level: parseInt(raw.data[35]),
          damageTaken: parseInt(raw.data[36]),
          damageLocation: parseInt(raw.data[37]),
          xpEarnedAdventurer: parseInt(raw.data[38]),
          xpEarnedItems: parseInt(raw.data[39]),
        };
        const hitByObstacleEvent = processData(
          hitByObstacleData,
          eventName,
          receipt.transaction_hash,
          currentAdventurer
        );
        events.push({ name: eventName, data: hitByObstacleEvent });
        break;
      case "DiscoveredBeast":
        const discoveredBeastData: DiscoveredBeastEvent = {
          adventurerState: parseAdventurerState(raw.data.slice(0, 33)),
          seed: parseInt(raw.data[34]),
          id: parseInt(raw.data[35]),
          beastSpecs: {
            tier: parseInt(raw.data[36]),
            itemType: parseInt(raw.data[37]),
            level: parseInt(raw.data[38]),
            specials: {
              special1: parseInt(raw.data[39]),
              special2: parseInt(raw.data[40]),
              special3: parseInt(raw.data[41]),
            },
          },
        };
        const discoveredBeastEvent = processData(
          discoveredBeastData,
          eventName,
          receipt.transaction_hash,
          currentAdventurer
        );
        events.push({ name: eventName, data: discoveredBeastEvent });
        break;
      case "AmbushedByBeast":
        const ambushedByBeastData: AmbushedByBeastEvent = {
          adventurerState: parseAdventurerState(raw.data.slice(0, 33)),
          seed: parseInt(raw.data[34]),
          id: parseInt(raw.data[35]),
          beastSpecs: {
            tier: parseInt(raw.data[36]),
            itemType: parseInt(raw.data[37]),
            level: parseInt(raw.data[38]),
            specials: {
              special1: parseInt(raw.data[39]),
              special2: parseInt(raw.data[40]),
              special3: parseInt(raw.data[41]),
            },
          },
          damage: parseInt(raw.data[42]),
          criticalHit: convertToBoolean(parseInt(raw.data[43])),
          location: parseInt(raw.data[44]),
        };
        const ambushedByBeastEvent = processData(
          ambushedByBeastData,
          eventName,
          receipt.transaction_hash,
          currentAdventurer
        );
        events.push({ name: eventName, data: ambushedByBeastEvent });
        break;
      case "AttackedBeast":
        const attackedBeastData: AttackedBeastEvent = {
          adventurerState: parseAdventurerState(raw.data.slice(0, 33)),
          seed: parseInt(raw.data[34]),
          id: parseInt(raw.data[35]),
          beastSpecs: {
            tier: parseInt(raw.data[36]),
            itemType: parseInt(raw.data[37]),
            level: parseInt(raw.data[38]),
            specials: {
              special1: parseInt(raw.data[39]),
              special2: parseInt(raw.data[40]),
              special3: parseInt(raw.data[41]),
            },
          },
          damage: parseInt(raw.data[42]),
          criticalHit: convertToBoolean(parseInt(raw.data[43])),
          location: parseInt(raw.data[44]),
        };
        const attackedBeastEvent = processData(
          attackedBeastData,
          eventName,
          receipt.transaction_hash,
          currentAdventurer
        );
        events.push({ name: eventName, data: attackedBeastEvent });
        break;
      case "AttackedByBeast":
        const attackedByBeastData: AttackedByBeastEvent = {
          adventurerState: parseAdventurerState(raw.data.slice(0, 33)),
          seed: parseInt(raw.data[34]),
          id: parseInt(raw.data[35]),
          beastSpecs: {
            tier: parseInt(raw.data[36]),
            itemType: parseInt(raw.data[37]),
            level: parseInt(raw.data[38]),
            specials: {
              special1: parseInt(raw.data[39]),
              special2: parseInt(raw.data[40]),
              special3: parseInt(raw.data[41]),
            },
          },
          damage: parseInt(raw.data[42]),
          criticalHit: convertToBoolean(parseInt(raw.data[43])),
          location: parseInt(raw.data[44]),
        };
        const attackedByBeastEvent = processData(
          attackedByBeastData,
          eventName,
          receipt.transaction_hash,
          currentAdventurer
        );
        events.push({ name: eventName, data: attackedByBeastEvent });
        break;
      case "SlayedBeast":
        const slayedBeastData: SlayedBeastEvent = {
          adventurerState: parseAdventurerState(raw.data.slice(0, 33)),
          seed: parseInt(raw.data[34]),
          id: parseInt(raw.data[35]),
          beastSpecs: {
            tier: parseInt(raw.data[36]),
            itemType: parseInt(raw.data[37]),
            level: parseInt(raw.data[38]),
            specials: {
              special1: parseInt(raw.data[39]),
              special2: parseInt(raw.data[40]),
              special3: parseInt(raw.data[41]),
            },
          },
          damageDealt: parseInt(raw.data[42]),
          criticalHit: convertToBoolean(parseInt(raw.data[43])),
          xpEarnedAdventurer: parseInt(raw.data[44]),
          xpEarnedItems: parseInt(raw.data[45]),
          goldEarned: parseInt(raw.data[46]),
        };
        const slayedBeastEvent = processData(
          slayedBeastData,
          eventName,
          receipt.transaction_hash,
          currentAdventurer
        );
        events.push({ name: eventName, data: slayedBeastEvent });
        break;
      case "FleeFailed":
        const fleeFailedData: FleeFailedEvent = {
          adventurerState: parseAdventurerState(raw.data.slice(0, 33)),
          seed: parseInt(raw.data[34]),
          id: parseInt(raw.data[35]),
          beastSpecs: {
            tier: parseInt(raw.data[36]),
            itemType: parseInt(raw.data[37]),
            level: parseInt(raw.data[38]),
            specials: {
              special1: parseInt(raw.data[39]),
              special2: parseInt(raw.data[40]),
              special3: parseInt(raw.data[41]),
            },
          },
        };
        const fleeFailedEvent = processData(
          fleeFailedData,
          eventName,
          receipt.transaction_hash,
          currentAdventurer
        );
        events.push({ name: eventName, data: fleeFailedEvent });
        break;
      case "FleeSucceeded":
        const fleeSucceededData: FleeSucceededEvent = {
          adventurerState: parseAdventurerState(raw.data.slice(0, 33)),
          seed: parseInt(raw.data[34]),
          id: parseInt(raw.data[35]),
          beastSpecs: {
            tier: parseInt(raw.data[36]),
            itemType: parseInt(raw.data[37]),
            level: parseInt(raw.data[38]),
            specials: {
              special1: parseInt(raw.data[39]),
              special2: parseInt(raw.data[40]),
              special3: parseInt(raw.data[41]),
            },
          },
        };
        const fleeSucceededEvent = processData(
          fleeSucceededData,
          eventName,
          receipt.transaction_hash,
          currentAdventurer
        );
        events.push({ name: eventName, data: fleeSucceededEvent });
        break;
      case "PurchasedItems":
        const purchasedItemsData: PurchasedItemsEvent = {
          adventurerStateWithBag: {
            adventurerState: parseAdventurerState(raw.data.slice(0, 33)),
            bag: parseBag(raw.data.slice(34, 65)),
          },
          // Skip array length
          purchases: parseItems(raw.data.slice(66)),
        };
        const purchasedItemsEvent = processData(
          purchasedItemsData,
          eventName,
          receipt.transaction_hash,
          currentAdventurer
        );
        events.push({ name: eventName, data: purchasedItemsEvent });
        break;
      case "PurchasedPotions":
        const purchasedPotionsData: PurchasedPotionsEvent = {
          adventurerState: parseAdventurerState(raw.data.slice(0, 33)),
          quantity: parseInt(raw.data[34]),
          cost: parseInt(raw.data[35]),
          health: parseInt(raw.data[36]),
        };
        const purchasedPotionsEvent = processData(
          purchasedPotionsData,
          eventName,
          receipt.transaction_hash,
          currentAdventurer
        );
        events.push({ name: eventName, data: purchasedPotionsEvent });
        break;
      case "EquippedItems":
        const { equippedItems, unequippedItems } = parseEquippedItems(
          // Include equipped array length
          raw.data.slice(65)
        );
        const equippedItemsData: EquippedItemsEvent = {
          adventurerStateWithBag: {
            adventurerState: parseAdventurerState(raw.data.slice(0, 33)),
            bag: parseBag(raw.data.slice(34, 65)),
          },
          equippedItems: equippedItems,
          unequippedItems: unequippedItems,
        };
        const equippedItemsEvent = processData(
          equippedItemsData,
          eventName,
          receipt.transaction_hash,
          currentAdventurer
        );
        events.push({ name: eventName, data: equippedItemsEvent });
        break;
      case "DroppedItems":
        const itemIds = [];
        // Skip array length
        const itemsData = raw.data.slice(66);
        for (let i = 0; i < itemsData.length; i++) {
          itemIds.push(parseInt(itemsData[i]));
        }
        const droppedItemsData: DroppedItemsEvent = {
          adventurerStateWithBag: {
            adventurerState: parseAdventurerState(raw.data.slice(0, 33)),
            bag: parseBag(raw.data.slice(34, 65)),
          },
          itemIds: itemIds,
        };
        const droppedItemsEvent = processData(
          droppedItemsData,
          eventName,
          receipt.transaction_hash,
          currentAdventurer
        );
        events.push({ name: eventName, data: droppedItemsEvent });
        break;
      case "GreatnessIncreased":
        const greatnessIncreasedData: GreatnessIncreasedEvent = {
          adventurerState: parseAdventurerState(raw.data.slice(0, 33)),
          itemId: parseInt(raw.data[34]),
          previousLevel: parseInt(raw.data[35]),
          newLevel: parseInt(raw.data[36]),
        };
        const greatnessIncreasedEvent = processData(
          greatnessIncreasedData,
          eventName,
          receipt.transaction_hash,
          currentAdventurer
        );
        events.push({ name: eventName, data: greatnessIncreasedEvent });
        break;
      case "ItemsLeveledUp":
        const itemsLeveledUpData: ItemsLeveledUpEvent = {
          adventurerState: parseAdventurerState(raw.data.slice(0, 33)),
          // Skip items length
          items: parseItemLevels(raw.data.slice(35)),
        };
        const itemsLeveledUpEvent = processData(
          itemsLeveledUpData,
          eventName,
          receipt.transaction_hash,
          currentAdventurer
        );
        events.push({ name: eventName, data: itemsLeveledUpEvent });
        break;
      case "NewHighScore":
        const newHighScoreData: NewHighScoreEvent = {
          adventurerState: parseAdventurerState(raw.data.slice(0, 33)),
          rank: parseInt(raw.data[34]),
        };
        const newHighScoreEvent = processData(
          newHighScoreData,
          eventName,
          receipt.transaction_hash,
          currentAdventurer
        );
        events.push({ name: eventName, data: newHighScoreEvent });
        break;
      case "AdventurerDied":
        const adventurerDiedData: AdventurerDiedEvent = {
          adventurerState: parseAdventurerState(raw.data.slice(0, 33)),
          killedByBeast: parseInt(raw.data[34]),
          killedByObstacle: parseInt(raw.data[35]),
          callerAddress: raw.data[36],
        };
        const adventurerDiedEvent = processData(
          adventurerDiedData,
          eventName,
          receipt.transaction_hash,
          currentAdventurer
        );
        events.push({ name: eventName, data: adventurerDiedEvent });
        break;
      case "AdventurerLeveledUp":
        const adventurerLeveledUpData: AdventurerLeveledUpEvent = {
          adventurerState: parseAdventurerState(raw.data.slice(0, 33)),
          previousLevel: parseInt(raw.data[34]),
          newLevel: parseInt(raw.data[35]),
        };
        const adventurerLeveledUpEvent = processData(
          adventurerLeveledUpData,
          eventName,
          receipt.transaction_hash,
          currentAdventurer
        );
        events.push({ name: eventName, data: adventurerLeveledUpEvent });
        break;
      case "UpgradesAvailable":
        // Skip array length
        const newItems = raw.data.slice(35);
        const newItemsIds = [];
        for (let i = 0; i < newItems.length; i++) {
          newItemsIds.push(parseInt(newItems[i]));
        }
        const upgradesAvailableData: UpgradesAvailableEvent = {
          adventurerState: parseAdventurerState(raw.data.slice(0, 33)),
          // Skip array length
          items: newItemsIds,
        };
        const upgradesAvailableEvent = processData(
          upgradesAvailableData,
          eventName,
          receipt.transaction_hash,
          currentAdventurer
        );
        events.push({ name: eventName, data: upgradesAvailableEvent });
        break;
      case "Transfer":
        const beastTransferData: ERC721TransferEvent = {
          from: raw.data[0],
          to: raw.data[1],
          tokenId: {
            low: parseInt(raw.data[2]),
            high: parseInt(raw.data[3]),
          },
        };
        events.push({ name: eventName, data: beastTransferData });
        break;
    }
  }

  return events;
}
