const mongoose = require("mongoose");

const urlSchema = mongoose.Schema(
  {
    originalUrl: {
      type: String,
      required: true,
    },
    shortCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    clickCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true },
);

urlSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("URL", urlSchema);
