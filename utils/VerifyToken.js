const jwt = require("jsonwebtoken");
const User = require("../models/adminUserSchema"); // Import your User model

exports.verifyToken = async (req, res, next) => {
  try {
    // Get the token from the authorization header
    const authHeader = req.header("Authorization");

    if (!authHeader) {
      return res.status(401).json({
        StatusCode: 401,
        Message: "No token provided",
      });
    }

    const [bearer, token] = authHeader.split(" ");
    if (bearer !== "Bearer" || !token) {
      return res.status(401).json({
        StatusCode: 401,
        Message: "Invalid token",
      });
    }
    
    // Verify the token
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(401).json({
          StatusCode: 401,
          Message: "Invalid token",
        });
      }
      req.user = user;
      next(); // Call the next middleware or route handler
    });
    // Check if user exists in the database
  } catch (error) {
    return res.status(401).json({
      StatusCode: 401,
      Message: "Invalid token",
    });
  }
};
