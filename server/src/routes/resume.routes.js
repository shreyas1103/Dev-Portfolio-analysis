const express = require("express");
const resumeController = require("../controllers/resume.controller");
const { requireAuth } = require("../middleware/auth.middleware");

const router = express.Router();
router.get("/suggestions", requireAuth, resumeController.getSuggestions);

module.exports = router;