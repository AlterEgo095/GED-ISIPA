module.exports = {
  apps: [{
    name: 'ged-isipa',
    script: '/opt/ged-isipa/node_modules/.bin/next',
    args: 'start -p 3020',
    cwd: '/opt/ged-isipa',
    exec_interpreter: 'node',
    exec_mode: 'fork',
    instances: 1,
    env_file: '/opt/ged-isipa/.env',
    env: {
      NODE_ENV: 'production',
      PORT: '3020',
      HOSTNAME: '0.0.0.0',
      // Secrets are loaded from .env file, NOT hardcoded here
    },
    autorestart: true,
    max_memory_restart: '512M',
    error_file: '/opt/ged-isipa/logs/error.log',
    out_file: '/opt/ged-isipa/logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 5000,
  }]
}
