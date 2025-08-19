const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { createServer } = require("http");
const { Server } = require("socket.io");
const path = require("path");
require("dotenv").config();

const logger = require("./utils/logger");
const { testConnections, closeConnections } = require("./db/config");

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

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, "../frontend")));

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

// Catch-all route to serve the frontend's index.html
app.get("*", (req, res) => {
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
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
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
  server.listen(PORT, async () => {
    logger.info(`Server running on port ${PORT}`);

    // Test database connections on startup
    try {
      await testConnections();
      logger.info("All database connections established successfully");
    } catch (error) {
      logger.error("Failed to establish database connections:", error);
    }
  });
}

module.exports = { app, server, io };
