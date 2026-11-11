module.exports = {
  apps: [
    {
      name: "ninho-clinica",
      script: "dist/server.cjs",
      instances: "max",
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};
