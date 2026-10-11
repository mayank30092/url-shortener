const rateLimit = require("express-rate-limit");

const createUrlLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many URL creation requests.Please try again later.",
  },
});

module.exports = { createUrlLimiter };
