const express = require("express");

const app = express();

app.get("/", (req, res) => {
  res.json({ message: "AI Mentor Backend Running" });
});

module.exports = app;