// const jwt = require("jsonwebtoken");

// export const verifyToken = (req, res, next) => {
//   const token = req.cookies.access_token;

//   if (!token)
//     return res.status(401).json({
//       StatusCode: 401,
//       Message: "Access Denied",
//     });

//   jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
//     if (err)
//       return res.status(403).json({
//         StatusCode: 403,
//         Message: "Token is invalid",
//       });
//   });

//   req.user = user;
//   next();
// };
