const Counter = require("../models/counter.model");
const { encodedBase62 } = require("./base62");

const generateShortCode = async () => {
  const counter = await Counter.findOneAndUpdate(
    { _id: "url" },
    { $inc: { sequence: 1 } },
    {
      new: true,
      upsert: true,
    },
  );
  return encodedBase62(counter.sequence);
};

module.exports = { generateShortCode };
