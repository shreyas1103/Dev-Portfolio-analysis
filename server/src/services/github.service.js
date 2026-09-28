const jwt = require("jsonwebtoken");
const env = require("../config/env");
const connectedAccountRepository = require("../repositories/connectedAccount.repository");
const githubClient = require("../adapters/github/github.client");
const encryptionUtil = require("../utils/encryption.util");
const { ConflictError } = require("../errors/AppError");

function buildAuthorizationUrl(userId) {
  const state = jwt.sign(
    { userId },
    env.oauthStateSecret,
    {
      expiresIn: "10m",
    }
  );

  const params = new URLSearchParams({
    client_id: env.githubClientId,
    redirect_uri: env.githubRedirectUri,
    scope: "read:user",
    state,
    prompt: "select_account",
  });

  const redirectUrl =
    `https://github.com/login/oauth/authorize?${params.toString()}`;

  return {
    redirectUrl,
  };
}

async function connectAccount(userId, code) {
  const existing = await connectedAccountRepository.findByUserAndSource(userId, "github");
  if (existing) {
    throw new ConflictError("GitHub account already connected");
  }

  const accessToken = await githubClient.exchangeCodeForToken(code);
  const { username } = await githubClient.fetchUserProfile(accessToken);
  const existingGithubAccount =
  await connectedAccountRepository.findBySourceAndExternalUsername(
    "github",
    username
  );

if (existingGithubAccount) {
  throw new ConflictError(
    "This GitHub account is already connected to another user"
  );
}
  const accessTokenEncrypted = encryptionUtil.encrypt(accessToken);

  const connectedAccount = await connectedAccountRepository.create({
    userId,
    source: "github",
    externalUsername: username,
    accessTokenEncrypted,
  });

  return connectedAccount;
}

module.exports = {
  buildAuthorizationUrl,
  connectAccount,
};