const ConnectedAccount = require("../models/ConnectedAccount");

async function findByUserAndSource(userId, source) {
  return ConnectedAccount.findOne({ userId, source });
}

async function create(data) {
  return ConnectedAccount.create(data);
}

async function findAllByUser(userId) {
  return ConnectedAccount.find({
    userId,
    isActive: true,
  })
  .select("-accessTokenEncrypted")
    .lean();
}
async function findAllActiveUserIds() {
  const accounts = await ConnectedAccount.find({ isActive: true }).distinct("userId");
  return accounts;
}

async function findBySourceAndExternalUsername(
  source,
  externalUsername
) {
  return ConnectedAccount.findOne({
    source,
    externalUsername,
  });
}

module.exports = {
  findByUserAndSource,
  create,
  findAllByUser,
  findAllActiveUserIds,
  findBySourceAndExternalUsername,
};