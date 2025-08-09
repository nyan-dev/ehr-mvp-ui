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
```
2. Install dependencies
(If you add npm packages later)

```bash
npm install
```

3. Configure contract details
Edit /public/index.js:

```javascript
const CONTRACT_ADDRESS = "0xYourDeployedAddress";
const CONTRACT_ABI = [ /* Your Contract ABI JSON */ ];
```

4. Run locally
You can simply open public/index.html in your browser, or serve locally for hot reload:

```bash
npm install -g serve
serve public
```

5. Deploy to Vercel
```bash
vercel --prod
```

🧩 Tech Stack
ethers.js

HTML + Vanilla JS

Vercel for hosting

📚 Usage Flow
Connect Wallet Authorizes MetaMask to interact with the contract

Grant Consent Allows a clinician address to view records

Create Record Saves hashed health record metadata on‑chain

View Records Fetches list of records from blockchain for connected account

📄 License
MIT License — see LICENSE for details.

🙌 Acknowledgements
Ethereum community for testnets & tooling

Open‑source contributors
