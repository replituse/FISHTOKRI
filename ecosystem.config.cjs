module.exports = {
  apps: [
    {
      name: "fishtokri",
      script: "dist/index.cjs",
      interpreter: "node",
      env: {
        NODE_ENV: "production",
        PORT: 3010,
        SESSION_SECRET: "fish_tokri_prod_secret",
        MONGODB_URI: "mongodb+srv://raneaniket23_db_user:0lEZL6KqIATNmZsj@fishtokricluster.vhw7jp9.mongodb.net/?appName=Fishtokricluster",
        MONGODB_DB: "fishtokri"
      }
    }
  ]
};
