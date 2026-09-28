const jwt = require("jsonwebtoken");

const env = require("../config/env");
const githubService = require("../services/github.service");
const leetcodeService = require("../services/leetcode.service");
const { ValidationError } = require("../errors/AppError");
const connectedAccountRepository = require("../repositories/connectedAccount.repository");

async function connectGithub(req, res, next) {
  try {
    const { redirectUrl } = githubService.buildAuthorizationUrl(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        redirectUrl,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function githubCallback(req, res, next) {
  try {
    const { code, state, error } = req.query;

    // User denied GitHub authorization
    if (error) {
      throw new ValidationError("GitHub authorization was cancelled");
    }

    // Invalid callback
    if (!code || !state) {
      throw new ValidationError("Invalid GitHub callback");
    }

    let decoded;
    try {
      decoded = jwt.verify(state, env.oauthStateSecret);
    } catch (err) {
      throw new ValidationError("Invalid or expired state");
    }

    await githubService.connectAccount(decoded.userId, code);

    res.redirect("http://localhost:5173/dashboard");
  } catch (err) {
    next(err);
  }
}

async function connectLeetcode(req, res, next) {
  try {
    const { username } = req.body;
    const connectedAccount = await leetcodeService.connectAccount(req.user.id, username);

    res.status(201).json({
      success: true,
      data: { connectedAccount },
    });
  } catch (err) {
    next(err);
  }
}

async function getAccounts(req, res, next) {
  try {
    const accounts = await connectedAccountRepository.findAllByUser(
      req.user.id
    );

    res.status(200).json({
      success: true,
      data: {
        accounts,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  connectGithub,
  githubCallback,
  connectLeetcode,
  getAccounts,
};