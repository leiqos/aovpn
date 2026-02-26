use tauri::command;
use std::process::Command;
use std::os::windows::process::CommandExt;

#[command]
pub async fn get_vpn_status() -> Result<String, String> {
    let output = Command::new("powershell")
        .args(&["-Command", "$c = @(); $d = Get-VpnConnection -AllUserConnection -ErrorAction SilentlyContinue; if ($d) { $c += $d }; $u = Get-VpnConnection -ErrorAction SilentlyContinue; if ($u) { $c += $u }; if ($c.Count -gt 0) { $c | Select-Object Name, ConnectionStatus | ConvertTo-Json } else { '[]' }"])
        .creation_flags(0x08000000)
        .output()
        .map_err(|e| format!("Failed to get VPN status: {}", e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[command]
pub async fn get_vpn_xml(name: &str) -> Result<String, String> {
    let script = format!(r#"
$conns = @()
$d = Get-VpnConnection -AllUserConnection -ErrorAction SilentlyContinue | Where-Object {{ $_.Name -match "{name}" }}
if ($d) {{ $conns += $d }}
$u = Get-VpnConnection -ErrorAction SilentlyContinue | Where-Object {{ $_.Name -match "{name}" }}
if ($u) {{ $conns += $u }}
$conn = $conns | Select-Object -First 1
if (-not $conn) {{
    "Keine VPN-Verbindung mit dem Namen '*{name}*' gefunden."
}} else {{
    [xml]$xml = $null
    try {{
        if ($conn.EapConfigXmlStream.InnerXml) {{
            $xml = [xml]$conn.EapConfigXmlStream.InnerXml
        }} elseif ($conn.ProfileXML) {{
            $xml = [xml]$conn.ProfileXML
        }}
    }} catch {{
        "Error parsing XML."
        exit 0
    }}

    if (-not $xml) {{
        "Kein lesbares XML in den Verbindungseigenschaften gefunden."
    }} else {{
        $StringWriter = New-Object System.IO.StringWriter
        $XmlWriter = New-Object System.Xml.XmlTextWriter $StringWriter
        $XmlWriter.Formatting = 'Indented'
        $xml.Save($XmlWriter)
        $StringWriter.ToString()
    }}
}}
"#);

    let output = Command::new("powershell")
        .args(&["-Command", &script])
        .creation_flags(0x08000000)
        .output()
        .map_err(|e| format!("Failed to get VPN XML: {}", e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[command]
pub async fn restart_vpn_service() -> Result<String, String> {
    let output = Command::new("powershell")
        .args(&["-Command", "Restart-Service RasMan -Force"])
        .creation_flags(0x08000000)
        .output()
        .map_err(|e| format!("Failed to restart service: {}", e))?;

    if output.status.success() {
        Ok("VPN Service restarted successfully.".to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[command]
pub async fn check_certificates(root_hash: &str) -> Result<String, String> {
    let script = format!(r#"
$hash = '{root_hash}'.Replace(' ', '').Trim()
$root = $null
if ($hash) {{
    $root = Get-ChildItem -Path "Cert:\LocalMachine\Root" -ErrorAction SilentlyContinue | Where-Object {{ $_.Thumbprint -match $hash }}
    if (-not $root) {{
        $root = Get-ChildItem -Path "Cert:\LocalMachine\CA" -ErrorAction SilentlyContinue | Where-Object {{ $_.Thumbprint -match $hash }}
    }}
}}

$machine = Get-ChildItem "Cert:\LocalMachine\My" -ErrorAction SilentlyContinue | Where-Object {{ $_.EnhancedKeyUsageList -match "Client Authentication|1.3.6.1.5.5.7.3.2" }}
$user = Get-ChildItem "Cert:\CurrentUser\My" -ErrorAction SilentlyContinue | Where-Object {{ $_.EnhancedKeyUsageList -match "Client Authentication|1.3.6.1.5.5.7.3.2" }}

function Format-Certs($certs) {{
    if (-not $certs) {{ return "Missing" }}
    $arr = @($certs)
    $formatted = @()
    foreach ($c in $arr) {{
        $name = $c.Subject
        if ([string]::IsNullOrWhiteSpace($name)) {{
            try {{
                $name = $c.GetNameInfo([Security.Cryptography.X509Certificates.X509NameType]::SimpleName, $false)
            }} catch {{}}
        }}
        if ([string]::IsNullOrWhiteSpace($name)) {{
            $name = $c.FriendlyName
        }}
        if ([string]::IsNullOrWhiteSpace($name)) {{
            $name = $c.Thumbprint
        }}
        $issuer = $c.Issuer
        if ($issuer -match 'CN=([^,]+)') {{
            $issuer = $matches[1]
        }}
        $formatted += "$name [Issuer: $issuer] (Expires: $($c.NotAfter.ToString('yyyy-MM-dd')))"
    }}
    return $formatted -join "`n  * "
}}

$res = [ordered]@{{
    "Root CA" = if ($root) {{ "Installed: " + ($root | Select-Object -First 1).Subject }} else {{ "Missing" }}
    "Machine Certs" = Format-Certs $machine
    "User Certs"    = Format-Certs $user
}}
$res | ConvertTo-Json
"#);

    let output = Command::new("powershell")
        .args(&["-Command", &script])
        .creation_flags(0x08000000)
        .output()
        .map_err(|e| format!("Failed to check certs: {}", e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[command]
pub async fn check_routes() -> Result<String, String> {
    let output = Command::new("powershell")
        .args(&["-Command", "$r = Get-NetRoute -ErrorAction SilentlyContinue | Where-Object { $_.InterfaceAlias -match 'Tunnel|VPN' -and $_.DestinationPrefix -notmatch '^(255|224|127|ff00|fe80|::1)' } | Select-Object DestinationPrefix, NextHop, InterfaceAlias; if ($r) { $r | ConvertTo-Json } else { '[]' }"])
        .creation_flags(0x08000000)
        .output()
        .map_err(|e| format!("Failed to check routes: {}", e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[command]
pub async fn check_dns(server: &str) -> Result<String, String> {
    let script = format!(r#"
try {{
    $res = Resolve-DnsName -Name "{server}" -ErrorAction Stop | Select-Object -First 1
    if ($res.IPAddress) {{ "DNS Resolved: $($res.IPAddress)" }} else {{ "DNS Resolved: $($res.IP4Address)" }}
}} catch {{
    "Failed to resolve DNS. The server name might be incorrect or unreachable."
}}
"#);
    let output = Command::new("powershell")
        .args(&["-Command", &script])
        .creation_flags(0x08000000)
        .output()
        .map_err(|e| format!("Failed to check DNS: {}", e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[command]
pub async fn check_ports(server: &str) -> Result<String, String> {
    // We rewrite the powershell script to use TcpClient with a 2 second timeout instead of Test-NetConnection 
    // to avoid massive 21-second timeouts per port, and we also mention UDP for 500/4500.
    let script = format!(r#"
$out = @()
foreach ($port in @(443, 500, 4500)) {{
    $client = New-Object System.Net.Sockets.TcpClient
    $task = $client.ConnectAsync("{server}", $port)
    if ($task.Wait(2000)) {{
        if ($client.Connected) {{
            $out += "Port $port (TCP) is OPEN"
        }} else {{
            $out += "Port $port (TCP) is CLOSED/BLOCKED"
        }}
    }} else {{
        $out += "Port $port (TCP) is TIMEOUT/BLOCKED"
    }}
    $client.Close()
}}

foreach ($port in @(500, 4500)) {{
    $udp = New-Object System.Net.Sockets.UdpClient
    $udp.Client.ReceiveTimeout = 2000
    try {{
        $udp.Connect("{server}", $port)
        $bytes = [Text.Encoding]::ASCII.GetBytes("ping")
        [void]$udp.Send($bytes, $bytes.Length)
        $ep = New-Object System.Net.IPEndPoint([System.Net.IPAddress]::Any, 0)
        [void]$udp.Receive([ref]$ep)
        $out += "Port $port (UDP) is OPEN (Responded)"
    }} catch {{
        $errStr = $_.Exception.ToString()
        if ($errStr -match "forcibly closed" -or $errStr -match "gewaltsam" -or $errStr -match "10054") {{
            $out += "Port $port (UDP) is CLOSED (ICMP Port Unreachable)"
        }} else {{
            $out += "Port $port (UDP) is OPEN/FILTERED (No rejection received)"
        }}
    }} finally {{
        $udp.Close()
    }}
}}
$out -join "`n"
"#);

    let output = Command::new("powershell")
        .args(&["-Command", &script])
        .creation_flags(0x08000000)
        .output()
        .map_err(|e| format!("Failed to check ports: {}", e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[command]
pub async fn check_nps_role() -> Result<String, String> {
    let script = r#"
$role = Get-WindowsFeature -Name NPAS -ErrorAction SilentlyContinue 
if ($role -and $role.Installed) { "INSTALLED" } else { "MISSING" }
"#;
    let output = Command::new("powershell")
        .args(&["-Command", script])
        .creation_flags(0x08000000)
        .output()
        .map_err(|e| format!("Failed to check NPS role: {}", e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[command]
pub async fn install_nps_role() -> Result<String, String> {
    let script = r#"
Write-Host "Installing Network Policy and Access Services (NPAS)..."
$res = Install-WindowsFeature -Name NPAS -IncludeManagementTools
if ($res.Success) {
    Write-Host "NPS Role installed successfully."
    if ($res.RestartNeeded) { Write-Host "A system restart may be required." }
} else {
    Write-Error "Role installation failed."
    exit 1
}
"#;
    let output = Command::new("powershell")
        .args(&["-Command", script])
        .creation_flags(0x08000000)
        .output()
        .map_err(|e| format!("Failed to install NPS role: {}", e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[command]
pub async fn check_rras_role() -> Result<String, String> {
    let script = r#"
$role = Get-WindowsFeature -Name DirectAccess-VPN -ErrorAction SilentlyContinue 
if ($role -and $role.Installed) { "INSTALLED" } else { "MISSING" }
"#;
    let output = Command::new("powershell")
        .args(&["-Command", script])
        .creation_flags(0x08000000)
        .output()
        .map_err(|e| format!("Failed to check RRAS role: {}", e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[command]
pub async fn install_rras_role() -> Result<String, String> {
    let script = r#"
Write-Host "Installing Routing and Remote Access (RRAS)..."
$res = Install-WindowsFeature -Name DirectAccess-VPN -IncludeManagementTools
if ($res.Success) {
    Write-Host "RRAS Role installed successfully."
    if ($res.RestartNeeded) { Write-Host "A system restart may be required." }
} else {
    Write-Error "Role installation failed."
    exit 1
}
"#;
    let output = Command::new("powershell")
        .args(&["-Command", script])
        .creation_flags(0x08000000)
        .output()
        .map_err(|e| format!("Failed to install RRAS role: {}", e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[command]
pub async fn check_iis_role() -> Result<String, String> {
    let script = r#"
$role = Get-WindowsFeature -Name Web-Server -ErrorAction SilentlyContinue 
if ($role -and $role.Installed) { "INSTALLED" } else { "MISSING" }
"#;
    let output = Command::new("powershell")
        .args(&["-Command", script])
        .creation_flags(0x08000000)
        .output()
        .map_err(|e| format!("Failed to check IIS role: {}", e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[command]
pub async fn install_iis_role() -> Result<String, String> {
    let script = r#"
Write-Host "Installing IIS Web Server for CRL Distribution Point..."
$res = Install-WindowsFeature -Name Web-Server -IncludeManagementTools
if ($res.Success) {
    Write-Host "IIS Web Server installed successfully."
    if ($res.RestartNeeded) { Write-Host "A system restart may be required." }
} else {
    Write-Error "IIS Role installation failed."
    exit 1
}
"#;
    let output = Command::new("powershell")
        .args(&["-Command", script])
        .creation_flags(0x08000000)
        .output()
        .map_err(|e| format!("Failed to install IIS role: {}", e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[command]
pub async fn audit_templates() -> Result<String, String> {
    let script = r#"
try {
    # Check if ADCS module is loaded
    if (-not (Get-Command Get-CATemplate -ErrorAction SilentlyContinue)) {
        "CA Audit Error: Active Directory Certificate Services (ADCS) module not found. This command must be run on the CA server or a workstation with RSAT ADCS tools installed."
        exit 0
    }
    
    $out = @()
    $out += "=== PKI Template Audit ==="
    $templates = Get-CATemplate -ErrorAction SilentlyContinue
    if (-not $templates) {
        $out += "Error: Could not list templates."
        $out -join "`n"
        exit 0
    }

    $vpnTypes = @("RASAndIASServer", "VPN", "AOVPN")
    $found = $templates | Where-Object { $vpnTypes -contains $_.Name -or $_.Name -match "AOVPN" }
    
    if ($found) {
        $out += "Found Potential VPN Templates:"
        foreach ($t in $found) {
            $out += " - $($t.Name) [OID: $($t.OID)]"
        }
        $out += "Recommendation: Ensure these templates have 'Client Authentication'/'Server Authentication' extended key usage and appropriate security group permissions."
    } else {
        $out += "WARNING: No existing AOVPN or RAS templates could be confidently identified."
        $out += "Recommendation: Connect to certtmpl.msc, duplicate 'Workstation Authentication' for devices, and 'User' for user tunnels."
    }
    $out -join "`n"
} catch {
    "Failed to audit CA Templates. Make sure you are running this with Enterprise Admin rights on the domain."
}
"#;
    let output = Command::new("powershell")
        .args(&["-Command", script])
        .creation_flags(0x08000000)
        .output()
        .map_err(|e| format!("Failed to audit templates: {}", e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}
