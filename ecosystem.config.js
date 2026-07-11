module.exports = {
  apps: [{
    name: 'ged-isipa',
    script: '/opt/ged-isipa/node_modules/.bin/next',
    args: 'start -p 3020',
    cwd: '/opt/ged-isipa',
    exec_interpreter: 'node',
    exec_mode: 'fork',
    instances: 1,
    env: {
      NODE_ENV: 'production',
      PORT: '3020',
      HOSTNAME: '0.0.0.0',
      DATABASE_URL: 'postgresql://ged_isipa:GedIsipa2026Secure!@localhost:5432/ged_isipa',
      NEXTAUTH_URL: 'https://ged.aenews.net',
      NEXTAUTH_SECRET: 'SXPLOPZvGq4cSIkcAroSrP9jn4dyPh5Qh9NwkPvq5NQqhJzrS9V1Vp3eEcZspogS',
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
