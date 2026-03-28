const { createClient } = require("redis");

async function connectRedis(app) {
  try {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
    const client = createClient({
      url: redisUrl,
      socket: {
        connectTimeoutMs: 3000,
        reconnectStrategy: false, // don't retry
      },
    });

    // Race: connect vs timeout
    await Promise.race([
      client.connect(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Redis connect timeout")), 3000)
      ),
    ]);

    app.locals.redis = client;
    app.locals.redisMock = false;

    console.log("✅ Redis Connected");
  } catch (err) {
    console.log("⚠️  Redis not available — using in-memory mock");

    // In-memory mock that mimics redis client
    const store = new Map();
    app.locals.redis = {
      set: async (key, value) => store.set(key, value),
      get: async (key) => store.get(key) || null,
    };
    app.locals.redisMock = true;
  }
}

module.exports = connectRedis;
