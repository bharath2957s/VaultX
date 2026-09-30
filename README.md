# 🔐 VaultX — Secure Zero-Trust File Sharing Platform

> **Share the file. Keep control.**  
> *Encrypted. Controlled. Expiring.*

VaultX is a zero-trust temporary file sharing platform designed for privacy, sovereignty, and real cryptographic security. Senders upload files with AES-256-GCM client/server encryption, set granular policies (password protection, server-side atomic download limits, live expiration, text-only chat, and instant revocation), and monitor access through real-time audit logs and suspicious activity heuristics.

---

## 🏗️ Architecture & Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                     VaultX Architecture                     │
├───────────────────────────────┬─────────────────────────────┤
│      Frontend (React/Vite)    │     Backend (FastAPI/Node)  │
│  - Zero-Trust Policy Console  │  - AES-256-GCM Engine       │
│  - Live Expiration Countdown  │  - Argon2id / PBKDF2 Hashes │
│  - Real-Time Text-Only Chat   │  - Atomic Download Counter  │
│  - Security Center & Audit    │  - HMAC Signed Credentials  │
│  - Intelligent Lossless UI    │  - Heuristic Risk Engine    │
└───────────────────────────────┴─────────────────────────────┘
```

### Cryptographic Lifecycle
```
File Upload ──> Derive unique DEK ──> AES-256-GCM Encrypt ──> Store Isolated (.enc)
                                                                       │
Receiver Access ──> Verify Server Policy (Expiry/Limit/Revoke) ────────┤
                                                                       │
Valid Session Token ──> Decrypt with DEK ──> Authenticate Tag ──> Stream to Client
```

---

## 🛡️ Threat Model & Security Controls

| Threat | VaultX Protection Mechanism |
|---|---|
| **Predictable Token Guessing** | 128-bit+ cryptographically random base64url slugs generated via CSPRNG (`crypto.randomBytes`). |
| **Access Token Tampering** | HMAC-SHA256 signature verification over claims (`iat`, `exp`, `jti`, `share_id`). |
| **Password Brute-Force** | Argon2id / 100,000-round salted PBKDF2 + automatic 15-minute lockout after 5 consecutive failures. |
| **Download Race Conditions** | Atomic database mutex lock during decrement; atomic query verification against `max_downloads`. |
| **Link Forwarding / Leakage** | Optional device binding, short-lived signed sessions, and instant single-click revocation. |
| **File Tampering & Bit Flips** | AES-256-GCM authenticated cipher with 128-bit authentication tag and SHA-256 integrity verification. |
| **Path Traversal & Overwrite** | Filename sanitization, internal random storage UUIDs (`<uuid>.enc`), zero raw paths exposed. |
| **Chat Injections & Exfiltration** | Strictly plain-text protocol; base64 payloads, data URLs, attachments, and `<script>` tags stripped. |
| **Disposable Email Abuse** | Domain MX and disposable provider blocklist (mailinator, tempmail, etc.) prior to registration. |
| **ZIP Bomb & Memory Overflow** | Streaming compression via `archiver` piped directly to HTTP response; temporary memory isolation. |

---

## 🚀 Quickstart & Running Locally

### 1. Unified Node / Full-Stack Server (Live Applet Mode)
```bash
# Install dependencies
npm install

# Start development full-stack server (Port 3000)
npm run dev

# Build for production
npm run build
```

### 2. Docker Compose (Production Multi-Container)
```bash
docker-compose up -d
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- PostgreSQL: `localhost:5432`

---

## 🧪 Automated Security Test Suite

VaultX contains a built-in automated test suite verifying AES-256-GCM tamper detection, Argon2/PBKDF2 constant-time verification, download limit race prevention, link expiration, and disposable email rejection:

- Run via API: `POST /api/security/run-tests`
- Run via UI: Navigate to **Security Center** > Click **"Run Automated Audit"**

---

## 📜 License
Apache-2.0. Built for security-conscious file exchange.
