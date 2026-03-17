# Wallet Hub 💸

A personal Open Finance dashboard and wealth tracker. This project integrates with real banking data via the Pluggy API to consolidate transactions and features a custom manual entry system for non-banking benefits (like meal vouchers).

## 🚀 Features

- **Open Finance Integration:** Automated syncing with banks (e.g., Nubank, Inter) using the Pluggy API (Read-only access).
- **Manual Entries:** Custom form to track non-bank expenses (e.g., Pluxee/Sodexo).
- **Unified Dashboard:** Centralized view of all automated and manual financial flows.
- **Bilingual UI:** Built-in toggles to switch the interface between English and Portuguese.

## 🛠️ Tech Stack

- **Frontend:** React (initialized via Vite for modern, fast builds)
- **Backend:** Node.js (Proxy server to securely handle API keys)
- **Database:** SQLite (Lightweight local storage for manual entries)

## 🔒 Security

This repository does not contain any sensitive financial data or API keys. All credentials are kept strictly local using `.env` files, and the Open Finance integration operates on a strict read-only basis.

---
