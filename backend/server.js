const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { createServer } = require("http");
const { Server } = require("socket.io");
const session = require("express-session");
const RedisStore = require("connect-redis").default;
const path = require("path");
require("dotenv").config();

const logger = require("./utils/logger");
const {
  redisClient,
  testConnections,
  closeConnections,
} = require("./db/config");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const gameRoutes = require("./routes/games");

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(",") || [
      "http://localhost:3001",
      "http://localhost:8080",
    ],
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 3001;

// Session middleware configuration
const useRedis = (process.env.USE_REDIS || "true").toLowerCase() !== "false";
const sessionStore =
  useRedis && redisClient ? new RedisStore({ client: redisClient }) : undefined; // express-session defaults to MemoryStore

if (!sessionStore) {
  logger.warn(
    "Using in-memory session store (Redis disabled or not connected). Not for production use."
  );
}

const sessionMiddleware = session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || "your-very-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
  },
});

app.use(sessionMiddleware);

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || [
      "http://localhost:3001",
      "http://localhost:8080",
    ],
    credentials: true,
  })
);
app.use(morgan("combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Disable caching in development for static assets and API responses
if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });
}

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/games", gameRoutes);

// Serve static files from the frontend directory
app.use(
  express.static(path.join(__dirname, "../frontend"), {
    etag: false,
    lastModified: false,
    cacheControl: false,
    maxAge: 0,
  })
);

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    const dbStatus = await testConnections();
    res.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      database: dbStatus ? "connected" : "disconnected",
    });
  } catch (error) {
    logger.error("Health check failed:", error);
    res.status(500).json({
      status: "ERROR",
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

// API routes
app.get("/api", (req, res) => {
  res.json({
    message: "Friends with Cards API",
    version: "1.0.0",
    status: "running",
  });
});

// Serve frontend application
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend", "index.html"));
});

// Socket.io connection handling
io.on("connection", (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on("disconnect", () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });

  // Handle game-related events here
  socket.on("join_game", (data) => {
    logger.info(`Player ${data.playerId} joining game ${data.gameId}`);
    // TODO: Implement game joining logic
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error("Unhandled error:", err);
  res.status(500).json({ error: "Something went wrong!" });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ error: "Route not found" });
});

// Catch-all route to serve the frontend's index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend", "index.html"));
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully");
  await closeConnections();
  server.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received, shutting down gracefully");
  await closeConnections();
  server.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });
});

if (require.main === module) {
  const requiredEnvVars = [
    "JWT_SECRET",
    "DB_HOST",
    "DB_PORT",
    "DB_NAME",
    "DB_USER",
    "DB_PASSWORD",
  ];
  const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

  if (missingEnvVars.length > 0) {
    logger.error(
      `Missing required environment variables: ${missingEnvVars.join(", ")}`
    );
    process.exit(1);
  }

  server.listen(PORT, async () => {
    logger.info(`Server running on port ${PORT}`);

    // Test database connections on startup
    const ok = await testConnections();
    if (ok) {
      logger.info("All database connections established successfully");
    } else {
      logger.error("One or more database connections failed. See logs above.");
    }
  });
}

module.exports = { app, server, io };
