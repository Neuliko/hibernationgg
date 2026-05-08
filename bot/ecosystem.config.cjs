module.exports = {
  apps: [
    {
      name: "hibernation-bot",
      script: "src/index.js",
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      max_restarts: 20,
      watch: false,
      env: { NODE_ENV: "production" },
    },
  ],
};
