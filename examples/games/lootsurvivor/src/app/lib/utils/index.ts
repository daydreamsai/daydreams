import {
  deathMessages,
  itemBasePrice,
  itemCharismaDiscount,
  itemMinimumPrice,
  potionBasePrice,
} from "../constants";
import { GameData } from "../data/GameData";
import type { Adventurer, Item, ItemPurchase } from "../../types";
import { BN } from "bn.js";

export function formatNumber(num: number): string {
  if (Math.abs(num) >= 1000000) {
    return parseFloat((num / 1000000).toFixed(2)) + "m";
  } else if (Math.abs(num) >= 1000) {
    return parseFloat((num / 1000).toFixed(2)) + "k";
  } else {
    return num.toFixed(2);
  }
}

export function formatXP(xp: number): string {
  if (Math.abs(xp) >= 1000000) {
    return parseFloat((xp / 1000000).toFixed(2)) + "m";
  } else if (Math.abs(xp) >= 1000) {
    return parseFloat((xp / 1000).toFixed(2)) + "k";
  } else {
    return xp.toString();
  }
}

export function indexAddress(address: string) {
  return address.replace(/^0x0+/, "0x");
}

export function padAddress(address: string) {
  if (address && address !== "") {
    const length = address.length;
    const neededLength = 66 - length;
    let zeros = "";
    for (var i = 0; i < neededLength; i++) {
      zeros += "0";
    }
    const newHex = address.substring(0, 2) + zeros + address.substring(2);
    return newHex;
  } else {
    return "";
  }
}

export function isChecksumAddress(address: string) {
  return /^0x[0-9a-f]{63,64}$/.test(address);
}

export function displayAddress(string: string) {
  if (string === undefined) return "unknown";
  return string.substring(0, 6) + "..." + string.substring(string.length - 4);
}

const P = new BN(
  "800000000000011000000000000000000000000000000000000000000000001",
  16
);

export function feltToString(felt: number) {
  // Convert to hex, remove '0x' if present, and pad to even length
  const hex = felt.toString(16).replace("0x", "");
  const hexPadded = hex.length % 2 ? "0" + hex : hex;

  // Convert hex to string
  const bytes = new Uint8Array(hexPadded.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hexPadded.substr(i * 2, 2), 16);
  }
  return new TextDecoder().decode(bytes);
}

export function stringToFelt(str: string) {
  // Convert string to hex
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  let hex = "0x";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
}

export function toNegativeNumber(felt: typeof BN.prototype) {
  const added = felt.sub(P);
  return added.abs().lt(felt.abs()) ? added : felt;
}

type DataDictionary = Record<number, string>;

export function getValueFromKey(
  data: DataDictionary,
  key: number
): string | null {
  return data[key] || null;
}

export function getKeyFromValue(
  data: DataDictionary,
  value: string
): string | null {
  for (const key in data) {
    if (data[key] === value) {
      return key;
    }
  }
  return null;
}

export function groupBySlot(items: Item[]) {
  const groups: Dictionary = {};
  groups["All"] = [];
  items.forEach((item) => {
    const { slot } = getItemData(item.item ?? "");
    if (slot) {
      if (!groups[slot]) {
        groups[slot] = [];
      }

      groups[slot].push(item);
    }
    groups["All"].push(item);
  });

  return groups;
}

type Dictionary = { [key: string]: Item[] };

export const sortByKey = (key: string) => {
  return (a: Dictionary, b: Dictionary) => {
    if (a[key] < b[key]) {
      return -1;
    } else if (a[key] > b[key]) {
      return 1;
    } else {
      return 0;
    }
  };
};

export const formatTime = (date: Date) => {
  return (
    date.toISOString().slice(0, 10) + " " + date.toISOString().slice(11, 19)
  );
};

export const formatTimeSeconds = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds - hours * 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
};

export function shortenHex(hexString: string, numDigits = 6) {
  if (hexString?.length <= numDigits) {
    return hexString;
  }

  const halfDigits = Math.floor(numDigits / 2);
  const firstHalf = hexString.slice(0, halfDigits);
  const secondHalf = hexString.slice(-halfDigits);
  return `${firstHalf}...${secondHalf}`;
}

export function convertTime(time: number) {
  const dateTime = new Date(time);

  // Convert the offset to milliseconds
  const currentTimezoneOffsetMinutes = new Date().getTimezoneOffset() * -1;
  const timezoneOffsetMilliseconds = currentTimezoneOffsetMinutes * 60 * 1000;

  const TimeUTC = dateTime.getTime() + timezoneOffsetMilliseconds;
  return TimeUTC;
}

export function getRankFromList(id: number, data: Adventurer[]) {
  return data.findIndex((data) => data.id === id);
}

export const getRandomNumber = (to: number) => {
  return (Math.floor(Math.random() * to) + 1).toString();
};

export function getOrdinalSuffix(n: number): string {
  let j = n % 10;
  let k = n % 100;

  if (j == 1 && k != 11) {
    return n + "st";
  }

  if (j == 2 && k != 12) {
    return n + "nd";
  }

  if (j == 3 && k != 13) {
    return n + "rd";
  }

  return n + "th";
}

export function calculateLevel(xp: number) {
  return Math.max(Math.floor(Math.sqrt(xp)), 1);
}

export function processItemName(item: Item) {
  if (item) {
    if (calculateLevel(item.xp ?? 0) >= 20) {
      return `${item.special2} ${item.special3} ${item.item} ${item.special1} +1`;
    } else if (calculateLevel(item.xp ?? 0) >= 19) {
      return `${item.special2} ${item.special3} ${item.item} ${item.special1}`;
    } else if (calculateLevel(item.xp ?? 0) >= 15) {
      return `${item.item} ${item.special1}`;
    } else {
      return `${item.item}`;
    }
  }
}

export function getItemData(item: string) {
  const gameData = new GameData();

  const item_name_format = item.replaceAll(" ", "");
  const tier = gameData.ITEM_TIERS[item_name_format];
  const type =
    gameData.ITEM_TYPES[parseInt(getKeyFromValue(gameData.ITEMS, item) ?? "")];
  const slot = gameData.ITEM_SLOTS[item_name_format];
  return { tier, type, slot };
}

export function processBeastName(
  beast: string,
  special2: string,
  special3: string
) {
  if (special2 && special3) {
    return `"${special2} ${special3}" ${beast}`;
  } else {
    return `${beast}`;
  }
}

export function getBeastData(beast: string) {
  const gameData = new GameData();
  const tier =
    gameData.BEAST_TIERS[
    parseInt(getKeyFromValue(gameData.BEASTS, beast) ?? "")
    ];
  const attack =
    gameData.BEAST_ATTACK_TYPES[
    gameData.BEAST_TYPES[
    parseInt(getKeyFromValue(gameData.BEASTS, beast) ?? "")
    ]
    ];
  const armor =
    gameData.BEAST_ARMOR_TYPES[
    gameData.BEAST_TYPES[
    parseInt(getKeyFromValue(gameData.BEASTS, beast) ?? "")
    ]
    ];
  const image = `/monsters/${beast.toLowerCase()}.png`;
  return { tier, attack, armor, image };
}

export function getRandomElement(arr: string[]): string {
  if (arr.length === 0) {
    throw new Error("Array must not be empty.");
  }
  const randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
}

type MyDict = { [key: string]: Item };

export function dedupeByValue(arr: MyDict[], key: string): MyDict[] {
  const seen = new Set();
  return arr.filter((item) => {
    const val = item[key];
    if (seen.has(val)) {
      return false;
    }
    seen.add(val);
    return true;
  });
}

export function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function checkAvailableSlots(ownedItems: Item[]) {
  if (ownedItems.length < 20) {
    return true;
  } else {
    return false;
  }
}

export function getItemPrice(tier: number, charisma: number) {
  const price = (6 - tier) * itemBasePrice - itemCharismaDiscount * charisma;
  if (price < itemMinimumPrice) {
    return itemMinimumPrice;
  } else {
    return price;
  }
}

export function getPotionPrice(adventurerLevel: number, charisma: number) {
  return Math.max(adventurerLevel - potionBasePrice * charisma, 1);
}

export function isFirstElement<T>(arr: T[], element: T): boolean {
  return arr[0] === element;
}

export function removeElement(arr: string[], value: string) {
  const index = arr.lastIndexOf(value);

  if (index > -1) {
    // Check if there's more than one instance of the value
    if (arr.indexOf(value) !== arr.lastIndexOf(value)) {
      // If there's more than one instance, just remove the last one
      arr.splice(index, 1);
    } else {
      // If there's only one instance, remove all
      while (arr.indexOf(value) !== -1) {
        arr.splice(arr.indexOf(value), 1);
      }
    }
  }

  return arr;
}

export function countOccurrences<T>(arr: T[], value: T): number {
  return arr.filter((item) => item === value).length;
}

export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array?.length; i += chunkSize) {
    const nextChunk = array?.slice(i, i + chunkSize);
    chunks.push(nextChunk);
    if (nextChunk.length < chunkSize) break; // Stop if we've hit the end of the array
  }
  return chunks;
}

export function isObject(value: any): value is object {
  return typeof value === "object" && !Array.isArray(value);
}

export function convertToBoolean(value: number): boolean {
  return value === 1;
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getDeathMessageByRank(rank: number): string {
  // The || {} is to prevent destructure error in case find returns undefined
  if (rank === 0) {
    return "Better luck next time - You can improve!";
  }

  const { message } =
    deathMessages.find((item: { rank: number; message: string }) => rank <= item.rank) || {};

  return message || "Better luck next time - You can improve!";
}

export const getUnequippedSuffixBoosts = (
  purchases: ItemPurchase[],
  adventurer: Adventurer,
  items: Item[],
  equipItems: string[],
  dropItems: string[]
) => {
  const gameData = new GameData();
  const equippedPurchasedItems = purchases.filter(
    (purchase) => purchase.equip === "1"
  );
  const purchasedItemStrings = equippedPurchasedItems.map(
    (purchase) => gameData.ITEMS[parseInt(purchase?.item) ?? 0]
  );
  const equippedItemStrings = equipItems.map(
    (equip) => gameData.ITEMS[parseInt(equip) ?? 0]
  );
  const droppedItemStrings = dropItems.map(
    (drop) => gameData.ITEMS[parseInt(drop) ?? 0]
  );
  const itemStrings = [
    ...purchasedItemStrings,
    ...equippedItemStrings,
    ...droppedItemStrings,
  ];
  const slotStrings = itemStrings.map(
    (itemString) => gameData.ITEM_SLOTS[itemString.split(" ").join("")]
  );

  // loop through slots and check what item is equipped
  const unequippedSuffixBoosts = [];
  for (const slot of slotStrings) {
    if (slot === "Weapon") {
      unequippedSuffixBoosts.push(
        gameData.ITEM_SUFFIX_BOOST[
        parseInt(
          getKeyFromValue(
            gameData.ITEM_SUFFIXES,
            items.find((item) => item.item === adventurer.weapon)?.special1 ??
            ""
          ) ?? "0"
        )
        ]
      );
    }
    if (slot === "Chest") {
      unequippedSuffixBoosts.push(
        gameData.ITEM_SUFFIX_BOOST[
        parseInt(
          getKeyFromValue(
            gameData.ITEM_SUFFIXES,
            items.find((item) => item.item === adventurer.chest)?.special1 ??
            ""
          ) ?? "0"
        )
        ]
      );
    }
    if (slot === "Head") {
      unequippedSuffixBoosts.push(
        gameData.ITEM_SUFFIX_BOOST[
        parseInt(
          getKeyFromValue(
            gameData.ITEM_SUFFIXES,
            items.find((item) => item.item === adventurer.head)?.special1 ??
            ""
          ) ?? "0"
        )
        ]
      );
    }
    if (slot === "Waist") {
      unequippedSuffixBoosts.push(
        gameData.ITEM_SUFFIX_BOOST[
        parseInt(
          getKeyFromValue(
            gameData.ITEM_SUFFIXES,
            items.find((item) => item.item === adventurer.waist)?.special1 ??
            ""
          ) ?? "0"
        )
        ]
      );
    }
    if (slot === "Foot") {
      unequippedSuffixBoosts.push(
        gameData.ITEM_SUFFIX_BOOST[
        parseInt(
          getKeyFromValue(
            gameData.ITEM_SUFFIXES,
            items.find((item) => item.item === adventurer.foot)?.special1 ??
            ""
          ) ?? "0"
        )
        ]
      );
    }
    if (slot === "Hand") {
      unequippedSuffixBoosts.push(
        gameData.ITEM_SUFFIX_BOOST[
        parseInt(
          getKeyFromValue(
            gameData.ITEM_SUFFIXES,
            items.find((item) => item.item === adventurer.hand)?.special1 ??
            ""
          ) ?? "0"
        )
        ]
      );
    }
    if (slot === "Neck") {
      unequippedSuffixBoosts.push(
        gameData.ITEM_SUFFIX_BOOST[
        parseInt(
          getKeyFromValue(
            gameData.ITEM_SUFFIXES,
            items.find((item) => item.item === adventurer.neck)?.special1 ??
            ""
          ) ?? "0"
        )
        ]
      );
    }
    if (slot === "Ring") {
      unequippedSuffixBoosts.push(
        gameData.ITEM_SUFFIX_BOOST[
        parseInt(
          getKeyFromValue(
            gameData.ITEM_SUFFIXES,
            items.find((item) => item.item === adventurer.ring)?.special1 ??
            ""
          ) ?? "0"
        )
        ]
      );
    }
  }
  return unequippedSuffixBoosts.filter((suffix) => suffix !== undefined);
};

export const calculateVitBoostRemoved = (
  purchases: ItemPurchase[],
  adventurer: Adventurer,
  items: Item[],
  equipItems: string[],
  dropItems: string[]
) => {
  const filteredSuffixBoosts = getUnequippedSuffixBoosts(
    purchases,
    adventurer,
    items,
    equipItems,
    dropItems
  );
  const vitTotal = findAndSumVitValues(filteredSuffixBoosts);
  return vitTotal;
};

export const calculateChaBoostRemoved = (
  purchases: ItemPurchase[],
  adventurer: Adventurer,
  items: Item[],
  equipItems: string[],
  dropItems: string[]
) => {
  const filteredSuffixBoosts = getUnequippedSuffixBoosts(
    purchases,
    adventurer,
    items,
    equipItems,
    dropItems
  );
  const chaTotal = findAndSumChaValues(filteredSuffixBoosts);
  return chaTotal;
};

function findAndSumVitValues(arr: string[]): number {
  let total = 0;

  arr.forEach((str) => {
    const matches = str.match(/VIT \+\d+/g);

    if (matches) {
      matches.forEach((match) => {
        const value = parseInt(match.split("+")[1]);
        total += value;
      });
    }
  });

  return total;
}

function findAndSumChaValues(arr: string[]): number {
  let total = 0;

  arr.forEach((str) => {
    const matches = str.match(/CHA \+\d+/g);

    if (matches) {
      matches.forEach((match) => {
        const value = parseInt(match.split("+")[1]);
        total += value;
      });
    }
  });

  return total;
}

export function formatCurrency(value: number): string {
  return (value / 10 ** 18).toFixed(4);
}

export function formatLords(value: number): string {
  return (value / 10 ** 18).toFixed(0);
}

export const formatItemName = (name: string): string => {
  return name.replace(/([a-z])([A-Z])/g, "$1 $2");
};

export const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error("Failed to copy text: ", err);
  }
};

export const DataType = {
  SpotEntry: (pairId: string) => ({
    variant: "SpotEntry",
    activeVariant: () => "SpotEntry",
    unwrap: () => pairId,
  }),
  FutureEntry: (pairId: string, expirationTimestamp: string) => ({
    variant: "FutureEntry",
    activeVariant: () => "FutureEntry",
    unwrap: () => [pairId, expirationTimestamp],
  }),
  GenericEntry: (key: string) => ({
    variant: "GenericEntry",
    activeVariant: () => "GenericEntry",
    unwrap: () => key,
  }),
};

export const removeSpaces = (str: string): string =>
  str?.replace(/\s+/g, "") ?? "";

export function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
