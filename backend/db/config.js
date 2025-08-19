const { Pool } = require("pg");
const Redis = require("redis");
const logger = require("../utils/logger");

// PostgreSQL configuration
const pgConfig = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "friends_with_cards",
  user: process.env.DB_USER || "fwc_user",
  password: process.env.DB_PASSWORD || "fwc_password",
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
};

// Feature flag to enable/disable Redis (useful for local dev without Redis running)
const isRedisEnabled =
  (process.env.USE_REDIS || "true").toLowerCase() !== "false";

// Redis configuration
const redisConfig = {
  socket: {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
  },
  db: process.env.REDIS_DB || 0,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
};

if (process.env.REDIS_PASSWORD) {
  redisConfig.password = process.env.REDIS_PASSWORD;
}

// Create PostgreSQL connection pool
const pgPool = new Pool(pgConfig);

// Handle PostgreSQL connection events
pgPool.on("connect", (client) => {
  logger.info("New PostgreSQL client connected");
});

pgPool.on("error", (err, client) => {
  logger.error("Unexpected error on idle PostgreSQL client", err);
});

// Create Redis client (conditionally)
let redisClient = null;
if (isRedisEnabled) {
  redisClient = Redis.createClient(redisConfig);

  // Handle Redis connection events
  redisClient.on("connect", () => {
    logger.info("Redis client connected");
  });

  redisClient.on("ready", () => {
    logger.info("Redis client ready");
  });

  redisClient.on("error", (err) => {
    logger.error("Redis client error:", err);
  });

  redisClient.on("end", () => {
    logger.info("Redis client disconnected");
  });

  // Connect to Redis
  redisClient.connect().catch((err) => {
    logger.error("Failed to connect to Redis:", err);
  });
} else {
  logger.warn(
    "USE_REDIS=false detected; Redis is disabled. Falling back to in-memory session store."
  );
}

// Test database connections
async function testConnections() {
  let allOk = true;

  // Test PostgreSQL
  try {
    const pgResult = await pgPool.query("SELECT NOW() as current_time");
    logger.info(
      "PostgreSQL connection successful:",
      pgResult.rows[0].current_time
    );
  } catch (error) {
    allOk = false;
    logger.error("PostgreSQL connection test failed:", error);
  }

  // Test Redis (only if enabled)
  if (isRedisEnabled && redisClient) {
    try {
      await redisClient.ping();
      logger.info("Redis connection successful");
    } catch (error) {
      allOk = false;
      logger.error("Redis connection test failed:", error);
    }
  } else if (!isRedisEnabled) {
    logger.warn("Skipping Redis connection test because USE_REDIS=false");
  }

  return allOk;
}

// Graceful shutdown function
async function closeConnections() {
  try {
    await pgPool.end();
    if (redisClient) {
      await redisClient.quit();
    }
    logger.info("Database connections closed gracefully");
  } catch (error) {
    logger.error("Error closing database connections:", error);
  }
}

module.exports = {
  pgPool,
  redisClient,
  testConnections,
  closeConnections,
};
