module.exports = {
  apps: [
    {
      name: 'legendary-spoon',
      script: 'bun',
      args: 'run server/src/index.ts',
      cwd: '/path/to/legendary-spoon',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      interpreter: 'none'
    }
  ]
};
