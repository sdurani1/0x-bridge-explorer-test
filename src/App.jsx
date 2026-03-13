import { useState, useEffect, useRef } from "react";

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
  1:      { name: "Ethereum",    short: "ETH",   color: "#627EEA", explorer: "https://etherscan.io/tx/",            rpc: "https://cloudflare-eth.com" },
  42161:  { name: "Arbitrum",    short: "ARB",   color: "#28A0F0", explorer: "https://arbiscan.io/tx/",             rpc: "https://arb1.arbitrum.io/rpc" },
  8453:   { name: "Base",        short: "BASE",  color: "#3B82F6", explorer: "https://basescan.org/tx/",            rpc: "https://mainnet.base.org" },
  10:     { name: "Optimism",    short: "OP",    color: "#FF4D6A", explorer: "https://optimistic.etherscan.io/tx/", rpc: "https://mainnet.optimism.io" },
  137:    { name: "Polygon",     short: "POL",   color: "#A855F7", explorer: "https://polygonscan.com/tx/",         rpc: "https://polygon-bor-rpc.publicnode.com" },
  43114:  { name: "Avalanche",   short: "AVAX",  color: "#EF4444", explorer: "https://snowtrace.io/tx/",            rpc: "https://avalanche-c-chain-rpc.publicnode.com" },
  56:     { name: "BNB Chain",   short: "BNB",   color: "#EAB308", explorer: "https://bscscan.com/tx/",             rpc: "https://bsc-rpc.publicnode.com" },
  81457:  { name: "Blast",       short: "BLAST", color: "#D4D400", explorer: "https://blastscan.io/tx/",            rpc: "https://blast-rpc.publicnode.com" },
  534352: { name: "Scroll",      short: "SCR",   color: "#E8AA6A", explorer: "https://scrollscan.com/tx/",          rpc: "https://scroll-rpc.publicnode.com" },
  59144:  { name: "Linea",       short: "LNA",   color: "#61DFFF", explorer: "https://lineascan.build/tx/",         rpc: "https://linea-rpc.publicnode.com" },
  5000:   { name: "Mantle",      short: "MNT",   color: "#00C3A0", explorer: "https://explorer.mantle.xyz/tx/",    rpc: "https://mantle-rpc.publicnode.com" },
  34443:  { name: "Mode",        short: "MODE",  color: "#CCFF00", explorer: "https://modescan.io/tx/",             rpc: "https://mainnet.mode.network" },
  146:    { name: "Sonic",       short: "S",     color: "#FF6B35", explorer: "https://sonicscan.org/tx/",           rpc: "https://rpc.soniclabs.com" },
  130:    { name: "Unichain",    short: "UNI",   color: "#FC72FF", explorer: "https://uniscan.xyz/tx/",             rpc: "https://mainnet.unichain.org" },
  480:    { name: "World Chain", short: "WLD",   color: "#60A5FA", explorer: "https://worldscan.org/tx/",           rpc: "https://worldchain-mainnet.g.alchemy.com/public" },
  2741:   { name: "Abstract",    short: "ABS",   color: "#C084FC", explorer: "https://abscan.org/tx/",              rpc: null },
  80094:  { name: "Berachain",   short: "BERA",  color: "#FB923C", explorer: "https://berascan.com/tx/",            rpc: "https://berachain-rpc.publicnode.com" },
  999:    { name: "HyperEVM",    short: "HYPE",  color: "#34D399", explorer: "https://hyperevmscan.io/tx/",         rpc: "https://rpc.hyperliquid.xyz/evm" },
  57073:  { name: "Ink",         short: "INK",   color: "#F472B6", explorer: "https://inkscan.xyz/tx/",             rpc: null },
  143:    { name: "Monad",       short: "MON",   color: "#818CF8", explorer: "https://monadexplorer.com/tx/",       rpc: null },
  9745:   { name: "Plasma",      short: "PLS",   color: "#6EE7B7", explorer: "https://plasma.explorer/tx/",         rpc: null },
  // SVM
  999999999991: { name: "Solana", short: "SOL", color: "#9945FF", explorer: "https://solscan.io/tx/", rpc: null, svm: true },
};
const CHAIN_LIST = Object.entries(CHAINS).map(([id, c]) => ({ id: Number(id), ...c }));
const getChain   = (id) => CHAINS[String(id)] || null;

// ── Token helpers ──────────────────────────────────────────────────────────────
const NATIVE = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
const TOKENS  = {
  "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913": { s: "USDC", d: 6 },
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": { s: "USDC", d: 6 },
  "0xaf88d065e77c8cc2239327c5edb3a432268e5831": { s: "USDC", d: 6 },
  "0xdac17f958d2ee523a2206206994597c13d831ec7": { s: "USDT", d: 6 },
  "0x4200000000000000000000000000000000000006": { s: "WETH", d: 18 },
  "0x82af49447d8a07e3bd95bd0d56f35241523fbab1": { s: "WETH", d: 18 },
};
const tokenSym  = (addr) => addr?.toLowerCase() === NATIVE ? "ETH" : TOKENS[addr?.toLowerCase()]?.s || addr?.slice(0,6)+"…"+addr?.slice(-4) || "?";
const tokenDec  = (addr) => addr?.toLowerCase() === NATIVE ? 18 : TOKENS[addr?.toLowerCase()]?.d || 18;
const fmtAmt    = (raw, addr) => {
  if (!raw) return "—";
  const n = Number(raw) / 10 ** tokenDec(addr);
  if (n === 0) return "0";
  if (n < 0.0001) return n.toExponential(3);
  if (n < 1)   return n.toFixed(4);
  if (n < 1e6) return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return n.toExponential(3);
};
const fmtTime = (ts) => ts
  ? new Date(ts * 1000).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
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

// ── Status config ──────────────────────────────────────────────────────────────
const STATUS = {
  pending:        { label: "Pending",         color: C.amber,  step: 1 },
  submitted:      { label: "Submitted",       color: C.blue,   step: 2 },
  bridge_filling: { label: "Bridging",        color: C.blue,   step: 2 },
  bridge_filled:  { label: "Bridge Filled",   color: C.green,  step: 3 },
  completed:      { label: "Complete",        color: C.green,  step: 3 },
  failed:         { label: "Failed",          color: C.red,    step: 0 },
  reverted:       { label: "Reverted",        color: C.red,    step: 0 },
};
const getStatus = (s) => STATUS[s] || { label: s?.replace(/_/g," ") || "Unknown", color: C.textDim, step: 1 };

// ── Input detection ────────────────────────────────────────────────────────────
const detectInput = (v) => {
  const s = v.trim();
  if (/^0x[0-9a-fA-F]{64}$/.test(s)) return "txhash";
  if (/^0x[0-9a-fA-F]{40}$/.test(s)) return "address";
  if (/^[1-9A-HJ-NP-Za-km-z]{80,100}$/.test(s)) return "svm_txhash";
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

// ── Chain tag ──────────────────────────────────────────────────────────────────
function ChainTag({ chainId, size = "sm" }) {
  const c = getChain(chainId);
  if (!c) return <span style={{ fontSize: 11, color: C.textDim, fontFamily: "monospace" }}>chain:{chainId}</span>;
  const fs  = size === "lg" ? 13 : 11;
  const pad = size === "lg" ? "5px 12px" : "3px 9px";
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, background: c.color+"18", border:`1px solid ${c.color}35`, borderRadius:6, padding:pad, fontFamily:"'IBM Plex Mono', monospace", fontSize:fs, fontWeight:600, color:c.color, whiteSpace:"nowrap" }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:c.color, flexShrink:0 }} />
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

// ── Journey step card ─────────────────────────────────────────────────────────
function StepCard({ step, idx, isLast, globalStatus }) {
  const isSwap   = step.type === "swap";
  const srcId    = step.transactions?.[0]?.chainId;
  const dstId    = step.destinationChainId || step.transactions?.[step.transactions.length-1]?.chainId;
  const srcChain = getChain(srcId);
  const dstChain = getChain(dstId);
  const sellSym  = tokenSym(step.sellToken);
  const buySym   = tokenSym(step.buyToken);
  const sellAmt  = fmtAmt(step.sellAmount, step.sellToken);
  const buyAmt   = fmtAmt(step.settledBuyAmount || step.quotedBuyAmount, step.buyToken);
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
              <span style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:15, fontWeight:700, color:C.text }}>{sellAmt} <span style={{ color: srcChain?.color || C.textSub }}>{sellSym}</span></span>
            </div>
          </div>

          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, paddingTop:18 }}>
            <span style={{ color: C.border2, fontSize:18 }}>→</span>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
            <span style={{ fontSize:10, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace", letterSpacing:"0.08em" }}>RECEIVE</span>
            <div style={{ display:"flex", alignItems:"center", gap:7 }}>
              {dstId && dstId !== srcId && <ChainTag chainId={dstId} />}
              <span style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:15, fontWeight:700, color:C.text }}>{buyAmt} <span style={{ color: dstChain?.color || C.textSub }}>{buySym}</span></span>
            </div>
          </div>
        </div>

        {/* Tx hashes */}
        {step.transactions?.length > 0 && (
          <div style={{ padding:"10px 16px 14px", borderTop:`1px solid ${C.border}`, display:"flex", flexDirection:"column", gap:7 }}>
            {step.transactions.map((tx, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:9, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace", minWidth:20, letterSpacing:"0.06em" }}>{i===0?"SRC":"DST"}</span>
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
function StatusBadge({ status }) {
  const s = getStatus(status);
  const isPulsing = status==="pending"||status==="bridge_filling"||status==="submitted";
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:7, fontFamily:"'IBM Plex Mono', monospace", fontSize:13, fontWeight:700, letterSpacing:"0.06em", color:s.color, background:s.color+"14", border:`1px solid ${s.color}35`, borderRadius:8, padding:"6px 14px" }}>
      <span style={{ width:7, height:7, borderRadius:"50%", background:s.color, flexShrink:0, animation:isPulsing?"pulse 1.2s ease-in-out infinite":"none", boxShadow:isPulsing?`0 0 8px ${s.color}`:"none" }} />
      {s.label.toUpperCase()}
    </span>
  );
}

// ── Result ────────────────────────────────────────────────────────────────────
function Result({ data }) {
  const steps  = data.steps || [];
  const failed = data.status==="failed"||data.status==="reverted";
  const first  = steps[0];
  const last   = steps[steps.length-1];
  const bridge = data.bridge ? data.bridge.replace(/_/g," ").replace(/\b\w/g,l=>l.toUpperCase()) : null;

  return (
    <div style={{ animation:"fadeUp 0.3s ease-out" }}>
      {/* Summary bar */}
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:"20px 22px", marginBottom:14, display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
            <StatusBadge status={data.status} />
            {bridge && (
              <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:C.surface2, border:`1px solid ${C.border2}`, borderRadius:8, padding:"6px 12px", fontFamily:"'IBM Plex Mono', monospace", fontSize:11, fontWeight:600, color:C.textSub, letterSpacing:"0.04em" }}>
                <span style={{ fontSize:9, color:C.textDim, letterSpacing:"0.1em" }}>via</span>
                {bridge}
              </span>
            )}
          </div>
          {first && last && (
            <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
              <ChainTag chainId={first.transactions?.[0]?.chainId} size="lg" />
              <span style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:16, fontWeight:700, color:C.text }}>
                {fmtAmt(first.sellAmount, first.sellToken)} <span style={{ color:getChain(first.transactions?.[0]?.chainId)?.color||C.textSub }}>{tokenSym(first.sellToken)}</span>
              </span>
              <span style={{ color:C.border2, fontSize:18 }}>→</span>
              <ChainTag chainId={last.destinationChainId||last.transactions?.[last.transactions.length-1]?.chainId} size="lg" />
              <span style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:16, fontWeight:700, color:C.text }}>
                {fmtAmt(last.settledBuyAmount||last.quotedBuyAmount, last.buyToken)} <span style={{ color:getChain(last.destinationChainId)?.color||C.textSub }}>{tokenSym(last.buyToken)}</span>
              </span>
            </div>
          )}
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:8, alignItems:"flex-end" }}>
          {data.zid && (
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:9, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace", letterSpacing:"0.1em", marginBottom:4 }}>ZID</div>
              <div style={{ fontSize:11, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace" }}>{trunc(data.zid,10,8)}</div>
            </div>
          )}
        </div>
      </div>

      {/* Failure */}
      {data.failure && (
        <div style={{ background:"#FF4D6A0a", border:`1px solid ${C.red}35`, borderRadius:12, padding:"16px 18px", marginBottom:14 }}>
          <div style={{ fontSize:11, fontWeight:700, color:C.red, fontFamily:"'IBM Plex Mono', monospace", letterSpacing:"0.08em", marginBottom:8 }}>// FAILURE DETAILS</div>
          <pre style={{ fontSize:11, color:C.red, fontFamily:"'IBM Plex Mono', monospace", lineHeight:1.6, overflowX:"auto", margin:0, opacity:0.8 }}>{JSON.stringify(data.failure, null, 2)}</pre>
        </div>
      )}

      {/* Journey */}
      {steps.length > 0 && (
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:10, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace", letterSpacing:"0.1em", marginBottom:14, paddingLeft:32 }}>// TRANSACTION JOURNEY</div>
          {steps.map((step, i) => (
            <StepCard key={i} step={step} idx={i} isLast={i===steps.length-1} globalStatus={data.status} />
          ))}
        </div>
      )}

      {/* Fallback: raw txs if no steps */}
      {steps.length===0 && data.transactions?.length > 0 && (
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden", marginBottom:14 }}>
          <div style={{ padding:"14px 20px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ fontSize:10, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace", letterSpacing:"0.1em" }}>// ON-CHAIN RECORDS</div>
            {bridge && (
              <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:C.surface2, border:`1px solid ${C.border2}`, borderRadius:6, padding:"3px 10px", fontFamily:"'IBM Plex Mono', monospace", fontSize:10, fontWeight:600, color:C.textSub }}>
                <span style={{ fontSize:8, color:C.textDim }}>via</span>{bridge}
              </span>
            )}
          </div>
          {data.transactions.map((tx,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 20px", borderBottom:i<data.transactions.length-1?`1px solid ${C.border}`:"none" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                <span style={{ fontSize:9, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace", letterSpacing:"0.06em", minWidth:24 }}>{i===0?"SRC":"DST"}</span>
                <ChainTag chainId={tx.chainId} />
              </div>
              <HashLink hash={tx.txHash} chainId={tx.chainId} />
              {tx.timestamp && <span style={{ fontSize:11, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace", marginLeft:"auto", flexShrink:0 }}>{fmtTime(tx.timestamp)}</span>}
            </div>
          ))}
        </div>
      )}

      {data.zid && (
        <div style={{ background:C.surface2, border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 18px", display:"flex", alignItems:"center", justifyContent:"flex-end" }}>
          <span style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:10, color:C.textDim }}>ref: {data.zid}</span>
        </div>
      )}
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

  const handleSearch = async () => {
    const val = input.trim();
    if (!val || inputKind === "empty" || inputKind === "partial") return;
    if (inputKind === "address") { setError("Wallet address lookup coming soon — enter a tx hash for now."); return; }
    if (inputKind === "svm_txhash") { setError("Solana transaction lookup coming soon — Solana is currently only supported as a destination chain."); return; }

    setLoading(true); setError(null); setResult(null);
    startLoadingMessages();

    try {
      // Detect chain server-side (avoids browser CORS issues)
      const detectRes = await fetch(`/api/detect-chain?txHash=${val}`);
      if (!detectRes.ok) throw new Error("Transaction not found on any supported chain. Double-check the hash and try again.");
      const { chainId: detectedChainId, input } = await detectRes.json();

      // Snap dropdown to detected chain
      setChainId(detectedChainId);

      const quoteId = extractQuoteId(input);
      const params  = new URLSearchParams({ originChain: detectedChainId, originTxHash: val });
      if (quoteId) params.append("quoteId", quoteId);

      const res  = await fetch(`/api/status?${params}`);
      if (!res.ok) throw new Error("This doesn't appear to be a 0x cross-chain transaction, or the bridge status is not yet available.");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e) {
      setError(e.message || "Something went wrong — please try again.");
    } finally {
      stopLoadingMessages();
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === "Enter") handleSearch(); };

  const canSearch = (inputKind === "txhash" || inputKind === "svm_txhash" || inputKind === "address") && !loading;

  const hint = {
    txhash:     { text: "✓ EVM transaction hash", color: C.green },
    svm_txhash: { text: "✓ Solana transaction signature", color: C.green },
    address:    { text: "◎ Wallet address — coming soon", color: C.amber },
    partial:    { text: `${input.trim().length} chars — EVM tx hash is 66, Solana sig is ~88`, color: C.textDim },
    empty:      null,
  }[inputKind];

  return (
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
      `}</style>

      {/* ── Nav ── */}
      <nav style={{ borderBottom:`1px solid ${C.border}`, padding:"0 32px", height:56, display:"flex", alignItems:"center", justifyContent:"space-between", background:C.bg+"ee", backdropFilter:"blur(12px)", position:"sticky", top:0, zIndex:50 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:28, height:28, background:C.greenDim, border:`1px solid ${C.gradEnd}50`, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>⬡</div>
          <span style={{ fontWeight:800, fontSize:15, letterSpacing:"-0.02em" }}>0x Bridge Explorer</span>
          <span style={{ fontSize:9, fontFamily:"'IBM Plex Mono', monospace", color:C.textDim, background:C.surface, border:`1px solid ${C.border}`, borderRadius:4, padding:"2px 7px", letterSpacing:"0.1em" }}>BETA</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, fontFamily:"'IBM Plex Mono', monospace", fontSize:11, color:C.gradStart }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:C.gradStart, animation:"pulse 1.4s ease-in-out infinite", display:"inline-block" }} />
            21 chains live
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
          <span key={isDark?"lookup-dark":"lookup-light"} style={{ background:C.grad, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text", display:"inline-block" }}>Lookup</span>
        </h1>
        <p style={{ fontSize:16, color:C.textSub, lineHeight:1.7, marginBottom:44, maxWidth:460, margin:"0 auto 44px" }}>
          Paste any transaction hash. We'll trace the full route — swap, bridge, delivery — step by step.
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
            {/* Chain select */}
            <div style={{ position:"relative", borderRight:`1px solid ${C.border}` }}>
              <select
                value={chainId}
                onChange={e => setChainId(e.target.value)}
                style={{ background:C.selectBg, border:"none", color:C.text, padding:"14px 36px 14px 16px", fontSize:13, fontFamily:"'IBM Plex Mono', monospace", fontWeight:600, outline:"none", cursor:"pointer", minWidth:130, appearance:"none" }}
              >
                {CHAIN_LIST.map(c => <option key={c.id} value={c.id}>{c.short}</option>)}
              </select>
              <span style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", color:C.textDim, fontSize:9, pointerEvents:"none" }}>▼</span>
            </div>

            {/* Input */}
            <input
              value={input}
              onChange={e => { setInput(e.target.value); setResult(null); setError(null); }}
              onKeyDown={handleKey}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="0x transaction hash or wallet address…"
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
          <span style={{ color:C.border2 }}>·</span>
          <span style={{ fontSize:11, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace" }}>chain auto-detected from tx hash</span>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ maxWidth:700, margin:"0 auto", padding:"0 24px 80px" }}>

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

        {/* Result */}
        {result && <Result data={result} />}

        {/* Empty state */}
        {!result && !error && !loading && (
          <div style={{ animation:"fadeUp 0.4s ease-out 0.1s both" }}>
            <div style={{ textAlign:"center", padding:"40px 0 48px" }}>
              <div style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:32, color:C.border2, marginBottom:12, letterSpacing:"-0.02em" }}>{"{ }"}</div>
              <div style={{ fontSize:14, color:C.textDim, fontFamily:"'IBM Plex Mono', monospace" }}>awaiting input_</div>
            </div>

            {/* Info cards */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
              {[
                { label:"// WHERE TO FIND IT", body:"Your tx hash is in your wallet after confirming. It starts with 0x and is 66 chars long." },
                { label:"// WHAT WE TRACE",    body:"Every step — the on-chain swap, the bridge hop, and the final delivery on the destination chain." },
                { label:"// 21 CHAINS",        body:"All 0x-supported chains: Ethereum, Base, Arbitrum, Polygon, Avalanche, and 16 more." },
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
  );
}
