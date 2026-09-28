const dashboardService = require("../services/dashboard.service");

async function getDashboard(req, res, next) {
  try {
    const data = await dashboardService.build(req.user.id);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
}

async function getHeatmap(req, res, next) {
  try {
    const days = Number(req.query.days) || 90;

    const data = await dashboardService.getHeatmap(
      req.user.id,
      days
    );

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}
module.exports = { getDashboard,getHeatmap, };