/* EHR Consent MVP — public/index.js
   - Uses ethers v6 (UMD). Ensure in index.html:
     <script src="https://cdn.jsdelivr.net/npm/ethers@6.13.2/dist/ethers.umd.min.js"></script>
     <script src="index.js"></script>
   - Add this section below your Output in index.html:
     <section>
       <h3>Wallet Addresses</h3>
       <div id="wallet-list"></div>
     </section>
*/

//////////////////////
// CONFIG
//////////////////////
const CONTRACT_ADDRESS = "0x7248237faba080dCd35b8B56BCDBbeC73A704A15";
const ABI = [
  { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "patient", "type": "address" }, { "indexed": true, "internalType": "address", "name": "clinician", "type": "address" } ], "name": "ConsentGranted", "type": "event" },
  { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "patient", "type": "address" }, { "indexed": true, "internalType": "address", "name": "clinician", "type": "address" } ], "name": "ConsentRevoked", "type": "event" },
  { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "patient", "type": "address" }, { "indexed": true, "internalType": "address", "name": "author", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "index", "type": "uint256" } ], "name": "RecordCreated", "type": "event" },
  { "inputs": [ { "internalType": "address", "name": "_patient", "type": "address" }, { "internalType": "string", "name": "_summary", "type": "string" }, { "internalType": "string", "name": "_hashPointer", "type": "string" } ], "name": "createRecord", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [ { "internalType": "address", "name": "_patient", "type": "address" } ], "name": "getRecords", "outputs": [ { "components": [ { "internalType": "string", "name": "summary", "type": "string" }, { "internalType": "string", "name": "hashPointer", "type": "string" }, { "internalType": "address", "name": "author", "type": "address" }, { "internalType": "uint256", "name": "timestamp", "type": "uint256" } ], "internalType": "struct EHRConsent.Record[]", "name": "", "type": "tuple[]" } ], "stateMutability": "view", "type": "function" },
  { "inputs": [ { "internalType": "address", "name": "_clinician", "type": "address" } ], "name": "grantConsent", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [ { "internalType": "address", "name": "_clinician", "type": "address" } ], "name": "revokeConsent", "outputs": [], "stateMutability": "nonpayable", "type": "function" }
];

//////////////////////
// GLOBALS
//////////////////////
let provider;     // ethers.BrowserProvider
let signer;       // ethers.Signer
let contract;     // ethers.Contract
let ethProvider;  // chosen window.ethereum (MetaMask preferred)
let currentAccount;

//////////////////////
// DOM SHORTCUTS
//////////////////////
const $ = (id) => document.getElementById(id);

const els = {
  connect: $("connect"),
  checkNet: $("checkNet"),
  account: $("account"),
  output: $("output"),

  clinicianAddr: $("clinicianAddr"),
  patientAddr: $("patientAddr"),
  summary: $("summary"),
  hash: $("hash"),

  grant: $("grant"),
  revoke: $("revoke"),
  create: $("create"),
  view: $("view"),

  walletList: $("wallet-list"),
};

//////////////////////
// UTIL
//////////////////////
function ensureEthersLoaded() {
  if (typeof ethers === "undefined") {
    throw new Error("ethers is not defined — ensure the UMD build is loaded before index.js");
  }
}

function getEthereum() {
  const eth = window.ethereum;
  if (!eth) return null;
  if (Array.isArray(eth.providers) && eth.providers.length) {
    const metamask = eth.providers.find((p) => p.isMetaMask);
    return metamask || eth.providers[0];
  }
  return eth;
}

function short(addr) {
  return addr ? addr.slice(0, 6) + "…" + addr.slice(-4) : "";
}

function jsonReplacer(_k, v) {
  return typeof v === "bigint" ? v.toString() : v;
}

function formatErr(e) {
  return e?.reason || e?.data?.message || e?.message || String(e);
}

//////////////////////
// LOGGING
//////////////////////
function log(msg, data) {
  const t = new Date().toISOString().split("T")[1].slice(0, 8);
  const line = data ? `${msg} ${JSON.stringify(data, jsonReplacer, 2)}` : msg;
  if (els.output) {
    els.output.textContent += `${t} | ${line}\n`;
    els.output.scrollTop = els.output.scrollHeight;
  } else {
    console.log(line);
  }
}

function toast(msg) {
  log(msg);
}

//////////////////////
// WALLET ADDRESS LIST (with localStorage)
//////////////////////
const LS_KEY = "walletAddresses";

function loadWallets() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); }
  catch { return []; }
}

function saveWallets(list) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

function addWalletAddress(addr) {
  if (!addr) return;
  addr = addr.trim();
  if (!ethers.isAddress(addr)) return;
  const list = loadWallets();
  if (!list.includes(addr)) {
    list.unshift(addr);
    saveWallets(list);
    renderWalletList();
  }
}

function removeWalletAddress(addr) {
  const next = loadWallets().filter((a) => a !== addr);
  saveWallets(next);
  renderWalletList();
}

function renderWalletList() {
  const wrap = els.walletList;
  if (!wrap) return;
  const list = loadWallets();

  wrap.innerHTML = "";
  if (list.length === 0) {
    wrap.innerHTML = '<p class="muted">No addresses yet. They’ll appear here after you interact.</p>';
    return;
  }

  list.forEach((addr) => {
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.gap = "8px";
    row.style.margin = "6px 0";

    const addrBtn = document.createElement("button");
    addrBtn.textContent = short(addr);
    addrBtn.title = addr;
    addrBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(addr);
        toast(`Copied ${short(addr)}`);
      } catch {
        toast("Copy failed");
      }
    };

    const fillClin = document.createElement("button");
    fillClin.textContent = "→ Clinician";
    fillClin.className = "secondary";
    fillClin.onclick = () => {
      if (els.clinicianAddr) els.clinicianAddr.value = addr;
      toast("Filled clinician");
    };

    const fillPat = document.createElement("button");
    fillPat.textContent = "→ Patient";
    fillPat.className = "secondary";
    fillPat.onclick = () => {
      if (els.patientAddr) els.patientAddr.value = addr;
      toast("Filled patient");
    };

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "✕";
    removeBtn.className = "secondary";
    removeBtn.onclick = () => removeWalletAddress(addr);

    row.append(addrBtn, fillClin, fillPat, removeBtn);
    wrap.appendChild(row);
  });
}

//////////////////////
// WALLET + CONTRACT
//////////////////////
function setAccount(addr) {
  currentAccount = addr;
  if (els.account) els.account.textContent = `Connected: ${short(addr)}`;
  addWalletAddress(addr);
}

async function connectWallet() {
  try {
    ensureEthersLoaded();
    ethProvider = getEthereum();
    if (!ethProvider) throw new Error("No EVM wallet found. Install/enable MetaMask.");

    await ethProvider.request({ method: "eth_requestAccounts" });
    provider = new ethers.BrowserProvider(ethProvider);
    signer = await provider.getSigner();
    const addr = await signer.getAddress();
    setAccount(addr);

    contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

    const net = await provider.getNetwork();
    log(`Connected. chainId=${net.chainId.toString()} name=${net.name || "unknown"}`);
  } catch (err) {
    log("connectWallet error:", formatErr(err));
  }
}

async function checkNetwork() {
  try {
    if (!provider) {
      const eth = getEthereum();
      if (!eth) throw new Error("No wallet provider");
      provider = new ethers.BrowserProvider(eth);
    }
    const net = await provider.getNetwork();
    log(`Network chainId: ${net.chainId.toString()} name: ${net.name || "unknown"}`);
    if (Number(net.chainId) !== 11155111) {
      log("Tip: switch to Sepolia (chainId 11155111) for testing");
    }
  } catch (err) {
    log("checkNetwork error:", formatErr(err));
  }
}

function ensureContract() {
  if (!contract) throw new Error("Connect wallet first.");
}

function validateAddress(addr, label) {
  if (!ethers.isAddress(addr)) throw new Error(`${label} address is invalid: ${addr}`);
}

//////////////////////
// CONTRACT ACTIONS
//////////////////////
async function grantConsent() {
  try {
    ensureContract();
    const clinician = els.clinicianAddr?.value.trim();
    validateAddress(clinician, "Clinician");
    addWalletAddress(clinician);

    const tx = await contract.grantConsent(clinician);
    log("grantConsent tx sent:", { hash: tx.hash });
    const rcpt = await tx.wait();
    log(`Consent granted to ${clinician}`, { blockNumber: Number(rcpt.blockNumber) });
  } catch (err) {
    log("grantConsent error:", formatErr(err));
  }
}

async function revokeConsent() {
  try {
    ensureContract();
    const clinician = els.clinicianAddr?.value.trim();
    validateAddress(clinician, "Clinician");
    addWalletAddress(clinician);

    const tx = await contract.revokeConsent(clinician);
    log("revokeConsent tx sent:", { hash: tx.hash });
    const rcpt = await tx.wait();
    log(`Consent revoked for ${clinician}`, { blockNumber: Number(rcpt.blockNumber) });
  } catch (err) {
    log("revokeConsent error:", formatErr(err));
  }
}

async function createRecord() {
  try {
    ensureContract();
    const patient = els.patientAddr?.value.trim();
    const summary = els.summary?.value.trim();
    const hash = els.hash?.value.trim();

    validateAddress(patient, "Patient");
    if (!summary) throw new Error("Summary is required");
    if (!hash) throw new Error("Hash/URI is required");

    addWalletAddress(patient);

    const tx = await contract.createRecord(patient, summary, hash);
    log("createRecord tx sent:", { hash: tx.hash });
    const rcpt = await tx.wait();
    log(`Record created for ${patient}`, { blockNumber: Number(rcpt.blockNumber) });
  } catch (err) {
    log("createRecord error:", formatErr(err));
  }
}

async function viewRecords() {
  try {
    ensureContract();
    const patient = els.patientAddr?.value.trim();
    validateAddress(patient, "Patient");
    addWalletAddress(patient);

    const recs = await contract.getRecords(patient);
    if (!Array.isArray(recs) || recs.length === 0) {
      log(`No records for ${patient}`);
      return;
    }

    const pretty = recs.map((r, i) => ({
      index: i,
      summary: r.summary ?? r[0],
      hashPointer: r.hashPointer ?? r[1],
      author: r.author ?? r[2],
      timestamp: (r.timestamp ?? r[3])?.toString?.() ?? String(r.timestamp ?? r[3]),
    }));
    log("Records:", pretty);
  } catch (err) {
    log("viewRecords error:", formatErr(err));
  }
}

//////////////////////
// WIRING + EVENTS
//////////////////////
function wireUI() {
  els.connect?.addEventListener("click", connectWallet);
  els.checkNet?.addEventListener("click", checkNetwork);
  els.grant?.addEventListener("click", grantConsent);
  els.revoke?.addEventListener("click", revokeConsent);
  els.create?.addEventListener("click", createRecord);
  els.view?.addEventListener("click", viewRecords);
}

function attachWalletEvents() {
  const eth = getEthereum();
  if (!eth || !eth.on) return;

  eth.on("accountsChanged", async (accounts) => {
    if (!accounts || accounts.length === 0) {
      currentAccount = undefined;
      if (els.account) els.account.textContent = "";
      signer = undefined;
      contract = undefined;
      return;
    }
    const addr = accounts[0];
    setAccount(addr);
    if (provider) signer = await provider.getSigner();
    if (signer) contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    log("accountsChanged -> updated signer");
  });

  eth.on("chainChanged", async () => {
    const eth2 = getEthereum();
    if (!eth2) return;
    provider = new ethers.BrowserProvider(eth2);
    signer = await provider.getSigner();
    contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    const net = await provider.getNetwork();
    log(`chainChanged -> chainId=${net.chainId.toString()}`);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  wireUI();
  renderWalletList();
  attachWalletEvents();
  log("Ready");
});
