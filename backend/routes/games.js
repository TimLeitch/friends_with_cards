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
    // Return minimally required lobby info + has_password flag
    const result = await pgPool.query(
      `SELECT id,
              name,
              game_type,
              status,
              current_players,
              max_players,
              (password_hash IS NOT NULL) AS has_password
         FROM game_sessions
        WHERE status = $1
        ORDER BY created_at DESC`,
      ["waiting"]
    );
    res.json(result.rows);
  } catch (err) {
    // If tables are not initialized yet, return an empty list instead of 500
    if (
      err &&
      (err.code === "42P01" ||
        /relation .* does not exist/i.test(err.message || ""))
    ) {
      logger.warn(
        "game_sessions table not found yet; returning empty games list"
      );
      return res.json([]);
    }
    logger.error(`Error fetching active games: ${err.stack || err.message}`);
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

// Join an existing game lobby
router.post("/:id/join", isAuthenticated, async (req, res) => {
  const sessionId = req.params.id;
  const userId = req.session?.userId;
  const { password } = req.body || {};

  if (!sessionId) {
    return res.status(400).json({ error: "Missing game id" });
  }

  try {
    // Load target game
    const gameResult = await pgPool.query(
      `SELECT id, name, game_type, status, password_hash, max_players
         FROM game_sessions
        WHERE id = $1`,
      [sessionId]
    );
    if (gameResult.rows.length === 0) {
      return res.status(404).json({ error: "Game not found" });
    }
    const game = gameResult.rows[0];

    if (game.status !== "waiting" && game.status !== "ready") {
      return res.status(400).json({ error: "Game is not joinable" });
    }

    // Capacity check
    const countResult = await pgPool.query(
      `SELECT COUNT(*)::int AS count FROM session_players WHERE session_id = $1`,
      [sessionId]
    );
    const currentPlayers = countResult.rows[0].count;
    const maxPlayers = game.max_players || 4;
    if (currentPlayers >= maxPlayers) {
      return res.status(400).json({ error: "Game is full" });
    }

    // Password check if protected
    if (game.password_hash) {
      if (!password) {
        return res.status(401).json({ error: "Password required" });
      }
      const ok = await bcrypt.compare(password, game.password_hash);
      if (!ok) {
        return res.status(401).json({ error: "Invalid password" });
      }
    }

    // Insert membership (idempotent)
    await pgPool.query(
      `INSERT INTO session_players (session_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (session_id, user_id) DO NOTHING`,
      [sessionId, userId]
    );

    // Recompute player count and update session
    const newCountResult = await pgPool.query(
      `SELECT COUNT(*)::int AS count FROM session_players WHERE session_id = $1`,
      [sessionId]
    );
    const newCount = newCountResult.rows[0].count;

    const newStatus =
      newCount >= 2 && game.status === "waiting" ? "ready" : game.status;
    await pgPool.query(
      `UPDATE game_sessions
          SET current_players = $1,
              status = $2
        WHERE id = $3`,
      [newCount, newStatus, sessionId]
    );

    // Load players for response
    const playersResult = await pgPool.query(
      `SELECT u.id, u.username
         FROM session_players sp
         JOIN users u ON u.id = sp.user_id
        WHERE sp.session_id = $1
        ORDER BY sp.joined_at ASC`,
      [sessionId]
    );

    return res.status(200).json({
      id: game.id,
      name: game.name,
      game_type: game.game_type,
      status: newStatus,
      current_players: newCount,
      max_players: maxPlayers,
      players: playersResult.rows,
    });
  } catch (err) {
    logger.error(`Error joining game: ${err.stack || err.message}`);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
