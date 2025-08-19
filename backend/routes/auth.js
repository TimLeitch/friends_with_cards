const express = require("express");
const bcrypt = require("bcrypt");
const { pgPool } = require("../db/config");
const logger = require("../utils/logger");

const router = express.Router();

// User registration
router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  try {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const client = await pgPool.connect();
    try {
      await client.query("BEGIN");

      const userInsertQuery = `
        INSERT INTO users (username, password_hash)
        VALUES ($1, $2)
        RETURNING id;
      `;
      const userResult = await client.query(userInsertQuery, [
        username,
        passwordHash,
      ]);
      const userId = userResult.rows[0].id;

      // Create default settings for the new user
      const settingsInsertQuery =
        "INSERT INTO user_settings (user_id) VALUES ($1);";
      await client.query(settingsInsertQuery, [userId]);

      const statsInsertQuery =
        "INSERT INTO user_game_stats (user_id) VALUES ($1);";
      await client.query(statsInsertQuery, [userId]);

      await client.query("COMMIT");

      req.session.userId = userId;

      res.status(201).json({
        message: "User registered successfully",
        userId,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      if (error.code === "23505" && error.constraint === "users_username_key") {
        return res.status(409).json({ error: "Username already taken" });
      }
      logger.error("Registration transaction failed:", error);
      res.status(500).json({ error: "Internal server error" });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error("Password hashing failed:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// User login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  try {
    const query = "SELECT id, password_hash FROM users WHERE username = $1";
    const result = await pgPool.query(query, [username]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    req.session.userId = user.id;

    res.status(200).json({
      message: "Login successful",
      userId: user.id,
    });
  } catch (error) {
    logger.error("Login failed:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// User logout
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      logger.error("Logout failed:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.clearCookie("connect.sid");
    res.status(200).json({ message: "Logout successful" });
  });
});

module.exports = router;
