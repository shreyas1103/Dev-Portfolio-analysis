const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const env = require("../config/env");
const userRepository = require("../repositories/user.repository");
const { ConflictError } = require("../errors/AppError");
const { AuthError } = require("../errors/AppError");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/token.util");

const SALT_ROUNDS = 10;

async function register(email, password, name) {
  const existingUser = await userRepository.findByEmail(email);

  if (existingUser) {
    throw new ConflictError("Email already registered");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await userRepository.create({
    email,
    name,
    passwordHash,
  });

  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
  };
}

async function login(email, password) {
  const user = await userRepository.findByEmail(email);

  if (!user) {
    throw new AuthError("Invalid credentials");
  }

  const isPasswordValid = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!isPasswordValid) {
    throw new AuthError("Invalid credentials");
  }

  const payload = {
    userId: user._id.toString(),
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return {
    user: {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
    },
    accessToken,
    refreshToken,
  };
}

async function getCurrentUser(userId) {
  return userRepository.findById(userId);
}

async function refresh(refreshToken) {
  let decoded;

  try{
    decoded = jwt.verify(
      refreshToken,
      env.jwtRefreshSecret
    );
  }catch(err){
    throw new AuthError("Invalid or expired refresh token");
  }

  const user = await userRepository.findById(
    decoded.userId
  );
 
  if(!user){
    throw new AuthError("Invalid or expired refresh token");
  }
 
  const payload = {
    userId: user._id.toString(),
  };

  const accessToken =
    generateAccessToken(payload);

  const newRefreshToken =
    generateRefreshToken(payload);

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
  
}
module.exports = {
  register,
  login,
  getCurrentUser,
  refresh,
};