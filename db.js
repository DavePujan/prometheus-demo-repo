const mongoose = require("mongoose");

async function connectDB() {
  try {
    const mongoUrl = process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/monitor-demo";
    await mongoose.connect(mongoUrl, {
      serverSelectionTimeoutMS: 3000,
    });

    console.log("✅ MongoDB Connected");

    const userSchema = new mongoose.Schema({
      name: String,
    });

    const User = mongoose.model("User", userSchema);

    return { User, useMock: false };
  } catch (err) {
    console.log("⚠️  MongoDB not available — using in-memory mock");

    // In-memory mock that mimics Mongoose model
    const store = [];
    const User = {
      create: async (data) => {
        const doc = { _id: Math.random().toString(36).slice(2), ...data };
        store.push(doc);
        return doc;
      },
      find: async () => store,
    };

    return { User, useMock: true };
  }
}

module.exports = connectDB;
