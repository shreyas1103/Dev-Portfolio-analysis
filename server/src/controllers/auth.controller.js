const authService = require("../services/auth.service");
const env = require("../config/env");
// const userRepository = require("../repositories/user.repository")
const { AuthError } = require("../errors/AppError");

const {
  REFRESH_TOKEN_EXPIRY_DAYS,
} = require("../utils/token.util");


function setRefreshTokenCookie(res, refreshToken) {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "lax",
    maxAge:
      REFRESH_TOKEN_EXPIRY_DAYS *
      24 *
      60 *
      60 *
      1000,
  });
}
function clearRefreshTokenCookie(res) {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "lax",
  });
}

async function register(req, res, next) {
  try {
    const { email, password, name } = req.body;

    const user = await authService.register(
      email,
      password,
      name
    );

    res.status(201).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const {
      user,
      accessToken,
      refreshToken,
    } = await authService.login(
      email,
      password
    );

    setRefreshTokenCookie(res, refreshToken);

    res.status(200).json({
      success: true,
      data: {
        user,
        accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res, next) {
  try {
    const user = await authService.getCurrentUser(
      req.user.id
    );

    res.status(200).json({
      success: true,
      data: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const oldRefreshToken =
      req.cookies.refreshToken;

    if (!oldRefreshToken) {
      throw new AuthError(
        "Authentication required"
      );
    }

    const {
      accessToken,
      refreshToken,
    } = await authService.refresh(
      oldRefreshToken
    );

    setRefreshTokenCookie(
      res,
      refreshToken
    );

    res.status(200).json({
      success: true,
      data: {
        accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    clearRefreshTokenCookie(res);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  getMe,
  refresh,
  logout,
};