# Security Guidelines

Security considerations when extending or deploying the AOVPN Dashboard.

## 1. Privilege Escalation (SYSTEM Context)

Device Tunnels require `SYSTEM` privileges for WMI modifications. The application handles this through:
- Generating isolated, temporary script templates
- Leveraging Windows Task Scheduler (`schtasks`) with `HighestAvailable` XML configuration
- Executing the task as `S-1-5-18` (SYSTEM), then cleaning up

**Rule:** Never execute long-running, external, or dynamically-fetched commands through this escalation pattern without thorough validation.

## 2. Command Injection Prevention

User inputs (server names, DNS suffixes, certificate hashes, IP addresses) are incorporated into PowerShell commands. Multiple defense layers are applied:

| Layer | Mechanism |
|-------|-----------|
| **Frontend** | `handleChange` strips dangerous characters (`"`, `'`, `;`, `$`, `` ` ``, `|`, `&`, `{`, `}`) |
| **Backend** | `encode_powershell_script` encodes entire command blocks as Base64 (`-EncodedCommand`), preventing shell metacharacter injection |
| **File writes** | `write_file_to_path` restricts file extensions to `.json` only |
| **CSP** | Content Security Policy restricts resource loading to `self` and Google Fonts |

## 3. Certificate Revocation

The app includes the ability to disable Certificate Revocation List (CRL) checks for SSTP, primarily for testing or constrained PKI environments.

**Rule:** The `sstpDisableRevocation` toggle should be clearly warned in the UI. Deploying VPN without revocation checks means the endpoint cannot verify if a certificate has been compromised.

## 4. Dependency Security

| Component | Approach |
|-----------|----------|
| **Frontend** | Secured by Vite build pipeline and Tauri's hardened IPC model (commands must be explicitly registered) |
| **NPM** | Run `npm audit` periodically to check for vulnerabilities |
| **Rust Crates** | Run `cargo audit` periodically (install via `cargo install cargo-audit`) |

**Rule:** Do not add third-party Tauri plugins to `lib.rs` without reviewing their elevated capabilities profile.
