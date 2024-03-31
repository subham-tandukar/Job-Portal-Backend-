const User = require("../models/adminUserSchema");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// --- app login ---
exports.login = async (req, res) => {
  const { Email, Password } = req.body;

  try {
    let user = await User.findOne({ Email });
    if (!user) {
      return res.status(401).json({
        Message: "User doesn't exist",
      });
    }

    const passwordCompare = await bcrypt.compare(Password, user.Password);
    if (!passwordCompare) {
      return res.status(401).json({
        Message: "Password doesn't match",
      });
    }

    // Update the lastLoggedIn field
    user.LastLoggedIn = new Date();
    await user.save(); // Save the updated user document

    const data = {
      user: {
        id: user.id,
        name: user.Name,
        email: user.Email,
      },
    };
    const authToken = jwt.sign(data, process.env.JWT_SECRET);

    res.status(201).json({
      StatusCode: 200,
      Message: "success",
      Login: [
        {
          Name: user.Name,
          Email: user.Email,
          UserID: user._id,
          Profile: user.Profile.url,
          Token: authToken,
        },
      ],
    });
  } catch (err) {
    res.status(401).json({
      StatusCode: 400,
      Message: err,
    });
  }
};
