const cron = require("node-cron");
const syncService = require("../services/sync.service");

function startSyncJob() {
  cron.schedule("0 * * * *", async () => {
    console.log("Running scheduled sync job...");
    await syncService.syncDueUsers();
  });
}

module.exports = { startSyncJob };