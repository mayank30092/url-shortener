const URL = require("../models/url.model");
const { generateShortCode } = require("../utils/generateShortCode");
const { validateUrl } = require("../utils/validateUrl");
const { redisClient } = require("../config/redis");

const createShortUrl = async (req, res) => {
  try {
    const { originalUrl, expiresAt } = req.body;

    if (!validateUrl(originalUrl)) {
      return res.status(400).json({
        success: false,
        message: "A valid HTTP or HTTPS URL is required",
      });
    }

    const expirationDate = expiresAt ? new Date(expiresAt) : null;

    if (expirationDate && Number.isNaN(expirationDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid expiration date",
      });
    }

    if (expirationDate && expirationDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Expiration date must be in the future",
      });
    }

    const shortCode = await generateShortCode();

    const url = await URL.create({
      originalUrl,
      shortCode,
      expiresAt: expirationDate,
    });

    const baseUrl = (
      process.env.BASE_URL || `http://localhost:${process.env.PORT || 5001}`
    ).replace(/\/+$/, "");

    return res.status(201).json({
      success: true,
      shortCode: url.shortCode,
      shortUrl: `${baseUrl}/${url.shortCode}`,
      expiresAt: url.expiresAt,
    });
  } catch (err) {
    console.error("Create URL error:", err.message);

    return res.status(500).json({
      success: false,
      message: "Failed to create short URL",
    });
  }
};

const getOriginalUrl = async (req, res) => {
  try {
    const { shortCode } = req.params;
    const cacheKey = `url:${shortCode}`;

    let originalUrl;
    let expiresAt = null;

    // Check Redis cache
    try {
      const cachedData = await redisClient.get(cacheKey);

      if (cachedData) {
        const cachedUrl = JSON.parse(cachedData);

        if (
          typeof cachedUrl.originalUrl === "string" &&
          validateUrl(cachedUrl.originalUrl)
        ) {
          originalUrl = cachedUrl.originalUrl;
          expiresAt = cachedUrl.expiresAt ?? null;
        } else {
          await redisClient.del(cacheKey);
        }
      }
    } catch (err) {
      console.error("Redis error:", err.message);
    }

    // Cache miss: fetch from MongoDB
    if (!originalUrl) {
      const url = await URL.findOne({ shortCode });

      if (!url) {
        return res.status(404).json({
          success: false,
          message: "Short URL not found",
        });
      }

      originalUrl = url.originalUrl;
      expiresAt = url.expiresAt;
    }

    // Check expiration
    if (expiresAt && new Date(expiresAt) <= new Date()) {
      await URL.deleteOne({
        shortCode,
        expiresAt: { $lte: new Date() },
      });

      try {
        await redisClient.del(cacheKey);
      } catch (err) {
        console.error("Redis delete failed:", err.message);
      }

      return res.status(410).json({
        success: false,
        message: "Short URL has expired",
      });
    }

    // Increment click count
    try {
      const result = await URL.updateOne(
        {
          shortCode,
          $or: [
            { expiresAt: null },
            { expiresAt: { $exists: false } },
            { expiresAt: { $gt: new Date() } },
          ],
        },
        { $inc: { clickCount: 1 } },
      );

      if (result.matchedCount === 0) {
        await redisClient.del(cacheKey);

        const exists = await URL.exists({ shortCode });

        return res.status(exists ? 410 : 404).json({
          success: false,
          message: exists ? "Short URL has expired" : "Short URL not found",
        });
      }
    } catch (err) {
      console.error("Analytics update failed:", err.message);
    }

    // Cache database results
    if (originalUrl) {
      try {
        const ttl = expiresAt
          ? Math.min(
              300,
              Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000),
            )
          : 300;

        if (ttl > 0) {
          await redisClient.set(
            cacheKey,
            JSON.stringify({ originalUrl, expiresAt }),
            { EX: ttl },
          );
        }
      } catch (err) {
        console.error("Redis cache write failed:", err.message);
      }
    }

    return res.redirect(originalUrl);
  } catch (err) {
    console.error("Redirect error:", err.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getUrlAnalytics = async (req, res) => {
  try {
    const url = await URL.findOne({ shortCode: req.params.shortCode })
      .select("originalUrl shortCode clickCount createdAt expiresAt")
      .lean();

    if (!url) {
      return res.status(404).json({
        success: false,
        message: "Short URL not found",
      });
    }

    return res.status(200).json({
      success: true,
      analytics: {
        ...url,
        clickCount: url.clickCount ?? 0,
      },
    });
  } catch (err) {
    console.error("Analytics error:", err.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch analytics",
    });
  }
};

module.exports = {
  createShortUrl,
  getOriginalUrl,
  getUrlAnalytics,
};
