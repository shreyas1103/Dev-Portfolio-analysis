const resumeGeneratorService = require("../services/resumeGenerator.service");

async function getSuggestions(req, res, next) {
  try {
    const bullets = await resumeGeneratorService.generateResumeBullets(req.user.id);
    res.status(200).json({ success: true, data: { bullets } });
  } catch (err) {
    next(err);
  }
}

module.exports = { getSuggestions };