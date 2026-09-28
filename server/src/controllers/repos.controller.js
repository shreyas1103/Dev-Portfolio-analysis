// controllers/repos.controller.js
const reposService = require("../services/repos.service");

async function getRepos(req, res, next) {
  try {
    const { sort, limit } = req.query;
    const repos = await reposService.getReposForUser(req.user.id, sort, limit);

    res.status(200).json({
      success: true,
      data: { repos },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getRepos };