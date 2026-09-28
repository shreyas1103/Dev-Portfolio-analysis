const express = require("express");
const syncService = require("../services/sync.service");
const { requireAuth } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/", requireAuth, async (req, res, next) => {
  try {
    await syncService.syncUser(req.user.userId);

    res.json({
      success: true,
      message: "Sync completed",
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;