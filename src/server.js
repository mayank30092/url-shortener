require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");
const { connectRedis } = require("./config/redis");

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  await connectDB();
  await connectRedis();

  app.listen(PORT, () => {
    console.log(`Server running on PORT ${PORT}`);
  });
};

startServer().catch((err) => {
  console.error("Startup failed:", err.message);
  process.exit(1);
});
