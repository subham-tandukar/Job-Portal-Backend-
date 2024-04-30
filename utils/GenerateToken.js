const jwt = require("jsonwebtoken");

const authToken = (data) => {
  return jwt.sign(data, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
};

const generateToken = (res, data) => {
  const expiryDate = new Date(Date.now() + 3600000); // 1 hour

  res.cookie("th_token", authToken(data), {
    httpOnly: true,
    maxAge: expiryDate,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "strict",
  });
};

module.exports = { authToken, generateToken };
