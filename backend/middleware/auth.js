const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      logger.error("JWT verification error:", err.message);
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
};

module.exports = { authenticateToken };
