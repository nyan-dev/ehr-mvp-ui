# 🎯 EHR-MVP-UI — Quick Demo Script

This is a **2–3 minute guided flow** you can use for:
- Live demonstrations
- Screen recordings
- Thesis / pilot presentations

It assumes:
- You’ve deployed to **Sepolia** with a known contract address
- MetaMask is installed and has test ETH
- You’re using the current stable build

---

## 🖥 1. Landing page
- Open [ehr-mvp-ui.vercel.app](https://ehr-mvp-ui.vercel.app) in a MetaMask‑enabled browser.
- Mention: “This is a **pure client‑side** dApp — no backend server; all state is on the blockchain.”

---

## 🔌 2. Connect wallet
- Click **Connect Wallet**.
- Approve connection in MetaMask.
- Point out the connected address appearing under the button.
- (Optional) click **Check Network** → should say: `chainId=11155111 name=sepolia`.

---

## ✅ 3. Grant consent
- In **Clinician Address**, paste a valid EVM address.
- Click **Grant Consent**.
- Show MetaMask transaction prompt → confirm.
- Wait for mined transaction log:  
  `"Consent granted to 0x... { "blockNumber": ... }"`

---

## 📝 4. Create a record
- Under **Clinician Actions**:
  - **Patient Address**: paste an address you control (or a test partner’s)
  - **Record Summary**: e.g., `Weight - 125 lbs, Height - 7ft`
  - **Hash/URI**: e.g., `Hash1234` (placeholder for IPFS/URI)
- Click **Create Record**.
- Show transaction hash + block number log.

---

## 👀 5. View records
- With the patient address still filled in, click **View Records**.
- Output should list at least one record object with:
  - `summary`
  - `hashPointer`
  - `author`
  - `timestamp`

---

## 💬 6. Wrap-up talking points
- **Security**: Consent is enforced in the smart contract — no backend can bypass it.
- **Transparency**: All actions are logged on‑chain (viewable in Sepolia Etherscan).
- **Extensibility**: Frontend can be adapted to support IPFS, encryption, and role‑specific dashboards.

---

## 🛠 Demo tips
- Use pre‑funded Sepolia accounts for smooth flow.
- Keep a text file with test addresses & sample data ready to paste.
- For screen recordings, zoom the browser to ~110–125% for legibility.

---
