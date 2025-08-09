/* eslint-disable no-undef */
console.log("index.js (ethers v6) loaded");

// ====== Config ======
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

// ====== Globals ======
let provider;   // ethers.BrowserProvider
let signer;     // ethers.Signer
let contract;   // ethers.Contract
let ethProvider; // selected window.ethereum (prefers MetaMask)

// ====== UI helpers ======
function log(msg, obj) {
  const el = document.getElementById("output");
  if (!el) return console.log(msg, obj ?? "");
  if (obj !== undefined) {
    el.textContent += `${msg} ${JSON.stringify(obj, null, 2)}\n`;
  } else {
    el.textContent += msg + "\n";
  }
  el.scrollTop = el.scrollHeight;
}

function setAccount(text) {
  const el = document.getElementById("account");
  if (el) el.textContent = text || "";
}

function shorten(addr) {
  return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : "";
}

function serializeErr(err) {
  return {
    message: err?.message,
    code: err?.code,
    data: err?.data,
    name: err?.name
  };
}

function ensureEthersLoaded() {
  if (typeof ethers === "undefined") {
    throw new Error("ethers is not defined — ensure the UMD build is loaded before this script.");
  }
}

// Prefer MetaMask if multiple injected providers exist
function getEthereum() {
  const eth = window.ethereum;
  if (!eth) return null;
  if (Array.isArray(eth.providers) && eth.providers.length > 0) {
    const metamask = eth.providers.find((p) => p.isMetaMask);
    return metamask || eth.providers[0];
  }
  return eth;
}

// ====== Core actions ======
async function connectWallet() {
  try {
    ensureEthersLoaded();

    ethProvider = getEthereum();
    if (!ethProvider) {
      alert("No EVM wallet found. Please install/enable MetaMask and reload.");
      return;
    }

    await ethProvider.request({ method: "eth_requestAccounts" });

    provider = new ethers.BrowserProvider(ethProvider); // v6
    signer = await provider.getSigner();

    const addr = await signer.getAddress();
    setAccount(`Connected: ${shorten(addr)}`);

    contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

    // Optional: log network
    const net = await provider.getNetwork();
    log(`Connected. chainId=${net.chainId.toString()} name=${net.name || "unknown"}`);
  } catch (err) {
    log("connectWallet error:", serializeErr(err));
  }
}

async function checkNetwork() {
  try {
    ensureEthersLoaded();

    if (!provider) {
      const eth = getEthereum();
      if (!eth) throw new Error("No wallet provider");
      provider = new ethers.BrowserProvider(eth);
    }
    const net = await provider.getNetwork();
    log(`Network chainId: ${net.chainId.toString()} name: ${net.name || "unknown"}`);
  } catch (err) {
    log("checkNetwork error:", serializeErr(err));
  }
}

function ensureContract() {
  if (!contract) throw new Error("Connect wallet first.");
}

function validateAddress(addr, label) {
  if (!ethers.isAddress(addr)) {
    throw new Error(`${label} address is invalid: ${addr}`);
  }
}

async function grantConsent() {
  try {
    ensureContract();
    const clinician = document.getElementById("clinicianAddr").value.trim();
    validateAddress(clinician, "Clinician");
    const tx = await contract.grantConsent(clinician);
    log("grantConsent tx sent:", { hash: tx.hash });
    const rcpt = await tx.wait();
    log(`Consent granted to ${clinician}`, { blockNumber: rcpt.blockNumber });
  } catch (err) {
    log("grantConsent error:", serializeErr(err));
  }
}

async function revokeConsent() {
  try {
    ensureContract();
    const clinician = document.getElementById("clinicianAddr").value.trim();
    validateAddress(clinician, "Clinician");
    const tx = await contract.revokeConsent(clinician);
    log("revokeConsent tx sent:", { hash: tx.hash });
    const rcpt = await tx.wait();
    log(`Consent revoked for ${clinician}`, { blockNumber: rcpt.blockNumber });
  } catch (err) {
    log("revokeConsent error:", serializeErr(err));
  }
}

async function createRecord() {
  try {
    ensureContract();
    const patient = document.getElementById("patientAddr").value.trim();
    const summary = document.getElementById("summary").value.trim();
    const hash = document.getElementById("hash").value.trim();

    validateAddress(patient, "Patient");
    if (!summary) throw new Error("Summary is required");
    if (!hash) throw new Error("Hash/URI is required");

    const tx = await contract.createRecord(patient, summary, hash);
    log("createRecord tx sent:", { hash: tx.hash });
    const rcpt = await tx.wait();
    log(`Record created for ${patient}`, { blockNumber: rcpt.blockNumber });
  } catch (err) {
    log("createRecord error:", serializeErr(err));
  }
}

async function viewRecords() {
  try {
    ensureContract();
    const patient = document.getElementById("patientAddr").value.trim();
    validateAddress(patient, "Patient");

    const recs = await contract.getRecords(patient);
    const pretty = recs.map((r, i) => ({
      index: i,
      summary: r.summary,
      hashPointer: r.hashPointer,
      author: r.author,
      timestamp: r.timestamp?.toString?.() ?? String(r.timestamp)
    }));
    log("Records:", pretty);
  } catch (err) {
    log("viewRecords error:", serializeErr(err));
  }
}

// ====== Wallet event listeners ======
function attachWalletEvents() {
  const eth = ethProvider || window.ethereum;
  if (!eth || !eth.on) return;

  eth.on("accountsChanged", async (accounts) => {
    try {
      const addr = accounts?.[0];
      if (!addr) {
        setAccount("Disconnected");
        contract = undefined;
        signer = undefined;
        return;
      }
      setAccount(`Connected: ${shorten(addr)}`);
      if (provider) {
        signer = await provider.getSigner();
        contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      }
      log("accountsChanged -> updated signer");
    } catch (err) {
      log("accountsChanged handler error:", serializeErr(err));
    }
  });

  eth.on("chainChanged", async (_hexId) => {
    try {
      // Some wallets recommend reload; we’ll re-init provider/signer.
      provider = new ethers.BrowserProvider(getEthereum());
      signer = await provider.getSigner();
      contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      const net = await provider.getNetwork();
      log(`chainChanged -> chainId=${net.chainId.toString()}`);
    } catch (err) {
      log("chainChanged handler error:", serializeErr(err));
    }
  });
}

// ====== Wire UI ======
function wireButtons() {
  const byId = (id) => document.getElementById(id);

  byId("connect")?.addEventListener("click", async () => {
    await connectWallet();
    attachWalletEvents();
  });
  byId("checkNet")?.addEventListener("click", checkNetwork);
  byId("grant")?.addEventListener("click", grantConsent);
  byId("revoke")?.addEventListener("click", revokeConsent);
  byId("create")?.addEventListener("click", createRecord);
  byId("view")?.addEventListener("click", viewRecords);
}

document.addEventListener("DOMContentLoaded", wireButtons);
// ===== Wallet address capture & copy =====
const walletList = [];

function addWalletAddress(addr) {
  if (
    addr &&
    addr.trim() !== "" &&
    /^0x[a-fA-F0-9]{40}$/.test(addr) &&
    !walletList.includes(addr)
  ) {
    walletList.push(addr);
    renderWalletList();
  }
}

function renderWalletList() {
  const container = document.getElementById("wallet-list");
  container.innerHTML = ""; // clear old list
  walletList.forEach(addr => {
    const line = document.createElement("div");
    line.className = "wallet-item";

    const span = document.createElement("span");
    span.textContent = addr;

    const copyBtn = document.createElement("button");
    copyBtn.textContent = "📋";
    copyBtn.className = "copy-btn";
    copyBtn.onclick = (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(addr);
      if (isMobile()) alert("Copied to clipboard!");
    };

    line.onclick = () => {
      if (isMobile()) {
        navigator.clipboard.writeText(addr);
        alert("Copied to clipboard!");
      }
    };

    line.appendChild(span);
    if (!isMobile()) line.appendChild(copyBtn);
    container.appendChild(line);
  });
}

function isMobile() {
  return /Mobi|Android/i.test(navigator.userAgent);
}

