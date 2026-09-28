const mongoose = require("mongoose");
const env = require("./env");
// connectDB() now only knows about connecting — it reports failure by throwing, which is the normal JS way of saying "something went wrong, you decide what to do
async function connectDB() {
  try {
    await mongoose.connect(env.mongodbUri);

    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed");
    console.error(error);

    throw error;
  }
}

module.exports = connectDB;