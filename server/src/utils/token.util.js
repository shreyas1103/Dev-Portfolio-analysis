const jwt = require("jsonwebtoken");

const env = require("../config/env");

const ACCESS_TOKEN_EXPIRY = "15m";

const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const REFRESH_TOKEN_EXPIRY = `${REFRESH_TOKEN_EXPIRY_DAYS}d`;

function generateAccessToken(payload) {
  return jwt.sign(
    payload,
    env.jwtAccessSecret,
    {
      expiresIn: ACCESS_TOKEN_EXPIRY,
    }
  );
}

function generateRefreshToken(payload) {
  return jwt.sign(
    payload,
    env.jwtRefreshSecret,
    {
      expiresIn: REFRESH_TOKEN_EXPIRY,
    }
  );
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  REFRESH_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY_DAYS,
};