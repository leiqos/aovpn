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
│   │   ├── config.rs           # VpnConfig struct (shared configuration shape)
│   │   ├── vpn_commands.rs     # Diagnostic commands (VPN status, certs, routing, ports)
│   │   └── vpn_deploy.rs       # Deployment logic (EAP XML, WMI bridge, Scheduled Tasks)
│   ├── tauri.conf.json         # Tauri project config (window size, CSP, icons)
│   ├── capabilities/           # Tauri permission capabilities
│   └── icons/                  # App icons (.ico, .png, .icns)
│
├── docs/
│   ├── Architecture.md         # This file
│   ├── Build_and_Git_Guide.md  # Build, development and Git workflow
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

Device Tunnels require `SYSTEM` privileges for WMI modifications. The app handles this by:
- Writing a PowerShell script encoded as UTF-16LE Base64
- Creating a temporary Scheduled Task XML that runs the script as `S-1-5-18` (SYSTEM)
- Executing the task immediately via `schtasks /run`
- Polling until the task completes, then cleaning it up

**Device Tunnel removal** is performed atomically within a single SYSTEM task:
1. `rasdial /disconnect` — disconnect the tunnel
2. `Start-Sleep -Milliseconds 800` — brief delay so AlwaysOn cannot reconnect
3. Delete WMI profile via `MDM_VPNv2_01` CIM session
4. `Remove-VpnConnection -AllUserConnection -Force` — remove phonebook entry

This ensures the deletion succeeds even when the tunnel is actively connected.

### 2. VpnConfig — Shared Configuration Shape

`config.rs` defines `VpnConfig`, the single Rust struct that carries all configuration from the React frontend to the Rust backend via Tauri IPC. It uses `#[serde(rename_all = "camelCase")]` to transparently map between TypeScript camelCase and Rust snake_case.

**Current fields:**

| Rust field | TypeScript field | Purpose |
|---|---|---|
| `company_prefix` | `companyPrefix` | Profile name prefix |
| `vpn_server_address` | `vpnServerAddress` | External VPN FQDN |
| `dns_suffix` | `dnsSuffix` | Internal DNS suffix |
| `trusted_network` | `trustedNetwork` | TrustedNetworkDetection value |
| `internal_ping_target` | `internalPingTarget` | Optional ping target for scheduled task TND check |
| `dns_servers` | `dnsServers` | Internal DNS server IPs |
| `device_routes` | `deviceRoutes` | Device Tunnel route list |
| `user_routes` | `userRoutes` | User Tunnel route list |
| `enable_task_scheduler_trigger` | `enableTaskSchedulerTrigger` | Deploy auto-connect scheduled task |
| `device_tunnel_always_on` | `deviceTunnelAlwaysOn` | AlwaysOn flag in Device Tunnel XML |
| `user_tunnel_protocol` | `userTunnelProtocol` | SSTP / IKEv2 / Automatic |
| `user_tunnel_always_on` | `userTunnelAlwaysOn` | AlwaysOn flag in User Tunnel XML |
| `force_tunneling` | `forceTunneling` | ForceTunnel routing policy |
| `disable_class_based_route` | `disableClassBasedRoute` | Suppress classful default routes |
| `disable_disconnect_button` | `disableDisconnectButton` | Hide disconnect UI button |
| `sstp_disable_revocation` | `sstpDisableRevocation` | Disable CRL check for SSTP |
| `root_ca_hash` | `rootCaHash` | Root CA certificate thumbprint |
| `eap_server_names` | `eapServerNames` | Server name for EAP-TLS validation |

### 3. Internal Ping Target — Trusted Network Detection Fix

The auto-connect scheduled task checks `Test-Connection -ComputerName $internalDomain` to determine if the machine is already on the corporate network before attempting to dial the VPN. If the `dnsSuffix` is a publicly routable domain (e.g. `corp.company.de`), this test always succeeds from outside and the Device Tunnel never connects.

The `internalPingTarget` field solves this: if set, the scheduled task pings that address (e.g. an internal DC IP like `192.168.1.10`) instead of the DNS suffix. An internal IP is unreachable from external networks, so the check correctly triggers the VPN dial.

> Note: `TrustedNetworkDetection` in the VPN XML profile works differently — it compares the network adapter's connection-specific DNS suffix (assigned by DHCP/AD) against the configured value, not reachability. Public domains are safe to use there.

### 4. Input Sanitization

User inputs flow into PowerShell commands. Multiple defense layers are applied:
- **Frontend:** Strips dangerous characters (`"`, `'`, `;`, `$`, `` ` ``, `|`, `&`, `{`, `}`) before sending to backend
- **Backend:** Encodes entire PowerShell scripts as UTF-16LE Base64 (`-EncodedCommand`) to prevent shell injection

### 5. EAP XML Generation

Instead of using static XML templates, the app generates EAP XML on-the-fly from configuration inputs. This allows dynamic certificate hash embedding and server name validation per deployment.

### 6. Dual Language

All UI strings and configuration guides (`guides.ts`) are available in English and German. A single `lang` state toggle in `App.tsx` switches between the `en` and `de` locales. All labels, tooltips, and guide steps are fully translated.

## Extending the App

- **New system commands:** Add functions to `vpn_deploy.rs` or `vpn_commands.rs`, register them in `lib.rs` with `#[command]`, and call them via `invoke()` from the frontend.
- **New config fields:** Add the field to the `VpnConfig` struct in `config.rs`, the TypeScript interface in `App.tsx`, the default state, and any relevant translations.
- **New guides:** Add entries to the `guides` object in `guides.ts` for both `en` and `de` locales using the `GuideStep` interface.
- **UI components:** The current UI lives in a single `App.tsx`. Future iterations could split this into a `components/` folder.
