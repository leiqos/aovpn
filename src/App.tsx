import { useState, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import './App.css';

interface VpnConfig {
  companyPrefix: string;
  vpnServerAddress: string;
  dnsSuffix: string;
  trustedNetwork: string;
  dnsServers: string;
  rootCaHash: string;
  eapServerNames: string;
  deviceRoutes: string[];
  userRoutes: string[];
  enableTaskSchedulerTrigger: boolean;
  userTunnelProtocol: string;
  userTunnelAlwaysOn: boolean;
  forceTunneling: boolean;
  disableClassBasedRoute: boolean;
  disableDisconnectButton: boolean;
  sstpDisableRevocation: boolean;
}

interface LogEntry {
  time: string;
  cmd: string;
  msg: string;
  isError: boolean;
}

const en = {
  title: "AOVPN",
  subtitle: "Enterprise Management Console",
  btnDeploy: "Run Deployment",
  btnDeploying: "Deploying...",
  clear: "Clear Log",
  coreParams: "1. Core & Network",
  prefixLabel: "Profile Prefix",
  serverLabel: "VPN Server FQDN",
  dnsSuffixLabel: "Internal DNS Suffix",
  trustedLabel: "Trusted Network",
  dnsServersLabel: "Internal DNS Servers",
  tunnelConstraints: "2. Routing & Rules",
  devRoutesLabel: "Device Routes",
  devTaskTrigger: "Auto-Connect Task",
  userRoutesLabel: "User Routes",
  protocolLabel: "Protocol",
  alwaysOnLabel: "Always On Enabled",
  advSection: "Advanced Options",
  forceTunnel: "Force Tunneling",
  disableClass: "Hide Default Routes",
  hideDisconnect: "Hide Disconnect UI",
  secPKI: "3. Certificates",
  rootCALabel: "Root CA Hash",
  eapLabel: "EAP Server Name",
  ignoreRevOn: "Revocation: OFF",
  ignoreRevOff: "Revocation: ON",
  verifyCerts: "Verify Local Certs",
  certShortcuts: "Certificate Tools",
  certTmpl: "Templates",
  certSrv: "CA Server",
  certMgr: "User Store",
  certLm: "Machine Store",
  tunnelCtrl: "4. Status & Tests",
  devTunnelCtrl: "Device Tunnel",
  userTunnelCtrl: "User Tunnel",
  up: "Up",
  down: "Down",
  remove: "Del",
  inspection: "System Checks",
  getState: "Connections",
  verifyRoutes: "Routes",
  getXml: "EAP XML",
  checkDns: "DNS Check",
  checkPorts: "Port Check",
  restartService: "Restart RasMan",
  terminal: "Terminal Output",
  streamReady: "Ready...",
  exportConfig: "Export",
  importConfig: "Import",
  promptVpnName: "Enter the name of the VPN connection to extract XML from:",
  tabClient: "Client Setup",
  tabServer: "Server Setup",
  serverAdminTitle: "Server Infrastructure",
  npsShortcut: "NPS Console",
  npsDesc: "Radius, Connection Request & Network Policies.",
  rrasShortcut: "RRAS Console",
  rrasDesc: "VPN Pools, SSTP/IKEv2 Ports & Routing.",
  caShortcut: "CA Console",
  caDesc: "Certificate Templates & Issuance.",
  auditTmpl: "Audit Templates",
  roleStatus: "Role Status:",
  btnInstallRole: "Install",
  btnInstallingRole: "Installing...",
  btnGuide: "Config Guide",
  adGpoShortcut: "AD & GPO",
  adGpoDesc: "AD Groups & Certificate Enrollment Policies.",
  tt_server: "External Fully Qualified Domain Name of your VPN Server",
  tt_eap: "Name on the Server Certificate used for EAP-TLS verification",
  tt_dev_routes: "Best Practice: Allow only /32 routes to Domain Controllers (e.g. 192.168.1.10/32).",
  tt_user_routes: "Best Practice: Allow full subnet routes for user access (e.g. 192.168.1.0/24).",
  guideClose: "Close",
  guideOpen: "Open",
  rrasGuideTitle: "🚀 RRAS Configuration Guide",
  npsGuideTitle: "🛡️ NPS Configuration Guide",
  caGuideTitle: "📜 Certificate Templates Guide",
  adGpoGuideTitle: "👥 Active Directory & GPO Guide",
  cdpShortcut: "CRL / CDP (IIS)",
  cdpDesc: "IIS Web Server for hosting Certificate Revocation Lists (CRL) over HTTP.",
  cdpGuideTitle: "🌐 CRL Distribution Point Guide",
};

const de = {
  title: "AOVPN",
  subtitle: "Enterprise Management Konsole",
  btnDeploy: "Deployment Starten",
  btnDeploying: "Wird Deployt...",
  clear: "Log Leeren",
  coreParams: "1. Kern-Netzwerk",
  prefixLabel: "Profil-Präfix",
  serverLabel: "VPN Server FQDN",
  dnsSuffixLabel: "Internes DNS Suffix",
  trustedLabel: "Trusted Net",
  dnsServersLabel: "Interne DNS Server",
  tunnelConstraints: "2. Routing & Regeln",
  devRoutesLabel: "Device Routen",
  devTaskTrigger: "Auto-Connect Task",
  userRoutesLabel: "User Routen",
  protocolLabel: "Protokoll",
  alwaysOnLabel: "Immer An (Always On)",
  advSection: "Erweiterte Optionen",
  forceTunnel: "Force Tunneling",
  disableClass: "Standardrouten Aus",
  hideDisconnect: "Trennen-UI Verbergen",
  secPKI: "3. Zertifikate",
  rootCALabel: "Root CA Hash",
  eapLabel: "EAP Server Name",
  ignoreRevOn: "Sperrlisten: AUS",
  ignoreRevOff: "Sperrlisten: AN",
  verifyCerts: "Lokale Certs Prüf.",
  certShortcuts: "Zertifikats-Tools",
  certTmpl: "Vorlagen",
  certSrv: "CA Server",
  certMgr: "User Store",
  certLm: "Rechner Store",
  tunnelCtrl: "4. Status & Tests",
  devTunnelCtrl: "Device Tunnel",
  userTunnelCtrl: "User Tunnel",
  up: "Up",
  down: "Down",
  remove: "Del",
  inspection: "System Checks",
  getState: "Verbindungen",
  verifyRoutes: "Routen",
  getXml: "EAP XML",
  checkDns: "DNS Test",
  checkPorts: "Port Test",
  restartService: "RasMan Neustart",
  terminal: "Terminal Ausgabe",
  streamReady: "Bereit...",
  exportConfig: "Export",
  importConfig: "Import",
  promptVpnName: "Geben Sie den Namen der VPN-Verbindung ein, um deren XML zu extrahieren:",
  tabClient: "Client Setup",
  tabServer: "Server Setup",
  serverAdminTitle: "Server Infrastruktur",
  npsShortcut: "NPS Konsole",
  npsDesc: "Radius, Verbindungs- & Netzwerkrichtlinien.",
  rrasShortcut: "RRAS Konsole",
  rrasDesc: "VPN Pools, SSTP/IKEv2 Ports & Routing.",
  caShortcut: "CA Konsole",
  caDesc: "Zertifikatsvorlagen & Ausstellung.",
  auditTmpl: "Templates Prüfen",
  roleStatus: "Rollen Status:",
  btnInstallRole: "Installieren",
  btnInstallingRole: "Wird installiert...",
  btnGuide: "Config Guide",
  adGpoShortcut: "AD & GPO",
  adGpoDesc: "AD Gruppen & Zertifikats-Enrollment Richtlinien.",
  tt_server: "Externer Fully Qualified Domain Name des VPN Servers",
  tt_eap: "Name auf dem Serverzertifikat zur EAP-TLS Überprüfung",
  tt_dev_routes: "Best Practice: Nur /32 Host-Routen zu Domain Controllern (z.B. 192.168.1.10/32).",
  tt_user_routes: "Best Practice: Ganze Subnetze für Benutzerzugriff freigeben (z.B. 192.168.1.0/24).",
  guideClose: "Schließen",
  guideOpen: "Öffnen",
  rrasGuideTitle: "🚀 RRAS Konfigurations-Guide",
  npsGuideTitle: "🛡️ NPS Konfigurations-Guide",
  caGuideTitle: "📜 Zertifikatsvorlagen-Guide",
  adGpoGuideTitle: "👥 Active Directory & GPO Guide",
  cdpShortcut: "CRL / CDP (IIS)",
  cdpDesc: "IIS-Webserver zum Bereitstellen von Zertifikatsperrlisten (CRL) über HTTP.",
  cdpGuideTitle: "🌐 Sperrlisten-Verteilungspunkt Guide",
};


import { guides } from './guides';



function App() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [lang, setLang] = useState<'en' | 'de'>('de'); // Default German
  const [activeTab, setActiveTab] = useState<'client' | 'server'>('client');
  const [npsStatus, setNpsStatus] = useState<'LOADING' | 'INSTALLED' | 'MISSING'>('LOADING');
  const [rrasStatus, setRrasStatus] = useState<'LOADING' | 'INSTALLED' | 'MISSING'>('LOADING');
  const terminalRef = useRef<HTMLDivElement>(null);

  const T = lang === 'en' ? en : de;

  const [config, setConfig] = useState<VpnConfig>({
    companyPrefix: "",
    vpnServerAddress: "",
    dnsSuffix: "",
    trustedNetwork: "",
    dnsServers: "",
    rootCaHash: "",
    eapServerNames: "",
    deviceRoutes: [],
    userRoutes: [],
    enableTaskSchedulerTrigger: true,
    userTunnelProtocol: "SSTP",
    userTunnelAlwaysOn: true,
    forceTunneling: false,
    disableClassBasedRoute: false,
    disableDisconnectButton: false,
    sstpDisableRevocation: false
  });

  const [showRrasGuide, setShowRrasGuide] = useState(false);
  const [showNpsGuide, setShowNpsGuide] = useState(false);
  const [showCaGuide, setShowCaGuide] = useState(false);
  const [showAdGpoGuide, setShowAdGpoGuide] = useState(false);
  const [isInstallingRras, setIsInstallingRras] = useState(false);
  const [isInstallingNps, setIsInstallingNps] = useState(false);
  const [iisStatus, setIisStatus] = useState<'LOADING' | 'INSTALLED' | 'MISSING'>('LOADING');
  const [isInstallingIis, setIsInstallingIis] = useState(false);
  const [showCdpGuide, setShowCdpGuide] = useState(false);

  useEffect(() => {
    if (activeTab === 'server') {
      invoke<string>('check_nps_role').then(res => setNpsStatus(res as any)).catch(() => setNpsStatus('MISSING'));
      invoke<string>('check_rras_role').then(res => setRrasStatus(res as any)).catch(() => setRrasStatus('MISSING'));
      invoke<string>('check_iis_role').then(res => setIisStatus(res as any)).catch(() => setIisStatus('MISSING'));
    }
  }, [activeTab]);

  useEffect(() => {
    invoke<boolean>('get_sstp_revocation_status')
      .then(res => setConfig(prev => ({ ...prev, sstpDisableRevocation: res })))
      .catch(_ => { });
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = (cmd: string, msg: string, isError: boolean = false) => {
    setLogs(prev => [...prev, {
      time: new Date().toLocaleTimeString(),
      cmd,
      msg,
      isError
    }]);
  };

  const clearLogs = () => setLogs([]);

  const sanitize = (val: string): string => val.replace(/["';$`|&{}]/g, '');

  const handleChange = (field: keyof VpnConfig, value: any) => {
    if (field === 'rootCaHash') {
      value = value.replace(/\s+/g, '');
    }
    if (typeof value === 'string' && field !== 'userTunnelProtocol') {
      value = sanitize(value);
    }
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleRoutesChange = (field: 'deviceRoutes' | 'userRoutes', value: string) => {
    const routesArray = value.split('\n').filter(r => r.trim().length > 0);
    setConfig(prev => ({ ...prev, [field]: routesArray }));
  };

  const callEndpoint = async (command: string, args: any = {}) => {
    try {
      const res: string = await invoke(command, args);
      let formattedRes = res.trim();
      try {
        const obj = JSON.parse(res);
        if (Array.isArray(obj)) {
          formattedRes = obj.map(item => JSON.stringify(item)).join('\n');
        } else {
          // Instead of a single line, we format it nicely for certificates and objects.
          formattedRes = Object.entries(obj).map(([k, v]) => {
            if (String(v).includes('Expires') || String(v).includes('Installed') || String(v).includes('*')) {
              return `\n[${k}]\n  * ${v}`;
            }
            return `${k}: ${v}`;
          }).join('\n');
        }
      } catch (e) { }

      addLog(command, formattedRes, false);
      return res;
    } catch (e: any) {
      addLog(command, String(e), true);
      throw e;
    }
  };

  const toggleLang = () => {
    setLang(prev => prev === 'en' ? 'de' : 'en');
  };

  const toggleRevocationCheck = async () => {
    const newState = !config.sstpDisableRevocation;
    handleChange('sstpDisableRevocation', newState);
    try {
      await callEndpoint('set_sstp_revocation', { disable: newState });
    } catch (e) { }
  };

  const installRrasRole = async () => {
    setIsInstallingRras(true);
    try {
      await callEndpoint('install_rras_role');
      const status = await invoke<string>('check_rras_role');
      setRrasStatus(status as any);
    } catch (e) { } finally {
      setIsInstallingRras(false);
    }
  };

  const installNpsRole = async () => {
    setIsInstallingNps(true);
    try {
      await callEndpoint('install_nps_role');
      const status = await invoke<string>('check_nps_role');
      setNpsStatus(status as any);
    } catch (e) { } finally {
      setIsInstallingNps(false);
    }
  };

  const installIisRole = async () => {
    setIsInstallingIis(true);
    addLog('SYSTEM', 'Installing IIS Web Server role...', false);
    try {
      const result = await callEndpoint('install_iis_role', {});
      addLog('IIS', result, false);
      setIisStatus('INSTALLED');
    } catch (e: any) {
      addLog('IIS', `Installation failed: ${e}`, true);
    } finally {
      setIsInstallingIis(false);
    }
  };

  const deployAll = async () => {
    if (isDeploying) return;

    const missing: string[] = [];
    if (!config.companyPrefix.trim()) missing.push(T.prefixLabel);
    if (!config.vpnServerAddress.trim()) missing.push(T.serverLabel);
    if (!config.dnsSuffix.trim()) missing.push(T.dnsSuffixLabel);
    if (!config.rootCaHash.trim()) missing.push(T.rootCALabel);
    if (!config.eapServerNames.trim()) missing.push(T.eapLabel);
    if (missing.length > 0) {
      window.alert(`${lang === 'de' ? 'Fehlende Pflichtfelder' : 'Missing required fields'}:\n\n• ${missing.join('\n• ')}`);
      return;
    }

    setIsDeploying(true);
    setLogs([]);
    addLog('SYSTEM', 'Starting Full VPN Deployment Sequence...', false);

    try {
      await callEndpoint('deploy_device_tunnel', { config });
      if (config.enableTaskSchedulerTrigger) {
        await callEndpoint('enable_task_scheduler_trigger', { config });
      }
      await callEndpoint('deploy_user_tunnel', { config });

      addLog('SYSTEM', '✅ Full VPN Deployment completed successfully!', false);
    } catch (e) {
      addLog('SYSTEM', '❌ Deployment sequence halted due to errors.', true);
    } finally {
      setIsDeploying(false);
    }
  };

  const exportConfig = async () => {
    try {
      const { save } = await import('@tauri-apps/plugin-dialog');

      const filePath = await save({
        filters: [{
          name: 'JSON Config',
          extensions: ['json']
        }],
        defaultPath: `vpn_config_${new Date().toISOString().split('T')[0]}.json`
      });

      if (filePath) {
        await callEndpoint('write_file_to_path', { path: filePath, content: JSON.stringify(config, null, 2) });
      }
    } catch (e) {
      addLog('SYSTEM', `Failed to export configuration.`, true);
    }
  };

  const importConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setConfig(prev => ({ ...prev, ...json }));
        window.alert("Configuration imported successfully!");
      } catch (err) {
        window.alert("Failed to read configuration file. Invalid JSON format.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="container">
      {(() => {
        const renderGuide = (
          visible: boolean,
          onClose: () => void,
          title: string,
          guideKey: string,
          buttons: { label: string; msc: string }[]
        ) => {
          if (!visible) return null;
          const steps = guides[lang][guideKey];
          return (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <div className="card" style={{ width: '800px', maxWidth: '90%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: '2rem' }}>
                <h2 style={{ marginTop: 0 }}>{title}</h2>
                <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem', marginBottom: '1.5rem' }}>
                  <ul style={{ textAlign: 'left', background: '#0d1117', padding: '1.5rem', borderRadius: '6px', border: '1px solid #30363d', listStyle: 'none', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.9rem' }}>
                    {steps.map((step, i) => (
                      <li key={i}>
                        <b>{i + 1}. {step.title}</b>
                        {step.subs && (
                          <ul style={{ marginTop: '0.5rem', marginBottom: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem', color: '#8b949e' }}>
                            {step.subs.map((sub, j) => <li key={j}>{sub}</li>)}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>{T.guideClose}</button>
                  {buttons.map((btn, i) => (
                    <button key={i} className="btn btn-primary" style={{ flex: 1 }} onClick={() => callEndpoint('open_msc', { name: btn.msc })}>{btn.label}</button>
                  ))}
                </div>
              </div>
            </div>
          );
        };
        return (<>
          {renderGuide(showRrasGuide, () => setShowRrasGuide(false), T.rrasGuideTitle, 'rras', [
            { label: `rrasmgmt.msc ${T.guideOpen}`, msc: 'rrasmgmt.msc' }
          ])}
          {renderGuide(showNpsGuide, () => setShowNpsGuide(false), T.npsGuideTitle, 'nps', [
            { label: `nps.msc ${T.guideOpen}`, msc: 'nps.msc' }
          ])}
          {renderGuide(showCaGuide, () => setShowCaGuide(false), T.caGuideTitle, 'ca', [
            { label: 'certtmpl.msc', msc: 'certtmpl.msc' },
            { label: 'certsrv.msc', msc: 'certsrv.msc' }
          ])}
          {renderGuide(showAdGpoGuide, () => setShowAdGpoGuide(false), T.adGpoGuideTitle, 'adGpo', [
            { label: 'AD (dsa.msc)', msc: 'dsa.msc' },
            { label: 'GPO (gpmc.msc)', msc: 'gpmc.msc' }
          ])}
          {renderGuide(showCdpGuide, () => setShowCdpGuide(false), T.cdpGuideTitle, 'cdp', [
            { label: 'IIS (inetmgr)', msc: 'inetmgr' },
            { label: 'certsrv.msc', msc: 'certsrv.msc' }
          ])}
        </>);
      })()}


      <div style={{ flex: 'none', borderBottom: '1px solid #30363d', marginBottom: '0.8rem', paddingBottom: '0.4rem' }}>
        <div className="header" style={{ paddingBottom: 0, borderBottom: 'none', alignItems: 'center', marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', paddingRight: '1rem', borderRight: '1px solid #30363d', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <img src="/app-icon.png" alt="logo" style={{ width: '24px', height: '24px' }} />
              {T.title}
            </h2>
            <div style={{ display: 'flex', gap: '0.2rem' }}>
              <button
                className="btn"
                style={{ width: '160px', textAlign: 'center', background: 'none', border: 'none', padding: '0.2rem 0.6rem', cursor: 'pointer', fontSize: '0.9rem', color: activeTab === 'client' ? '#58a6ff' : '#8b949e', borderBottom: activeTab === 'client' ? '2px solid #58a6ff' : 'none', borderRadius: 0 }}
                onClick={() => setActiveTab('client')}
              >
                {T.tabClient}
              </button>
              <button
                className="btn"
                style={{ width: '160px', textAlign: 'center', background: 'none', border: 'none', padding: '0.2rem 0.6rem', cursor: 'pointer', fontSize: '0.9rem', color: activeTab === 'server' ? '#58a6ff' : '#8b949e', borderBottom: activeTab === 'server' ? '2px solid #58a6ff' : 'none', borderRadius: 0 }}
                onClick={() => setActiveTab('server')}
              >
                {T.tabServer}
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <label className="btn btn-outline" style={{ width: 'auto', padding: '0.2rem 0.4rem', fontSize: '0.75rem', cursor: 'pointer', margin: 0 }}>
              📥 {T.importConfig}
              <input type="file" accept=".json" style={{ display: 'none' }} onChange={importConfig} />
            </label>
            <button className="btn btn-outline" style={{ width: 'auto', padding: '0.2rem 0.4rem', fontSize: '0.75rem' }} onClick={exportConfig}>
              📤 {T.exportConfig}
            </button>
            <button className="btn btn-outline" style={{ width: 'auto', padding: '0.2rem 0.4rem', fontSize: '0.75rem' }} onClick={toggleLang}>
              {lang === 'de' ? '🇺🇸 EN' : '🇩🇪 DE'}
            </button>
            <button className="btn btn-success" disabled={isDeploying} onClick={deployAll} style={{ width: '260px', padding: '0.4rem 0.8rem', fontSize: '0.9rem', justifyContent: 'center' }}>
              🚀 {isDeploying ? T.btnDeploying : T.btnDeploy}
            </button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        {activeTab === 'client' && (
          <div className="main-grid" style={{ gridTemplateColumns: 'minmax(0, 5fr) minmax(0, 7fr)', minHeight: '100%' }}>
            {/* LEFT COLUMN: Configuration */}
            <div className="col">
              <div className="card">
                <h2>{T.coreParams}</h2>
                <div className="section-grid">
                  <div>
                    <div className="form-group">
                      <label>{T.prefixLabel}</label>
                      <input type="text" placeholder="e.g. MyCompany" value={config.companyPrefix} onChange={e => handleChange('companyPrefix', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label title={T.tt_server}>{T.serverLabel}</label>
                      <input type="text" placeholder="e.g. vpn.example.com" value={config.vpnServerAddress} onChange={e => handleChange('vpnServerAddress', e.target.value)} title={T.tt_server} />
                    </div>
                  </div>
                  <div>
                    <div className="form-group">
                      <label>{T.dnsSuffixLabel}</label>
                      <input type="text" placeholder="e.g. internal.local" value={config.dnsSuffix} onChange={e => handleChange('dnsSuffix', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>{T.trustedLabel}</label>
                      <input type="text" placeholder="e.g. internal.local" value={config.trustedNetwork} onChange={e => handleChange('trustedNetwork', e.target.value)} />
                    </div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label>{T.dnsServersLabel}</label>
                      <input type="text" placeholder="e.g. 192.168.1.10, 192.168.1.11" value={config.dnsServers} onChange={e => handleChange('dnsServers', e.target.value)} />
                    </div>
                  </div>
                </div >
              </div >

              <div className="card">
                <h2>{T.tunnelConstraints}</h2>
                <div className="section-grid">
                  <div>
                    <div className="form-group">
                      <label style={{ color: '#58a6ff' }} title={T.tt_dev_routes}>{T.devRoutesLabel}</label>
                      <textarea rows={3} placeholder="e.g.&#10;10.0.1.10/32&#10;10.0.1.11/32" value={config.deviceRoutes.join('\n')} onChange={e => handleRoutesChange('deviceRoutes', e.target.value)} title={T.tt_dev_routes} />
                    </div>
                    <div className="checkbox-group">
                      <input type="checkbox" id="workaround" checked={config.enableTaskSchedulerTrigger} onChange={e => handleChange('enableTaskSchedulerTrigger', e.target.checked)} />
                      <label htmlFor="workaround">{T.devTaskTrigger}</label>
                    </div>

                    <div className="advanced-section" style={{ marginTop: '0.8rem', paddingTop: '0.4rem', borderTop: '1px dashed #30363d' }}>
                      <div className="advanced-title" style={{ fontSize: '0.65rem' }}>{T.advSection}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <div className="checkbox-group">
                          <input type="checkbox" id="force_tunnel" checked={config.forceTunneling} onChange={e => handleChange('forceTunneling', e.target.checked)} />
                          <label htmlFor="force_tunnel">{T.forceTunnel}</label>
                        </div>
                        <div className="checkbox-group">
                          <input type="checkbox" id="disable_class" checked={config.disableClassBasedRoute} onChange={e => handleChange('disableClassBasedRoute', e.target.checked)} />
                          <label htmlFor="disable_class">{T.disableClass}</label>
                        </div>
                        <div className="checkbox-group">
                          <input type="checkbox" id="disable_ui" checked={config.disableDisconnectButton} onChange={e => handleChange('disableDisconnectButton', e.target.checked)} />
                          <label htmlFor="disable_ui">{T.hideDisconnect}</label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="form-group">
                      <label style={{ color: '#58a6ff' }} title={T.tt_user_routes}>{T.userRoutesLabel}</label>
                      <textarea rows={3} placeholder="e.g.&#10;10.0.1.0/24&#10;10.0.2.0/24" value={config.userRoutes.join('\n')} onChange={e => handleRoutesChange('userRoutes', e.target.value)} title={T.tt_user_routes} />
                    </div>
                    <div className="form-group">
                      <div style={{ flex: 1 }}>
                        <label>{T.protocolLabel}</label>
                        <select value={config.userTunnelProtocol} onChange={e => handleChange('userTunnelProtocol', e.target.value)}>
                          <option value="SSTP">SSTP</option>
                          <option value="IKEv2">IKEv2</option>
                          <option value="Automatic">Automatic</option>
                        </select>
                      </div>
                    </div>
                    <div className="checkbox-group">
                      <input type="checkbox" id="always_on" checked={config.userTunnelAlwaysOn} onChange={e => handleChange('userTunnelAlwaysOn', e.target.checked)} />
                      <label htmlFor="always_on">{T.alwaysOnLabel}</label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <h2>{T.secPKI}</h2>
                <div className="form-group">
                  <label>{T.rootCALabel}</label>
                  <input type="text" className="root-ca-input" placeholder="e.g. 68b545d69b..." value={config.rootCaHash} onChange={e => handleChange('rootCaHash', e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: '0.8rem' }}>
                  <label title={T.tt_eap}>{T.eapLabel}</label>
                  <input type="text" placeholder="e.g. cert.example.com" value={config.eapServerNames} onChange={e => handleChange('eapServerNames', e.target.value)} title={T.tt_eap} />
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.4rem' }}>
                  <button className="btn btn-success" style={{ flex: 1, padding: '0.4rem' }} onClick={() => callEndpoint('check_certificates', { rootHash: config.rootCaHash })}>
                    {T.verifyCerts}
                  </button>
                  <button className="btn btn-outline" style={{ flex: 1, padding: '0.4rem', color: config.sstpDisableRevocation ? '#ff7b72' : '#7ee787' }} onClick={toggleRevocationCheck}>
                    {config.sstpDisableRevocation ? T.ignoreRevOn : T.ignoreRevOff}
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Admin & Diagnostics */}
            <div className="col">
              <div className="card">
                <h2>{T.tunnelCtrl}</h2>
                <div className="control-group" style={{ marginBottom: '0.8rem' }}>
                  <div style={{ flex: 1 }}>
                    <div className="control-label">{T.devTunnelCtrl}</div>
                    <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.3rem' }}>
                      <button className="btn btn-outline" onClick={() => callEndpoint('connect_device_tunnel', { config })}>{T.up}</button>
                      <button className="btn btn-outline" onClick={() => callEndpoint('disconnect_device_tunnel', { config })}>{T.down}</button>
                      <button className="btn btn-danger" style={{ padding: '0.3rem 0.6rem', color: '#ff7b72', borderColor: 'rgba(248, 81, 73, 0.4)' }} onClick={() => callEndpoint('remove_device_tunnel', { config })}>{T.remove}</button>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="control-label">{T.userTunnelCtrl}</div>
                    <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '0.3rem' }}>
                      <button className="btn btn-outline" onClick={() => callEndpoint('connect_user_tunnel', { config })}>{T.up}</button>
                      <button className="btn btn-outline" onClick={() => callEndpoint('disconnect_user_tunnel', { config })}>{T.down}</button>
                      <button className="btn btn-danger" style={{ padding: '0.3rem 0.6rem', color: '#ff7b72', borderColor: 'rgba(248, 81, 73, 0.4)' }} onClick={() => callEndpoint('remove_user_tunnel', { config })}>{T.remove}</button>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: '1rem', borderTop: '1px solid #30363d', paddingTop: '0.8rem' }}>

                  {/* Inspection Panel */}
                  <div>
                    <div className="control-label" style={{ marginBottom: '0.4rem' }}>{T.inspection}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '0.4rem' }}>
                        <button className="btn btn-outline" style={{ padding: '0.2rem', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis' }} onClick={() => callEndpoint('get_vpn_status')}>{T.getState}</button>
                        <button className="btn btn-outline" style={{ padding: '0.2rem', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis' }} onClick={() => callEndpoint('check_routes')}>{T.verifyRoutes}</button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '0.4rem' }}>
                        <button className="btn btn-outline" style={{ padding: '0.2rem', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis' }} onClick={() => callEndpoint('check_dns', { server: config.vpnServerAddress })}>{T.checkDns}</button>
                        <button className="btn btn-outline" style={{ padding: '0.2rem', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis' }} onClick={() => callEndpoint('check_ports', { server: config.vpnServerAddress })}>{T.checkPorts}</button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '0.4rem' }}>
                        <button className="btn btn-outline" style={{ padding: '0.2rem', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis' }} onClick={() => {
                          const vpnName = window.prompt(T.promptVpnName, config.companyPrefix);
                          if (vpnName) {
                            callEndpoint('get_vpn_xml', { name: vpnName });
                          }
                        }}>{T.getXml}</button>
                        <button className="btn btn-danger" style={{ padding: '0.2rem', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis' }} onClick={() => callEndpoint('restart_vpn_service')}>{T.restartService}</button>
                      </div>
                    </div>
                  </div>

                  {/* Cert Tools Panel */}
                  <div>
                    <div className="control-label" style={{ marginBottom: '0.4rem' }}>{T.certShortcuts}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '0.4rem' }}>
                        <button className="btn btn-outline" style={{ padding: '0.2rem', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis' }} onClick={() => callEndpoint('open_msc', { name: "certtmpl.msc" })}>{T.certTmpl}</button>
                        <button className="btn btn-outline" style={{ padding: '0.2rem', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis' }} onClick={() => callEndpoint('open_msc', { name: "certsrv.msc" })}>{T.certSrv}</button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '0.4rem' }}>
                        <button className="btn btn-outline" style={{ padding: '0.2rem', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis' }} onClick={() => callEndpoint('open_msc', { name: "certmgr.msc" })}>{T.certMgr}</button>
                        <button className="btn btn-outline" style={{ padding: '0.2rem', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis' }} onClick={() => callEndpoint('open_msc', { name: "certlm.msc" })}>{T.certLm}</button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
                <div className="flex-between" style={{ padding: '0.6rem 0.6rem 0.2rem 0.6rem' }}>
                  <h2 style={{ margin: 0, fontSize: '0.85rem' }}>{T.terminal}</h2>
                  <button className="btn btn-outline" style={{ width: 'auto', padding: '0.1rem 0.4rem', fontSize: '0.7rem' }} onClick={clearLogs}>{T.clear}</button>
                </div>
                <div className="terminal" ref={terminalRef} style={{ flex: 1, height: '100%', minHeight: '320px', border: 'none', borderTop: '1px solid var(--card-border)', borderRadius: 0, padding: '0.6rem', background: '#090c10' }}>
                  {logs.length === 0 ? <div style={{ color: '#484f58' }}>{T.streamReady}</div> : null}
                  {logs.map((log, i) => (
                    <div key={i} className="log-entry">
                      <span className="log-time">[{log.time}]</span>
                      <span className="log-cmd">{log.cmd}</span>
                      <div className={log.isError ? "log-err log-msg" : "log-msg"}>{log.msg}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'server' && (
          <div className="main-grid" style={{ gridTemplateColumns: 'minmax(0, 5fr) minmax(0, 7fr)', minHeight: '100%' }}>
            <div className="col">
              <div className="card" style={{ padding: '0.8rem 1rem' }}>
                <div className="flex-between" style={{ marginBottom: '0.4rem' }}>
                  <h2 style={{ margin: 0, color: '#58a6ff', fontSize: '1rem' }}>{T.rrasShortcut}</h2>
                  <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: rrasStatus === 'INSTALLED' ? '#238636' : (rrasStatus === 'MISSING' ? '#da3633' : '#30363d') }}>
                    {rrasStatus}
                  </span>
                </div>
                <p style={{ margin: '0 0 0.8rem 0', fontSize: '0.8rem', color: '#8b949e' }}>{T.rrasDesc}</p>

                {(rrasStatus !== 'INSTALLED' || isInstallingRras) ? (
                  <button className="btn btn-outline" disabled={isInstallingRras} style={{ marginBottom: '0.4rem', padding: '0.3rem', fontSize: '0.8rem', borderColor: isInstallingRras ? '#484f58' : '#da3633', opacity: isInstallingRras ? 0.7 : 1 }} onClick={installRrasRole}>{isInstallingRras ? T.btnInstallingRole : T.btnInstallRole}</button>
                ) : null}

                <div style={{ display: 'flex', gap: '0.4rem', marginTop: 'auto' }}>
                  <button className="btn btn-success" style={{ flex: 1, padding: '0.3rem', fontSize: '0.8rem' }} onClick={() => setShowRrasGuide(true)}>{T.btnGuide}</button>
                  <button className="btn btn-outline" style={{ flex: 1, padding: '0.3rem', fontSize: '0.8rem' }} onClick={() => callEndpoint('open_msc', { name: "rrasmgmt.msc" })}>rrasmgmt.msc</button>
                </div>
              </div>

              <div className="card" style={{ padding: '0.8rem 1rem' }}>
                <div className="flex-between" style={{ marginBottom: '0.4rem' }}>
                  <h2 style={{ margin: 0, color: '#58a6ff', fontSize: '1rem' }}>{T.npsShortcut}</h2>
                  <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: npsStatus === 'INSTALLED' ? '#238636' : (npsStatus === 'MISSING' ? '#da3633' : '#30363d') }}>
                    {npsStatus}
                  </span>
                </div>
                <p style={{ margin: '0 0 0.8rem 0', fontSize: '0.8rem', color: '#8b949e' }}>{T.npsDesc}</p>

                {(npsStatus !== 'INSTALLED' || isInstallingNps) ? (
                  <button className="btn btn-outline" disabled={isInstallingNps} style={{ marginBottom: '0.4rem', padding: '0.3rem', fontSize: '0.8rem', borderColor: isInstallingNps ? '#484f58' : '#da3633', opacity: isInstallingNps ? 0.7 : 1 }} onClick={installNpsRole}>{isInstallingNps ? T.btnInstallingRole : T.btnInstallRole}</button>
                ) : null}

                <div style={{ display: 'flex', gap: '0.4rem', marginTop: 'auto' }}>
                  <button className="btn btn-success" style={{ flex: 1, padding: '0.3rem', fontSize: '0.8rem' }} onClick={() => setShowNpsGuide(true)}>{T.btnGuide}</button>
                  <button className="btn btn-outline" style={{ flex: 1, padding: '0.3rem', fontSize: '0.8rem' }} onClick={() => callEndpoint('open_msc', { name: "nps.msc" })}>nps.msc</button>
                </div>
              </div>

              <div className="card" style={{ padding: '0.8rem 1rem' }}>
                <h2 style={{ margin: '0 0 0.4rem 0', color: '#58a6ff', fontSize: '1rem' }}>{T.caShortcut}</h2>
                <p style={{ margin: '0 0 0.8rem 0', fontSize: '0.8rem', color: '#8b949e' }}>{T.caDesc}</p>

                <div style={{ display: 'flex', gap: '0.4rem', marginTop: 'auto' }}>
                  <button className="btn btn-success" style={{ flex: 2, padding: '0.3rem', fontSize: '0.8rem' }} onClick={() => setShowCaGuide(true)}>{T.btnGuide}</button>
                  <button className="btn btn-outline" style={{ flex: 1, padding: '0.3rem', fontSize: '0.8rem' }} onClick={() => callEndpoint('open_msc', { name: "certsrv.msc" })}>certsrv</button>
                  <button className="btn btn-outline" style={{ flex: 1, padding: '0.3rem', fontSize: '0.8rem' }} onClick={() => callEndpoint('open_msc', { name: "certtmpl.msc" })}>certtmpl</button>
                </div>
              </div>

              <div className="card" style={{ padding: '0.8rem 1rem' }}>
                <h2 style={{ margin: '0 0 0.4rem 0', color: '#58a6ff', fontSize: '1rem' }}>{T.adGpoShortcut}</h2>
                <p style={{ margin: '0 0 0.8rem 0', fontSize: '0.8rem', color: '#8b949e' }}>{T.adGpoDesc}</p>

                <div style={{ display: 'flex', gap: '0.4rem', marginTop: 'auto' }}>
                  <button className="btn btn-success" style={{ flex: 2, padding: '0.3rem', fontSize: '0.8rem' }} onClick={() => setShowAdGpoGuide(true)}>{T.btnGuide}</button>
                  <button className="btn btn-outline" style={{ flex: 1, padding: '0.3rem', fontSize: '0.8rem' }} onClick={() => callEndpoint('open_msc', { name: "dsa.msc" })}>AD (dsa)</button>
                  <button className="btn btn-outline" style={{ flex: 1, padding: '0.3rem', fontSize: '0.8rem' }} onClick={() => callEndpoint('open_msc', { name: "gpmc.msc" })}>GPO (gpmc)</button>
                </div>
              </div>

              <div className="card" style={{ padding: '0.8rem 1rem' }}>
                <div className="flex-between" style={{ marginBottom: '0.4rem' }}>
                  <h2 style={{ margin: 0, color: '#58a6ff', fontSize: '1rem' }}>{T.cdpShortcut}</h2>
                  <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: iisStatus === 'INSTALLED' ? '#238636' : (iisStatus === 'MISSING' ? '#da3633' : '#30363d') }}>
                    {iisStatus}
                  </span>
                </div>
                <p style={{ margin: '0 0 0.8rem 0', fontSize: '0.8rem', color: '#8b949e' }}>{T.cdpDesc}</p>

                {(iisStatus !== 'INSTALLED' || isInstallingIis) ? (
                  <button className="btn btn-outline" disabled={isInstallingIis} style={{ marginBottom: '0.4rem', padding: '0.3rem', fontSize: '0.8rem', borderColor: isInstallingIis ? '#484f58' : '#da3633', opacity: isInstallingIis ? 0.7 : 1 }} onClick={installIisRole}>{isInstallingIis ? T.btnInstallingRole : T.btnInstallRole}</button>
                ) : null}

                <div style={{ display: 'flex', gap: '0.4rem', marginTop: 'auto' }}>
                  <button className="btn btn-success" style={{ flex: 2, padding: '0.3rem', fontSize: '0.8rem' }} onClick={() => setShowCdpGuide(true)}>{T.btnGuide}</button>
                  <button className="btn btn-outline" style={{ flex: 1, padding: '0.3rem', fontSize: '0.8rem' }} onClick={() => callEndpoint('open_msc', { name: "inetmgr" })}>IIS (inetmgr)</button>
                </div>
              </div>
            </div>

            <div className="col">
              <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
                <div className="flex-between" style={{ padding: '0.6rem 0.6rem 0.2rem 0.6rem' }}>
                  <h2 style={{ margin: 0, fontSize: '0.85rem' }}>{T.terminal}</h2>
                  <button className="btn btn-outline" style={{ width: 'auto', padding: '0.1rem 0.4rem', fontSize: '0.7rem' }} onClick={clearLogs}>{T.clear}</button>
                </div>
                <div className="terminal" ref={terminalRef} style={{ flex: 1, border: 'none', borderTop: '1px solid var(--card-border)', borderRadius: 0, padding: '0.6rem', background: '#090c10' }}>
                  {logs.length === 0 ? <div style={{ color: '#484f58' }}>{T.streamReady}</div> : null}
                  {logs.map((log, i) => (
                    <div key={i} className="log-entry">
                      <span className="log-time">[{log.time}]</span>
                      <span className="log-cmd">{log.cmd}</span>
                      <div className={log.isError ? "log-err log-msg" : "log-msg"}>{log.msg}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
