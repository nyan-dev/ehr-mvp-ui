
const CONTRACT_ADDRESS = "0x7248237faba080dCd35b8B56BCDBbeC73A704A15"; 
const ABI = [
		{
			"anonymous": false,
			"inputs": [
				{
					"indexed": true,
					"internalType": "address",
					"name": "patient",
					"type": "address"
				},
				{
					"indexed": true,
					"internalType": "address",
					"name": "clinician",
					"type": "address"
				}
			],
			"name": "ConsentGranted",
			"type": "event"
		},
		{
			"anonymous": false,
			"inputs": [
				{
					"indexed": true,
					"internalType": "address",
					"name": "patient",
					"type": "address"
				},
				{
					"indexed": true,
					"internalType": "address",
					"name": "clinician",
					"type": "address"
				}
			],
			"name": "ConsentRevoked",
			"type": "event"
		},
		{
			"anonymous": false,
			"inputs": [
				{
					"indexed": true,
					"internalType": "address",
					"name": "patient",
					"type": "address"
				},
				{
					"indexed": true,
					"internalType": "address",
					"name": "author",
					"type": "address"
				},
				{
					"indexed": false,
					"internalType": "uint256",
					"name": "index",
					"type": "uint256"
				}
			],
			"name": "RecordCreated",
			"type": "event"
		},
		{
			"inputs": [
				{
					"internalType": "address",
					"name": "_patient",
					"type": "address"
				},
				{
					"internalType": "string",
					"name": "_summary",
					"type": "string"
				},
				{
					"internalType": "string",
					"name": "_hashPointer",
					"type": "string"
				}
			],
			"name": "createRecord",
			"outputs": [],
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"inputs": [
				{
					"internalType": "address",
					"name": "_patient",
					"type": "address"
				}
			],
			"name": "getRecords",
			"outputs": [
				{
					"components": [
						{
							"internalType": "string",
							"name": "summary",
							"type": "string"
						},
						{
							"internalType": "string",
							"name": "hashPointer",
							"type": "string"
						},
						{
							"internalType": "address",
							"name": "author",
							"type": "address"
						},
						{
							"internalType": "uint256",
							"name": "timestamp",
							"type": "uint256"
						}
					],
					"internalType": "struct EHRConsent.Record[]",
					"name": "",
					"type": "tuple[]"
				}
			],
			"stateMutability": "view",
			"type": "function"
		},
		{
			"inputs": [
				{
					"internalType": "address",
					"name": "_clinician",
					"type": "address"
				}
			],
			"name": "grantConsent",
			"outputs": [],
			"stateMutability": "nonpayable",
			"type": "function"
		},
		{
			"inputs": [
				{
					"internalType": "address",
					"name": "_clinician",
					"type": "address"
				}
			],
			"name": "revokeConsent",
			"outputs": [],
			"stateMutability": "nonpayable",
			"type": "function"
		}
];

// 2) Globals
let provider, signer, contract;

function log(msg, obj) {
  const el = document.getElementById("output");
  if (obj !== undefined) {
    el.textContent += `${msg} ${JSON.stringify(obj, null, 2)}\n`;
  } else {
    el.textContent += msg + "\n";
  }
  el.scrollTop = el.scrollHeight;
}

function setAccount(text) {
  document.getElementById("account").textContent = text || "";
}

async function connectWallet() {
  try {
    if (!window.ethereum) {
      alert("MetaMask not found. Install it to continue.");
      return;
    }
    await window.ethereum.request({ method: "eth_requestAccounts" });
    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();
    const addr = await signer.getAddress();
    setAccount(`Connected: ${addr}`);
    contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    log("Wallet connected and contract ready.");
  } catch (err) {
    log("connectWallet error:", serializeErr(err));
  }
}

async function checkNetwork() {
  try {
    if (!provider) provider = new ethers.providers.Web3Provider(window.ethereum);
    const net = await provider.getNetwork();
    log(`Network chainId: ${net.chainId} name: ${net.name}`);
  } catch (err) {
    log("checkNetwork error:", serializeErr(err));
  }
}

async function grantConsent() {
  try {
    const clinician = document.getElementById("clinicianAddr").value.trim();
    validateAddress(clinician, "Clinician");
    const tx = await contract.grantConsent(clinician);
    log("grantConsent tx sent:", { hash: tx.hash });
    await tx.wait();
    log(`Consent granted to ${clinician}`);
  } catch (err) {
    log("grantConsent error:", serializeErr(err));
  }
}

async function revokeConsent() {
  try {
    const clinician = document.getElementById("clinicianAddr").value.trim();
    validateAddress(clinician, "Clinician");
    const tx = await contract.revokeConsent(clinician);
    log("revokeConsent tx sent:", { hash: tx.hash });
    await tx.wait();
    log(`Consent revoked for ${clinician}`);
  } catch (err) {
    log("revokeConsent error:", serializeErr(err));
  }
}

async function createRecord() {
  try {
    const patient = document.getElementById("patientAddr").value.trim();
    const summary = document.getElementById("summary").value.trim();
    const hash = document.getElementById("hash").value.trim();
    validateAddress(patient, "Patient");
    if (!summary) throw new Error("Summary is required");
    if (!hash) throw new Error("Hash/URI is required");

    const tx = await contract.createRecord(patient, summary, hash);
    log("createRecord tx sent:", { hash: tx.hash });
    await tx.wait();
    log(`Record created for ${patient}`);
  } catch (err) {
    log("createRecord error:", serializeErr(err));
  }
}

async function viewRecords() {
  try {
    const patient = document.getElementById("patientAddr").value.trim();
    validateAddress(patient, "Patient");
    const recs = await contract.getRecords(patient);
    // recs is an array of tuples: [summary, hashPointer, author, timestamp]
    const pretty = recs.map((r, i) => ({
      index: i,
      summary: r.summary,
      hashPointer: r.hashPointer,
      author: r.author,
      timestamp: r.timestamp.toString()
    }));
    log("Records:", pretty);
  } catch (err) {
    log("viewRecords error:", serializeErr(err));
  }
}

function validateAddress(addr, label) {
  if (!ethers.utils.isAddress(addr)) {
    throw new Error(`${label} address is invalid: ${addr}`);
  }
}

function serializeErr(err) {
  // Avoid circular refs; surface message + code + data
  return { message: err?.message, code: err?.code, data: err?.data };
}

// 3) Wire buttons
document.getElementById("connect").onclick = connectWallet;
document.getElementById("checkNet").onclick = checkNetwork;
document.getElementById("grant").onclick = grantConsent;
document.getElementById("revoke").onclick = revokeConsent;
document.getElementById("create").onclick = createRecord;
document.getElementById("view").onclick = viewRecords;
