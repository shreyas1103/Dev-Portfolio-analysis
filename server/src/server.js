const app = require("./app");
const env = require("./config/env");
const connectDB = require("./config/db");
const { startSyncJob } = require("./jobs/syncJob");

async function startServer() {
  try {
    await connectDB();
     startSyncJob();
   // it will now actually catch a thrown connection error, because connectDB() no longer kills the process itself before control returns.
    app.listen(env.port, () => {
      console.log(
        `🚀 Server running on port ${env.port}`
      );
    });
  } catch (error) {
    console.error("❌ Server startup failed");
    console.error(error);

    process.exit(1);
  }
}

startServer();