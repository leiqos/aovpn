mod config;
mod vpn_commands;
mod vpn_deploy;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      vpn_deploy::deploy_device_tunnel,
      vpn_deploy::disconnect_device_tunnel,
      vpn_deploy::connect_device_tunnel,
      vpn_deploy::disconnect_user_tunnel,
      vpn_deploy::connect_user_tunnel,
      vpn_deploy::remove_device_tunnel,
      vpn_deploy::remove_user_tunnel,
      vpn_deploy::open_msc,
      vpn_deploy::get_sstp_revocation_status,
      vpn_deploy::deploy_user_tunnel,
      vpn_deploy::enable_task_scheduler_trigger,
      vpn_deploy::set_sstp_revocation,
      vpn_deploy::write_file_to_path,
      vpn_commands::get_vpn_status,
      vpn_commands::get_vpn_xml,
      vpn_commands::restart_vpn_service,
      vpn_commands::check_certificates,
      vpn_commands::check_routes,
      vpn_commands::check_dns,
      vpn_commands::check_ports,
      vpn_commands::check_rras_role,
      vpn_commands::install_rras_role,
      vpn_commands::check_nps_role,
      vpn_commands::install_nps_role,
      vpn_commands::check_iis_role,
      vpn_commands::install_iis_role,
      vpn_commands::audit_templates,
    ])
    .setup(|app| {
      #[cfg(debug_assertions)]
      {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
