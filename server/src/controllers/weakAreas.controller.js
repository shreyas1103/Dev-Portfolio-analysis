const weakAreaService = require("../services/weakArea.service");

async function getWeakAreas(req, res, next) {
  try {
    const weakAreas = await weakAreaService.getWeakAreasForUser(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        weakAreas,
        ...(weakAreas.length === 0 && { message: "Not enough data yet" }),
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getWeakAreas };