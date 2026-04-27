import React, { useState, useEffect, useRef } from "react";

// ── Design tokens ──────────────────────────────────────────────────────────────
const THEMES = {
  dark: {
    bg:       "#080808",
    surface:  "#111111",
    surface2: "#181818",
    border:   "#242424",
    border2:  "#2e2e2e",
    green:    "#A855F7",
    greenDim: "#A855F722",
    greenMid: "#A855F744",
    gradStart: "#EDD9FF",
    gradEnd:   "#8B3FF5",
    grad:      "linear-gradient(90deg, #EDD9FF, #8B3FF5)",
    text:     "#F2F2F2",
    textSub:  "#A0A0A0",
    textDim:  "#505050",
    red:      "#FF4D6A",
    amber:    "#FFB347",
    blue:     "#4A9EFF",
    inputBg:  "transparent",
    selectBg: "transparent",
    dotGrid:  "#242424",
  },
  light: {
    bg:       "#F4F5F7",
    surface:  "#FFFFFF",
    surface2: "#ECEEF2",
    border:   "#E0E3EA",
    border2:  "#CDD1DA",
    green:    "#7C3AED",
    greenDim: "#7C3AED18",
    greenMid: "#7C3AED35",
    gradStart: "#C084FC",
    gradEnd:   "#6B32E4",
    grad:      "linear-gradient(90deg, #C084FC, #6B32E4)",
    text:     "#0D0F14",
    textSub:  "#4A5068",
    textDim:  "#8892AA",
    red:      "#E8334A",
    amber:    "#D07A00",
    blue:     "#1A6FE0",
    inputBg:  "#FFFFFF",
    selectBg: "#FFFFFF",
    dotGrid:  "#D8DCE6",
  },
};

// C is a mutable ref updated by the theme — components use C directly
let C = THEMES.dark;

// ── Chain registry ─────────────────────────────────────────────────────────────
const CHAINS = {
  1:      { name: "Ethereum",    short: "ETH",   color: "#627EEA", explorer: "https://etherscan.io/tx/",            logo: "/chains/ethereum.svg" },
  42161:  { name: "Arbitrum",    short: "ARB",   color: "#28A0F0", explorer: "https://arbiscan.io/tx/",             logo: "/chains/arbitrum-one.svg" },
  8453:   { name: "Base",        short: "BASE",  color: "#3B82F6", explorer: "https://basescan.org/tx/",            logo: "/chains/base.svg" },
  10:     { name: "Optimism",    short: "OP",    color: "#FF4D6A", explorer: "https://optimistic.etherscan.io/tx/", logo: "/chains/op-mainnet.svg" },
  137:    { name: "Polygon",     short: "POL",   color: "#A855F7", explorer: "https://polygonscan.com/tx/",         logo: "/chains/polygon.svg" },
  43114:  { name: "Avalanche",   short: "AVAX",  color: "#EF4444", explorer: "https://snowtrace.io/tx/",            logo: "/chains/avalanche.svg" },
  56:     { name: "BNB Chain",   short: "BNB",   color: "#EAB308", explorer: "https://bscscan.com/tx/",             logo: "/chains/bnb-smart-chain.svg" },
  534352: { name: "Scroll",      short: "SCR",   color: "#E8AA6A", explorer: "https://scrollscan.com/tx/",          logo: "/chains/scroll.svg" },
  59144:  { name: "Linea",       short: "LNA",   color: "#61DFFF", explorer: "https://lineascan.build/tx/",         logo: "/chains/linea-mainnet.svg" },
  5000:   { name: "Mantle",      short: "MNT",   color: "#00C3A0", explorer: "https://explorer.mantle.xyz/tx/",    logo: "/chains/mantle.svg" },
  34443:  { name: "Mode",        short: "MODE",  color: "#CCFF00", explorer: "https://modescan.io/tx/",             logo: "/chains/mode.svg" },
  146:    { name: "Sonic",       short: "SON",   color: "#FF6B35", explorer: "https://sonicscan.org/tx/",           logo: "/chains/sonic.svg" },
  130:    { name: "Unichain",    short: "UNI",   color: "#FC72FF", explorer: "https://uniscan.xyz/tx/",             logo: "/chains/unichain.svg" },
  480:    { name: "World Chain", short: "WLD",   color: "#60A5FA", explorer: "https://worldscan.org/tx/",           logo: "/chains/worldchain.svg" },
  2741:   { name: "Abstract",    short: "ABS",   color: "#C084FC", explorer: "https://abscan.org/tx/",              logo: "/chains/abstract.svg" },
  80094:  { name: "Berachain",   short: "BERA",  color: "#FB923C", explorer: "https://berascan.com/tx/",            logo: "/chains/berachain.svg" },
  999:    { name: "HyperEVM",    short: "HYPE",  color: "#34D399", explorer: "https://hyperevmscan.io/tx/",         logo: "/chains/hyperevm.svg" },
  57073:  { name: "Ink",         short: "INK",   color: "#F472B6", explorer: "https://inkscan.xyz/tx/",             logo: "/chains/ink.svg" },
  143:    { name: "Monad",       short: "MON",   color: "#818CF8", explorer: "https://monadexplorer.com/tx/",       logo: "/chains/monad.svg" },
  9745:   { name: "Plasma",      short: "PLS",   color: "#6EE7B7", explorer: "https://plasmascan.to/tx/",          logo: "/chains/plasma.svg" },
  4217:   { name: "Tempo",       short: "TMP",   color: "#000000", explorer: "https://explore.tempo.xyz/tx/",      logo: "/chains/tempo.svg" },
  // SVM
  999999999991: { name: "Solana", short: "SOL", color: "#9945FF", explorer: "https://solscan.io/tx/", rpc: null, svm: true, logo: "/chains/solana.svg" },
};
const CHAIN_LIST = Object.entries(CHAINS).map(([id, c]) => ({ id: Number(id), ...c })).sort((a, b) => a.name.localeCompare(b.name));
const getChain   = (id) => CHAINS[String(id)] || null;

// ── Token helpers ──────────────────────────────────────────────────────────────
const NATIVE = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
const TOKENS  = {
  // USDC — multi-chain
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": { s: "USDC",   d: 6  }, // Ethereum
  "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913": { s: "USDC",   d: 6  }, // Base
  "0xaf88d065e77c8cc2239327c5edb3a432268e5831": { s: "USDC",   d: 6  }, // Arbitrum
  "0x0b2c639c533813f4aa9d7837caf62653d097ff85": { s: "USDC",   d: 6  }, // Optimism
  "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359": { s: "USDC",   d: 6  }, // Polygon
  "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d": { s: "USDC",   d: 18 }, // BNB
  "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e": { s: "USDC",   d: 6  }, // Avalanche
  "0x09bc4e0d864854c6afb6eb9a9cdf58ac190d0df9": { s: "USDC",   d: 6  }, // Mantle
  "0x06efdbff2a14a7c8e15944d1f4a48f9f95f663a4": { s: "USDC",   d: 6  }, // Scroll
  "0x176211869ca2b568f2a7d4ee941e073a821ee1ff": { s: "USDC",   d: 6  }, // Linea
  "0xe96c591e7e9526cc0b0b5c5f6e3e83c44b31ff1e": { s: "USDC",   d: 6  }, // Blast
  "0x754704bc059f8c67012fed69bc8a327a5aafb603": { s: "USDC",   d: 6  }, // Monad
  // USDT — multi-chain
  "0xdac17f958d2ee523a2206206994597c13d831ec7": { s: "USDT",   d: 6  }, // Ethereum
  "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9": { s: "USDT",   d: 6  }, // Arbitrum
  "0x94b008aa00579c1307b0ef2c499ad98a8ce58e58": { s: "USDT",   d: 6  }, // Optimism
  "0xc2132d05d31c914a87c6611c10748aeb04b58e8f": { s: "USDT",   d: 6  }, // Polygon
  "0x55d398326f99059ff775485246999027b3197955": { s: "USDT",   d: 18 }, // BNB
  "0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7": { s: "USDT",   d: 6  }, // Avalanche
  "0x201eba5cc46d216ce6dc03f6a759e8e766e956ae": { s: "USDT",   d: 6  }, // Mantle
  // WETH — multi-chain
  "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": { s: "WETH",   d: 18 }, // Ethereum
  "0x4200000000000000000000000000000000000006": { s: "WETH",   d: 18 }, // Base / Optimism
  "0x82af49447d8a07e3bd95bd0d56f35241523fbab1": { s: "WETH",   d: 18 }, // Arbitrum
  "0x4300000000000000000000000000000000000004": { s: "WETH",   d: 18 }, // Blast
  "0xe5d7c2a44ffddf6b295a15c148167daaaf5cf34e": { s: "WETH",   d: 18 }, // Linea
  "0x5aea5775959fbc2557cc8789bc1bf90a239d9a91": { s: "WETH",   d: 18 }, // zkSync
  "0x2170ed0880ac9a755fd29b2688956bd959f933f8": { s: "WETH",   d: 18 }, // BNB (ETH)
  // DAI
  "0x6b175474e89094c44da98b954eedeac495271d0f": { s: "DAI",    d: 18 }, // Ethereum
  "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1": { s: "DAI",    d: 18 }, // Arbitrum / Optimism
  "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063": { s: "DAI",    d: 18 }, // Polygon
  "0xd9ab5096a832b9ce79914329daee236f8eea0390": { s: "DAI",    d: 18 }, // Avalanche
  // WBTC
  "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599": { s: "WBTC",   d: 8  }, // Ethereum
  "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f": { s: "WBTC",   d: 8  }, // Arbitrum
  "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6": { s: "WBTC",   d: 8  }, // Polygon
  "0x68f180fcce6836688e9084f035309e29bf0a2095": { s: "WBTC",   d: 8  }, // Optimism
  // cbBTC (Coinbase BTC)
  "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf": { s: "cbBTC",  d: 8  }, // Ethereum
  "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf": { s: "cbBTC",  d: 8  }, // Base
  // PYUSD
  "0x6c3ea9036406852006290770bedfcaba0e23a0e8": { s: "PYUSD",  d: 6  }, // Ethereum
  "0x4685ab3204e2fdd6d3f6c7faac2d8d48a1ebf9f5": { s: "PYUSD",  d: 6  }, // Solana (wrapped)
  // stETH / wstETH
  "0xae7ab96520de3a18e5e111b5eaab095312d7fe84": { s: "stETH",  d: 18 },
  "0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0": { s: "wstETH", d: 18 }, // Ethereum
  "0x5979d7b546e38e414f7e9822514be443a4800529": { s: "wstETH", d: 18 }, // Arbitrum
  "0x1f32b1c2345538c0c6f582fcb022739c4a194ebb": { s: "wstETH", d: 18 }, // Optimism
  // LINK
  "0x514910771af9ca656af840dff83e8264ecf986ca": { s: "LINK",   d: 18 }, // Ethereum
  "0xf97f4df75117a78c1a5a0dbb814af92458539fb4": { s: "LINK",   d: 18 }, // Arbitrum
  // UNI
  "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984": { s: "UNI",    d: 18 },
  // MATIC / POL
  "0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0": { s: "POL",    d: 18 },
  "0x0000000000000000000000000000000000001010": { s: "POL",    d: 18 },
  // OP
  "0x4200000000000000000000000000000000000042": { s: "OP",     d: 18 },
  // ARB
  "0x912ce59144191c1204e64559fe8253a0e49e6548": { s: "ARB",    d: 18 },
  // AAVE
  "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9": { s: "AAVE",   d: 18 },
  // FRAX
  "0x853d955acef822db058eb8505911ed77f175b99e": { s: "FRAX",   d: 18 },
  // sUSD
  "0x57ab1ec28d129707052df4df418d58a2d46d5f51": { s: "sUSD",   d: 18 },
  // crvUSD
  "0xf939e0a03fb07f59a73314e73794be0e57ac1b4e": { s: "crvUSD", d: 18 },
  // cbETH
  "0xbe9895146f7af43049ca1c1ae358b0541ea49704": { s: "cbETH",  d: 18 },
  // rETH
  "0xae78736cd615f374d3085123a210448e74fc6393": { s: "rETH",   d: 18 },
  // ezETH
  "0xbf5495efe5db9ce00f80364c8b423567e58d2110": { s: "ezETH",  d: 18 },
  // weETH
  "0xcd5fe23c85820f7b72d0926fc9b05b43e359b7ee": { s: "weETH",  d: 18 },
  // USDS (Sky/MakerDAO)
  "0xdc035d45d973e3ec169d2276ddab16f1e407384f": { s: "USDS",   d: 18 },
  // ZRX
  "0xe41d2489571d322189246dafa5ebde1f4699f498": { s: "ZRX",    d: 18 },
  // VIRTUAL (Base)
  "0x0b3e328455c4059eeb9e3f84b5543f74e24e7e1b": { s: "VIRTUAL",d: 18 },
  // HYPE (HyperEVM native)
  "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee": { s: "ETH",    d: 18 }, // already handled by NATIVE check
  // MIM (Magic Internet Money)
  "0x99d8a9c45b2eca8864373a26d1459e3dff1e17f3": { s: "MIM",    d: 18 }, // Ethereum
  "0xfea7a6a0b346362bf88a9e4a88416b77a57d6c2a": { s: "MIM",    d: 18 }, // Arbitrum
  // PEPE
  "0x6982508145454ce325ddbe47a25d4ec3d2311933": { s: "PEPE",   d: 18 },
  // SHIB
  "0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce": { s: "SHIB",   d: 18 },
};
const NATIVE_SYMS = {
  1:"ETH", 8453:"ETH", 42161:"ETH", 10:"ETH", 534352:"ETH", 59144:"ETH",
  5000:"MNT", 34443:"ETH", 146:"S", 130:"ETH", 480:"ETH", 2741:"ETH",
  80094:"BERA", 999:"HYPE", 57073:"ETH", 10143:"MON", 9745:"ETH", 4217:"TEMPO",
  137:"POL", 43114:"AVAX", 56:"BNB",
};
const tokenSym  = (addr, chainId) => addr?.toLowerCase() === NATIVE ? (NATIVE_SYMS[chainId] || "ETH") : TOKENS[addr?.toLowerCase()]?.s || addr?.slice(0,6)+"…"+addr?.slice(-4) || "?";
const tokenDec  = (addr) => addr?.toLowerCase() === NATIVE ? 18 : TOKENS[addr?.toLowerCase()]?.d || 18;
const STABLES   = new Set(["USDC","USDT","DAI","BUSD","FRAX","LUSD","crvUSD","PYUSD"]);
const isStable  = (addr) => STABLES.has(tokenSym(addr));

// Clean up integrator/app names for display
const APP_NAME_MAP = {
  "Matcha v3": "Matcha",
  "Matcha v2": "Matcha",
  "matcha-meta-prod": "Matcha Meta",
  "matcha-meta": "Matcha Meta",
};
const cleanAppName = (name) => {
  if (!name) return null;
  return APP_NAME_MAP[name] || name;
};

const fmtAmt    = (raw, addr, decimalsOverride) => {
  if (!raw) return "—";
  const n = Number(raw) / 10 ** (decimalsOverride ?? tokenDec(addr));
  if (n === 0) return "0";
  if (n < 0.0001) return n.toExponential(3);
  if (n < 1)   return n.toFixed(4);
  if (n < 1e6) return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (n < 1e9) return (n / 1e6).toFixed(2) + "M";
  if (n < 1e12) return (n / 1e9).toFixed(2) + "B";
  return (n / 1e12).toFixed(2) + "T";
};
const fmtTime = (ts) => ts
  ? new Date(ts * 1000).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) + " UTC"
  : null;
const trunc = (h, a=10, b=8) => h?.length > a+b+3 ? `${h.slice(0,a)}…${h.slice(-b)}` : h || "";
const isSolanaHash = (h) => h && !h.startsWith("0x") && /^[1-9A-HJ-NP-Za-km-z]{80,}$/.test(h);

// ── quoteId extraction ─────────────────────────────────────────────────────────
function extractQuoteId(input) {
  if (!input || input.length < 10) return null;
  const hex = input.startsWith("0x") ? input.slice(2) : input;
  const idx  = hex.indexOf("3cdfaf67");
  if (idx === -1) return null;
  const start = idx + 8 + 64;
  if (start + 32 > hex.length) return null;
  return "0x" + hex.slice(start, start + 32);
}

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS = {
  // API statuses (from docs)
  origin_tx_pending:   { label: "Origin TX Pending",   color: C.amber, desc: "The origin transaction is pending on-chain." },
  origin_tx_succeeded: { label: "Origin TX Succeeded", color: C.amber, desc: "Included in a block, waiting for confirmations." },
  origin_tx_confirmed: { label: "Origin TX Confirmed", color: C.amber, desc: "Confirmed. Bridge processing should begin shortly." },
  origin_tx_reverted:  { label: "Origin TX Reverted",  color: C.red,   desc: "The transaction reverted. Funds remain in your origin wallet." },
  bridge_pending:      { label: "Bridge Pending",      color: C.amber, desc: "The bridge provider has received the funds and is processing." },
  bridge_filled:       { label: "Bridge Filled",       color: C.green, desc: "Funds have arrived at the destination address." },
  bridge_failed:       { label: "Bridge Failed",       color: C.red,   desc: "The bridge was unable to complete. See failure details below." },
  unknown:             { label: "Unknown",             color: C.textDim, desc: "Status unknown. Please contact 0x support." },
  // Legacy
  pending:        { label: "Pending",       color: C.amber,  desc: "" },
  submitted:      { label: "Submitted",     color: C.blue,   desc: "" },
  bridge_filling: { label: "Bridging",      color: C.blue,   desc: "" },
  completed:      { label: "Complete",      color: C.green,  desc: "" },
  failed:         { label: "Failed",        color: C.red,    desc: "" },
  reverted:       { label: "Reverted",      color: C.red,    desc: "" },
};
const getStatus = (s) => STATUS[s] || { label: s?.replace(/_/g," ") || "Unknown", color: C.textDim, desc: "" };

// ── Input detection ────────────────────────────────────────────────────────────
const detectInput = (v) => {
  const s = v.trim();
  if (/^0x[0-9a-fA-F]{64}$/.test(s)) return "txhash";
  if (/^0x[0-9a-fA-F]{40}$/.test(s)) return "address";
  if (/^[1-9A-HJ-NP-Za-km-z]{80,100}$/.test(s)) return "svm_txhash";
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s)) return "svm_address";
  if (/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.eth$/i.test(s)) return "ens";
  if (s.length > 4) return "partial";
  return "empty";
};

// ── Loading messages ───────────────────────────────────────────────────────────
const LOADING_MSGS = [
  "Tracing the route…",
  "Pinging the bridge…",
  "Reading calldata…",
  "Asking the chain nicely…",
  "Decoding the journey…",
  "Consulting the mempool…",
];

// ── Animated scan bar ──────────────────────────────────────────────────────────
function ScanBar() {
  return (
    <div style={{ position: "relative", height: 2, background: C.border, borderRadius: 2, overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: "40%", background: `linear-gradient(90deg, transparent, ${C.gradEnd}, transparent)`, animation: "scan 1.2s ease-in-out infinite" }} />
    </div>
  );
}

// ── Token link ────────────────────────────────────────────────────────────────
function TokenLink({ addr, chainId, color }) {
  const sym   = tokenSym(addr, chainId);
  const chain = getChain(chainId);
  const NATIVE = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
  const isNative = addr?.toLowerCase() === NATIVE;
  // Build token explorer URL — most explorers use /token/{addr}
  const base = chain?.explorer?.replace("/tx/", "") || "";
  const url  = (!isNative && addr && base) ? `${base}/token/${addr}` : null;

  const style = {
    color: color || chain?.color || C.textSub,
    fontFamily: "'IBM Plex Mono', monospace",
    textDecoration: url ? "underline" : "none",
    textDecorationColor: (color || chain?.color || C.textSub) + "60",
    textUnderlineOffset: "3px",
    cursor: url ? "pointer" : "default",
  };

  if (!url) return <span style={style}>{sym}</span>;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" style={style}
       onClick={e => e.stopPropagation()}>{sym} <span style={{ fontSize:"0.75em", opacity:0.6 }}>↗</span></a>
  );
}

// ── Chain tag ──────────────────────────────────────────────────────────────────
function ChainTag({ chainId, size = "sm" }) {
  const c = getChain(chainId);
  if (!c) return <span style={{ fontSize: 11, color: C.textDim, fontFamily: "monospace" }}>chain:{chainId}</span>;
  const fs      = size === "lg" ? 13 : 11;
  const pad     = size === "lg" ? "4px 10px 4px 6px" : "2px 8px 2px 5px";
  const imgSize = size === "lg" ? 16 : 13;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, background: c.color+"18", border:`1px solid ${c.color}35`, borderRadius:6, padding:pad, fontFamily:"'IBM Plex Mono', monospace", fontSize:fs, fontWeight:600, color:c.color, whiteSpace:"nowrap" }}>
      {c.logo
        ? <img src={c.logo} onError={e => { e.target.style.display="none"; e.target.nextSibling.style.display="inline-block"; }} style={{ width:imgSize, height:imgSize, borderRadius:"50%", objectFit:"cover", flexShrink:0 }} />
        : null}
      <span style={{ width:6, height:6, borderRadius:"50%", background:c.color, flexShrink:0, display: c.logo ? "none" : "inline-block" }} />
      {c.short}
    </span>
  );
}

// ── Hash link ─────────────────────────────────────────────────────────────────
function HashLink({ hash, chainId }) {
  const [copied, setCopied] = useState(false);
  const c = getChain(chainId);
  const isSVM = isSolanaHash(hash);
  const explorerUrl = isSVM
    ? `https://solscan.io/tx/${hash}`
    : c ? `${c.explorer}${hash}` : null;
  const explorerLabel = isSVM ? "↗ solscan" : "↗";
  const explorerColor = isSVM ? "#9945FF" : C.textDim;
  const explorerBorder = isSVM ? "#9945FF35" : C.border2;
  const copy = () => { navigator.clipboard.writeText(hash); setCopied(true); setTimeout(()=>setCopied(false),1600); };
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
      <span style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:12, color:C.blue, letterSpacing:"0.01em" }} title={hash}>{trunc(hash, isSVM ? 8 : 10, isSVM ? 6 : 8)}</span>
      <button onClick={copy} style={{ background:"none", border:`1px solid ${C.border2}`, borderRadius:4, cursor:"pointer", fontSize:9, color:copied?C.green:C.textDim, padding:"2px 7px", fontFamily:"'IBM Plex Mono', monospace", letterSpacing:"0.05em", transition:"all 0.15s", flexShrink:0 }}>
        {copied?"COPIED":"COPY"}
      </button>
      {explorerUrl && (
        <a href={explorerUrl} target="_blank" rel="noopener noreferrer"
          style={{ fontSize:10, color:explorerColor, border:`1px solid ${explorerBorder}`, borderRadius:4, padding:"2px 8px", textDecoration:"none", fontFamily:"'IBM Plex Mono', monospace", transition:"all 0.15s", flexShrink:0 }}
          onMouseEnter={e=>{e.target.style.color=C.green;e.target.style.borderColor=C.greenMid;}}
          onMouseLeave={e=>{e.target.style.color=explorerColor;e.target.style.borderColor=explorerBorder;}}
        >{explorerLabel}</a>
      )}
    </div>
  );
}

// ── Address copy button ──────────────────────────────────────────────────────
function AddressCopyButton({ address }) {
  const [copied, setCopied] = useState(false);
  const copy = (e) => { e.preventDefault(); e.stopPropagation(); navigator.clipboard.writeText(address); setCopied(true); setTimeout(()=>setCopied(false),1600); };
  return (
    <button onClick={copy} style={{ background:"none", border:`1px solid ${C.border2}`, borderRadius:4, cursor:"pointer", fontSize:9, color:copied?C.green:C.textDim, padding:"2px 7px", fontFamily:"'IBM Plex Mono', monospace", letterSpacing:"0.05em", transition:"all 0.15s", flexShrink:0 }}>
      {copied?"COPIED":"COPY"}
    </button>
  );
}

// ── Journey step card ─────────────────────────────────────────────────────────
function StepCard({ step, idx, isLast, globalStatus, tokenCache = {} }) {
  const isSwap   = step.type === "swap";
  const srcId    = step.transactions?.[0]?.chainId;
  const dstId    = step.destinationChainId || step.transactions?.[step.transactions.length-1]?.chainId;
  const srcChain = getChain(srcId);
  const dstChain = getChain(dstId);
  const getCached = (addr, chainId) => {
    const key = addr?.toLowerCase() + "_" + chainId;
    return tokenCache[key] || TOKENS[addr?.toLowerCase()];
  };
  const sellSym  = getCached(step.sellToken, srcId)?.s || tokenSym(step.sellToken, srcId);
  const buySym   = getCached(step.buyToken, dstId || srcId)?.s || tokenSym(step.buyToken, dstId || srcId);
  const sellDec  = getCached(step.sellToken, srcId)?.d;
  const buyDec   = getCached(step.buyToken, dstId || srcId)?.d;
  const sellStable = STABLES.has(sellSym);
  const buyStable  = STABLES.has(buySym);
  const sellAmt  = (sellStable ? "$" : "") + fmtAmt(step.sellAmount, step.sellToken, sellDec);
  const buyAmt   = (buyStable  ? "$" : "") + fmtAmt(step.settledBuyAmount || step.quotedBuyAmount, step.buyToken, buyDec);
  const ts       = step.transactions?.[0]?.timestamp;
  const accentColor = isSwap ? C.blue : C.green;

  return (
    <div style={{ display:"flex", gap:0 }}>
      {/* Timeline spine */}
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", width:32, flexShrink:0, paddingTop:16 }}>
        <div style={{ width:12, height:12, borderRadius:"50%", border:`2px solid ${accentColor}`, background: C.bg, zIndex:1, boxShadow:`0 0 8px ${accentColor}60` }} />
        {!isLast && <div style={{ width:1, flex:1, background:`linear-gradient(180deg, ${accentColor}60, ${C.border})`, marginTop:4, minHeight:40 }} />}
      </div>

      {/* Card */}
      <div style={{ flex:1, marginBottom: isLast?0:12, background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden", animation:`fadeUp 0.35s ease-out ${idx*0.08}s both` }}>
        {/* Header */}
        <div style={{ padding:"12px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:10, fontWeight:700, letterSpacing:"0.1em", color:accentColor, background: accentColor+"18", border:`1px solid ${accentColor}35`, borderRadius:4, padding:"2px 8px" }}>
              {isSwap ? "SWAP" : "BRIDGE"}
            </span>
            {!isSwap && step.bridge && (
              <span style={{ fontSize:11, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace" }}>via {step.bridge.replace(/_/g," ")}</span>
            )}
          </div>
          {ts && <span style={{ fontSize:11, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace" }}>{fmtTime(ts)}</span>}
        </div>

        {/* Token flow */}
        <div style={{ padding:"16px", display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
            <span style={{ fontSize:10, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace", letterSpacing:"0.08em" }}>SEND</span>
            <div style={{ display:"flex", alignItems:"center", gap:7 }}>
              <ChainTag chainId={srcId} />
              <span style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:15, fontWeight:700, color:C.text }}>{sellAmt} <TokenLink addr={step.sellToken} chainId={srcId} /></span>
            </div>
          </div>

          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, paddingTop:18 }}>
            <span style={{ color: C.border2, fontSize:18 }}>→</span>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
            <span style={{ fontSize:10, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace", letterSpacing:"0.08em" }}>RECEIVE</span>
            <div style={{ display:"flex", alignItems:"center", gap:7 }}>
              {dstId && dstId !== srcId && <ChainTag chainId={dstId} />}
              <span style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:15, fontWeight:700, color:C.text }}>{buyAmt} <TokenLink addr={step.buyToken} chainId={dstId || srcId} /></span>
            </div>
          </div>
        </div>

        {/* Tx hashes */}
        {step.transactions?.length > 0 && (
          <div style={{ padding:"10px 16px 14px", borderTop:`1px solid ${C.border}`, display:"flex", flexDirection:"column", gap:7 }}>
            {step.transactions.map((tx, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:9, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace", minWidth:60, letterSpacing:"0.06em" }}>{i===0?"SOURCE":"DESTINATION"}</span>
                <HashLink hash={tx.txHash} chainId={tx.chainId} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────

// ── Wallet History ─────────────────────────────────────────────────────────────
function WalletHistory({ data, walletAddr, loading, cursor, onLoadMore, onTrace, onFilter, activeFilters }) {
  // Read initial page from URL if present
  const initPage = React.useMemo(() => {
    const p = new URLSearchParams(window.location.search).get("page");
    return p ? Math.max(0, parseInt(p) - 1) : 0;
  }, []);
  const [pageSize, setPageSize] = React.useState(10);
  const [page, setPage]         = React.useState(initPage);
  const [showFilters, setShowFilters] = React.useState(false);
  const txs     = data?.transactions || [];
  const total   = txs.length;
  const paged   = txs.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(total / pageSize);

  const activeCount = Object.values(activeFilters || {}).filter(v => v).length;

  // Sync page to URL
  const updatePage = (newPage) => {
    setPage(newPage);
    const params = new URLSearchParams(window.location.search);
    if (newPage > 0) {
      params.set("page", String(newPage + 1));
    } else {
      params.delete("page");
    }
    const url = `?${params.toString()}`;
    window.history.replaceState({ wallet: walletAddr, page: newPage }, "", url);
  };

  const CHAIN_NAMES = {
    1:"Ethereum",8453:"Base",42161:"Arbitrum",10:"Optimism",137:"Polygon",
    56:"BNB",43114:"Avalanche",534352:"Scroll",59144:"Linea",5000:"Mantle",
    34443:"Mode",146:"Sonic",130:"Unichain",480:"World Chain",2741:"Abstract",
    80094:"Berachain",999:"HyperEVM",57073:"Ink",143:"Monad",9745:"Plasma",4217:"Tempo",
    999999999991:"Solana",
  };

  const statusColor = (s) => {
    if (!s) return C.textDim;
    if (s.includes("filled") || s.includes("succeeded")) return C.green;
    if (s.includes("failed") || s.includes("reverted")) return C.red;
    if (s.includes("pending") || s.includes("confirmed")) return C.amber;
    return C.textDim;
  };

  const fmtStatus = (s) => s ? s.replace(/_/g," ") : "unknown";
  const truncHash = (h) => h ? h.slice(0,8)+"..."+h.slice(-6) : "-";
  const isSol = (h) => h && !h.startsWith("0x");

  return (
    <div style={{ animation:"fadeUp 0.3s ease-out" }}>
      <div style={{ marginBottom:16, display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
        <span style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:11, color:C.textDim }}>// WALLET HISTORY</span>
        <span style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:11, color:C.blue, background:C.blue+"18", border:`1px solid ${C.blue}35`, borderRadius:6, padding:"2px 8px" }}>
          {walletAddr?.slice(0,6)}...{walletAddr?.slice(-4)}
        </span>
        <span style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:10, color:C.textDim }}>{data?.pagination?.total ?? txs.length} transaction{(data?.pagination?.total ?? txs.length) !== 1 ? "s" : ""}</span>
        {data?.totalVolume > 0 && (
          <span style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:10, color:C.green, fontWeight:600 }}>
            ${data.totalVolume >= 1e6 ? (data.totalVolume / 1e6).toFixed(1) + "M" : data.totalVolume >= 1e3 ? Math.round(data.totalVolume / 1e3).toLocaleString() + "K" : Math.round(data.totalVolume).toLocaleString()} total
          </span>
        )}
        <button
          onClick={() => setShowFilters(f => !f)}
          style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:9, color: activeCount > 0 ? C.blue : C.textDim, background: activeCount > 0 ? C.blue+"14" : C.surface, border:`1px solid ${activeCount > 0 ? C.blue+"50" : C.border}`, borderRadius:4, padding:"3px 10px", cursor:"pointer", letterSpacing:"0.05em" }}
        >{showFilters ? "hide filters" : "filters"}{activeCount > 0 ? ` (${activeCount})` : ""}</button>
        {activeCount > 0 && (
          <button onClick={() => onFilter({})} style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:9, color:C.red, background:"none", border:`1px solid ${C.red}30`, borderRadius:4, padding:"3px 8px", cursor:"pointer" }}>clear</button>
        )}
        <button
          onClick={() => {
            const headers = ["Timestamp","Status","Source Chain","Dest Chain","Sell Token","Sell Amount","Sell USD","Buy Token","Buy Amount","Buy USD","Volume USD","Bridge","Integrator","Origin Tx","Dest Tx","Sender","Recipient"];
            const rows = txs.map(tx => [
              tx.timestamp || "",
              tx.status || "",
              getChain(tx.originChain)?.name || tx.originChain || "",
              getChain(tx.destinationChain)?.name || tx.destinationChain || "",
              tx.sellTokenSymbol || "",
              tx.sellAmount || "",
              tx.sellUsd || "",
              tx.buyTokenSymbol || "",
              tx.buyAmount || "",
              tx.buyUsd || "",
              tx.volumeUsd || "",
              tx.bridge || "",
              tx.appName || "",
              tx.originTx || "",
              tx.destinationTx || "",
              tx.originAddress || "",
              tx.destinationAddress || "",
            ]);
            const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `0x-bridge-history-${walletAddr?.slice(0,8)}-${new Date().toISOString().slice(0,10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:9, color:C.textDim, background:C.surface, border:`1px solid ${C.border}`, borderRadius:4, padding:"3px 10px", cursor:"pointer", letterSpacing:"0.05em" }}
        >export CSV</button>
        <span style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:9, color:C.textDim, opacity:0.5, marginLeft:"auto" }}>{data?.source === "clickhouse" ? "via ClickHouse" : "0x-routed transactions only"}</span>
      </div>

      {/* Filter controls */}
      {showFilters && (
        <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap", alignItems:"flex-end" }}>
          {/* Status filter */}
          <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
            <label style={{ fontSize:9, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace", letterSpacing:"0.08em" }}>STATUS</label>
            <select
              value={activeFilters?.status || ""}
              onChange={e => onFilter({ ...activeFilters, status: e.target.value || undefined })}
              style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:10, color:C.text, background:C.surface, border:`1px solid ${C.border}`, borderRadius:6, padding:"5px 8px", cursor:"pointer", minWidth:120 }}
            >
              <option value="">All statuses</option>
              <option value="bridge_filled">Filled</option>
              <option value="bridge_failed">Failed</option>
              <option value="bridge_pending">Pending</option>
              <option value="origin_tx_confirmed">Confirmed</option>
            </select>
          </div>

          {/* Chain filter */}
          <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
            <label style={{ fontSize:9, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace", letterSpacing:"0.08em" }}>CHAIN</label>
            <select
              value={activeFilters?.chain || ""}
              onChange={e => onFilter({ ...activeFilters, chain: e.target.value || undefined })}
              style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:10, color:C.text, background:C.surface, border:`1px solid ${C.border}`, borderRadius:6, padding:"5px 8px", cursor:"pointer", minWidth:120 }}
            >
              <option value="">All chains</option>
              {Object.entries(CHAIN_NAMES).map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>

          {/* Bridge filter */}
          <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
            <label style={{ fontSize:9, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace", letterSpacing:"0.08em" }}>BRIDGE</label>
            <select
              value={activeFilters?.bridge || ""}
              onChange={e => onFilter({ ...activeFilters, bridge: e.target.value || undefined })}
              style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:10, color:C.text, background:C.surface, border:`1px solid ${C.border}`, borderRadius:6, padding:"5px 8px", cursor:"pointer", minWidth:120 }}
            >
              <option value="">All bridges</option>
              <option value="relay">Relay</option>
              <option value="across_v4">Across V4</option>
              <option value="gas_zip">Gas Zip</option>
              <option value="oft">OFT</option>
              <option value="bungee_auto">Bungee Auto</option>
              <option value="mayan_swift">Mayan Swift</option>
              <option value="squid">Squid</option>
              <option value="stargate">Stargate</option>
              <option value="near_intents">Near Intents</option>
            </select>
          </div>

          {/* Date range */}
          <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
            <label style={{ fontSize:9, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace", letterSpacing:"0.08em" }}>AFTER</label>
            <input
              type="date"
              value={activeFilters?.after || ""}
              onChange={e => onFilter({ ...activeFilters, after: e.target.value || undefined })}
              style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:10, color:C.text, background:C.surface, border:`1px solid ${C.border}`, borderRadius:6, padding:"4px 8px" }}
            />
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
            <label style={{ fontSize:9, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace", letterSpacing:"0.08em" }}>BEFORE</label>
            <input
              type="date"
              value={activeFilters?.before || ""}
              onChange={e => onFilter({ ...activeFilters, before: e.target.value || undefined })}
              style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:10, color:C.text, background:C.surface, border:`1px solid ${C.border}`, borderRadius:6, padding:"4px 8px" }}
            />
          </div>
        </div>
      )}

      {loading && txs.length === 0 && (
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"40px", textAlign:"center", fontFamily:"'IBM Plex Mono', monospace", fontSize:11, color:C.textDim }}>
          Fetching wallet history...
        </div>
      )}

      {!loading && txs.length === 0 && (
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"40px", textAlign:"center", fontFamily:"'IBM Plex Mono', monospace", fontSize:11, color:C.textDim }}>
          No cross-chain transactions found for this wallet.
        </div>
      )}

      {txs.length > 0 && (
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden", marginBottom:14 }}>
          <div className="wallet-grid-header" style={{ display:"grid", gridTemplateColumns:"1fr 20px 1.2fr 100px 100px 50px", gap:10, padding:"9px 16px", borderBottom:`1px solid ${C.border}`, background:C.surface2 }}>
            {["SOURCE","","DESTINATION","STATUS","INTEGRATOR",""].map((h,i) => (
              <div key={i} style={{ fontSize:9, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace", letterSpacing:"0.1em" }}>{h}</div>
            ))}
          </div>

          {paged.map((tx, i) => {
            const srcChain   = getChain(tx.originChain);
            const dstChain   = getChain(tx.destinationChain);
            const bridge     = tx.bridge ? tx.bridge.replace(/_/g," ") : null;
            const sc         = statusColor(tx.status);
            const srcHash    = tx.originTx;
            const dstHash    = tx.destinationTx && tx.destinationTx !== "0x" ? tx.destinationTx : null;
            const srcChainId = tx.originChain;
            const dstChainId = tx.destinationChain;

            return (
              <div key={i} className="wallet-row"
                style={{ display:"grid", gridTemplateColumns:"1fr 20px 1.2fr 100px 100px 50px", gap:10, padding:"11px 16px", borderBottom: i < paged.length-1 ? `1px solid ${C.border}` : "none", alignItems:"center", transition:"background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background=C.surface2}
                onMouseLeave={e => e.currentTarget.style.background="transparent"}
              >
                {/* Source */}
                <div style={{ display:"flex", flexDirection:"column", gap:3, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                    {srcChain?.logo
                      ? <img src={srcChain.logo} alt="" style={{ width:16, height:16, borderRadius:"50%", flexShrink:0 }} />
                      : <span style={{ width:16, height:16, borderRadius:"50%", background:C.border, display:"inline-block", flexShrink:0 }} />
                    }
                    <span style={{ fontSize:11, fontFamily:"'IBM Plex Mono', monospace", color:C.textSub, fontWeight:600 }}>
                      {srcChain?.short || CHAIN_NAMES[srcChainId] || String(srcChainId)}
                    </span>
                  </div>
                  {srcHash && (
                    <a href={(srcChain?.explorer || "https://etherscan.io/tx/") + srcHash} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize:10, fontFamily:"'IBM Plex Mono', monospace", color:C.blue, textDecoration:"none" }}
                      onClick={e => e.stopPropagation()}
                    >{truncHash(srcHash)} ↗</a>
                  )}
                </div>

                {/* Arrow */}
                <span style={{ color:C.textDim, fontSize:14, textAlign:"center" }}>→</span>

                {/* Destination */}
                <div style={{ display:"flex", flexDirection:"column", gap:3, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:5, flexWrap:"wrap" }}>
                    {dstChain?.logo
                      ? <img src={dstChain.logo} alt="" style={{ width:16, height:16, borderRadius:"50%", flexShrink:0 }} />
                      : <span style={{ width:16, height:16, borderRadius:"50%", background:C.border, display:"inline-block", flexShrink:0 }} />
                    }
                    <span style={{ fontSize:11, fontFamily:"'IBM Plex Mono', monospace", color:C.textSub, fontWeight:600 }}>
                      {dstChain?.short || CHAIN_NAMES[dstChainId] || String(dstChainId || "?")}
                    </span>
                    {bridge && <span style={{ fontSize:9, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace", opacity:0.7 }}>via {bridge}</span>}
                  </div>
                  {dstHash ? (
                    <a href={isSol(dstHash) ? `https://solscan.io/tx/${dstHash}` : (dstChain?.explorer || "") + dstHash}
                      target="_blank" rel="noopener noreferrer"
                      style={{ fontSize:10, fontFamily:"'IBM Plex Mono', monospace", color:C.blue, textDecoration:"none" }}
                      onClick={e => e.stopPropagation()}
                    >{truncHash(dstHash)} {isSol(dstHash) ? "↗ solscan" : "↗"}</a>
                  ) : (
                    <span style={{ fontSize:10, fontFamily:"'IBM Plex Mono', monospace", color:C.textDim, opacity:0.4 }}>-</span>
                  )}
                </div>

                {/* Status */}
                <span style={{ fontSize:10, fontFamily:"'IBM Plex Mono', monospace", color:sc, fontWeight:600, whiteSpace:"nowrap", textTransform:"capitalize" }}>
                  {fmtStatus(tx.status)}
                </span>

                {/* Integrator */}
                <span style={{ fontSize:8, fontFamily:"'IBM Plex Mono', monospace", color:C.gradEnd, whiteSpace:"nowrap" }}>
                  {tx.appName ? cleanAppName(tx.appName) : ""}
                </span>

                {/* Trace */}
                <span
                  onClick={() => onTrace(srcChainId, srcHash)}
                  style={{ fontSize:10, color:C.textDim, padding:"2px 8px", border:`1px solid ${C.border}`, borderRadius:4, cursor:"pointer", fontFamily:"'IBM Plex Mono', monospace", whiteSpace:"nowrap" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor=C.green; e.currentTarget.style.color=C.green; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.textDim; }}
                >trace</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination controls */}
      {total > 0 && (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, marginBottom:14, flexWrap:"wrap" }}>
          {/* Page size selector */}
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontSize:10, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace" }}>Show</span>
            {[10, 25, 50].map(n => (
              <button key={n} onClick={() => { setPageSize(n); updatePage(0); }}
                style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:10, color: pageSize===n ? C.green : C.textDim, background: pageSize===n ? C.green+"14" : C.surface, border:`1px solid ${pageSize===n ? C.green+"50" : C.border}`, borderRadius:4, padding:"3px 10px", cursor:"pointer" }}
              >{n}</button>
            ))}
          </div>

          {/* Page nav */}
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:10, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace" }}>
              {page * pageSize + 1}–{Math.min((page + 1) * pageSize, total)} of {total}{cursor ? "+" : ""}
            </span>
            <button onClick={() => updatePage(Math.max(0, page - 1))} disabled={page === 0}
              style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:11, color: page===0 ? C.textDim : C.textSub, background:C.surface, border:`1px solid ${C.border}`, borderRadius:4, padding:"3px 10px", cursor: page===0 ? "not-allowed" : "pointer", opacity: page===0 ? 0.4 : 1 }}
            >← prev</button>
            <button onClick={() => { if ((page+1)*pageSize >= total && cursor) { onLoadMore(); } else { updatePage(page + 1); } }} disabled={(page+1)*pageSize >= total && !cursor}
              style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:11, color:C.textSub, background:C.surface, border:`1px solid ${C.border}`, borderRadius:4, padding:"3px 10px", cursor:"pointer", opacity: (page+1)*pageSize >= total && !cursor ? 0.4 : 1 }}
            >next →</button>
          </div>
        </div>
      )}

      {cursor && (page+1)*pageSize >= total && (
        <div style={{ display:"flex", justifyContent:"center", marginBottom:14 }}>
          <button onClick={onLoadMore} disabled={loading}
            style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:11, color:C.textSub, background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"8px 20px", cursor:"pointer" }}
          >{loading ? "Loading..." : "Load more"}</button>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const s = getStatus(status);
  const isPulsing = ["pending","bridge_filling","submitted","origin_tx_pending","origin_tx_succeeded","origin_tx_confirmed","bridge_pending"].includes(status);
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:8, fontFamily:"'IBM Plex Mono', monospace", fontSize:14, fontWeight:700, letterSpacing:"0.06em", color:s.color, background:s.color+"14", border:`1px solid ${s.color}35`, borderRadius:10, padding:"8px 18px" }}>
      <span style={{ width:8, height:8, borderRadius:"50%", background:s.color, flexShrink:0, animation:isPulsing?"pulse 1.2s ease-in-out infinite":"none", boxShadow:isPulsing?`0 0 8px ${s.color}`:"none" }} />
      {s.label.toUpperCase()}
    </span>
  );
}

function StatusDesc({ status }) {
  const s = getStatus(status);
  if (!s.desc) return null;
  return <span style={{ fontSize:12, color:s.color, opacity:0.65, fontFamily:"'IBM Plex Mono', monospace" }}>{s.desc}</span>;
}

// ── Result ────────────────────────────────────────────────────────────────────
function PipelineNode({ label, chainId, amount, token, txHash, address, addressLabel, isENS, timestamp, accentColor, addrLabel, isDifferent }) {
  const chain = getChain(chainId);
  // For Solana, link to solscan account page; for EVM use block explorer /address/
  // Detect Solana by chainId OR by address format (base58, not 0x)
  const isSolAddr = address && !address.startsWith("0x");
  const isSolDest = chainId === 999999999991 || isSolAddr;
  const explorerAddr = address
    ? isSolDest
      ? `https://solscan.io/account/${address}`
      : chain?.explorer.replace("/tx/", "/address/") + address
    : null;
  const fieldLabel = label === "// ORIGIN" ? "SENDER" : "RECIPIENT";
  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", gap:0 }}>
      <div style={{ fontSize:10, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace", letterSpacing:"0.12em", marginBottom:10, fontWeight:600 }}>{label}</div>
      <div style={{ background:C.surface2, border:`1px solid ${isDifferent ? C.amber : accentColor}35`, borderRadius:14, padding:"20px 22px", display:"flex", flexDirection:"column", gap:16, height:"100%" }}>
        {chainId ? <ChainTag chainId={chainId} size="lg" /> : <span style={{ fontSize:11, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace" }}>Unknown chain</span>}
        {amount && amount !== "--" && (
          <div style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:22, fontWeight:700, color:C.text, lineHeight:1.2 }}>
            {amount} <TokenLink addr={token} chainId={chainId} />
          </div>
        )}
        <div style={{ height:1, background:C.border }} />
        {txHash && (
          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
            <div style={{ fontSize:10, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace", letterSpacing:"0.1em", fontWeight:600 }}>TX HASH</div>
            <HashLink hash={txHash} chainId={chainId} />
          </div>
        )}
        {address && (
          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
              <div style={{ fontSize:10, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace", letterSpacing:"0.1em", fontWeight:600 }}>{fieldLabel}</div>
              {isDifferent && (
                <span style={{ fontSize:9, color:C.amber, background:C.amber+"18", border:`1px solid ${C.amber}35`, borderRadius:4, padding:"1px 5px", fontFamily:"'IBM Plex Mono', monospace", letterSpacing:"0.04em" }}>≠ SENDER</span>
              )}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <a href={explorerAddr} target="_blank" rel="noopener noreferrer" title={address}
                style={{ fontSize:12, fontFamily:"'IBM Plex Mono', monospace", color: isENS ? C.gradStart : isDifferent ? C.amber : C.textSub, textDecoration:"none", display:"flex", alignItems:"center", gap:4 }}
                onMouseEnter={e => e.currentTarget.style.color=C.gradStart}
                onMouseLeave={e => e.currentTarget.style.color= isENS ? C.gradStart : isDifferent ? C.amber : C.textSub}
              >{addressLabel} <span style={{ opacity:0.6 }}>↗</span></a>
              <AddressCopyButton address={address} />
            </div>
          </div>
        )}
        {timestamp && (
          <div style={{ fontSize:11, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace", marginTop:"auto", paddingTop:4 }}>{fmtTime(timestamp)}</div>
        )}
      </div>
    </div>
  );
}

function PipelineConnector({ label, sublabel }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"36px 12px 0", gap:6, flexShrink:0, minWidth:80 }}>
      {label && <div style={{ fontSize:10, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace", letterSpacing:"0.06em", whiteSpace:"nowrap", textAlign:"center" }}>{label}</div>}
      <div style={{ display:"flex", alignItems:"center" }}>
        <div style={{ width:22, height:1, background:C.border2 }} />
        <span style={{ color:C.textDim, fontSize:22, lineHeight:1 }}>›</span>
        <div style={{ width:22, height:1, background:C.border2 }} />
      </div>
      {sublabel && <div style={{ fontSize:10, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace", textAlign:"center" }}>{sublabel}</div>}
    </div>
  );
}

function Result({ data, tokenCache = {} }) {
  // Debug: log raw API response so we can inspect token data in devtools
  React.useEffect(() => { console.log("[bridge-explorer] Result data:", JSON.stringify(data, null, 2)); }, [data]);

  const steps  = data.steps || [];
  const bridge = data.bridge ? data.bridge.replace(/_/g," ").replace(/\b\w/g,l=>l.toUpperCase()) : null;
  const first  = steps[0];
  const last   = steps[steps.length-1];
  const ts     = data._tokenSummary || {};  // server-injected summary

  const getCached = (addr, cid) => {
    const key = addr?.toLowerCase() + "_" + cid;
    return tokenCache[key] || TOKENS[addr?.toLowerCase()];
  };

  // When steps is empty, fall back to data.transactions for origin/dest info
  const rawTxs        = data.transactions || [];
  const originTx      = first?.transactions?.[0] || rawTxs[0];
  const destRawTx     = rawTxs[rawTxs.length - 1];

  const originChainId = originTx?.chainId;
  const originTxHash  = originTx?.txHash;
  const originTs      = originTx?.timestamp;

  // Token amounts: prefer steps data, fall back to _tokenSummary from server
  const sellTokenAddr = first?.sellToken || ts.sellToken;
  const sellAmtRaw    = first?.sellAmount || ts.sellAmount;
  const buyTokenAddr  = last?.buyToken || ts.buyToken;
  const buyAmtRaw     = last?.settledBuyAmount || last?.quotedBuyAmount || ts.buyAmount;

  // Use pre-resolved symbols from ClickHouse when available
  // ClickHouse amounts are USUALLY human-readable (e.g., "597.38"), but sometimes
  // raw integer units (e.g., "7314159780" for USDC). Detect by checking for decimal point.
  // On-chain amounts are always raw.
  const isChSource = ts._source?.startsWith("clickhouse");
  const isSellOnChain = ts._source === "clickhouse+on-chain";
  const isBuyOnChain = ts._source === "clickhouse+on-chain-dest";

  // Helper: determine if a ClickHouse amount is human-readable or raw
  // Human-readable: contains "." (e.g., "597.38") or is a small integer (e.g., "70")
  // Raw: large integer without decimal (e.g., "7314159780")
  const isHumanReadable = (amtStr) => {
    if (!amtStr) return true;
    if (String(amtStr).includes(".")) return true;
    return Number(amtStr) < 1e8; // small integers are human-readable (e.g., "70" = 70 USDT)
  };

  const originSellSym = ts.sellSymbol || getCached(sellTokenAddr, originChainId)?.s || tokenSym(sellTokenAddr, originChainId);
  const sellIsHuman = isChSource && !isSellOnChain && isHumanReadable(sellAmtRaw);
  const originSellDec = sellIsHuman ? 0 : getCached(sellTokenAddr, originChainId)?.d;
  const originAmt     = sellAmtRaw ? (STABLES.has(originSellSym)?"$":"") + fmtAmt(sellAmtRaw, sellTokenAddr, originSellDec) : null;

  const lastTxInSteps = last?.transactions?.[last.transactions?.length-1];
  // For bridges like near_intents that return steps:[], use the last tx in data.transactions as destination
  const destRawTxFallback = rawTxs.length > 1 ? rawTxs[rawTxs.length - 1] : null;
  const destChainId   = last?.destinationChainId || lastTxInSteps?.chainId || ts.destinationChainId || destRawTxFallback?.chainId || null;
  const destTxHash    = lastTxInSteps?.txHash || destRawTxFallback?.txHash || null;
  const destTs        = lastTxInSteps?.timestamp || destRawTxFallback?.timestamp || null;
  const destBuySym    = ts.buySymbol || getCached(buyTokenAddr, destChainId)?.s || tokenSym(buyTokenAddr, destChainId);
  const buyIsHuman = isChSource && !isBuyOnChain && isHumanReadable(buyAmtRaw);
  const destBuyDec    = buyIsHuman ? 0 : getCached(buyTokenAddr, destChainId)?.d;
  const destAmt       = buyAmtRaw ? (STABLES.has(destBuySym)?"$":"") + fmtAmt(buyAmtRaw, buyTokenAddr, destBuyDec) : null;

  const sender        = data.sender || data.taker;
  // For Solana destinations, don't fall back to sender
  const isSolanaDest  = destChainId === 999999999991
    || (destTxHash && !destTxHash.startsWith("0x"));
  // data.recipient may be a Solana address (base58) — use it directly
  const recipient     = data.recipient || (isSolanaDest ? null : sender);
  const senderLabel   = data.senderENS || data.takerENS || (sender ? sender.slice(0,6)+"…"+sender.slice(-4) : null);
  const recipientLabel= data.recipientENS || (recipient ? recipient.slice(0,6)+"…"+recipient.slice(-4) : null);
  const senderIsENS   = !!(data.senderENS || data.takerENS);
  const recipientIsENS= !!data.recipientENS;
  const isDifferent   = !!(sender && recipient && sender.toLowerCase() !== recipient.toLowerCase());
  const midSteps      = steps.length > 1 ? steps.slice(1, -1) : [];
  const bridgeStep    = steps.find(s => s.type === "bridge");
  const bridgeSecs    = originTs && destTs ? Math.round(destTs - originTs) + "s" : null;

  // Bridge explorer URLs
  const BRIDGE_EXPLORERS = {
    relay:           { name: "Relay",        url: (tx) => `https://relay.link/transaction/${tx}` },
    across_v4:       { name: "Across",       url: (tx) => `https://app.across.to/transfer/${tx}` },
    gas_zip:         { name: "Gas.zip",      url: (tx) => `https://www.gas.zip/scan/tx/${tx}` },
    oft:             { name: "LayerZero",    url: (tx) => `https://layerzeroscan.com/tx/${tx}` },
    stargate:        { name: "LayerZero",    url: (tx) => `https://layerzeroscan.com/tx/${tx}` },
    bungee_auto:     { name: "Socketscan",   url: (tx) => `https://www.socketscan.io/tx/${tx}` },
    mayan_swift:     { name: "Mayan",        url: (tx) => `https://explorer.mayan.finance/tx/SWIFT_${tx}__0` },
    mayan_mctp:      { name: "Mayan",        url: (tx) => `https://explorer.mayan.finance/tx/MCTP_${tx}__0` },
    mayan_fast_mctp: { name: "Mayan",        url: (tx) => `https://explorer.mayan.finance/tx/FAST_MCTP_${tx}__0` },
    squid:           { name: "Axelarscan",   url: (tx) => `https://axelarscan.io/tx/${tx.replace("0x","").toUpperCase()}` },
  };
  const bridgeExplorer = data.bridge ? BRIDGE_EXPLORERS[data.bridge] : null;
  const bridgeExplorerUrl = bridgeExplorer && originTxHash ? bridgeExplorer.url(originTxHash) : null;

  // Format timestamp
  const fmtTs = (ts) => {
    if (!ts) return null;
    const d = new Date(ts * 1000);
    return d.toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" }) + ", " +
      d.toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit", second:"2-digit", hour12:true, timeZone:"UTC" }) + " UTC";
  };

  // USD values from ClickHouse
  const sellUsd = ts.sellUsd || ts.volumeUsd;
  const buyUsd  = ts.buyUsd;
  const gasUsd  = ts.gasUsd;
  const slippageBps = ts.slippageBps;
  const tradeType   = ts.tradeType;

  const fmtUsd = (v) => {
    if (!v) return null;
    const n = Number(v);
    if (n >= 1000) return "$" + Math.round(n).toLocaleString();
    if (n >= 1) return "$" + n.toFixed(2);
    return "$" + n.toFixed(4);
  };

  return (
    <div style={{ animation:"fadeUp 0.3s ease-out" }}>
      {/* ── Status header bar ── */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16, flexWrap:"wrap" }}>
        <StatusBadge status={data.status} />
        {bridge && (
          bridgeExplorerUrl ? (
            <a href={bridgeExplorerUrl} target="_blank" rel="noopener noreferrer"
              style={{ display:"inline-flex", alignItems:"center", gap:5, background:C.surface2, border:`1px solid ${C.border2}`, borderRadius:8, padding:"7px 14px", fontFamily:"'IBM Plex Mono', monospace", fontSize:12, fontWeight:600, color:C.textSub, textDecoration:"none", transition:"all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor=C.blue; e.currentTarget.style.color=C.blue; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor=C.border2; e.currentTarget.style.color=C.textSub; }}
            >
              <span style={{ fontSize:10, color:C.textDim }}>via</span>{bridge} <span style={{ opacity:0.5, fontSize:11 }}>↗</span>
            </a>
          ) : (
            <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:C.surface2, border:`1px solid ${C.border2}`, borderRadius:8, padding:"7px 14px", fontFamily:"'IBM Plex Mono', monospace", fontSize:12, fontWeight:600, color:C.textSub }}>
              <span style={{ fontSize:10, color:C.textDim }}>via</span>{bridge}
            </span>
          )
        )}
        {ts.appName && (
          <span style={{ display:"inline-flex", alignItems:"center", gap:4, background:C.gradEnd+"12", border:`1px solid ${C.gradEnd}30`, borderRadius:8, padding:"7px 14px", fontFamily:"'IBM Plex Mono', monospace", fontSize:11, fontWeight:600, color:C.gradEnd }}>
            {cleanAppName(ts.appName)}
          </span>
        )}
        {bridgeSecs && (
          <span style={{ marginLeft:"auto", fontSize:12, fontFamily:"'IBM Plex Mono', monospace", color:C.textDim }}>
            Fill time: <span style={{ color:C.green, fontWeight:600 }}>{bridgeSecs}</span>
          </span>
        )}
      </div>
      <StatusDesc status={data.status} />

      {/* ── Summary bar — swap at a glance ── */}
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:"20px 28px", marginTop:16, marginBottom:14, display:"flex", alignItems:"center", justifyContent:"center", gap:24 }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:28, fontWeight:700, color:C.text, fontFamily:"'IBM Plex Mono', monospace" }}>
            {originAmt || "—"} <span style={{ fontSize:14, fontWeight:400, color:C.textDim }}>{originSellSym}</span>
          </div>
          <div style={{ fontSize:11, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace", marginTop:4 }}>
            on {getChain(originChainId)?.name || originChainId}
          </div>
        </div>
        <span style={{ fontSize:24, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace" }}>→</span>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:28, fontWeight:700, color:C.text, fontFamily:"'IBM Plex Mono', monospace" }}>
            {destAmt || "—"} <span style={{ fontSize:14, fontWeight:400, color:C.textDim }}>{destBuySym}</span>
          </div>
          <div style={{ fontSize:11, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace", marginTop:4 }}>
            on {destChainId ? (getChain(destChainId)?.name || destChainId) : "…"}
          </div>
        </div>
      </div>

      {/* ── Two-column Source / Destination cards ── */}
      <div className="pipeline-row" style={{ display:"flex", gap:14, marginBottom:14 }}>
        {/* Source card */}
        <div style={{ flex:1, background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden" }}>
          <div style={{ padding:"14px 20px", borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:11, fontWeight:600, color:C.text, fontFamily:"'IBM Plex Mono', monospace", letterSpacing:"0.04em" }}>Source</span>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              {getChain(originChainId)?.logo && <img src={getChain(originChainId).logo} alt="" style={{ width:14, height:14, borderRadius:"50%" }} />}
              <span style={{ fontSize:11, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace" }}>{getChain(originChainId)?.name || originChainId}</span>
            </div>
          </div>
          <div style={{ padding:"20px" }}>
            <div style={{ fontSize:24, fontWeight:700, color:C.text, fontFamily:"'IBM Plex Mono', monospace", marginBottom:4 }}>
              {originAmt || "—"} <span style={{ fontSize:13, fontWeight:400, color:C.textDim }}>{originSellSym}</span>
            </div>
            {sellUsd && !originAmt?.startsWith("$") && (
              <div style={{ fontSize:11, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace", marginBottom:4 }}>{fmtUsd(sellUsd)}</div>
            )}
            <div style={{ height:1, background:C.border, margin:"16px 0" }} />
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div>
                <div style={{ fontSize:9, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace", letterSpacing:"0.08em", marginBottom:5 }}>TX HASH</div>
                {originTxHash ? <HashLink hash={originTxHash} chainId={originChainId} /> : <span style={{ fontSize:11, color:C.textDim }}>—</span>}
              </div>
              <div>
                <div style={{ fontSize:9, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace", letterSpacing:"0.08em", marginBottom:5 }}>SENDER</div>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  {senderLabel && (
                    <>
                      <a href={getChain(originChainId)?.explorer?.replace("/tx/","/address/") + sender} target="_blank" rel="noopener noreferrer"
                        style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:12, color:C.blue, textDecoration:"none" }}
                      >{senderLabel}{senderIsENS ? "" : ""}</a>
                      {sender && <AddressCopyButton address={sender} />}
                    </>
                  )}
                </div>
              </div>
              <div>
                <div style={{ fontSize:9, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace", letterSpacing:"0.08em", marginBottom:5 }}>TIMESTAMP</div>
                <span style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:12, color:C.textSub }}>{fmtTs(originTs) || "—"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Destination card */}
        <div style={{ flex:1, background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden" }}>
          <div style={{ padding:"14px 20px", borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:11, fontWeight:600, color:C.text, fontFamily:"'IBM Plex Mono', monospace", letterSpacing:"0.04em" }}>Destination</span>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              {destChainId && getChain(destChainId)?.logo && <img src={getChain(destChainId).logo} alt="" style={{ width:14, height:14, borderRadius:"50%" }} />}
              <span style={{ fontSize:11, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace" }}>{destChainId ? (getChain(destChainId)?.name || destChainId) : "Pending…"}</span>
            </div>
          </div>
          <div style={{ padding:"20px" }}>
            {destAmt ? (
              <>
                <div style={{ fontSize:24, fontWeight:700, color:C.text, fontFamily:"'IBM Plex Mono', monospace", marginBottom:4 }}>
                  {destAmt} <span style={{ fontSize:13, fontWeight:400, color:C.textDim }}>{destBuySym}</span>
                </div>
                {buyUsd && !destAmt?.startsWith("$") && (
                  <div style={{ fontSize:11, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace", marginBottom:4 }}>~{fmtUsd(buyUsd)}</div>
                )}
              </>
            ) : (
              <div style={{ fontSize:14, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace", marginBottom:4 }}>
                {data.status === "bridge_filled" ? "Details not returned by API" : "Awaiting bridge fill…"}
              </div>
            )}
            <div style={{ height:1, background:C.border, margin:"16px 0" }} />
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div>
                <div style={{ fontSize:9, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace", letterSpacing:"0.08em", marginBottom:5 }}>TX HASH</div>
                {destTxHash ? <HashLink hash={destTxHash} chainId={destChainId} /> : <span style={{ fontSize:11, color:C.textDim }}>—</span>}
              </div>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:5 }}>
                  <span style={{ fontSize:9, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace", letterSpacing:"0.08em" }}>RECIPIENT</span>
                  {isDifferent && <span style={{ fontSize:9, color:C.amber, background:C.amber+"18", borderRadius:3, padding:"1px 6px", fontFamily:"'IBM Plex Mono', monospace" }}>≠ sender</span>}
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  {recipientLabel ? (
                    <>
                      <span style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:12, color: isDifferent ? C.amber : C.blue }}
                      >{recipientLabel}</span>
                      {recipient && <AddressCopyButton address={recipient} />}
                    </>
                  ) : <span style={{ fontSize:11, color:C.textDim }}>—</span>}
                </div>
              </div>
              <div>
                <div style={{ fontSize:9, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace", letterSpacing:"0.08em", marginBottom:5 }}>TIMESTAMP</div>
                <span style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:12, color:C.textSub }}>{fmtTs(destTs) || "—"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer bar: gas, slippage, trade type, ref ── */}
      <div style={{ background:C.surface2, border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 18px", display:"flex", alignItems:"center", gap:16, flexWrap:"wrap", marginBottom:18 }}>
        {gasUsd != null && gasUsd > 0 && (
          <>
            <span style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:10, color:C.textDim }}>Gas <span style={{ color:C.textSub, fontWeight:600 }}>${gasUsd < 0.01 ? gasUsd.toFixed(4) : gasUsd.toFixed(2)}</span></span>
            <div style={{ width:1, height:12, background:C.border2 }} />
          </>
        )}
        {tradeType && (
          <>
            <span style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:10, color:C.textDim }}>Type <span style={{ color:C.textSub, fontWeight:600 }}>{tradeType}</span></span>
            <div style={{ width:1, height:12, background:C.border2 }} />
          </>
        )}
        {data.zid && (
          <span style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:10, color:C.textDim, marginLeft:"auto" }}>ref: {data.zid}</span>
        )}
      </div>

      {(data.failure || data.status === "bridge_failed" || data.status === "origin_tx_reverted") && (() => {
        const f = data.failure;

        // Human-readable failure reasons from API docs
        const REASON_DESC = {
          expired:   "The bridge provider couldn't execute the transaction before it expired.",
          cancelled: "The bridge was cancelled by the user or a third-party entity.",
          out_of_gas:"The bridge provider ran out of gas mid-execution.",
          internal:  "The bridge provider encountered a technical failure.",
          unknown:   "The reason for the bridge failure couldn't be determined.",
        };

        // Human-readable failure statuses from API docs
        const STATUS_DESC = {
          refund_pending:        "An automatic recovery process has been initiated by the bridge provider.",
          refund_succeeded:      "The refund has been issued. Check your origin or destination wallet.",
          manual_action_required:"User action required to recover funds — see refund transaction below.",
          no_actions_required:   "The bridge failed before transferring tokens. Funds remain in your origin wallet.",
          failed:                "Recovery is not possible. Please contact 0x support.",
        };

        const reason = f?.reason;
        const failStatus = f?.status;
        const isManual = failStatus === "manual_action_required";
        const isSuccess = failStatus === "refund_succeeded" || failStatus === "no_actions_required";

        // Refund txs: prefer failure.transactions, fall back to 2nd+ tx in data.transactions
        const refundTxs = f?.transactions?.length > 0
          ? f.transactions
          : (data.status === "bridge_failed" && data.transactions?.length > 1)
            ? data.transactions.slice(1)
            : [];

        // Manual transaction if provided
        const manualTx = f?.recovery?.manualTransaction;
        const manualChainId = f?.recovery?.chainId;

        return (
          <div style={{ background:`${C.red}0a`, border:`1px solid ${isManual ? C.amber : C.red}35`, borderRadius:12, padding:"16px 20px", marginBottom:14 }}>
            <div style={{ fontSize:9, fontWeight:700, color:isManual ? C.amber : C.red, fontFamily:"'IBM Plex Mono', monospace", letterSpacing:"0.1em", marginBottom:12 }}>// FAILURE DETAILS</div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>

              {/* Reason */}
              <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                <span style={{ fontSize:9, color:C.red, fontFamily:"'IBM Plex Mono', monospace", letterSpacing:"0.08em", opacity:0.6, minWidth:70, flexShrink:0, paddingTop:2 }}>REASON</span>
                <div>
                  <div style={{ fontSize:12, color:C.red, fontFamily:"'IBM Plex Mono', monospace", fontWeight:600, textTransform:"capitalize", marginBottom:2 }}>
                    {reason ? reason.replace(/_/g," ") : "Bridge failed"}
                  </div>
                  {reason && REASON_DESC[reason] && (
                    <div style={{ fontSize:11, color:C.red, opacity:0.6, lineHeight:1.5 }}>{REASON_DESC[reason]}</div>
                  )}
                </div>
              </div>

              {/* Status */}
              {failStatus && (
                <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                  <span style={{ fontSize:9, color:C.red, fontFamily:"'IBM Plex Mono', monospace", letterSpacing:"0.08em", opacity:0.6, minWidth:70, flexShrink:0, paddingTop:2 }}>STATUS</span>
                  <div>
                    <div style={{ fontSize:12, color: isSuccess ? C.green : isManual ? C.amber : C.red, fontFamily:"'IBM Plex Mono', monospace", fontWeight:600, textTransform:"capitalize", marginBottom:2 }}>
                      {failStatus.replace(/_/g," ")}
                    </div>
                    {STATUS_DESC[failStatus] && (
                      <div style={{ fontSize:11, color: isSuccess ? C.green : isManual ? C.amber : C.red, opacity:0.7, lineHeight:1.5 }}>{STATUS_DESC[failStatus]}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Refund TX */}
              {refundTxs.length > 0 && (
                <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                  <span style={{ fontSize:9, color:C.green, fontFamily:"'IBM Plex Mono', monospace", letterSpacing:"0.08em", opacity:0.8, minWidth:70, flexShrink:0, paddingTop:2 }}>REFUND TX</span>
                  <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                    {refundTxs.map((tx, i) => (
                      <HashLink key={i} hash={tx.txHash} chainId={tx.chainId} />
                    ))}
                  </div>
                </div>
              )}

              {/* Manual action transaction */}
              {manualTx && (
                <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                  <span style={{ fontSize:9, color:C.amber, fontFamily:"'IBM Plex Mono', monospace", letterSpacing:"0.08em", opacity:0.8, minWidth:70, flexShrink:0, paddingTop:2 }}>ACTION TX</span>
                  <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                    <HashLink hash={manualTx} chainId={manualChainId} />
                    <div style={{ fontSize:10, color:C.amber, opacity:0.7, fontFamily:"'IBM Plex Mono', monospace" }}>Submit this tx to recover your funds</div>
                  </div>
                </div>
              )}

            </div>
          </div>
        );
      })()}

    </div>
  );
}

// ── Theme toggle ──────────────────────────────────────────────────────────────
function ThemeToggle({ mode, setMode }) {
  const opts = [{ id:"light", icon:"☀" }, { id:"dark", icon:"◑" }, { id:"system", icon:"⊙" }];
  return (
    <div style={{ display:"flex", background:C.surface2, border:`1px solid ${C.border}`, borderRadius:9, padding:3, gap:2 }}>
      {opts.map(o => (
        <button key={o.id} onClick={() => setMode(o.id)} title={o.id}
          style={{ background: mode===o.id ? C.surface : "transparent", border: mode===o.id ? `1px solid ${C.border2}` : "1px solid transparent", color: mode===o.id ? C.text : C.textDim, borderRadius:6, padding:"4px 10px", cursor:"pointer", fontSize:13, transition:"all 0.15s", fontFamily:"inherit" }}
        >{o.icon}</button>
      ))}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
// ── Password Gate ─────────────────────────────────────────────────────────────
function PasswordGate({ children }) {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // On mount, check if already authenticated via cookie by pinging a test endpoint
  useEffect(() => {
    fetch("/api/auth-check")
      .then(r => r.json())
      .then(d => { setAuthed(d.ok === true); setChecking(false); })
      .catch(() => { setAuthed(false); setChecking(false); });
  }, []);

  if (checking) return null; // brief flash while checking
  if (authed) return children;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(false);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      if (res.ok) {
        setAuthed(true);
      } else {
        setError(true);
        setPw("");
      }
    } catch { setError(true); }
    setSubmitting(false);
  };

  return (
    <div style={{ background:"#080808", color:"#e0e0e0", fontFamily:"'Manrope', sans-serif", display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh" }}>
      <div style={{ background:"#111111", border:"1px solid #242424", borderRadius:16, padding:"48px 40px", maxWidth:400, width:"100%", textAlign:"center" }}>
        <div style={{ width:40, height:40, background:"#1a1a2e", border:"1px solid #A855F750", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", fontSize:20 }}>⬡</div>
        <h1 style={{ fontSize:18, fontWeight:800, marginBottom:6, letterSpacing:"-0.02em" }}>0x Cross-Chain Explorer</h1>
        <div style={{ fontSize:12, color:"#888", fontFamily:"'IBM Plex Mono', monospace", marginBottom:28 }}>Internal tool — password required</div>
        <form onSubmit={handleSubmit}>
          <input
            type="password" value={pw} onChange={e => setPw(e.target.value)}
            placeholder="Enter password" autoFocus autoComplete="current-password"
            style={{ width:"100%", padding:"12px 16px", background:"#080808", border:"1px solid #242424", borderRadius:10, color:"#e0e0e0", fontFamily:"'IBM Plex Mono', monospace", fontSize:14, outline:"none", marginBottom:16 }}
          />
          <button type="submit" disabled={submitting}
            style={{ width:"100%", padding:12, background:"linear-gradient(135deg, #A855F7, #8B3FF5)", border:"none", borderRadius:10, color:"white", fontFamily:"'IBM Plex Mono', monospace", fontSize:13, fontWeight:600, cursor:"pointer", letterSpacing:"0.06em", opacity: submitting ? 0.6 : 1 }}
          >{submitting ? "CHECKING…" : "ENTER"}</button>
        </form>
        {error && <div style={{ fontSize:11, color:"#FF4D6A", fontFamily:"'IBM Plex Mono', monospace", marginTop:12 }}>Incorrect password</div>}
      </div>
    </div>
  );
}

export default function BridgeExplorer() {
  const [themeMode, setThemeMode] = useState("dark");
  const [systemDark, setSystemDark] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)").matches : true
  );
  const [input,    setInput]   = useState("");
  const [chainId,  setChainId] = useState("8453");
  const [loading,  setLoading] = useState(false);
  const [loadMsg,  setLoadMsg] = useState("");
  const [result,   setResult]  = useState(null);
  const [error,    setError]   = useState(null);
  const [focused,  setFocused] = useState(false);
  const [tokenCache, setTokenCache] = useState({});
  const tokenFetching = useRef(new Set());
  const [recent,      setRecent]    = useState([]);
  const [recentLoad,  setRecentLoad] = useState(true);
  const [stats,       setStats]     = useState(null);
  const [recentMeta,  setRecentMeta] = useState(null); // { latestTimestamp, source }
  const [pending,     setPending]    = useState([]);
  const [pendingLoad, setPendingLoad] = useState(true);
  const [topWallets,  setTopWallets]  = useState([]);
  const [topWalletsLoad, setTopWalletsLoad] = useState(false);
  const [topWalletsPeriod, setTopWalletsPeriod] = useState("30d");
  const [homeTab,     setHomeTabRaw]    = useState(() => {
    const p = new URLSearchParams(window.location.search).get("tab");
    return p === "pending" ? "pending" : p === "wallets" ? "wallets" : "recent";
  });
  const setHomeTab = (tab) => {
    setHomeTabRaw(tab);
    const params = new URLSearchParams(window.location.search);
    if (tab === "pending") { params.set("tab", "pending"); }
    else if (tab === "wallets") { params.set("tab", "wallets"); }
    else { params.delete("tab"); }
    const qs = params.toString();
    window.history.pushState({}, "", qs ? `?${qs}` : window.location.pathname);
  };
  const [detecting,   setDetecting]  = useState(false);
  const recentEnriched = useRef({});
  const [walletData,  setWalletData]  = useState(null);
  const [walletLoad,  setWalletLoad]  = useState(false);
  const [walletCursor,setWalletCursor]= useState(null);
  const [walletAddr,  setWalletAddr]  = useState(null);
  const [walletFilters, setWalletFilters] = useState({});
  const autoRefreshRef = useRef(null);
  const [autoRefreshCount, setAutoRefreshCount] = useState(0);

  useEffect(() => {
    // Try ClickHouse-powered endpoint first, fall back to Dune
    fetch("/api/recent-ch")
      .then(r => {
        if (!r.ok) throw new Error("CH unavailable");
        return r.json();
      })
      .then(d => {
        const rows = d.rows || [];
        setRecent(rows);
        setRecentMeta({ latestTimestamp: d.latestTimestamp, source: d.source || "clickhouse" });
        setRecentLoad(false);
        // Background-enrich rows with null bridge by calling the live API
        rows.forEach(row => {
          if (row.bridge) return;
          const hash = row.src_tx_hash;
          const cid = row.chain_id;
          if (!hash || !cid) return;
          fetch(`/api/status-direct?originChain=${cid}&originTxHash=${hash}`)
            .then(r => r.json())
            .then(data => {
              if (!data || data.error || data.name) return;
              if (data.bridge) {
                recentEnriched.current[hash] = {
                  ...recentEnriched.current[hash],
                  bridge: data.bridge,
                };
                setRecent(prev => [...prev]);
              }
            })
            .catch(() => {});
        });
      })
      .catch(() => {
        // Fallback to Dune
        fetch("/api/recent")
          .then(r => r.json())
          .then(async d => {
            const rows = d.rows || [];
            setRecent(rows);
            setRecentMeta({ latestTimestamp: d.executedAt, source: "dune" });
            // Enrich rows that have no dst_tx_hash by calling status API in parallel
            rows.forEach(row => {
              if (row.dst_tx_hash) return;
              const hash = row.src_tx_hash || row.tx_hash;
              if (!hash || !row.chain_id) return;
              fetch(`/api/status-direct?originChain=${row.chain_id}&originTxHash=${hash}`)
                .then(r => r.json())
                .then(data => {
                  if (!data || data.error || data.name) return;
                  const steps = data.steps || [];
                  const last = steps[steps.length - 1];
                  const rawTxs = data.transactions || [];
                  const destTx = last?.transactions?.[last.transactions?.length - 1]
                    || (rawTxs.length > 1 ? rawTxs[rawTxs.length - 1] : null);
                  if (!destTx?.txHash || !destTx?.chainId) return;
                  recentEnriched.current[hash] = {
                    dst_tx_hash: destTx.txHash,
                    dst_chain_id: destTx.chainId,
                    dst_chain: destTx.chain || "",
                  };
                  setRecent(prev => [...prev]);
                })
                .catch(() => {});
            });
            setRecentLoad(false);
          })
          .catch(() => setRecentLoad(false));
      });
  }, []);

  // Fetch aggregate stats
  useEffect(() => {
    fetch("/api/stats")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setStats(d); })
      .catch(() => {});
  }, []);

  // Fetch pending transactions and verify each against live API before displaying
  // API is the source of truth for status — never show a tx as pending if the API says otherwise
  useEffect(() => {
    fetch("/api/pending")
      .then(r => r.ok ? r.json() : null)
      .then(async (d) => {
        if (!d?.rows?.length) {
          setPending([]);
          setPendingLoad(false);
          return;
        }

        const TERMINAL = new Set(["bridge_filled", "bridge_failed", "origin_tx_reverted"]);
        const rows = d.rows;

        // Verify ALL rows against the live API in parallel (with 5s timeout each)
        const verified = await Promise.allSettled(
          rows.map(async (row) => {
            if (!row.originTx || !row.originChain) return row; // can't verify, keep it
            try {
              const controller = new AbortController();
              const timeout = setTimeout(() => controller.abort(), 5000);
              const res = await fetch(
                `/api/status-direct?originChain=${row.originChain}&originTxHash=${row.originTx}`,
                { signal: controller.signal }
              );
              clearTimeout(timeout);
              if (!res.ok) return row; // API error, keep it as pending
              const live = await res.json();
              if (!live || live.error || live.name) return row; // API error, keep it
              if (TERMINAL.has(live.status)) return null; // terminal — remove it
              return row; // still pending
            } catch {
              return row; // fetch failed, keep it as pending
            }
          })
        );

        // Filter to only truly pending rows
        const stillPending = verified
          .map(r => r.status === "fulfilled" ? r.value : null)
          .filter(Boolean);

        setPending(stillPending);
        setPendingLoad(false);
      })
      .catch(() => setPendingLoad(false));
  }, []);

  // Fetch top wallets when tab is selected or period changes
  const fetchTopWallets = (period) => {
    setTopWalletsLoad(true);
    fetch(`/api/top-wallets?period=${period}&limit=25`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.wallets) setTopWallets(d.wallets);
        setTopWalletsLoad(false);
      })
      .catch(() => setTopWalletsLoad(false));
  };

  useEffect(() => {
    if (homeTab === "wallets" && topWallets.length === 0) {
      fetchTopWallets(topWalletsPeriod);
    }
  }, [homeTab]);

  const handlePeriodChange = (p) => {
    setTopWalletsPeriod(p);
    fetchTopWallets(p);
  };

  const handleRecentClick = (row) => {
    const chain = getChain(row.chain_id);
    if (chain?.explorer) {
      window.open(chain.explorer + row.tx_hash, "_blank", "noopener noreferrer");
    }
  };

  const handleRecentSearch = (e, row) => {
    e.stopPropagation();
    const hash = row.src_tx_hash || row.tx_hash;
    if (!hash) return;
    const cid = String(row.chain_id);
    setChainId(cid);
    setInput(hash);
    setResult(null);
    setError(null);
    window.history.pushState({ chainId: cid, txHash: hash }, "", `?chain=${cid}&tx=${hash}`);
    doSearch(cid, hash);
  };

  const fetchTokenInfo = (address, chainId) => {
    if (!address || !chainId) return;
    const key = `${address.toLowerCase()}_${chainId}`;
    if (tokenCache[key] || tokenFetching.current.has(key)) return;
    const NATIVE = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
    if (address.toLowerCase() === NATIVE) return;
    // Only fetch if not already in our static TOKENS map
    if (TOKENS[address.toLowerCase()]) return;
    tokenFetching.current.add(key);
    fetch(`/api/token-info?address=${address}&chainId=${chainId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.symbol) {
          setTokenCache(prev => ({ ...prev, [key]: { s: data.symbol, d: data.decimals ?? 18 } }));
        }
        tokenFetching.current.delete(key);
      })
      .catch(() => tokenFetching.current.delete(key));
  };
  const msgInterval = useRef(null);

  // Sync system preference
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const h = e => setSystemDark(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  // Apply theme — mutate C so all components pick it up on re-render
  const isDark = themeMode === "dark" || (themeMode === "system" && systemDark);
  C = isDark ? THEMES.dark : THEMES.light;

  const inputKind = detectInput(input);

  const startLoadingMessages = () => {
    let i = 0;
    setLoadMsg(LOADING_MSGS[0]);
    msgInterval.current = setInterval(() => {
      i = (i + 1) % LOADING_MSGS.length;
      setLoadMsg(LOADING_MSGS[i]);
    }, 900);
  };

  const stopLoadingMessages = () => {
    clearInterval(msgInterval.current);
    setLoadMsg("");
  };

  const fillDemo = () => {
    setInput("0x3795c89705725964aa6d4c41ea044222d8d8be4a2ceb4abc4d146179d4da6623");
    setChainId("8453");
    setResult(null); setError(null);
  };

  const doWalletSearch = async (addr, cursor = null, filters = null) => {
    if (!addr) return;
    setWalletLoad(true);
    setWalletAddr(addr);
    if (!cursor) setWalletData(null);
    setResult(null);
    setError(null);
    const f = filters || walletFilters;
    try {
      // Try ClickHouse-powered wallet history first
      const params = new URLSearchParams({ user: addr, limit: "50" });
      if (cursor) params.set("cursor", cursor);
      if (f.status) params.set("status", f.status);
      if (f.chain) params.set("chain", f.chain);
      if (f.bridge) params.set("bridge", f.bridge);
      if (f.after) params.set("after", f.after);
      if (f.before) params.set("before", f.before);

      let res = await fetch(`/api/wallet-ch?${params}`);
      let data = await res.json();

      // If ClickHouse fails or returns error, fall back to tx-history-beta (no filter support)
      if (!res.ok || data.error) {
        const fallbackParams = new URLSearchParams({ user: addr, limit: "50" });
        if (cursor) fallbackParams.set("cursor", cursor);
        res = await fetch(`/api/wallet?${fallbackParams}`);
        data = await res.json();
      }

      if (data.error || data.name) {
        setError(data.message || data.error || "Failed to fetch wallet history");
        setWalletData(null);
      } else {
        if (cursor) {
          setWalletData(prev => ({
            ...data,
            transactions: [...(prev?.transactions || []), ...(data.transactions || [])],
          }));
        } else {
          setWalletData(data);
        }
        setWalletCursor(data.pagination?.hasMore ? data.pagination?.nextCursor : null);
      }
    } catch (e) {
      setError("Failed to fetch wallet history");
    } finally {
      setWalletLoad(false);
    }
  };

  const handleWalletFilter = (newFilters) => {
    setWalletFilters(newFilters);
    if (walletAddr) doWalletSearch(walletAddr, null, newFilters);
  };

  // Statuses that should trigger auto-refresh
  const PENDING_STATUSES = new Set(["bridge_pending", "origin_tx_pending", "origin_tx_succeeded", "origin_tx_confirmed"]);

  const stopAutoRefresh = () => {
    if (autoRefreshRef.current) {
      clearInterval(autoRefreshRef.current);
      autoRefreshRef.current = null;
    }
    setAutoRefreshCount(0);
  };

  const doSearch = async (cid, hash, isAutoRefresh = false) => {
    if (!hash || !cid) return;
    if (!isAutoRefresh) {
      setWalletData(null);
      setWalletAddr(null);
      stopAutoRefresh();
    }
    const val = hash.trim();
    if (!val) return;
    if (!isAutoRefresh) {
      setLoading(true);
      setError(null);
      setResult(null);
      startLoadingMessages();
    }
    try {
      const params = new URLSearchParams({ originChain: cid, originTxHash: val });
      const res  = await fetch(`/api/status-direct?${params}`);
      const data = await res.json();
      if (!res.ok || data.error || data.name) {
        // Handle the pending bridge case — show as pending result, not an error
        if (data._pending) {
          setResult({ status: "bridge_pending", bridge: null, transactions: [], steps: [], zid: data.zid, _pending: true });
          if (!autoRefreshRef.current) {
            autoRefreshRef.current = setInterval(() => {
              setAutoRefreshCount(c => c + 1);
              doSearch(cid, val, true);
            }, 15000);
          }
          return;
        }
        throw new Error(data.message || data.error || "Transaction not found. Make sure you selected the correct origin chain.");
      }
      // Handle pending bridge state returned from server
      if (data._pending) {
        setResult({ status: "bridge_pending", bridge: null, transactions: [], steps: [], zid: data.zid, _pending: true });
        if (!autoRefreshRef.current) {
          autoRefreshRef.current = setInterval(() => {
            setAutoRefreshCount(c => c + 1);
            doSearch(cid, val, true);
          }, 15000);
        }
        return;
      }

      setResult(data);

      // If status is still in-flight, start auto-refresh
      if (PENDING_STATUSES.has(data.status)) {
        if (!autoRefreshRef.current) {
          autoRefreshRef.current = setInterval(() => {
            setAutoRefreshCount(c => c + 1);
            doSearch(cid, val, true);
          }, 15000);
        }
      } else {
        // Terminal status — stop polling
        stopAutoRefresh();
      }

      if (data?.steps?.length) {
        data.steps.forEach(step => {
          const stepCid = step.transactions?.[0]?.chainId;
          if (step.sellToken) fetchTokenInfo(step.sellToken, stepCid);
          if (step.buyToken) fetchTokenInfo(step.buyToken, step.destinationChainId || stepCid);
        });
      }
      // Also fetch token info from _tokenSummary (covers cases where steps parsing missed something)
      const ts = data._tokenSummary;
      if (ts) {
        if (ts.sellToken && ts.originChainId) fetchTokenInfo(ts.sellToken, ts.originChainId);
        if (ts.buyToken && ts.destinationChainId) fetchTokenInfo(ts.buyToken, ts.destinationChainId);
      }
    } catch (e) {
      if (!isAutoRefresh) setError(e.message);
    } finally {
      if (!isAutoRefresh) setLoading(false);
    }
  };

  // Clean up auto-refresh on unmount
  useEffect(() => { return () => stopAutoRefresh(); }, []);

  // Handle browser back/forward
  useEffect(() => {
    const onPop = (e) => {
      const state = e.state;
      if (state?.chainId && state?.txHash) {
        setChainId(state.chainId);
        setInput(state.txHash);
        setWalletData(null);
        setWalletAddr(null);
        doSearch(state.chainId, state.txHash);
      } else if (state?.wallet) {
        setResult(null);
        setError(null);
        setInput(state.wallet);
        doWalletSearch(state.wallet);
      } else {
        // Back to homepage
        setResult(null);
        setError(null);
        setWalletData(null);
        setWalletAddr(null);
        setInput("");
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // On mount, check if URL has params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const chain = params.get("chain");
    const tx    = params.get("tx");
    const wallet = params.get("wallet");
    if (chain && tx) {
      setChainId(chain);
      setInput(tx);
      doSearch(chain, tx);
    } else if (wallet) {
      setInput(wallet);
      doWalletSearch(wallet);
    }
  }, []);

  const handleSearch = async () => {
    const val = input.trim();
    if (!val || inputKind === "empty" || inputKind === "partial") return;
    if (inputKind === "svm_txhash") { setError("Solana transaction lookup coming soon — Solana is currently only supported as a destination chain."); return; }
    if (inputKind === "ens") {
      setResult(null);
      setError(null);
      setLoading(true);
      setLoadMsg("Resolving ENS name…");
      try {
        const res = await fetch(`/api/resolve-ens?name=${encodeURIComponent(val)}`);
        const data = await res.json();
        if (!res.ok || !data.address) {
          setError(`Could not resolve "${val}" — ENS name not found.`);
          setLoading(false);
          return;
        }
        setInput(data.address);
        setLoading(false);
        window.history.pushState({ wallet: data.address }, "", `?wallet=${data.address}`);
        doWalletSearch(data.address);
      } catch {
        setError("ENS resolution failed. Please try again.");
        setLoading(false);
      }
      return;
    }
    if (inputKind === "address" || inputKind === "svm_address") {
      setResult(null);
      setError(null);
      window.history.pushState({ wallet: val }, "", `?wallet=${val}`);
      doWalletSearch(val);
      return;
    }
    window.history.pushState({ chainId, txHash: val }, "", `?chain=${chainId}&tx=${val}`);
    doSearch(chainId, val);
  };

  const handleKey = (e) => { if (e.key === "Enter") handleSearch(); };

  const canSearch = (inputKind === "txhash" || inputKind === "svm_txhash" || inputKind === "address" || inputKind === "svm_address" || inputKind === "ens") && !loading;

  const hint = {
    txhash:     { text: "✓ EVM transaction hash", color: C.green },
    svm_txhash: { text: "✓ Solana transaction signature", color: C.green },
    svm_address:{ text: "✓ Solana wallet address — press Search to view history", color: C.green },
    address:    { text: "✓ EVM wallet address — press Search to view history", color: C.green },
    ens:        { text: "✓ ENS name — press Search to resolve and view history", color: C.green },
    partial:    { text: `${input.trim().length} chars — EVM tx hash is 66, Solana sig is ~88`, color: C.textDim },
    empty:      null,
  }[inputKind];

  return (
    <PasswordGate>
    <div style={{ minHeight:"100vh", background:C.bg, color:C.text, fontFamily:"'Manrope', sans-serif", transition:"background 0.2s, color 0.2s" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.85)} }
        @keyframes scan { 0%{left:-40%} 100%{left:140%} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes glow { 0%,100%{box-shadow:0 0 20px ${C.gradEnd}18} 50%{box-shadow:0 0 36px ${C.gradEnd}30} }
        ::placeholder { color: ${C.textDim}; }
        ::-webkit-scrollbar { width:4px; } ::-webkit-scrollbar-track { background:${C.bg}; } ::-webkit-scrollbar-thumb { background:${C.border2}; border-radius:4px; }
        select option { background:${C.surface}; color:${C.text}; }
        select { color-scheme: ${isDark ? "dark" : "light"}; }
        a { color: inherit; }
        body { background-image: radial-gradient(${C.dotGrid} 1px, transparent 1px); background-size: 28px 28px; }

        /* ── Mobile responsive ── */
        @media (max-width: 640px) {
          .pipeline-row { flex-direction: column !important; }
          .pipeline-connector { padding: 8px 0 !important; flex-direction: row !important; }
          .pipeline-connector > div { width: 12px !important; height: 1px !important; }
          .pipeline-connector > span { transform: rotate(90deg); }
          .nav-bar { padding: 0 14px !important; }
          .nav-title { font-size: 13px !important; }
          .nav-extras { display: none !important; }
          .body-container { padding: 0 14px 60px !important; }
          .search-input { font-size: 13px !important; }
          .recent-row { flex-wrap: wrap !important; gap: 6px !important; padding: 10px 12px !important; }
          .recent-route { width: auto !important; }
          .recent-volume { width: auto !important; }
          .recent-meta { width: 100% !important; margin-left: 0 !important; justify-content: space-between !important; }
          .wallet-grid { grid-template-columns: 1fr !important; gap: 6px !important; }
          .wallet-grid-header { display: none !important; }
          .wallet-row { grid-template-columns: 1fr !important; gap: 6px !important; padding: 12px !important; }
          .wallet-row-src, .wallet-row-arrow, .wallet-row-dst { display: inline-flex !important; }
          .wallet-row-flow { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
          .info-cards { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── Nav ── */}
      <nav className="nav-bar" style={{ borderBottom:`1px solid ${C.border}`, padding:"0 32px", height:56, display:"flex", alignItems:"center", justifyContent:"space-between", background:C.bg+"ee", backdropFilter:"blur(12px)", position:"sticky", top:0, zIndex:50 }}>
        <div
          style={{ display:"flex", alignItems:"center", gap:12, cursor:"pointer" }}
          onClick={() => { setResult(null); setError(null); setInput(""); setChainId("8453"); setWalletData(null); setWalletAddr(null); setWalletCursor(null); setWalletFilters({}); stopAutoRefresh(); window.history.pushState({}, "", "/"); }}
        >
          <div style={{ width:28, height:28, background:C.greenDim, border:`1px solid ${C.gradEnd}50`, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>⬡</div>
          <span className="nav-title" style={{ fontWeight:800, fontSize:15, letterSpacing:"-0.02em" }}>0x Cross-Chain Explorer</span>
          <span style={{ fontSize:9, fontFamily:"'IBM Plex Mono', monospace", color:C.textDim, background:C.surface, border:`1px solid ${C.border}`, borderRadius:4, padding:"2px 7px", letterSpacing:"0.1em" }}>BETA</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, fontFamily:"'IBM Plex Mono', monospace", fontSize:11, color:C.gradStart }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:C.gradStart, animation:"pulse 1.4s ease-in-out infinite", display:"inline-block" }} />
            22 chains live
          </div>
          <a href="https://0x.org" target="_blank" rel="noopener noreferrer" style={{ fontSize:11, color:C.textDim, textDecoration:"none", fontFamily:"'IBM Plex Mono', monospace", letterSpacing:"0.03em" }}
            onMouseEnter={e=>e.currentTarget.style.color=C.textSub} onMouseLeave={e=>e.currentTarget.style.color=C.textDim}
          >Powered by 0x ↗</a>
          <ThemeToggle mode={themeMode} setMode={setThemeMode} />
        </div>
      </nav>

      {/* ── Hero ── */}
      <div style={{ padding:"72px 24px 60px", textAlign:"center", maxWidth:700, margin:"0 auto" }}>
        <div style={{ display:"inline-block", fontFamily:"'IBM Plex Mono', monospace", fontSize:11, color:C.gradStart, letterSpacing:"0.15em", marginBottom:20, opacity:0.9 }}>
          // CROSS-CHAIN TRANSACTION EXPLORER
        </div>
        <h1 style={{ fontSize:"clamp(32px, 5vw, 52px)", fontWeight:800, letterSpacing:"-0.03em", lineHeight:1.1, marginBottom:16 }}>
          0x Cross-Chain<br />
          <span key={isDark?"lookup-dark":"lookup-light"} style={{ background:C.grad, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text", display:"inline-block" }}>Explorer</span>
        </h1>
        <p style={{ fontSize:16, color:C.textSub, lineHeight:1.7, marginBottom:44, maxWidth:460, margin:"0 auto 44px" }}>
          Paste a transaction hash or wallet address. We'll trace the full route — swap, bridge, delivery — step by step.
        </p>

        {/* ── Search ── */}
        <div style={{
          background: C.surface,
          border: `1px solid ${focused ? C.gradEnd+"70" : C.border}`,
          borderRadius: 14,
          overflow: "hidden",
          transition: "border-color 0.2s",
          boxShadow: focused ? `0 0 0 3px ${C.gradEnd}18` : "none",
          animation: "glow 3s ease-in-out infinite",
        }}>
          <div style={{ display:"flex", gap:0 }}>
            {/* Input */}
            <input
              value={input}
              onChange={e => {
                const v = e.target.value;
                setInput(v);
                setResult(null);
                setError(null);
                // Auto-detect chain when a full EVM tx hash is pasted
                if (/^0x[0-9a-fA-F]{64}$/.test(v.trim())) {
                  setDetecting(true);
                  fetch(`/api/detect-chain?txHash=${v.trim()}`)
                    .then(r => r.json())
                    .then(d => { if (d.chainId) setChainId(String(d.chainId)); })
                    .catch(() => {})
                    .finally(() => setDetecting(false));
                }
              }}
              onKeyDown={handleKey}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Transaction hash or wallet address…"
              style={{ flex:1, background:C.inputBg, border:"none", outline:"none", padding:"14px 16px", fontSize:14, color:C.text, fontFamily:"'IBM Plex Mono', monospace", minWidth:0 }}
            />

            {/* Button */}
            <button
              onClick={handleSearch}
              disabled={!canSearch}
              style={{
                background: canSearch ? C.grad : C.surface2,
                color: canSearch ? C.bg : C.textDim,
                border:"none", padding:"14px 24px", cursor: canSearch ? "pointer" : "not-allowed",
                fontSize:13, fontWeight:800, fontFamily:"'Manrope', sans-serif",
                letterSpacing:"-0.01em", transition:"all 0.15s", flexShrink:0,
                display:"flex", alignItems:"center", gap:8,
              }}
              onMouseEnter={e => { if (canSearch && !loading) e.currentTarget.style.filter="brightness(0.9)"; }}
              onMouseLeave={e => { e.currentTarget.style.filter="none"; }}
            >
              {loading
                ? <span style={{ width:16, height:16, border:`2px solid ${C.bg}50`, borderTopColor:C.bg, borderRadius:"50%", animation:"spin 0.7s linear infinite", display:"inline-block" }} />
                : "SEARCH"
              }
            </button>
          </div>

          {/* Scan bar while loading */}
          {loading && <ScanBar />}

          {/* Hint or loading message */}
          {(hint || loadMsg) && (
            <div style={{ padding:"8px 16px", borderTop:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:8 }}>
              {loading
                ? <span key={isDark?"load-dark":"load-light"} style={{ fontSize:11, fontFamily:"'IBM Plex Mono', monospace", background:C.grad, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text", display:"inline-block" }}>{loadMsg}<span style={{ WebkitTextFillColor:C.gradStart, animation:"blink 0.8s step-end infinite" }}>_</span></span>
                : hint && <span key={isDark?"hint-dark":"hint-light"} style={{ fontSize:11, fontFamily:"'IBM Plex Mono', monospace", ...(hint.color===C.green ? {background:C.grad, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text", display:"inline-block"} : {color:hint.color}) }}>{hint.text}</span>
              }
            </div>
          )}
        </div>

        {/* Demo link */}
        <div style={{ marginTop:16, display:"flex", alignItems:"center", justifyContent:"center", gap:12 }}>
          <button onClick={fillDemo} style={{ background:"none", border:"none", cursor:"pointer", fontSize:12, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace", textDecoration:"underline", textDecorationColor:C.border2 }}
            onMouseEnter={e=>e.target.style.color=C.textSub} onMouseLeave={e=>e.target.style.color=C.textDim}
          >try a real transaction</button>

        </div>
      </div>

      {/* ── Body ── */}
      <div className="body-container" style={{ maxWidth:700, margin:"0 auto", padding:"0 24px 80px" }}>

        {/* Error */}
        {error && (
          <div style={{ background:"#FF4D6A08", border:`1px solid ${C.red}35`, borderRadius:12, padding:"16px 20px", marginBottom:24, display:"flex", gap:12, animation:"fadeUp 0.25s ease-out" }}>
            <span style={{ color:C.red, flexShrink:0, fontFamily:"'IBM Plex Mono', monospace" }}>ERR</span>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:C.red, marginBottom:4, fontFamily:"'IBM Plex Mono', monospace" }}>Transaction not found</div>
              <div style={{ fontSize:12, color:C.red, opacity:0.7, lineHeight:1.5 }}>{error}</div>
            </div>
          </div>
        )}

        {/* Wallet History */}
        {walletData && !result && (
          <WalletHistory
            data={walletData}
            walletAddr={walletAddr}
            loading={walletLoad}
            cursor={walletCursor}
            onLoadMore={() => doWalletSearch(walletAddr, walletCursor)}
            onFilter={handleWalletFilter}
            activeFilters={walletFilters}
            onTrace={(cid, txHash) => {
              if (!txHash) return;
              setWalletData(null);
              setWalletAddr(null);
              setChainId(String(cid));
              setInput(txHash);
              window.history.pushState({}, "", `?chain=${cid}&tx=${txHash}`);
              doSearch(String(cid), txHash);
            }}
          />
        )}

        {/* Result */}
        {autoRefreshRef.current && (
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 14px", background:C.blue+"12", border:`1px solid ${C.blue}30`, borderRadius:8, marginBottom:10, fontFamily:"'IBM Plex Mono', monospace", fontSize:10 }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:C.blue, animation:"pulse 1.5s ease-in-out infinite" }} />
            <span style={{ color:C.blue }}>Auto-refreshing every 15s…</span>
            <span style={{ color:C.textDim }}>(poll #{autoRefreshCount})</span>
            <button onClick={stopAutoRefresh} style={{ marginLeft:"auto", background:"none", border:`1px solid ${C.blue}40`, borderRadius:4, color:C.blue, fontSize:9, padding:"2px 8px", cursor:"pointer", fontFamily:"inherit" }}>stop</button>
          </div>
        )}
        {result && <Result data={result} tokenCache={tokenCache} />}

        {/* Empty state + Recent feed */}
        {!result && !error && !loading && !walletData && (
          <div style={{ animation:"fadeUp 0.4s ease-out 0.1s both" }}>

            {/* Stats banner */}
            {stats && (
              <div style={{ display:"flex", gap:12, marginBottom:20, alignItems:"stretch" }}>
                <div style={{ flex:2, background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"20px 24px" }}>
                  <div style={{ fontSize:9, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace", letterSpacing:"0.1em", marginBottom:8 }}>TOTAL CROSS-CHAIN VOLUME</div>
                  <div style={{ fontSize:32, fontWeight:700, fontFamily:"'IBM Plex Mono', monospace", color:C.green }}>
                    ${stats.totalVolume >= 1e6 ? (stats.totalVolume / 1e6).toFixed(1) + "M" : stats.totalVolume >= 1e3 ? Math.round(stats.totalVolume / 1e3).toLocaleString() + "K" : Math.round(stats.totalVolume).toLocaleString()}
                  </div>
                  <div style={{ fontSize:11, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace", marginTop:6 }}>across {stats.totalTrades.toLocaleString()} trades</div>
                </div>
                <div style={{ flex:1, display:"flex", flexDirection:"column", gap:12 }}>
                  <div style={{ flex:1, background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"14px 18px" }}>
                    <div style={{ fontSize:9, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace", letterSpacing:"0.1em", marginBottom:4 }}>24H VOLUME</div>
                    <div style={{ fontSize:18, fontWeight:700, fontFamily:"'IBM Plex Mono', monospace", color:C.text }}>
                      ${stats.volume24h >= 1e6 ? (stats.volume24h / 1e6).toFixed(1) + "M" : stats.volume24h >= 1e3 ? Math.round(stats.volume24h / 1e3).toLocaleString() + "K" : Math.round(stats.volume24h).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ flex:1, background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"14px 18px" }}>
                    <div style={{ fontSize:9, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace", letterSpacing:"0.1em", marginBottom:4 }}>24H TRADES</div>
                    <div style={{ fontSize:18, fontWeight:700, fontFamily:"'IBM Plex Mono', monospace", color:C.text }}>
                      {stats.trades24h.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab bar */}
            <div style={{ display:"flex", gap:0, marginBottom:16, borderBottom:`1px solid ${C.border}` }}>
              <button
                onClick={() => setHomeTab("recent")}
                style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:10, letterSpacing:"0.08em", color: homeTab==="recent" ? C.green : C.textDim, background:"none", border:"none", borderBottom: homeTab==="recent" ? `2px solid ${C.green}` : "2px solid transparent", padding:"8px 16px", cursor:"pointer", fontWeight: homeTab==="recent" ? 700 : 400 }}
              >RECENT</button>
              <button
                onClick={() => setHomeTab("pending")}
                style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:10, letterSpacing:"0.08em", color: homeTab==="pending" ? C.amber : C.textDim, background:"none", border:"none", borderBottom: homeTab==="pending" ? `2px solid ${C.amber}` : "2px solid transparent", padding:"8px 16px", cursor:"pointer", fontWeight: homeTab==="pending" ? 700 : 400, display:"flex", alignItems:"center", gap:6 }}
              >PENDING {pending.length > 0 && <span style={{ fontSize:9, color:C.amber, background:C.amber+"18", border:`1px solid ${C.amber}35`, borderRadius:4, padding:"0px 6px" }}>{pending.length}</span>}</button>
              <button
                onClick={() => setHomeTab("wallets")}
                style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:10, letterSpacing:"0.08em", color: homeTab==="wallets" ? C.gradEnd : C.textDim, background:"none", border:"none", borderBottom: homeTab==="wallets" ? `2px solid ${C.gradEnd}` : "2px solid transparent", padding:"8px 16px", cursor:"pointer", fontWeight: homeTab==="wallets" ? 700 : 400 }}
              >TOP WALLETS</button>
            </div>

            {/* Pending tab */}
            {homeTab === "pending" && (
              <div style={{ marginBottom:40 }}>
                {pendingLoad ? (
                  <div style={{ fontSize:11, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace" }}>Loading…</div>
                ) : pending.length === 0 ? (
                  <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"40px", textAlign:"center", fontFamily:"'IBM Plex Mono', monospace", fontSize:11, color:C.textDim }}>
                    No pending transactions in the last 7 days.
                  </div>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    {pending.map((row, i) => {
                      const srcChain = getChain(row.originChain);
                      const dstChain = getChain(row.destinationChain);
                      const ts = row.timestamp ? new Date(row.timestamp.endsWith("Z") ? row.timestamp : row.timestamp + "Z") : null;
                      const timeStr = ts ? ts.toLocaleString("en-US", { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit", timeZone:"UTC" }) + " UTC" : "";
                      const STABLES_SET2 = new Set(["USDC","USDT","DAI","BUSD","USDS","FRAX","LUSD","PYUSD","USDC.e","USD₮0","pathUSD","USDT0","AUSD","sUSDai","USR","BRLA","crvUSD"]);
                      let volStr = null;
                      if (row.volumeUsd) {
                        volStr = "$" + Number(row.volumeUsd).toLocaleString("en-US", { maximumFractionDigits:0 });
                      } else if (row.sellAmount && STABLES_SET2.has(row.sellTokenSymbol)) {
                        volStr = "$" + Number(row.sellAmount).toLocaleString("en-US", { maximumFractionDigits:0 });
                      } else if (row.buyAmount && STABLES_SET2.has(row.buyTokenSymbol)) {
                        volStr = "$" + Number(row.buyAmount).toLocaleString("en-US", { maximumFractionDigits:0 });
                      }
                      const bridge = row.bridge ? row.bridge.replace(/_/g," ") : null;
                      const age = ts ? Math.round((Date.now() - ts.getTime()) / (1000 * 60 * 60)) : null;
                      const ageStr = age !== null ? (age < 24 ? `${age}h ago` : `${Math.round(age / 24)}d ago`) : "";
                      const statusLabel = row.status === "bridge_pending" ? "pending" : row.status === "origin_tx_confirmed" ? "confirmed" : row.status === "status_api_error" ? "api error" : row.status?.replace(/_/g," ") || "unknown";
                      const walletShort = row.originAddress ? row.originAddress.slice(0,6)+"…"+row.originAddress.slice(-4) : "";

                      return (
                        <div
                          key={i}
                          onClick={() => {
                            if (!row.originTx || !row.originChain) return;
                            setChainId(String(row.originChain));
                            setInput(row.originTx);
                            window.history.pushState({}, "", `?chain=${row.originChain}&tx=${row.originTx}`);
                            doSearch(String(row.originChain), row.originTx);
                          }}
                          style={{
                            background:C.surface, border:`1px solid ${C.amber}25`, borderRadius:10,
                            padding:"11px 16px", display:"flex", alignItems:"center",
                            gap:10, transition:"border-color 0.15s", cursor:"pointer",
                          }}
                          onMouseEnter={e => e.currentTarget.style.borderColor=C.amber}
                          onMouseLeave={e => e.currentTarget.style.borderColor=C.amber+"25"}
                        >
                          {/* Route */}
                          <div style={{ display:"flex", alignItems:"center", flexShrink:0 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:6, width:110 }}>
                              {srcChain?.logo
                                ? <img src={srcChain.logo} alt="" style={{ width:18, height:18, borderRadius:"50%", flexShrink:0 }} />
                                : <span style={{ width:18, height:18, borderRadius:"50%", background:C.surface2, flexShrink:0, display:"inline-block" }} />
                              }
                              <span style={{ fontSize:11, fontFamily:"'IBM Plex Mono', monospace", color:C.textSub, fontWeight:600 }}>{srcChain?.short || String(row.originChain)}</span>
                            </div>
                            <div style={{ display:"flex", alignItems:"center", gap:6, width:110 }}>
                              {dstChain?.logo
                                ? <img src={dstChain.logo} alt="" style={{ width:18, height:18, borderRadius:"50%", flexShrink:0 }} />
                                : <span style={{ width:18, height:18, borderRadius:"50%", background:C.surface2, flexShrink:0, display:"inline-block" }} />
                              }
                              <span style={{ fontSize:11, fontFamily:"'IBM Plex Mono', monospace", color:C.textSub, fontWeight:600 }}>{dstChain?.short || String(row.destinationChain || "?")}</span>
                            </div>
                          </div>

                          {/* Volume */}
                          <span style={{ fontSize:10, fontFamily:"'IBM Plex Mono', monospace", color:C.amber, fontWeight:600, flexShrink:0, width:85 }}>{volStr || ""}</span>

                          {/* Status + bridge + app + wallet + age */}
                          <div style={{ display:"flex", alignItems:"center", gap:6, flex:"1 1 0", minWidth:0, overflow:"hidden" }}>
                            <span style={{ fontSize:9, fontFamily:"'IBM Plex Mono', monospace", color:C.amber, fontWeight:600, textTransform:"uppercase" }}>{statusLabel}</span>
                            {bridge && <span style={{ fontSize:8, fontFamily:"'IBM Plex Mono', monospace", color:C.textDim, background:C.surface2, borderRadius:3, padding:"1px 5px", whiteSpace:"nowrap" }}>{bridge}</span>}
                            {row.appName && <span style={{ fontSize:8, fontFamily:"'IBM Plex Mono', monospace", color:C.gradEnd, background:C.gradEnd+"12", borderRadius:3, padding:"1px 5px", whiteSpace:"nowrap" }}>{cleanAppName(row.appName)}</span>}
                            {walletShort && <span style={{ fontSize:9, fontFamily:"'IBM Plex Mono', monospace", color:C.textDim, opacity:0.5 }}>{walletShort}</span>}
                          </div>

                          {/* Time + trace */}
                          <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                            <span style={{ fontSize:10, fontFamily:"'IBM Plex Mono', monospace", color:C.textDim }}>{ageStr}</span>
                            <span style={{ fontSize:10, color:C.textDim, padding:"2px 8px", border:`1px solid ${C.border}`, borderRadius:4, fontFamily:"'IBM Plex Mono', monospace", whiteSpace:"nowrap" }}>trace</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Top Wallets tab */}
            {homeTab === "wallets" && (
              <div style={{ marginBottom:40 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                  <div style={{ fontSize:9, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace", letterSpacing:"0.12em" }}>// TOP WALLETS BY VOLUME</div>
                  <div style={{ display:"flex", gap:4 }}>
                    {["7d","30d","90d","all"].map(p => (
                      <button key={p} onClick={() => handlePeriodChange(p)}
                        style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:9, color: topWalletsPeriod === p ? C.gradEnd : C.textDim, background: topWalletsPeriod === p ? C.gradEnd+"15" : "none", border:`1px solid ${topWalletsPeriod === p ? C.gradEnd+"40" : C.border}`, borderRadius:4, padding:"3px 10px", cursor:"pointer", fontWeight: topWalletsPeriod === p ? 700 : 400 }}
                      >{p === "all" ? "ALL TIME" : p.toUpperCase()}</button>
                    ))}
                  </div>
                </div>

                {topWalletsLoad ? (
                  <div style={{ fontSize:11, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace" }}>Loading top wallets…</div>
                ) : topWallets.length === 0 ? (
                  <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"40px", textAlign:"center", fontFamily:"'IBM Plex Mono', monospace", fontSize:11, color:C.textDim }}>
                    No wallet data found for this period.
                  </div>
                ) : (
                  <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden" }}>
                    {/* Header */}
                    <div style={{ display:"grid", gridTemplateColumns:"40px 1fr 100px 70px 85px 85px 120px", gap:8, padding:"10px 16px", borderBottom:`1px solid ${C.border}`, background:C.surface2 }}>
                      {["#","WALLET","VOLUME","TRADES","BRIDGE","INTEGRATOR","LAST ACTIVE"].map((h,i) => (
                        <div key={i} style={{ fontSize:9, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace", letterSpacing:"0.1em" }}>{h}</div>
                      ))}
                    </div>
                    {/* Rows */}
                    {topWallets.map((w, i) => {
                      const volStr = w.totalVolume >= 1e6 ? "$" + (w.totalVolume / 1e6).toFixed(1) + "M"
                        : w.totalVolume >= 1e3 ? "$" + Math.round(w.totalVolume / 1e3).toLocaleString() + "K"
                        : "$" + Math.round(w.totalVolume).toLocaleString();
                      const lastTs = w.lastActive ? new Date(w.lastActive + "Z") : null;
                      const lastStr = lastTs ? lastTs.toLocaleDateString("en-US", { month:"short", day:"numeric" }) + ", " + lastTs.toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit", timeZone:"UTC" }) + " UTC" : "—";
                      const addrShort = w.address ? w.address.slice(0,6) + "…" + w.address.slice(-4) : "—";
                      const bridge = w.topBridge ? w.topBridge.replace(/_/g," ") : null;
                      const app = w.topApp ? cleanAppName(w.topApp) : null;
                      return (
                        <div key={i}
                          style={{ display:"grid", gridTemplateColumns:"40px 1fr 100px 70px 85px 85px 120px", gap:8, padding:"11px 16px", borderBottom: i < topWallets.length - 1 ? `1px solid ${C.border}` : "none", alignItems:"center", cursor:"pointer", transition:"background 0.15s" }}
                          onMouseEnter={e => e.currentTarget.style.background = C.surface2}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                          onClick={() => {
                            setInput(w.address);
                            window.history.pushState({ wallet: w.address }, "", `?wallet=${w.address}`);
                            doWalletSearch(w.address);
                          }}
                        >
                          {/* Rank */}
                          <span style={{ fontSize:12, fontFamily:"'IBM Plex Mono', monospace", color: i < 3 ? C.gradEnd : C.textDim, fontWeight: i < 3 ? 700 : 400 }}>{w.rank}</span>

                          {/* Wallet */}
                          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                            <span style={{ fontSize:11, fontFamily:"'IBM Plex Mono', monospace", color:C.blue }}>{addrShort}</span>
                            <span
                              onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(w.address); }}
                              style={{ fontSize:9, color:C.textDim, border:`1px solid ${C.border}`, borderRadius:3, padding:"1px 5px", cursor:"pointer", fontFamily:"'IBM Plex Mono', monospace" }}
                            >copy</span>
                          </div>

                          {/* Volume */}
                          <span style={{ fontSize:11, fontFamily:"'IBM Plex Mono', monospace", color:C.green, fontWeight:600 }}>{volStr}</span>

                          {/* Trades */}
                          <span style={{ fontSize:11, fontFamily:"'IBM Plex Mono', monospace", color:C.textSub }}>{w.tradeCount.toLocaleString()}</span>

                          {/* Bridge */}
                          <div>
                            {bridge && <span style={{ fontSize:8, fontFamily:"'IBM Plex Mono', monospace", color:C.textDim, background:C.surface2, borderRadius:3, padding:"1px 5px", whiteSpace:"nowrap" }}>{bridge}</span>}
                          </div>

                          {/* Integrator */}
                          <div>
                            {app && <span style={{ fontSize:8, fontFamily:"'IBM Plex Mono', monospace", color:C.gradEnd, background:C.gradEnd+"12", borderRadius:3, padding:"1px 5px", whiteSpace:"nowrap" }}>{app}</span>}
                          </div>

                          {/* Last active */}
                          <span style={{ fontSize:9, fontFamily:"'IBM Plex Mono', monospace", color:C.textDim }}>{lastStr}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Recent tab */}
            {homeTab === "recent" && (
            <div style={{ marginBottom:40 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                <div style={{ fontSize:9, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace", letterSpacing:"0.12em" }}>// RECENT TRANSACTIONS</div>
                {recentMeta?.latestTimestamp && (
                  <div style={{ fontSize:9, fontFamily:"'IBM Plex Mono', monospace", color:C.textDim, opacity:0.6 }}>
                    latest: {(() => {
                      const raw = recentMeta.latestTimestamp;
                      const d = new Date(raw.endsWith("Z") ? raw : raw + "Z");
                      const lagMs = Date.now() - d.getTime();
                      const lagMin = Math.round(lagMs / (1000 * 60));
                      const lagStr = lagMin < 60 ? `${lagMin}m ago` : `${Math.floor(lagMin / 60)}h ${lagMin % 60}m ago`;
                      const lagColor = lagMin <= 15 ? C.green : lagMin <= 60 ? C.amber : C.red;
                      const timeStr = d.toLocaleString("en-US", { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit", timeZone:"UTC" }) + " UTC";
                      return <>{timeStr} <span style={{ color: lagColor, opacity:1 }}>({lagStr})</span></>;
                    })()}
                    {recentMeta.source && <span style={{ opacity:0.5 }}> · {recentMeta.source}</span>}
                  </div>
                )}
              </div>
              {recentLoad ? (
                <div style={{ fontSize:11, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace" }}>Loading…</div>
              ) : recent.length === 0 ? (
                <div style={{ fontSize:11, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace" }}>No recent transactions found</div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {/* Header - aligned to data columns */}
                  <div style={{ display:"flex", alignItems:"center", gap:8, padding:"0 16px 8px", borderBottom:`1px solid ${C.border}`, marginBottom:4 }}>
                    {/* Route header */}
                    <div style={{ display:"flex", alignItems:"center", flexShrink:0 }}>
                      <span style={{ fontSize:9, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace", letterSpacing:"0.1em", width:90 }}>SOURCE</span>
                      <span style={{ fontSize:9, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace", letterSpacing:"0.1em", width:90 }}>DEST</span>
                    </div>
                    <span style={{ fontSize:9, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace", letterSpacing:"0.1em", flexShrink:0, width:75 }}>USD</span>
                    <span style={{ fontSize:9, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace", letterSpacing:"0.1em", flexShrink:0, width:75 }}>BRIDGE</span>
                    <span style={{ fontSize:9, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace", letterSpacing:"0.1em", flex:"1 1 0" }}>INTEGRATOR</span>
                    <span style={{ fontSize:9, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace", letterSpacing:"0.1em", flexShrink:0 }}>TIME</span>
                    <span style={{ width:42, flexShrink:0 }}></span>
                  </div>
                  {recent.map((row, i) => {
                    const hash = row.src_tx_hash || row.tx_hash;
                    const enriched = recentEnriched.current[hash] || {};
                    const mergedRow = { ...row, ...enriched };
                    const srcChain = getChain(row.chain_id);
                    const ts = row.block_time ? new Date(row.block_time.endsWith("Z") ? row.block_time : row.block_time + "Z") : null;
                    const timeStr = ts ? ts.toLocaleString("en-US", { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit", timeZone:"UTC" }) + " UTC" : "";
                    // Token amount display from ClickHouse data
                    // volume_usd may be null during 10-min pipeline battle testing
                    const STABLES_SET = new Set(["USDC","USDT","DAI","BUSD","USDS","FRAX","LUSD","PYUSD","USDC.e","USD₮0","pathUSD","USDT0","AUSD","sUSDai","USR","BRLA","crvUSD"]);
                    let volStr = null;
                    if (row.volume_usd) {
                      volStr = "$" + Number(row.volume_usd).toLocaleString("en-US", { maximumFractionDigits:0 });
                    } else if (row.sell_amount && STABLES_SET.has(row.sell_token_symbol)) {
                      volStr = "$" + Number(row.sell_amount).toLocaleString("en-US", { maximumFractionDigits:0 });
                    } else if (row.buy_amount && STABLES_SET.has(row.buy_token_symbol)) {
                      volStr = "$" + Number(row.buy_amount).toLocaleString("en-US", { maximumFractionDigits:0 });
                    }
                    const tokenFlow = row.sell_token_symbol && row.buy_token_symbol
                      ? `${row.sell_token_symbol} → ${row.buy_token_symbol}`
                      : null;

                    return (
                      <div
                        key={i}
                        className="recent-row"
                        onClick={e => handleRecentSearch(e, row)}
                        style={{
                          background:C.surface, border:`1px solid ${C.border}`, borderRadius:10,
                          padding:"11px 16px", display:"flex", alignItems:"center",
                          gap:8, transition:"border-color 0.15s", cursor:"pointer",
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor=C.green}
                        onMouseLeave={e => e.currentTarget.style.borderColor=C.border}
                      >
                        {/* Route: source → destination */}
                        <div style={{ display:"flex", alignItems:"center", flexShrink:0 }}>
                          {/* Source chain */}
                          <div style={{ display:"flex", alignItems:"center", gap:6, width:90 }}>
                            {srcChain?.logo
                              ? <img src={srcChain.logo} alt={srcChain.name} style={{ width:18, height:18, borderRadius:"50%", flexShrink:0 }} />
                              : <span style={{ width:18, height:18, borderRadius:"50%", background:C.surface2, flexShrink:0, display:"inline-block" }} />
                            }
                            <span style={{ fontSize:11, fontFamily:"'IBM Plex Mono', monospace", color:C.textSub, fontWeight:600 }}>{srcChain?.short || row.chain}</span>
                          </div>

                          {/* Destination chain */}
                          <div style={{ display:"flex", alignItems:"center", gap:6, width:90 }}>
                          {mergedRow.dst_chain_id ? (
                            (() => { const dstChain = getChain(mergedRow.dst_chain_id); return (
                              <>
                                {dstChain?.logo
                                  ? <img src={dstChain.logo} alt={dstChain.name} style={{ width:18, height:18, borderRadius:"50%", flexShrink:0 }} />
                                  : <span style={{ width:18, height:18, borderRadius:"50%", background:C.surface2, flexShrink:0, display:"inline-block" }} />
                                }
                                <span style={{ fontSize:11, fontFamily:"'IBM Plex Mono', monospace", color:C.textSub, fontWeight:600 }}>{dstChain?.short || mergedRow.dst_chain}</span>
                              </>
                            ); })()
                          ) : (
                            <span style={{ fontSize:10, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace", animation:"pulse 1.5s ease-in-out infinite", opacity:0.4 }}>…</span>
                          )}
                          </div>
                        </div>

                        {/* Volume */}
                        <span className="recent-volume" style={{ fontSize:10, fontFamily:"'IBM Plex Mono', monospace", color:C.green, fontWeight:600, flexShrink:0, width:75 }}>{volStr || ""}</span>

                        {/* Bridge */}
                        <div style={{ flexShrink:0, width:75 }}>
                          {mergedRow.bridge && <span style={{ fontSize:8, fontFamily:"'IBM Plex Mono', monospace", color:C.textDim, background:C.surface2, borderRadius:3, padding:"1px 5px", whiteSpace:"nowrap" }}>{mergedRow.bridge.replace(/_/g," ")}</span>}
                        </div>

                        {/* Integrator */}
                        <div style={{ flex:"1 1 0", minWidth:0, overflow:"hidden" }}>
                          {mergedRow.app_name && <span style={{ fontSize:8, fontFamily:"'IBM Plex Mono', monospace", color:C.gradEnd, background:C.gradEnd+"12", borderRadius:3, padding:"1px 5px", whiteSpace:"nowrap" }}>{cleanAppName(mergedRow.app_name)}</span>}
                        </div>

                        {/* Time + trace */}
                        <div className="recent-meta" style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                          <span style={{ fontSize:10, fontFamily:"'IBM Plex Mono', monospace", color:C.textDim }}>{timeStr}</span>
                          <span
                            title="Trace in Bridge Explorer"
                            onClick={e => handleRecentSearch(e, row)}
                            style={{ fontSize:10, color:C.textDim, padding:"2px 8px", border:`1px solid ${C.border}`, borderRadius:4, cursor:"pointer", fontFamily:"'IBM Plex Mono', monospace" }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor=C.green; e.currentTarget.style.color=C.green; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.textDim; }}
                          >trace</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            )}

            {/* Info cards */}
            <div className="info-cards" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
              {[
                { label:"// WHERE TO FIND IT", body:"Your tx hash is in your wallet after confirming. It starts with 0x and is 66 chars long." },
                { label:"// WHAT WE TRACE",    body:"Every step — the on-chain swap, the bridge hop, and the final delivery on the destination chain." },
                { label:"// 22 CHAINS",        body:"All 0x-supported chains: Ethereum, Base, Arbitrum, Polygon, Avalanche, Tempo, and more." },
              ].map((c,i) => (
                <div key={i} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"18px 16px", animation:`fadeUp 0.4s ease-out ${0.1+i*0.07}s both` }}>
                  <div key={isDark?"label-dark":"label-light"} style={{ fontSize:9, fontFamily:"'IBM Plex Mono', monospace", background:C.grad, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text", letterSpacing:"0.1em", marginBottom:10, display:"inline-block" }}>{c.label}</div>
                  <div style={{ fontSize:12, color:C.textSub, lineHeight:1.65 }}>{c.body}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
    </PasswordGate>
  );
}
