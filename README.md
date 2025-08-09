# 🏥 EHR-MVP-UI

Minimal **web UI** for blockchain‑secured Electronic Health Record (EHR) consent management.  
One‑page HTML/JS app (ethers.js) to:

- Connect a wallet (MetaMask)
- Grant / revoke consent
- Create / view health records  
via the **EHRConsent** smart contract.

Designed for **testnets** (e.g. Sepolia)  
Deployable **free** on [Vercel](https://vercel.com).

---

## 🚀 Live Demo
**[ehr-mvp-ui.vercel.app](https://ehr-mvp-ui.vercel.app)**

---

## 📦 Features
- 🔌 **Wallet connect** (MetaMask)
- ✅ Grant / revoke consent on‑chain
- 📝 Create health records tied to patient address
- 👀 View stored records directly from blockchain
- ⚡ Zero backend — fully client‑side

---

## 📋 Prerequisites
- **MetaMask** installed in your browser
- Testnet ETH (Sepolia) — get from [Sepolia PoW Faucet](https://sepolia-faucet.pk910.de/#/mine/fdfba457-8009-4309-a0cd-c9c40ff499b7)
- EHRConsent contract deployed on testnet  
  *(Replace `CONTRACT_ADDRESS` and `ABI` in `/public/index.js`)*

---

## 🛠 Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/nyan-dev/ehr-mvp-ui.git
cd ehr-mvp-ui
