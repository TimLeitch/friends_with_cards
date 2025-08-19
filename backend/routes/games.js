const express = require("express");
const router = express.Router();
const { pgPool } = require("../db/config");
const logger = require("../utils/logger");
const bcrypt = require("bcryptjs"); // Added missing import for bcrypt
const { authenticateToken } = require("../middleware/auth");

// Session-based auth to align with current login implementation
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) return next();
  return res.status(401).json({ error: "Unauthorized" });
};

// Get all active game lobbies
router.get("/", async (req, res) => {
  try {
    // Use only widely-available columns to avoid schema drift issues
    const result = await pgPool.query(
      "SELECT id, name, game_type, status, current_players, max_players FROM game_sessions WHERE status = $1 ORDER BY created_at DESC",
      ["waiting"]
    );
    // Compute has_password on the server without depending on the column
    const rows = result.rows.map((row) => ({ ...row, has_password: false }));
    res.json(rows);
  } catch (err) {
    logger.error(`Error fetching active games: ${err.stack}`);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create a new game lobby
router.post("/", async (req, res) => {
  const rawBody = req.body || {};
  logger.info(
    `Create game request received: contentType=${
      req.headers["content-type"]
    }, bodyKeys=${Object.keys(rawBody)}`
  );
  const nameInput = rawBody.name ?? rawBody["game-name"];
  const gameTypeInput = rawBody.game_type ?? rawBody["game-type"];
  const password = rawBody.password ?? rawBody["game-password"] ?? null;

  const name = typeof nameInput === "string" ? nameInput.trim() : nameInput;
  const game_type =
    typeof gameTypeInput === "string" ? gameTypeInput.trim() : gameTypeInput;

  if (!name || !game_type) {
    logger.error(
      `Create game missing fields: name=${JSON.stringify(
        name
      )}, game_type=${JSON.stringify(game_type)}, bodyKeys=${Object.keys(
        rawBody
      )}`
    );
    return res
      .status(400)
      .json({ error: "Missing required fields: name, game_type" });
  }

  try {
    // Discover schema to build a compatible insert
    const colsResult = await pgPool.query(
      `SELECT column_name, is_nullable
       FROM information_schema.columns
       WHERE table_name = 'game_sessions' AND column_name IN ('creator_id','password_hash')`
    );
    const availableCols = Object.fromEntries(
      colsResult.rows.map((r) => [r.column_name, r.is_nullable])
    );

    const fields = ["name", "game_type"]; // always present in our usage
    const values = [name, game_type];
    const placeholders = ["$1", "$2"];

    // Handle creator_id if the column exists
    if (Object.prototype.hasOwnProperty.call(availableCols, "creator_id")) {
      const creatorId = req.session?.userId || null;
      const isRequired = availableCols["creator_id"] === "NO"; // not nullable
      if (isRequired && !creatorId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      fields.push("creator_id");
      values.push(creatorId);
      placeholders.push(`$${placeholders.length + 1}`);
    }

    // Handle password_hash if the column exists
    if (Object.prototype.hasOwnProperty.call(availableCols, "password_hash")) {
      const passwordHash = password ? await bcrypt.hash(password, 10) : null;
      fields.push("password_hash");
      values.push(passwordHash);
      placeholders.push(`$${placeholders.length + 1}`);
    }

    const query = `INSERT INTO game_sessions (${fields.join(
      ", "
    )}) VALUES (${placeholders.join(", ")}) RETURNING *`;
    const result = await pgPool.query(query, values);
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    logger.error(`Error creating game: ${err.stack || err.message}`);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
