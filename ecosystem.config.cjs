


module.exports = {
  apps: [
    {
      name: "integracao-site-rotony",
      script: "src/server.ts", // O arquivo que inicia tudo
      interpreter: "node",      // O binário a ser usado
      node_args: [
        "--env-file=.env",
        "--experimental-strip-types"
      ],
      exec_mode: "fork",
      watch: false,
      max_memory_restart: "1G",
      instances: 1,
      autorestart: true,
      restart_delay: 5000,
      out_file: "logs/logs-out.log",
      error_file: "logs/logs-error.log", // É bom ter o log de erro separado
      log_date_format: "YYYY-MM-DD HH:mm:ss"
    },
      
  ]
}
 