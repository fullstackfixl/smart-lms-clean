module.exports = {
  apps: [{
    name: 'smart-lms-api',
    script: './server.js',
    instances: 'max',
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/pm2-err.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true,
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    node_args: '--max-old-space-size=2048',
    
    // Restart configuration
    min_uptime: '10s',
    max_restarts: 10,
    autorestart: true,
    
    // Graceful shutdown
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    
    // Environment-specific settings
    env: {
      NODE_ENV: 'development',
      PORT: 5000
    }
  }]
}
