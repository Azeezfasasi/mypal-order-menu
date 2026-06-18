module.exports = {
  apps: [
    {
      name: "business-admin",
      script: "./server.js",
      cwd: process.cwd(),
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "500M",

      // Environment variables
      env: {
        NODE_ENV: "production",
        PORT: 4100,
        HOSTNAME: "0.0.0.0",
      },

      // Memory optimization
      node_args: "--max-old-space-size=512",

      // Logging
      error_file: "./logs/error.log",
      out_file: "./logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,

      // Auto-restart configuration
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",

      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: false, // Changed to false - Next.js standalone doesn't send ready signal
      listen_timeout: 10000,

      // Health check
      health_check: {
        enable: false, // Disabled - we do manual health checks in deployment
      },
    },
  ],
};
