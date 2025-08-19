const express = require("express");
const router = express.Router();
const db = require("../db/config");
const logger = require("../utils/logger");
const bcrypt = require("bcryptjs"); // Added missing import for bcrypt
const { authenticateToken } = require("../middleware/auth");

// Get all active game lobbies
router.get("/", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT gs.id, gs.name, u.username AS creator, gs.game_type, gs.status, gs.current_players, gs.max_players, (gs.password_hash IS NOT NULL) AS has_password FROM game_sessions gs JOIN users u ON gs.creator_id = u.id WHERE gs.status = $1 ORDER BY gs.created_at DESC",
      ["waiting"]
    );
    res.json(result.rows);
  } catch (err) {
    logger.error("Error fetching active games:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create a new game lobby
router.post("/", authenticateToken, async (req, res) => {
  const { name, game_type, password } = req.body;
  const creator_id = req.user.id;

  if (!name || !creator_id || !game_type) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const password_hash = password ? await bcrypt.hash(password, 10) : null;
    const result = await db.query(
      "INSERT INTO game_sessions (name, creator_id, game_type, password_hash) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, creator_id, game_type, password_hash]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    logger.error("Error creating game:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
