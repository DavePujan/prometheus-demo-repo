const express = require("express");
const http = require("http");
const monitor = require("prometheus-auto-instrument");

const connectDB = require("./db");
const connectRedis = require("./redis");

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

(async () => {
  // DB + Redis
  const { User } = await connectDB();
  await connectRedis(app);

  // 🔥 INIT MONITOR (ALL FEATURES)
  monitor.init({
    app,

        ignoreRoutes: ["/metrics", "/dashboard", /^\/__monitor/, "/favicon.ico"],

    autoDetect: {
      mongo: true,
      redis: true,
      otel: true,
    },

    anomalyDetection: {
      enabled: true,
      multiplier: 2,
      minSamples: 5,
      onAnomaly: (data) => {
        console.log("🚨 Anomaly detected:", data.route);
      },
    },
  });

    // v1.2.0+ package dashboard integration (UI + JSON endpoint + WS stream).
    let attachDashboardWs = null;
    if (typeof monitor.setupDashboard === "function") {
        attachDashboardWs = monitor.setupDashboard(app, monitor.register, "/dashboard");
    }

  // ---------------- ROUTES ----------------

  // Normal route
  app.get("/hello", (req, res) => {
    res.send("Hello World");
  });

  // Dynamic route (tests normalization)
  app.get("/users/:id", async (req, res) => {
    const user = await User.create({ name: "User " + req.params.id });
    res.json(user);
  });

  // Redis route
  app.get("/cache/:key", async (req, res) => {
    const redis = app.locals.redis;

    await redis.set(req.params.key, "value");
    const val = await redis.get(req.params.key);

    res.json({ key: req.params.key, value: val });
  });

  // Error route (tests error metric)
  app.get("/error", (req, res) => {
    res.status(500).send("Internal Server Error");
  });

  // Slow route (trigger anomaly)
  app.get("/slow", async (req, res) => {
    await new Promise((r) => setTimeout(r, 2000));
    res.send("Slow response");
  });

  // Keep old URL working by redirecting to package dashboard route.
  app.get("/__monitor", (req, res) => {
    res.redirect("/dashboard");
  });

  // ------------------------------------------------

    const server = http.createServer(app);
    if (typeof attachDashboardWs === "function") {
        attachDashboardWs(server);
    }

    server.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📊 Metrics → http://localhost:${PORT}/metrics`);
        console.log(`📈 Dashboard → http://localhost:${PORT}/dashboard`);
  });
})();
