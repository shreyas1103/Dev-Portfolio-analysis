const express = require("express");
const validate = require("../middleware/validate.middleware");
const { reposQuerySchema } = require("../validators/repos.validator");
const reposController = require("../controllers/repos.controller");
const { requireAuth } = require("../middleware/auth.middleware");

const router = express.Router();

router.get(
  "/",
  requireAuth,
  validate(reposQuerySchema, "query"),
  reposController.getRepos
);

module.exports = router;