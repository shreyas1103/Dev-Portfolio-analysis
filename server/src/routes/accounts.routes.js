const express = require("express");

const { requireAuth } = require("../middleware/auth.middleware");
const accountsController = require("../controllers/accounts.controller");
const validate = require("../middleware/validate.middleware");
const router = express.Router();

router.get(
  "/",
  requireAuth,
  accountsController.getAccounts
);

router.post(
  "/github/connect",
  requireAuth,
  accountsController.connectGithub
);

router.get(
  "/github/callback",
   accountsController.githubCallback
  );

  router.post(
  "/leetcode/connect",
  requireAuth,
  accountsController.connectLeetcode
);



module.exports = router;