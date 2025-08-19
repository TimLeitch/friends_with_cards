const express = require("express");
const { pgPool } = require("../db/config");
const logger = require("../utils/logger");

const router = express.Router();

// Middleware to protect routes
const isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
};

// Get user data
router.get("/me", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const userQuery = "SELECT id, username FROM users WHERE id = $1";
    const settingsQuery = "SELECT * FROM user_settings WHERE user_id = $1";
    const statsQuery = "SELECT * FROM user_game_stats WHERE user_id = $1";

    const userResult = await pgPool.query(userQuery, [userId]);
    const settingsResult = await pgPool.query(settingsQuery, [userId]);
    const statsResult = await pgPool.query(statsQuery, [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = {
      user: userResult.rows[0],
      settings: settingsResult.rows[0] || {},
      stats: statsResult.rows[0] || {},
    };

    res.status(200).json(user);
  } catch (error) {
    logger.error("Failed to get user data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update user settings
router.put("/settings", isAuthenticated, async (req, res) => {
  const userId = req.session.userId;
  const {
    card_background,
    theme,
    font_settings,
    color_settings,
    background_image,
  } = req.body;

  try {
    const query = `
      UPDATE user_settings
      SET
        card_background = COALESCE($1, card_background),
        theme = COALESCE($2, theme),
        font_settings = COALESCE($3, font_settings),
        color_settings = COALESCE($4, color_settings),
        background_image = COALESCE($5, background_image)
      WHERE user_id = $6
      RETURNING *;
    `;
    const values = [
      card_background,
      theme,
      font_settings,
      color_settings,
      background_image,
      userId,
    ];
    const result = await pgPool.query(query, values);

    res.json(result.rows[0]);
  } catch (error) {
    logger.error("Failed to update user settings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
