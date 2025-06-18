module.exports = {
  apps: [{
    name: 'xess-club-security',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/xess-club-security',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/log/xess-error.log',
    out_file: '/var/log/xess-out.log',
    log_file: '/var/log/xess-combined.log',
    time: true
  }]
};