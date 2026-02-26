use base64::Engine;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct VpnConfig {
    pub company_prefix: String,
    pub vpn_server_address: String,
    pub dns_suffix: String,
    pub dns_servers: String,
    pub trusted_network: String,
    pub root_ca_hash: String,
    pub eap_server_names: String,
    pub device_routes: Vec<String>,
    pub user_routes: Vec<String>,
    pub enable_task_scheduler_trigger: bool,
    pub user_tunnel_protocol: String,
    pub user_tunnel_always_on: bool,
    pub force_tunneling: bool,
    pub disable_class_based_route: bool,
    pub disable_disconnect_button: bool,
    pub sstp_disable_revocation: bool,
}

/// Helper to convert a string to a UTF-16LE Base64 string for PowerShell's -EncodedCommand
pub fn encode_powershell_script(script: &str) -> String {
    let utf16: Vec<u8> = script
        .encode_utf16()
        .flat_map(|u| u.to_le_bytes())
        .collect();
    base64::engine::general_purpose::STANDARD.encode(&utf16)
}
