export const prologue =
  "An adventurer stirs from a slumber in a cold, dark cave.";
export const chapter1 =
  "Disoriented, they scour the darkness, the only sound a dripping echo and the biting whisper of wind.";
export const chapter2 =
  "Where? How? Water whispers nearby. They move, reaching through the mist. Suddenly, a fountain materializes, an ethereal sentinel obscured by the swirling vapor.";
export const chapter3 =
  "Intrigued, they draw closer, their form dancing on the water's surface. Four oddities lie within - a wand, a book, a club, and a sword.";
export const chapter4 =
  "They find golden coins in their pocket, glimmering in the dim light - an enigma wrapped in the shroud of the unexpected.";
export const battle = "A beast lurks in the shadow, prepare for battle!";

export const notificationAnimations = [
  { name: "idle", startFrame: 0, frameCount: 4 },
  { name: "run", startFrame: 9, frameCount: 5 },
  { name: "jump", startFrame: 11, frameCount: 7 },
  { name: "attack1", startFrame: 42, frameCount: 5 },
  { name: "attack2", startFrame: 47, frameCount: 6 },
  { name: "attack3", startFrame: 53, frameCount: 8 },
  { name: "damage", startFrame: 59, frameCount: 4 },
  { name: "die", startFrame: 64, frameCount: 9 },
  { name: "drawSword", startFrame: 70, frameCount: 5 },
  { name: "discoverItem", startFrame: 85, frameCount: 6 },
  { name: "slide", startFrame: 24, frameCount: 5 },
];

// ---- CONTRACT PARAMS
export const itemCharismaDiscount = 1;
export const itemBasePrice = 4;
export const itemMinimumPrice = 1;
export const potionCharismaDiscount = 2;
export const potionBasePrice = 2;
export const VRF_FEE_LIMIT = 5000000000000000; // 0.005 ETH
export const VRF_WAIT_TIME = 3000;
export const vitalityIncrease = 15;

// UI PARAMS
export const getWaitRetryInterval = (network: string) =>
  network === "mainnet" || network === "sepolia" ? 1000 : 10; // 6 seconds on sepolia + mainnet, 10ms on katana
export const ETH_INCREMENT = 0.001;
export const LORDS_INCREMENT = 5;
export const getMaxFee = (network: string) =>
  network === "mainnet" ? 0.001 * 10 ** 18 : 0.3 * 10 ** 18; // 0.001ETH on mainnet, 0.3ETH on sepolia
export const ETH_PREFUND_AMOUNT = (network: string) =>
  network === "mainnet" || network === "sepolia"
    ? "0x2386F26FC10000"
    : "0x38D7EA4C68000"; // 0.01ETH on Mainnet or Sepolia, 0.001ETH on Testnet

export const deathMessages = [
  {
    rank: 3,
    message: "Supreme Conqueror! - Unrivaled mastery of survival!",
  },
  {
    rank: 10,
    message: "Glorious Victor! - A testament to your indomitable spirit!",
  },
  {
    rank: 25,
    message: "Heroic Endurance! - Legends will speak of your bravery!",
  },
  {
    rank: 50,
    message: "Valiant Survivor! - A remarkable display of fortitude!",
  },
  { rank: 100, message: "Brave Combatant! - A commendable effort!" },
  { rank: 250, message: "Daring Challenger! - A brave stand!" },
];

export const efficacyData = [
  { weapon: "Blade", metal: "Weak", hide: "Fair", cloth: "Strong" },
  { weapon: "Bludgeon", metal: "Fair", hide: "Strong", cloth: "Weak" },
  { weapon: "Magic", metal: "Strong", hide: "Weak", cloth: "Fair" },
];

export const collectionData = [
  {
    avatar: "/collections/Blobert.png",
    name: "Bloberts",
    token: "0x00539f522b29ae9251dbf7443c7a950cf260372e69efab3710a11bf17a9599f1",
  },
  {
    avatar: "/collections/Ducks-Everywhere.png",
    name: "Ducks Everywhere",
    token: "0x058949fa2955b10b3a82521934e8b0505dc0b7ba929c3049622ae91d2c52e194",
  },
  {
    avatar: "/collections/Everai.png",
    name: "Everai",
    token: "0x02acee8c430f62333cf0e0e7a94b2347b5513b4c25f699461dd8d7b23c072478",
  },
  {
    avatar: "/collections/Focus-Tree.png",
    name: "Focus Tree",
    token: "0x0377c2d65debb3978ea81904e7d59740da1f07412e30d01c5ded1c5d6f1ddc43",
  },
  {
    avatar: "/collections/Influence.png",
    name: "Influence",
    token: "0x0241b9c4ce12c06f49fee2ec7c16337386fa5185168f538a7631aacecdf3df74",
  },
  {
    avatar: "/collections/The-Syndicate.png",
    name: "The Syndicate",
    token: "0x065a413ce0b5c169c583c7efad857913523485f1febcf5ef4f3909133f04904a",
  },
  {
    avatar: "/collections/Pixel-Banners.png",
    name: "Pixel Banners",
    token: "0x02d66679de61a5c6d57afd21e005a8c96118bd60315fd79a4521d68f5e5430d1",
  },
  {
    avatar: "/collections/Realms.png",
    name: "Realms",
    token: "0x07ae27a31bb6526e3de9cf02f081f6ce0615ac12a6d7b85ee58b8ad7947a2809",
  },
];

export const maxGamesPlayable = 1600;

export const payouts = {
  first: 0.27,
  second: 0.16,
  third: 0.1,
  clientProvider: 0.27,
  creator: 0.2,
};

export const seasonCost = 4000000000000000000;
