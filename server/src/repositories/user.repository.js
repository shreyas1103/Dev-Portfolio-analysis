const User = require("../models/User");

async function findByEmail(email) {
  return User.findOne({ email }).lean();
}

async function create(userData) {
  return User.create(userData);
}

async function findById(id) {
  return User.findById(id).lean();
}

module.exports = {
  findByEmail,
  create,
  findById,
};