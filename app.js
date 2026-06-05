const STARTING_BALANCE = 10000;
const MINES_GRID_SIZE = 25;
const MINES_MIN_COUNT = 1;
const MINES_MAX_COUNT = MINES_GRID_SIZE - 1;
const ROULETTE_PAYOUTS = { red: 2, black: 2, green: 14 };
const ROULETTE_SLOTS = [
  "green",
  "red",
  "black",
  "red",
  "black",
  "red",
  "black",
  "red",
  "black",
  "red",
  "black",
  "red",
  "black",
  "red",
  "black",
];
const ROULETTE_SEGMENT_WIDTH = 93;
const ROULETTE_RENDER_LOOPS = 16;
const ROULETTE_RESET_LOOP = 6;
const ROCKET_TICK_MS = 100;
const PLINKO_ROWS = 12;
const PLINKO_MAX_BALLS = 15;
const PLINKO_PROFILES = {
  easy: {
    buckets: [3.2, 1.8, 1.2, 1, 0.7, 1, 1.2, 1.8, 3.2],
    weights: [0.9, 4, 12, 22, 30, 22, 12, 4, 0.9],
  },
  normal: {
    buckets: [5.7, 2.3, 1.2, 1, 0.5, 1, 1.2, 2.3, 5.7],
    weights: [0.16, 1.2, 6, 22, 45, 22, 6, 1.2, 0.16],
  },
  hard: {
    buckets: [12, 5.7, 2.1, 0.8, 0.3, 0.8, 2.1, 5.7, 12],
    weights: [0.05, 0.45, 4, 20, 52, 20, 4, 0.45, 0.05],
  },
};
const PLINKO_BUCKET_LEFT = 8;
const PLINKO_BUCKET_WIDTH = 84;
const MINES_REWARD_FACTOR = 0.68;
const TOWERS_ROWS = 8;
const TOWERS_MODES = {
  easy: {
    columns: 5,
    badPicks: 2,
    multiplier: 1.32,
  },
  normal: {
    columns: 3,
    badPicks: 1,
    multiplier: 1.52,
  },
  hard: {
    columns: 3,
    badPicks: 2,
    multiplier: 2.15,
  },
};
const WIN_IMAGES = [
  "images/e65e836859ab6c998e6eddab8657df02-tiger-illustration-face-chinese.png.webp",
  "images/images.jpeg",
  "images/images-2.jpeg",
  "images/90.gif",
  "images/giphy.gif",
  "images/bbfaccgx5x4h1.gif",
  "images/ishowspeed-speed.gif",
  "images/90.jpeg",
  "images/200w.gif",
  "images/transparent-background-missile-fire-free-png.png.webp",
  "images/Cartoon-Superman-PNG-Image-Background.png",
];
const LOSS_IMAGES = [
  "images/holyairball.gif",
  "images/giphy.gif",
  "images/bbfaccgx5x4h1.gif",
  "images/ishowspeed-speed.gif",
  "images/90.jpeg",
  "images/200w.gif",
  "images/transparent-background-missile-fire-free-png.png.webp",
  "images/e65e836859ab6c998e6eddab8657df02-tiger-illustration-face-chinese.png.webp",
];
const GIF_IMAGES = [
  "images/holyairball.gif",
  "images/90.gif",
  "images/giphy.gif",
  "images/bbfaccgx5x4h1.gif",
  "images/ishowspeed-speed.gif",
  "images/200w.gif",
];
const WIN_WORDS = ["MEGA WIN", "JACKPOT", "WILD HIT", "BONUS BLAST", "CASH OUT"];
const LOSS_WORDS = ["BUST", "CRASHED", "NOPE", "RIPPED", "MISS"];
const FX_EMOJIS = ["💥", "⚡", "🔥", "💎", "🚀", "💰", "🤑"];
const LOSS_EMOJIS = ["💣", "💥", "☠️", "🧨", "💀", "🫠"];
const WIN_VARIANTS = ["jackpot", "meme", "orbit", "stampede", "neon", "gifstorm", "gifwall"];
const LOSS_VARIANTS = ["wasted", "glitch", "meltdown", "blackout", "impact", "gifpanic", "gifstatic"];
const FX_BODY_CLASSES = [
  ...WIN_VARIANTS.map((variant) => `fx-win-${variant}`),
  ...LOSS_VARIANTS.map((variant) => `fx-loss-${variant}`),
];

// Shared demo balance. This is play money only and never connects to real payments.
let balance = STARTING_BALANCE;

// Mines state: the bet is deducted up front, mine positions are hidden until the round ends.
let minesRound = {
  active: false,
  bet: 0,
  mineCount: 3,
  safePicks: 0,
  mineIndexes: new Set(),
  revealedIndexes: new Set(),
};

// Roulette state: the selected color controls the next spin's payout rule.
let rouletteChoice = "red";
let rouletteSpinning = false;
let rouletteReelOffset = 0;

// Rocket state: each launch has a hidden crash multiplier and a timer that raises the live multiplier.
let rocketRound = {
  active: false,
  bet: 0,
  multiplier: 1,
  crashAt: 1,
  elapsedTicks: 0,
  timerId: null,
};

// Plinko state: multiple balls can move at once, capped to avoid browser slowdown.
let activePlinkoBalls = 0;
let plinkoPegPositions = [];
let plinkoDifficulty = "easy";

// Towers state: each row has one safe tile. The player climbs from bottom to top.
let towersDifficulty = "easy";
let towersRound = {
  active: false,
  bet: 0,
  level: 0,
  badColumns: [],
};
let fxSequence = 0;

const balanceElement = document.querySelector("#balance");
const screenButtons = document.querySelectorAll("[data-screen]");
const screens = document.querySelectorAll(".screen");
const navButtons = document.querySelectorAll(".nav-button");

const minesBetInput = document.querySelector("#mines-bet");
const minesCountInput = document.querySelector("#mines-count");
const minesBoard = document.querySelector("#mines-board");
const minesStartButton = document.querySelector("#mines-start");
const minesCashoutButton = document.querySelector("#mines-cashout");
const minesHeading = document.querySelector("#mines-heading");
const minesSafeCount = document.querySelector("#mines-safe-count");
const minesMultiplier = document.querySelector("#mines-multiplier");
const minesPayout = document.querySelector("#mines-payout");
const minesMessage = document.querySelector("#mines-message");

const rouletteBetInput = document.querySelector("#roulette-bet");
const rouletteWheel = document.querySelector("#roulette-wheel");
const rouletteResult = document.querySelector("#roulette-result");
const rouletteChoiceLabel = document.querySelector("#roulette-choice");
const rouletteSpinButton = document.querySelector("#roulette-spin");
const rouletteMessage = document.querySelector("#roulette-message");
const rouletteChoiceButtons = document.querySelectorAll("[data-roulette-choice]");

const rocketBetInput = document.querySelector("#rocket-bet");
const rocketStartButton = document.querySelector("#rocket-start");
const rocketCashoutButton = document.querySelector("#rocket-cashout");
const rocketLive = document.querySelector("#rocket-live");
const rocketPanelMultiplier = document.querySelector("#rocket-panel-multiplier");
const rocketWinPreview = document.querySelector("#rocket-win-preview");
const rocketMessage = document.querySelector("#rocket-message");
const rocketShip = document.querySelector("#rocket-ship");
const rocketPath = document.querySelector("#rocket-path");

const plinkoBetInput = document.querySelector("#plinko-bet");
const plinkoPegs = document.querySelector("#plinko-pegs");
const plinkoBuckets = document.querySelector("#plinko-buckets");
const plinkoBalls = document.querySelector("#plinko-balls");
const plinkoDropButton = document.querySelector("#plinko-drop");
const plinkoLast = document.querySelector("#plinko-last");
const plinkoMessage = document.querySelector("#plinko-message");
const plinkoDifficultyButtons = document.querySelectorAll("[data-plinko-difficulty]");

const towersBetInput = document.querySelector("#towers-bet");
const towersBoard = document.querySelector("#towers-board");
const towersStartButton = document.querySelector("#towers-start");
const towersCashoutButton = document.querySelector("#towers-cashout");
const towersLevel = document.querySelector("#towers-level");
const towersPayout = document.querySelector("#towers-payout");
const towersMessage = document.querySelector("#towers-message");
const towersDifficultyButtons = document.querySelectorAll("[data-towers-difficulty]");
const fxLayer = document.querySelector("#fx-layer");

function formatUsdAmount(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatUsd(amount) {
  return formatUsdAmount(amount);
}

function updateBalance(amount) {
  balance = Math.max(0, amount);
  balanceElement.textContent = formatUsd(balance);
  syncBetInputsToBalance();
}

function clampBetInputToBalance(input) {
  const value = Math.floor(Number(input.value));
  const maxBet = Math.floor(balance);

  if (!Number.isFinite(value)) {
    return Number.NaN;
  }

  if (value > maxBet) {
    input.value = String(maxBet);
    return maxBet;
  }

  return value;
}

function readBet(input) {
  return clampBetInputToBalance(input);
}

function syncBetInputsToBalance() {
  [
    minesBetInput,
    rouletteBetInput,
    rocketBetInput,
    plinkoBetInput,
    towersBetInput,
  ].forEach((input) => {
    if (input) {
      clampBetInputToBalance(input);
    }
  });
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function canAffordBet(bet) {
  return Number.isFinite(bet) && bet > 0 && bet <= balance;
}

function showScreen(screenId) {
  screens.forEach((screen) => {
    screen.classList.toggle("active", screen.id === screenId);
  });

  navButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.screen === screenId);
  });
}

function setMessage(element, message, type = "") {
  element.textContent = message;
  element.className = `game-message ${type}`.trim();
}

function createConfetti() {
  const colors = ["#30f579", "#f8ff7a", "#77b7ff", "#ff8a99", "#ffffff"];

  for (let index = 0; index < 130; index += 1) {
    const piece = document.createElement("span");

    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.top = `${-12 - Math.random() * 80}px`;
    piece.style.background = colors[index % colors.length];
    piece.style.setProperty("--confetti-x", `${-70 + Math.random() * 140}px`);
    piece.style.setProperty("--confetti-y", `${window.innerHeight + 80 + Math.random() * 120}px`);
    piece.style.setProperty("--confetti-rotate", `${Math.random() * 540}deg`);
    piece.style.animationDelay = `${Math.random() * 260}ms`;
    document.body.append(piece);
    window.setTimeout(() => piece.remove(), 1700);
  }
}

function randomFrom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function resetFxLayer() {
  if (!fxLayer) {
    return;
  }

  fxLayer.className = "fx-layer";
  fxLayer.innerHTML = "";
  document.body.classList.remove(...FX_BODY_CLASSES);
}

function scheduleFxReset(sequence, delay) {
  window.setTimeout(() => {
    if (sequence === fxSequence) {
      resetFxLayer();
    }
  }, delay);
}

function spawnFxImage(imageSet, className, delay = 0) {
  const image = document.createElement("img");

  image.className = className;
  image.src = randomFrom(imageSet);
  image.alt = "";
  image.style.left = `${8 + Math.random() * 84}%`;
  image.style.top = `${8 + Math.random() * 78}%`;
  image.style.setProperty("--fx-delay", `${delay}ms`);
  image.style.setProperty("--fx-spin", `${-34 + Math.random() * 68}deg`);
  image.style.setProperty("--fx-scale", `${0.7 + Math.random() * 0.95}`);
  fxLayer.append(image);
}

function spawnFxWord(words, className, delay = 0) {
  const word = document.createElement("span");

  word.className = className;
  word.textContent = randomFrom(words);
  word.style.left = `${12 + Math.random() * 76}%`;
  word.style.top = `${12 + Math.random() * 72}%`;
  word.style.setProperty("--fx-delay", `${delay}ms`);
  word.style.setProperty("--fx-spin", `${-18 + Math.random() * 36}deg`);
  fxLayer.append(word);
}

function spawnFxEmoji(emojis, className, delay = 0) {
  const emoji = document.createElement("span");

  emoji.className = className;
  emoji.textContent = randomFrom(emojis);
  emoji.style.left = `${Math.random() * 100}%`;
  emoji.style.top = `${-10 - Math.random() * 30}%`;
  emoji.style.setProperty("--fx-delay", `${delay}ms`);
  emoji.style.setProperty("--fx-drift", `${-160 + Math.random() * 320}px`);
  emoji.style.setProperty("--fx-spin", `${-220 + Math.random() * 440}deg`);
  fxLayer.append(emoji);
}

function spawnFxPanel(imageSet, title, subtitle, variant) {
  const panel = document.createElement("div");
  const image = document.createElement("img");
  const heading = document.createElement("strong");
  const caption = document.createElement("span");

  panel.className = `fx-panel ${variant}`;
  image.src = randomFrom(imageSet);
  image.alt = "";
  heading.textContent = title;
  caption.textContent = subtitle;
  panel.append(heading, image, caption);
  fxLayer.append(panel);
}

function spawnFxShape(className, delay = 0) {
  const shape = document.createElement("span");

  shape.className = className;
  shape.style.left = `${Math.random() * 100}%`;
  shape.style.top = `${Math.random() * 100}%`;
  shape.style.setProperty("--fx-delay", `${delay}ms`);
  shape.style.setProperty("--fx-spin", `${-180 + Math.random() * 360}deg`);
  shape.style.setProperty("--fx-drift", `${-220 + Math.random() * 440}px`);
  fxLayer.append(shape);
}

function spawnGifShowcase(title, subtitle, variant) {
  const showcase = document.createElement("div");
  const lead = document.createElement("img");
  const sideA = document.createElement("img");
  const sideB = document.createElement("img");
  const heading = document.createElement("strong");
  const caption = document.createElement("span");

  showcase.className = `fx-gif-showcase ${variant}`;
  lead.src = randomFrom(GIF_IMAGES);
  sideA.src = randomFrom(GIF_IMAGES);
  sideB.src = randomFrom(GIF_IMAGES);
  lead.alt = "";
  sideA.alt = "";
  sideB.alt = "";
  lead.className = "lead-gif";
  sideA.className = "side-gif side-a";
  sideB.className = "side-gif side-b";
  heading.textContent = title;
  caption.textContent = subtitle;
  showcase.append(sideA, sideB, lead, heading, caption);
  fxLayer.append(showcase);
}

function spawnGifFloater(className, delay = 0) {
  const image = document.createElement("img");

  image.className = className;
  image.src = randomFrom(GIF_IMAGES);
  image.alt = "";
  image.style.left = `${4 + Math.random() * 92}%`;
  image.style.top = `${8 + Math.random() * 78}%`;
  image.style.setProperty("--fx-delay", `${delay}ms`);
  image.style.setProperty("--fx-spin", `${-24 + Math.random() * 48}deg`);
  image.style.setProperty("--fx-scale", `${0.85 + Math.random() * 0.85}`);
  fxLayer.append(image);
}

function spawnGifWall(className, delay = 0, index = 0) {
  const card = document.createElement("img");
  const positions = [
    [16, 22],
    [82, 24],
    [18, 76],
    [82, 74],
    [50, 18],
    [50, 82],
  ];
  const position = positions[index % positions.length];

  card.className = className;
  card.src = randomFrom(GIF_IMAGES);
  card.alt = "";
  card.style.left = `${position[0] + (Math.random() - 0.5) * 8}%`;
  card.style.top = `${position[1] + (Math.random() - 0.5) * 8}%`;
  card.style.setProperty("--fx-delay", `${delay}ms`);
  card.style.setProperty("--fx-spin", `${-9 + Math.random() * 18}deg`);
  fxLayer.append(card);
}

function runWinVariant(variant, gameName) {
  if (variant === "meme") {
    spawnFxPanel(WIN_IMAGES, "HE HIT?", `${gameName.toUpperCase()} JUST PAID`, "win-panel");
  }

  if (variant === "orbit") {
    for (let index = 0; index < 8; index += 1) {
      spawnFxImage(WIN_IMAGES, "fx-image fx-orbit-image", index * 80);
    }
  }

  if (variant === "stampede") {
    for (let index = 0; index < 7; index += 1) {
      spawnFxImage(WIN_IMAGES, "fx-image fx-runner-image", index * 95);
    }
  }

  if (variant === "neon") {
    for (let index = 0; index < 14; index += 1) {
      spawnFxShape("fx-laser", index * 35);
    }
  }

  if (variant === "jackpot") {
    for (let index = 0; index < 28; index += 1) {
      spawnFxShape("fx-coin", index * 28);
    }
  }

  if (variant === "gifstorm") {
    spawnGifShowcase("GIF GOD MODE", `${gameName.toUpperCase()} WENT CRAZY`, "win-gif-showcase");

    for (let index = 0; index < 10; index += 1) {
      spawnGifFloater("fx-gif-floater", index * 140);
    }
  }

  if (variant === "gifwall") {
    spawnGifShowcase("CLIP IT", `${gameName.toUpperCase()} WIN REPLAY`, "win-gif-showcase gif-wall-showcase");

    for (let index = 0; index < 12; index += 1) {
      spawnGifWall("fx-gif-wall-card", index * 95, index);
    }
  }
}

function runLossVariant(variant, gameName) {
  if (variant === "wasted") {
    spawnFxPanel(LOSS_IMAGES, "WASTED", `${gameName.toUpperCase()} FOLDED`, "loss-panel wasted-panel");
  }

  if (variant === "glitch") {
    for (let index = 0; index < 16; index += 1) {
      spawnFxShape("fx-glitch-strip", index * 28);
    }
  }

  if (variant === "meltdown") {
    for (let index = 0; index < 22; index += 1) {
      spawnFxShape("fx-meteor", index * 34);
    }
  }

  if (variant === "blackout") {
    spawnFxPanel(LOSS_IMAGES, "NO SIGNAL", `${gameName.toUpperCase()} LOST`, "loss-panel blackout-panel");
  }

  if (variant === "impact") {
    for (let index = 0; index < 6; index += 1) {
      spawnFxShape("fx-shockwave", index * 130);
    }
  }

  if (variant === "gifpanic") {
    spawnGifShowcase("ABSOLUTE COOKED", `${gameName.toUpperCase()} DISASTER CAM`, "loss-gif-showcase");

    for (let index = 0; index < 9; index += 1) {
      spawnGifFloater("fx-gif-floater loss-gif-floater", index * 150);
    }
  }

  if (variant === "gifstatic") {
    spawnGifShowcase("REPLAY OF PAIN", `${gameName.toUpperCase()} LOSS LOOP`, "loss-gif-showcase gif-static-showcase");

    for (let index = 0; index < 10; index += 1) {
      spawnGifWall("fx-gif-wall-card loss-gif-wall-card", index * 115, index);
    }
  }
}

// Full-screen outcome effects stay cosmetic; game results are still handled by each game mode.
function triggerWinEffects(gameName) {
  if (!fxLayer) {
    createConfetti();
    return;
  }

  fxSequence += 1;
  const sequence = fxSequence;
  const variant = randomFrom(WIN_VARIANTS);

  resetFxLayer();
  createConfetti();
  document.body.classList.remove("loss-shake");
  document.body.classList.add("win-shake", `fx-win-${variant}`);
  fxLayer.classList.add("active", "win-blast", `win-${variant}`);

  const hero = document.createElement("img");
  hero.className = "fx-hero-image";
  hero.src = randomFrom(WIN_IMAGES);
  hero.alt = "";
  fxLayer.append(hero);

  const title = document.createElement("span");
  title.className = "fx-title";
  title.textContent = `${gameName.toUpperCase()} WIN`;
  fxLayer.append(title);

  for (let index = 0; index < 9; index += 1) {
    spawnFxImage(WIN_IMAGES, "fx-image", index * 70);
  }

  for (let index = 0; index < 12; index += 1) {
    spawnFxWord(WIN_WORDS, "fx-word", index * 55);
  }

  for (let index = 0; index < 34; index += 1) {
    spawnFxEmoji(FX_EMOJIS, "fx-emoji", index * 22);
  }

  runWinVariant(variant, gameName);

  window.setTimeout(() => document.body.classList.remove("win-shake"), 620);
  scheduleFxReset(sequence, variant.startsWith("gif") ? 3900 : 2850);
}

function triggerLossEffects(gameName) {
  if (!fxLayer) {
    return;
  }

  fxSequence += 1;
  const sequence = fxSequence;
  const variant = randomFrom(LOSS_VARIANTS);

  resetFxLayer();
  document.body.classList.remove("win-shake");
  document.body.classList.add("loss-shake", `fx-loss-${variant}`);
  fxLayer.classList.add("active", "loss-blast", `loss-${variant}`);

  const title = document.createElement("span");
  title.className = "fx-title loss-title";
  title.textContent = `${gameName.toUpperCase()} ${randomFrom(LOSS_WORDS)}`;
  fxLayer.append(title);

  for (let index = 0; index < 4; index += 1) {
    spawnFxImage(LOSS_IMAGES, "fx-image loss-image", index * 90);
  }

  for (let index = 0; index < 9; index += 1) {
    spawnFxWord(LOSS_WORDS, "fx-word loss-word", index * 65);
  }

  for (let index = 0; index < 28; index += 1) {
    spawnFxEmoji(LOSS_EMOJIS, "fx-emoji loss-emoji", index * 24);
  }

  runLossVariant(variant, gameName);

  window.setTimeout(() => document.body.classList.remove("loss-shake"), 760);
  scheduleFxReset(sequence, variant.startsWith("gif") ? 3600 : 2400);
}

function randomUniqueIndexes(count, max) {
  const indexes = new Set();

  while (indexes.size < count) {
    indexes.add(Math.floor(Math.random() * max));
  }

  return indexes;
}

function readMineCount() {
  const count = Math.floor(Number(minesCountInput.value));
  const safeCount = Number.isFinite(count) ? count : 3;
  const clampedCount = clamp(safeCount, MINES_MIN_COUNT, MINES_MAX_COUNT);

  minesCountInput.value = String(clampedCount);
  return clampedCount;
}

function getMinesMultiplier(safePicks, mineCount = minesRound.mineCount) {
  let multiplier = 1;

  for (let pick = 0; pick < safePicks; pick += 1) {
    const remainingTiles = MINES_GRID_SIZE - pick;
    const remainingSafeTiles = MINES_GRID_SIZE - mineCount - pick;
    const fairStep = remainingTiles / remainingSafeTiles;

    multiplier *= 1 + (fairStep - 1) * MINES_REWARD_FACTOR;
  }

  return multiplier;
}

function updateMinesReadout() {
  const multiplier = getMinesMultiplier(minesRound.safePicks);
  const mineCount = minesRound.active ? minesRound.mineCount : readMineCount();

  minesHeading.textContent = `${mineCount} hidden mine${mineCount === 1 ? "" : "s"}`;
  minesSafeCount.textContent = String(minesRound.safePicks);
  minesMultiplier.textContent = `${multiplier.toFixed(2)}x`;
  minesPayout.textContent = formatUsd(minesRound.bet * multiplier);
}

function createMinesBoard() {
  minesBoard.innerHTML = "";

  for (let index = 0; index < MINES_GRID_SIZE; index += 1) {
    const tile = document.createElement("button");
    tile.className = "mine-tile";
    tile.type = "button";
    tile.dataset.index = String(index);
    tile.setAttribute("aria-label", `Tile ${index + 1}`);
    tile.addEventListener("click", () => pickMinesTile(index, tile));
    minesBoard.append(tile);
  }
}

function startMinesRound() {
  const bet = readBet(minesBetInput);
  const mineCount = readMineCount();

  if (!canAffordBet(bet)) {
    setMessage(minesMessage, "Enter a bet you can afford with your balance.", "loss");
    return;
  }

  updateBalance(balance - bet);
  minesRound = {
    active: true,
    bet,
    mineCount,
    safePicks: 0,
    mineIndexes: randomUniqueIndexes(mineCount, MINES_GRID_SIZE),
    revealedIndexes: new Set(),
  };

  createMinesBoard();
  updateMinesReadout();
  minesCashoutButton.disabled = true;
  minesStartButton.disabled = true;
  minesCountInput.disabled = true;
  setMessage(minesMessage, `Round started. ${mineCount} mine${mineCount === 1 ? " is" : "s are"} hidden. More mines raise the payout faster.`, "");
}

function revealMines(hitIndex = null) {
  document.querySelectorAll(".mine-tile").forEach((tile) => {
    const index = Number(tile.dataset.index);
    tile.disabled = true;

    if (minesRound.mineIndexes.has(index)) {
      tile.classList.add("mine");
      tile.textContent = "💣";
    } else if (minesRound.revealedIndexes.has(index)) {
      tile.classList.add("safe");
      tile.textContent = "💎";
    }

    if (index === hitIndex) {
      tile.classList.add("hit");
    }
  });
}

function endMinesRound() {
  minesRound.active = false;
  minesStartButton.disabled = false;
  minesCashoutButton.disabled = true;
  minesCountInput.disabled = false;
}

function pickMinesTile(index, tile) {
  if (!minesRound.active || minesRound.revealedIndexes.has(index)) {
    return;
  }

  if (minesRound.mineIndexes.has(index)) {
    revealMines(index);
    endMinesRound();
    updateMinesReadout();
    triggerLossEffects("mines");
    setMessage(minesMessage, `Mine hit. You lost ${formatUsd(minesRound.bet)}.`, "loss");
    return;
  }

  minesRound.revealedIndexes.add(index);
  minesRound.safePicks += 1;
  tile.classList.add("safe", "revealed");
  tile.textContent = "💎";
  tile.disabled = true;
  minesCashoutButton.disabled = false;
  updateMinesReadout();
  setMessage(minesMessage, "Safe tile. Cash out now or keep picking for a larger multiplier.", "win");
}

function cashOutMines() {
  if (!minesRound.active || minesRound.safePicks === 0) {
    return;
  }

  const multiplier = getMinesMultiplier(minesRound.safePicks);
  const payout = minesRound.bet * multiplier;
  updateBalance(balance + payout);
  revealMines();
  endMinesRound();
  triggerWinEffects("mines");
  setMessage(minesMessage, `Cashed out at ${multiplier.toFixed(2)}x for ${formatUsd(payout)}.`, "win");
}

function setRouletteReelOffset(offset, animate = true) {
  rouletteWheel.style.transition = animate ? "" : "none";
  rouletteReelOffset = offset;
  rouletteWheel.style.transform = `translateX(${rouletteReelOffset}px)`;

  if (!animate) {
    void rouletteWheel.offsetHeight;
    rouletteWheel.style.transition = "";
  }
}

function getRouletteOffset(loop, slotIndex) {
  return -((loop * ROULETTE_SLOTS.length + slotIndex) * ROULETTE_SEGMENT_WIDTH + ROULETTE_SEGMENT_WIDTH / 2);
}

function createRouletteBoard() {
  rouletteWheel.innerHTML = "";

  Array.from({ length: ROULETTE_RENDER_LOOPS }).forEach(() => {
    ROULETTE_SLOTS.forEach((color) => {
      const slot = document.createElement("span");

      slot.className = `roulette-slot ${color}`;
      rouletteWheel.append(slot);
    });
  });

  setRouletteReelOffset(getRouletteOffset(ROULETTE_RESET_LOOP, 0), false);
}

function setRouletteChoice(choice) {
  rouletteChoice = choice;
  rouletteChoiceLabel.textContent = choice[0].toUpperCase() + choice.slice(1);
  rouletteChoiceButtons.forEach((button) => {
    button.classList.toggle("selected", button.dataset.rouletteChoice === choice);
  });
}

function getRouletteResult() {
  const index = Math.floor(Math.random() * ROULETTE_SLOTS.length);
  return {
    color: ROULETTE_SLOTS[index],
    index,
  };
}

function spinRoulette() {
  const bet = readBet(rouletteBetInput);

  if (rouletteSpinning) {
    return;
  }

  if (!canAffordBet(bet)) {
    setMessage(rouletteMessage, "Enter a bet you can afford with your balance.", "loss");
    return;
  }

  rouletteSpinning = true;
  rouletteSpinButton.disabled = true;
  updateBalance(balance - bet);
  rouletteResult.textContent = "?";
  setMessage(rouletteMessage, "Reel spinning...", "");

  const result = getRouletteResult();
  const targetLoop = ROULETTE_RESET_LOOP + 5 + Math.floor(Math.random() * 3);

  setRouletteReelOffset(getRouletteOffset(targetLoop, result.index));

  window.setTimeout(() => {
    const won = result.color === rouletteChoice;
    const payout = won ? bet * ROULETTE_PAYOUTS[result.color] : 0;

    rouletteResult.textContent = result.color === "green" ? "0" : result.color[0].toUpperCase();
    rouletteResult.dataset.result = result.color;

    if (won) {
      updateBalance(balance + payout);
      triggerWinEffects("roulette");
      setMessage(rouletteMessage, `${result.color.toUpperCase()} hit. You won ${formatUsd(payout)}.`, "win");
    } else {
      triggerLossEffects("roulette");
      setMessage(rouletteMessage, `${result.color.toUpperCase()} hit. You lost ${formatUsd(bet)}.`, "loss");
    }

    setRouletteReelOffset(getRouletteOffset(ROULETTE_RESET_LOOP, result.index), false);
    rouletteSpinning = false;
    rouletteSpinButton.disabled = false;
  }, 2700);
}

function getRocketCrashMultiplier() {
  return Number((1.25 + Math.random() * 3.25).toFixed(2));
}

function updateRocketVisuals(status = "") {
  const multiplier = rocketRound.multiplier;
  const progress = Math.min((multiplier - 1) / 3.4, 1);
  const x = 8 + progress * 74;
  const y = 78 - progress * 52;
  const payout = rocketRound.bet * multiplier;

  rocketLive.textContent = `${multiplier.toFixed(2)}x`;
  rocketPanelMultiplier.textContent = `${multiplier.toFixed(2)}x`;
  rocketWinPreview.textContent = formatUsd(payout);
  rocketShip.style.left = `${x}%`;
  rocketShip.style.top = `${y}%`;
  rocketPath.style.width = `${Math.max(8, progress * 70)}%`;
  rocketShip.classList.toggle("crashed", status === "crashed");
  rocketShip.classList.toggle("boosted", multiplier >= 2);
  rocketShip.classList.toggle("hyperspeed", multiplier >= 3);
  rocketPath.classList.toggle("hyperspeed", multiplier >= 3);
}

function resetRocketVisuals() {
  rocketRound.multiplier = 1;
  rocketRound.elapsedTicks = 0;
  updateRocketVisuals();
  rocketShip.classList.remove("crashed");
}

function endRocketRound() {
  window.clearInterval(rocketRound.timerId);
  rocketRound.active = false;
  rocketRound.timerId = null;
  rocketStartButton.disabled = false;
  rocketCashoutButton.disabled = true;
}

function startRocketRound() {
  const bet = readBet(rocketBetInput);

  if (rocketRound.active) {
    return;
  }

  if (!canAffordBet(bet)) {
    setMessage(rocketMessage, "Enter a bet you can afford with your balance.", "loss");
    return;
  }

  updateBalance(balance - bet);
  rocketRound = {
    active: true,
    bet,
    multiplier: 1,
    crashAt: getRocketCrashMultiplier(),
    elapsedTicks: 0,
    timerId: null,
  };

  rocketStartButton.disabled = true;
  rocketCashoutButton.disabled = false;
  setMessage(rocketMessage, "Rocket launched. Cash out before the hidden crash point.", "");
  updateRocketVisuals();

  rocketRound.timerId = window.setInterval(() => {
    rocketRound.elapsedTicks += 1;
    rocketRound.multiplier = Number((1 + rocketRound.elapsedTicks * 0.05).toFixed(2));
    updateRocketVisuals();

    if (rocketRound.multiplier >= rocketRound.crashAt) {
      updateRocketVisuals("crashed");
      triggerLossEffects("rocket");
      setMessage(rocketMessage, `Rocket crashed at ${rocketRound.crashAt.toFixed(2)}x. You lost ${formatUsd(rocketRound.bet)}.`, "loss");
      endRocketRound();
    }
  }, ROCKET_TICK_MS);
}

function cashOutRocket() {
  if (!rocketRound.active) {
    return;
  }

  const payout = rocketRound.bet * rocketRound.multiplier;
  updateBalance(balance + payout);
  triggerWinEffects("rocket");
  setMessage(rocketMessage, `Cashed out at ${rocketRound.multiplier.toFixed(2)}x for ${formatUsd(payout)}.`, "win");
  endRocketRound();
}

function createPlinkoBoard() {
  plinkoPegs.innerHTML = "";
  plinkoBuckets.innerHTML = "";
  plinkoPegPositions = [];
  const profile = PLINKO_PROFILES[plinkoDifficulty];

  for (let row = 0; row < PLINKO_ROWS; row += 1) {
    for (let col = 0; col <= row; col += 1) {
      const peg = document.createElement("span");
      const x = 50 + (col - row / 2) * 6.7;
      const y = 8 + row * 6.4;

      peg.className = "plinko-peg";
      peg.style.left = `${x}%`;
      peg.style.top = `${y}%`;
      plinkoPegs.append(peg);
      plinkoPegPositions.push({ element: peg, x, y });
    }
  }

  profile.buckets.forEach((multiplier) => {
    const bucket = document.createElement("span");
    bucket.className = multiplier > 2 ? "hot" : multiplier < 1 ? "low" : "";
    bucket.textContent = `${multiplier}x`;
    plinkoBuckets.append(bucket);
  });
}

function getPlinkoBucketIndex() {
  const weights = PLINKO_PROFILES[plinkoDifficulty].weights;
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let roll = Math.random() * totalWeight;

  for (let index = 0; index < weights.length; index += 1) {
    roll -= weights[index];

    if (roll <= 0) {
      return index;
    }
  }

  return Math.floor(PLINKO_PROFILES[plinkoDifficulty].buckets.length / 2);
}

function getPlinkoBucketCenter(bucketIndex) {
  return PLINKO_BUCKET_LEFT + ((bucketIndex + 0.5) / PLINKO_PROFILES[plinkoDifficulty].buckets.length) * PLINKO_BUCKET_WIDTH;
}

function getPlinkoBucketFromX(x) {
  const normalized = (x - PLINKO_BUCKET_LEFT) / PLINKO_BUCKET_WIDTH;
  const bucketIndex = Math.floor(normalized * PLINKO_PROFILES[plinkoDifficulty].buckets.length);

  return clamp(bucketIndex, 0, PLINKO_PROFILES[plinkoDifficulty].buckets.length - 1);
}

function movePlinkoBall(ball, bucketIndex, onComplete) {
  const targetX = getPlinkoBucketCenter(bucketIndex);
  const state = {
    x: 50 + (Math.random() - 0.5) * 2,
    y: 5,
    vx: (Math.random() - 0.5) * 0.08,
    vy: 0,
    radius: 1.35,
    lastTime: performance.now(),
    settled: false,
  };

  function animate(now) {
    const rawDelta = Math.min((now - state.lastTime) / 16.67, 2);
    const delta = Number.isFinite(rawDelta) ? rawDelta : 1;
    const drift = (targetX - state.x) * 0.00022;
    const centerGravity = (50 - state.x) * 0.0012;
    const railForce = state.x < 11 ? (11 - state.x) * 0.0032 : state.x > 89 ? (89 - state.x) * 0.0032 : 0;

    state.lastTime = now;
    state.vy += 0.048 * delta;
    state.vx += (drift + centerGravity + railForce) * delta;
    state.vx = clamp(state.vx * 0.988, -0.72, 0.72);
    state.vy = clamp(state.vy, -0.95, 1.55);
    state.x += state.vx * delta;
    state.y += state.vy * delta;

    if (state.x < 5) {
      state.x = 5;
      state.vx = Math.abs(state.vx) * 0.46;
      state.vy *= 0.94;
    }

    if (state.x > 95) {
      state.x = 95;
      state.vx = -Math.abs(state.vx) * 0.46;
      state.vy *= 0.94;
    }

    plinkoPegPositions.forEach((peg) => {
      const dx = state.x - peg.x;
      const dy = state.y - peg.y;
      const distance = Math.hypot(dx, dy);
      const minDistance = state.radius + 1.15;

      if (distance === 0 || distance >= minDistance) {
        return;
      }

      const nx = dx / distance;
      const ny = dy / distance;
      const velocityAlongNormal = state.vx * nx + state.vy * ny;

      if (velocityAlongNormal > 0) {
        return;
      }

      const overlap = minDistance - distance;
      const randomness = (Math.random() - 0.5) * 0.04;

      state.x += nx * overlap;
      state.y += ny * overlap;
      state.vx -= (1.72 * velocityAlongNormal * nx);
      state.vy -= (1.72 * velocityAlongNormal * ny);
      state.vx = clamp(state.vx * 0.78 + randomness, -0.7, 0.7);
      state.vy = clamp(state.vy * 0.82, -0.9, 1.45);
      peg.element.classList.remove("hit");
      void peg.element.offsetWidth;
      peg.element.classList.add("hit");
      ball.classList.remove("bounce");
      void ball.offsetWidth;
      ball.classList.add("bounce");
    });

    if (state.y > 88) {
      state.vx = clamp(state.vx + (targetX - state.x) * 0.0012 * delta + (50 - state.x) * 0.0018 * delta, -0.5, 0.5);
    }

    ball.style.left = `${state.x}%`;
    ball.style.top = `${state.y}%`;

    if (state.y >= 93 && !state.settled) {
      const landedBucketIndex = getPlinkoBucketFromX(state.x);
      const landedX = getPlinkoBucketCenter(landedBucketIndex);

      state.settled = true;
      ball.style.left = `${landedX}%`;
      ball.style.top = "91%";
      onComplete(landedBucketIndex);
      return;
    }

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

function dropPlinkoChip() {
  const bet = readBet(plinkoBetInput);

  if (activePlinkoBalls >= PLINKO_MAX_BALLS) {
    setMessage(plinkoMessage, "Too many balls are already dropping. Wait for one to land.", "");
    return;
  }

  if (!canAffordBet(bet)) {
    setMessage(plinkoMessage, "Enter a bet you can afford with your balance.", "loss");
    return;
  }

  const bucketIndex = getPlinkoBucketIndex();
  const ball = document.createElement("span");

  activePlinkoBalls += 1;
  updateBalance(balance - bet);
  ball.className = "plinko-ball";
  plinkoBalls.append(ball);
  setMessage(plinkoMessage, `${activePlinkoBalls} ball${activePlinkoBalls === 1 ? "" : "s"} dropping...`, "");

  movePlinkoBall(ball, bucketIndex, (landedBucketIndex) => {
    const multiplier = PLINKO_PROFILES[plinkoDifficulty].buckets[landedBucketIndex];
    const payout = bet * multiplier;

    updateBalance(balance + payout);
    plinkoLast.textContent = `${multiplier}x`;
    ball.classList.add("landed");
    const bucket = plinkoBuckets.children[landedBucketIndex];

    if (bucket) {
      bucket.classList.remove("hit");
      void bucket.offsetWidth;
      bucket.classList.add("hit");
    }
    window.setTimeout(() => ball.remove(), 120);

    if (payout > bet) {
      triggerWinEffects("plinko");
      setMessage(plinkoMessage, `Landed on ${multiplier}x. You won ${formatUsd(payout)}.`, "win");
    } else {
      if (payout < bet) {
        triggerLossEffects("plinko");
      }
      setMessage(plinkoMessage, `Landed on ${multiplier}x for ${formatUsd(payout)}.`, payout === bet ? "" : "loss");
    }

    activePlinkoBalls -= 1;
  });
}

function setPlinkoDifficulty(difficulty) {
  if (activePlinkoBalls > 0) {
    setMessage(plinkoMessage, "Wait for active balls to land before changing difficulty.", "");
    return;
  }

  plinkoDifficulty = difficulty;
  plinkoDifficultyButtons.forEach((button) => {
    button.classList.toggle("selected", button.dataset.plinkoDifficulty === difficulty);
  });
  plinkoLast.textContent = "-";
  createPlinkoBoard();
}

function getTowersMultiplier(level) {
  return Math.pow(TOWERS_MODES[towersDifficulty].multiplier, level);
}

function updateTowersReadout() {
  const payout = towersRound.bet * getTowersMultiplier(towersRound.level);

  towersLevel.textContent = String(towersRound.level);
  towersPayout.textContent = formatUsd(payout);
}

function createTowersBoard() {
  towersBoard.innerHTML = "";
  towersBoard.style.setProperty("--tower-columns", String(TOWERS_MODES[towersDifficulty].columns));

  for (let row = TOWERS_ROWS - 1; row >= 0; row -= 1) {
    for (let col = 0; col < TOWERS_MODES[towersDifficulty].columns; col += 1) {
      const tile = document.createElement("button");
      tile.className = "tower-tile";
      tile.type = "button";
      tile.dataset.row = String(row);
      tile.dataset.col = String(col);
      tile.textContent = "🟦";
      tile.addEventListener("click", () => pickTowerTile(row, col, tile));
      towersBoard.append(tile);
    }
  }
}

function setTowersDifficulty(difficulty) {
  if (towersRound.active) {
    return;
  }

  towersDifficulty = difficulty;
  towersDifficultyButtons.forEach((button) => {
    button.classList.toggle("selected", button.dataset.towersDifficulty === difficulty);
  });
  createTowersBoard();
  updateTowersReadout();
}

function startTowersRound() {
  const bet = readBet(towersBetInput);

  if (!canAffordBet(bet)) {
    setMessage(towersMessage, "Enter a bet you can afford with your balance.", "loss");
    return;
  }

  updateBalance(balance - bet);
  towersRound = {
    active: true,
    bet,
    level: 0,
    badColumns: Array.from({ length: TOWERS_ROWS }, () => randomUniqueIndexes(TOWERS_MODES[towersDifficulty].badPicks, TOWERS_MODES[towersDifficulty].columns)),
  };

  createTowersBoard();
  updateTowersReadout();
  towersStartButton.disabled = true;
  towersCashoutButton.disabled = true;
  towersDifficultyButtons.forEach((button) => {
    button.disabled = true;
  });
  setMessage(towersMessage, `Tower started. ${TOWERS_MODES[towersDifficulty].badPicks} bad pick${TOWERS_MODES[towersDifficulty].badPicks === 1 ? "" : "s"} per row.`, "");
  markActiveTowerRow();
}

function markActiveTowerRow() {
  document.querySelectorAll(".tower-tile").forEach((tile) => {
    const row = Number(tile.dataset.row);
    tile.classList.toggle("active-row", towersRound.active && row === towersRound.level);
    tile.disabled = !towersRound.active || row !== towersRound.level;
  });
}

function revealTowerRound(hitTile = null) {
  document.querySelectorAll(".tower-tile").forEach((tile) => {
    const row = Number(tile.dataset.row);
    const col = Number(tile.dataset.col);
    tile.disabled = true;

    if (towersRound.badColumns[row].has(col)) {
      tile.classList.add("miss");
      tile.textContent = "💥";
    } else {
      tile.classList.add("safe");
      tile.textContent = "💎";
    }

    if (tile === hitTile) {
      tile.classList.add("hit");
    }
  });
}

function endTowersRound() {
  towersRound.active = false;
  towersStartButton.disabled = false;
  towersCashoutButton.disabled = true;
  towersDifficultyButtons.forEach((button) => {
    button.disabled = false;
  });
}

function pickTowerTile(row, col, tile) {
  if (!towersRound.active || row !== towersRound.level) {
    return;
  }

  if (towersRound.badColumns[row].has(col)) {
    tile.classList.add("miss");
    tile.textContent = "💥";
    revealTowerRound(tile);
    endTowersRound();
    triggerLossEffects("towers");
    setMessage(towersMessage, `Missed tile. You lost ${formatUsd(towersRound.bet)}.`, "loss");
    return;
  }

  tile.classList.add("safe");
  tile.textContent = "💎";
  towersRound.level += 1;
  towersCashoutButton.disabled = false;
  updateTowersReadout();

  if (towersRound.level >= TOWERS_ROWS) {
    cashOutTowers();
    return;
  }

  setMessage(towersMessage, "Safe pick. Climb again or cash out.", "win");
  markActiveTowerRow();
}

function cashOutTowers() {
  if (!towersRound.active || towersRound.level === 0) {
    return;
  }

  const multiplier = getTowersMultiplier(towersRound.level);
  const payout = towersRound.bet * multiplier;
  updateBalance(balance + payout);
  revealTowerRound();
  endTowersRound();
  triggerWinEffects("towers");
  setMessage(towersMessage, `Cashed out at ${multiplier.toFixed(2)}x for ${formatUsd(payout)}.`, "win");
}

updateBalance(STARTING_BALANCE);
createMinesBoard();
createRouletteBoard();
createPlinkoBoard();
createTowersBoard();
updateMinesReadout();
resetRocketVisuals();
updateTowersReadout();

screenButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    showScreen(button.dataset.screen);
  });
});

[
  minesBetInput,
  rouletteBetInput,
  rocketBetInput,
  plinkoBetInput,
  towersBetInput,
].forEach((input) => {
  input.addEventListener("input", () => {
    clampBetInputToBalance(input);
  });
});

minesStartButton.addEventListener("click", startMinesRound);
minesCashoutButton.addEventListener("click", cashOutMines);
minesBetInput.addEventListener("input", updateMinesReadout);
minesCountInput.addEventListener("input", updateMinesReadout);

rouletteChoiceButtons.forEach((button) => {
  button.addEventListener("click", () => setRouletteChoice(button.dataset.rouletteChoice));
});
rouletteSpinButton.addEventListener("click", spinRoulette);

rocketStartButton.addEventListener("click", startRocketRound);
rocketCashoutButton.addEventListener("click", cashOutRocket);

plinkoDropButton.addEventListener("click", dropPlinkoChip);
plinkoDifficultyButtons.forEach((button) => {
  button.addEventListener("click", () => setPlinkoDifficulty(button.dataset.plinkoDifficulty));
});

towersStartButton.addEventListener("click", startTowersRound);
towersCashoutButton.addEventListener("click", cashOutTowers);
towersDifficultyButtons.forEach((button) => {
  button.addEventListener("click", () => setTowersDifficulty(button.dataset.towersDifficulty));
});
