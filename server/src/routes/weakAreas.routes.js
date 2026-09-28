const express = require("express");
const weakAreasController = require("../controllers/weakAreas.controller");
const { requireAuth } = require("../middleware/auth.middleware");

const router = express.Router();
router.get("/", requireAuth, weakAreasController.getWeakAreas);

module.exports = router;