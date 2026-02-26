<p align="center">
  <img src="public/app-icon.png" alt="AOVPN Dashboard Logo" width="120" />
</p>

<h1 align="center">AOVPN Dashboard</h1>

<p align="center">
  A modern desktop application for managing Windows Always On VPN — built with Tauri, React & Rust.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Tauri-v2-blue?logo=tauri&logoColor=white" alt="Tauri v2" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/Rust-Backend-orange?logo=rust&logoColor=white" alt="Rust" />
  <img src="https://img.shields.io/badge/TypeScript-Frontend-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="MIT License" />
</p>

<p align="center">
  <img src="docs/screenshots/client-tab.png?v=2" alt="Client Deployment Tab" width="48%" />
  &nbsp;
  <img src="docs/screenshots/server-tab.png?v=2" alt="Server Management Tab" width="48%" />
</p>

---

## What is this?

**AOVPN Dashboard** is a native Windows desktop tool that simplifies the deployment and management of [Microsoft Always On VPN](https://learn.microsoft.com/en-us/windows-server/remote/remote-access/vpn/always-on-vpn/). Instead of writing PowerShell scripts by hand or navigating multiple management consoles, everything is managed from a single, clean GUI — in English and German.

**Who is it for?** IT administrators and engineers who deploy Always On VPN in enterprise environments using Windows Server, Active Directory, and PKI infrastructure.

---

## Features

### 🖥️ Client Deployment
- **Device Tunnel** — Provisions a pre-logon IKEv2 machine tunnel (SYSTEM context) via WMI/MDM bridge
- **User Tunnel** — Deploys SSTP or IKEv2 user tunnel upon login for full intranet access
- **Routing Controls** — Force tunneling, disable class-based routes, trusted network detection
- **Import / Export** — Save and load VPN configurations as `.json` files

### 🏢 Server Management
- **Role Installation** — Check status and install RRAS, NPS, and IIS directly from the app
- **Step-by-Step Guides** — Built-in configuration guides for RRAS, NPS, Certificate Authority, Active Directory GPO, and CRL/CDP setup

### 🛠️ Diagnostics
- **Connection checks** — View active VPNs, routing tables, DNS & port availability
- **Certificate verification** — Validates Root CA, User, and Machine certificates
- **EAP XML extraction** — Extract and format EAP configuration from existing VPN profiles
- **MMC shortcuts** — Quick launch `certlm.msc`, `certmgr.msc`, `certsrv.msc`, `certtmpl.msc`

### 🌍 Dual Language
- Full English and German interface — toggle with one click

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Vite |
| **Backend** | Rust (Tauri v2) |
| **System Integration** | PowerShell, WMI/MDM Bridge, Scheduled Tasks |
| **Desktop Framework** | [Tauri](https://tauri.app/) — lightweight, secure, native |

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  React Frontend                  │
│         (App.tsx · guides.ts · App.css)          │
└──────────────────────┬──────────────────────────┘
                       │ Tauri IPC (invoke)
┌──────────────────────▼──────────────────────────┐
│                  Rust Backend                    │
│  ┌──────────────┐  ┌──────────────────────────┐ │
│  │  config.rs   │  │   vpn_commands.rs        │ │
│  │  (VpnConfig) │  │   (diagnostics, certs)   │ │
│  └──────────────┘  └──────────────────────────┘ │
│  ┌─────────────────────────────────────────────┐ │
│  │             vpn_deploy.rs                   │ │
│  │  (EAP XML generation, WMI deployment,      │ │
│  │   Scheduled Tasks for SYSTEM context)       │ │
│  └─────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────┘
                       │ PowerShell / WMI
               ┌───────▼───────┐
               │  Windows OS   │
               │  (VPN, PKI,   │
               │   AD, RRAS)   │
               └───────────────┘
```

The backend generates EAP XML on-the-fly and uses `MDM_VPNv2_01` WMI bridging to deploy VPN profiles natively. For Device Tunnel operations that require SYSTEM privileges, the app creates temporary Scheduled Tasks running as `S-1-5-18` (SYSTEM) and cleans them up after execution.

---

## Getting Started

### Prerequisites

- **OS:** Windows 10/11 Pro or Enterprise (Admin privileges required)
- **Node.js** v18+ — [Download](https://nodejs.org/)
- **Rust** 1.77+ — [Install via rustup](https://rustup.rs/)

> **Note:** Server features (RRAS, NPS role installation) require a Windows Server machine.

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/leiqos/aovpn.git
cd aovpn

# 2. Install dependencies
npm install

# 3. Run in development mode
npm run tauri dev

# 4. Build for release (creates .exe in src-tauri/target/release)
npm run tauri build
```

---

## Project Structure

```
aovpn/
├── src/                        # Frontend (React + TypeScript)
│   ├── App.tsx                 # Main application UI component
│   ├── App.css                 # Styles
│   ├── guides.ts               # Step-by-step configuration guides (EN/DE)
│   ├── main.tsx                # React entry point
│   └── index.css               # Base styles
│
├── src-tauri/                  # Backend (Rust + Tauri)
│   ├── src/
│   │   ├── main.rs             # Executable entry point
│   │   ├── lib.rs              # Tauri app config & command registration
│   │   ├── config.rs           # VpnConfig data structure
│   │   ├── vpn_commands.rs     # Diagnostic & status query commands
│   │   └── vpn_deploy.rs       # VPN deployment logic (EAP XML, WMI, Tasks)
│   ├── tauri.conf.json         # Tauri configuration
│   └── icons/                  # Application icons
│
├── docs/                       # Documentation
│   ├── Architecture.md         # Architecture & folder structure details
│   └── Security.md             # Security considerations & guidelines
│
├── package.json                # NPM config & scripts
├── vite.config.ts              # Vite build config
└── LICENSE                     # MIT License
```

---

## Documentation

- [Architecture & Folder Structure](docs/Architecture.md) — Detailed technical overview
- [Security Guidelines](docs/Security.md) — Input sanitization, privilege escalation, PKI considerations

---

## Future Improvements

- Split `App.tsx` into smaller, reusable React components
- Add automated tests (unit + integration)
- Add screenshots and demo GIFs to this README

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

> **Disclaimer:** This software is provided as-is for educational and administrative purposes. The author accepts no responsibility for any damage, data loss, or misconfiguration resulting from its use. Always test in a non-production environment first.
