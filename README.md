<p align="center">
  <img src="public/app-icon.png" alt="AOVPN Dashboard Logo" width="120" />
</p>

<h1 align="center">AOVPN Dashboard</h1>

<p align="center">
  A modern desktop application for managing Windows Always On VPN — built with Tauri, React &amp; Rust.
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
  - Optional **Always On** toggle for Device Tunnel (default: enabled)
  - Optional **Internal Ping Target** — specify an internal IP or hostname to use for trusted network detection instead of the DNS suffix (fixes false-positive detection on publicly routable domains)
- **User Tunnel** — Deploys SSTP or IKEv2 user tunnel upon login for full intranet access
  - Configurable protocol (SSTP / IKEv2 / Automatic) and Always On toggle
- **Routing Controls** — Force tunneling, disable class-based routes, split routing
- **Trusted Network Detection** — Auto-suppresses VPN when on the corporate network
- **Auto-Connect Task** — Optional Windows Scheduled Task for Device Tunnel reconnect on startup (useful for older Windows 10 clients; not required on Windows 11 Enterprise which handles this natively)
- **Import / Export** — Save and load VPN configurations as `.json` files

### 🏢 Server Management

- **Role Installation** — Check status and install RRAS, NPS, and IIS directly from the app
- **Step-by-Step Guides** — Detailed built-in configuration guides with explanations for:
  - RRAS (VPN server setup, ports, certificates, IP pools)
  - NPS (RADIUS client, connection request & network policies, policy order)
  - Certificate Authority (server, device and user cert templates, enrollment, chain validation)
  - Active Directory & GPO (security groups, autoenrollment, Root CA deployment)
  - CRL / CDP via IIS (HTTP distribution, Delta CRL, AIA extension, testing)

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
│  │  (EAP XML generation, WMI deployment,       │ │
│  │   Scheduled Tasks for SYSTEM context)        │ │
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

For Device Tunnel removal, the app performs a single atomic SYSTEM-context operation: disconnect → wait → remove WMI profile → remove phonebook entry, preventing AlwaysOn from reconnecting between steps.

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
npx tauri build
```

> **Note:** The `npm run tauri` shorthand is not available — always use `npx tauri build` or `npx tauri dev`.

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
│   ├── Build_and_Git_Guide.md  # Build, development and Git workflow
│   └── Security.md             # Security considerations & guidelines
│
├── package.json                # NPM config & scripts
├── vite.config.ts              # Vite build config
└── LICENSE                     # MIT License
```

---

## Configuration Fields Reference

| Field | Description |
|-------|-------------|
| `companyPrefix` | Profile name prefix (e.g. `MyCompany` → `MyCompany Device Tunnel`) |
| `vpnServerAddress` | External FQDN of the VPN server (e.g. `vpn.company.com`) |
| `dnsSuffix` | Internal DNS suffix for split DNS (e.g. `corp.company.com`) |
| `trustedNetwork` | Domain suffix for TrustedNetworkDetection in VPN profile XML |
| `internalPingTarget` | Optional: IP or internal hostname to ping for trusted network check in the scheduled task. Leave empty to fall back to `dnsSuffix`. Use this if your domain is publicly routable. |
| `dnsServers` | Internal DNS server IPs (comma-separated) |
| `deviceTunnelAlwaysOn` | Whether Device Tunnel uses `<AlwaysOn>true</AlwaysOn>` in the XML profile |
| `enableTaskSchedulerTrigger` | Deploy an auto-connect scheduled task (legacy workaround, not needed on Win11 Enterprise) |
| `userTunnelAlwaysOn` | Whether User Tunnel uses Always On |
| `forceTunneling` | Route all traffic through VPN (`ForceTunnel` routing policy) |

---

## Documentation

- [Architecture & Folder Structure](docs/Architecture.md) — Detailed technical overview
- [Build & Git Guide](docs/Build_and_Git_Guide.md) — Build, development and Git workflow
- [Security Guidelines](docs/Security.md) — Input sanitization, privilege escalation, PKI considerations

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

> **Disclaimer:** This software is provided as-is for educational and administrative purposes. The author accepts no responsibility for any damage, data loss, or misconfiguration resulting from its use. Always test in a non-production environment first.
