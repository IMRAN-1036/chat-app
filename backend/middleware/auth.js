const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  // Support both header formats:
  // 1. x-auth-token: <token>
  // 2. Authorization: Bearer <token>
  let token = req.header("x-auth-token");

  if (!token) {
    const authHeader = req.header("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }

  // Check if no token found
  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "chatvault-default-secret");
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};
