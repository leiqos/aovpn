# Architecture & Folder Structure

This document outlines the architecture of the AOVPN Dashboard to help contributors and maintainers quickly orient themselves.

## Folder Structure

```text
aovpn/
├── src/                        # Frontend (React + TypeScript)
│   ├── App.tsx                 # Main UI — tabs, forms, terminal, guides
│   ├── App.css                 # All application styles
│   ├── guides.ts               # Step-by-step configuration guides (EN/DE)
│   ├── main.tsx                # React entry point
│   └── index.css               # Base/reset styles
│
├── src-tauri/                  # Backend (Rust + Tauri v2)
│   ├── src/
│   │   ├── main.rs             # Executable entry point
│   │   ├── lib.rs              # Tauri app setup & IPC command registration
│   │   ├── config.rs           # VpnConfig struct (shared state shape)
│   │   ├── vpn_commands.rs     # Diagnostic commands (VPN status, certs, routing, ports)
│   │   └── vpn_deploy.rs       # Deployment logic (EAP XML, WMI bridge, Scheduled Tasks)
│   ├── tauri.conf.json         # Tauri project config (window size, CSP, icons)
│   ├── capabilities/           # Tauri permission capabilities
│   └── icons/                  # App icons (.ico, .png, .icns)
│
├── docs/
│   ├── Architecture.md         # This file
│   └── Security.md             # Security guidelines
│
├── package.json                # NPM dependencies & scripts
├── vite.config.ts              # Vite build configuration
└── LICENSE                     # MIT License
```

## Data Flow

```
User Input (React form) 
    → invoke("command_name", { args })     // Tauri IPC
    → Rust handler in lib.rs               // routes to correct function
    → vpn_deploy.rs / vpn_commands.rs      // executes PowerShell via std::process
    → Result<String, String>               // returned to frontend
    → Terminal output (logs)               // displayed in UI
```

## Key Architecture Decisions

### 1. SYSTEM Context via Scheduled Tasks
Device Tunnels require `SYSTEM` privileges. The app handles this by:
- Writing a temporary XML template to disk
- Creating a Scheduled Task that runs as `S-1-5-18` (SYSTEM)
- Executing the task, which injects the VPN profile via `MDM_VPNv2_01` WMI bridge
- Cleaning up the temporary task afterwards

### 2. Input Sanitization
User inputs flow into PowerShell commands. Multiple layers of defense are applied:
- **Frontend:** Strips dangerous characters (`"`, `'`, `;`, `$`, `` ` ``, `|`, `&`, `{`, `}`) before sending to backend
- **Backend:** Encodes entire PowerShell scripts as Base64 (`-EncodedCommand`) to prevent shell injection

### 3. EAP XML Generation
Instead of using static XML templates, the app generates EAP XML on-the-fly from the configuration inputs. This allows dynamic certificate hashing and server name validation.

### 4. Dual Language
All UI strings and configuration guides (`guides.ts`) are available in English and German, controlled by a single toggle in the app state.

## Extending the App

- **New system commands:** Add functions to `vpn_deploy.rs` or `vpn_commands.rs`, register them in `lib.rs`, and call them via `invoke()` from the frontend.
- **New guides:** Add entries to the `guides` object in `guides.ts` for both `en` and `de` locales.
- **UI components:** The current UI lives in a single `App.tsx`. Future iterations could split this into a `components/` folder for better maintainability.
