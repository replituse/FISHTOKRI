module.exports = {
  apps: [
    {
      name: "fishtokri",
      script: "server/index.ts",
      interpreter: "node",
      interpreter_args: "--import tsx",
      env: {
        NODE_ENV: "production",
        PORT: 3010,
        SESSION_SECRET: "fish_tokri_prod_secret",
        VITE_HMR_DISABLED: "true",
        MONGODB_URI: "mongodb+srv://raneaniket23_db_user:0lEZL6KqIATNmZsj@fishtokricluster.vhw7jp9.mongodb.net/?appName=Fishtokricluster",
        MONGODB_DB: "fishtokri"
      }
    }
  ]
};
