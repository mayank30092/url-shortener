const express = require("express");
const router = express.Router();
const {
  createShortUrl,
  getUrlAnalytics,
} = require("../controllers/url.controller");
const { createUrlLimiter } = require("../middleware/rateLimiter");

router.post("/", createUrlLimiter, createShortUrl);
router.get("/:shortCode/analytics", getUrlAnalytics);

module.exports = router;
