const express = require("express");
const urlRoutes = require("./routes/url.routes");
const { getOriginalUrl } = require("./controllers/url.controller");
const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is health",
  });
});
app.use("/api/v1/urls", urlRoutes);
app.get("/:shortCode", getOriginalUrl);

module.exports = app;
