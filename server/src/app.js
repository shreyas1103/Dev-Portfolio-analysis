const express = require("express");
const cors = require("cors");
const env = require("./config/env");
const syncRoutes = require("./routes/sync.routes");
const authRoutes = require("./routes/auth.routes");
const accountsRoutes = require("./routes/accounts.routes");
const errorHandler = require("./middleware/errorHandler.middleware");
const cookieParser = require("cookie-parser");
const dashboardRoutes = require("./routes/dashboard.routes");
const reposRoutes = require("./routes/repos.routes");
const weakAreasRoutes = require("./routes/weakAreas.routes");
const resumeRoutes = require("./routes/resume.routes");
const app = express();


const allowedOrigins = [
  "http://localhost:5173",
  env.clientUrl,
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "ok",
  });
});
app.use("/api/auth", authRoutes);
app.use("/api/accounts", accountsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/sync", syncRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/repos", reposRoutes);
app.use("/api/weak-areas",weakAreasRoutes);
app.use(errorHandler);

module.exports = app;