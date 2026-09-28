const express = require("express");
const dashboardController = require("../controllers/dashboard.controller");
const { requireAuth } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", requireAuth, dashboardController.getDashboard);
router.get("/heatmap", requireAuth, dashboardController.getHeatmap);

module.exports = router;