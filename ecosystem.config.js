module.exports = {
  apps: [
    {
      name: 'puloqimi-bot',
      script: 'dist/main.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        TZ: 'Asia/Tashkent',
      },
      env_production: {
        NODE_ENV: 'production',
        TZ: 'Asia/Tashkent',
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      merge_logs: true,
    },
  ],
};
