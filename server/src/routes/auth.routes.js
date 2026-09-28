const express = require("express");

const authController = require("../controllers/auth.controller");
const validate = require("../middleware/validate.middleware");
const { registerSchema , loginSchema} = require("../validators/auth.validator");
const { requireAuth } = require("../middleware/auth.middleware");

const router = express.Router();

router.post(
  "/register",
  validate(registerSchema),
  authController.register
);

router.post(
  "/login",
  validate(loginSchema),
  authController.login
);

router.get(
  "/me",
  requireAuth,
  authController.getMe
);

router.post(
  "/refresh",
  authController.refresh
);

// router.post(
//   "/logout",
//   requireAuth,
//   authController.logout
// );

router.post(
  "/logout",
  authController.logout
);
module.exports = router;