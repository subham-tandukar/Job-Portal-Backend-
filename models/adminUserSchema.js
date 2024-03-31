const mongoose = require("mongoose");

const adminUserSchema = new mongoose.Schema(
  {
    Profile: {
      public_id: {
        type: String,
        // required: true,
      },
      url: {
        type: String,
        // required: true,
      },
    },
    Name: {
      type: String,
      required: true,
      trim: true,
    },
    Email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    Password: {
      type: String,
      required: true,
    },
    LastLoggedIn: {
      type: Date, // Field to store the last logged in date
    },
  },
  { timestamps: true }
);

const adminUsers = new mongoose.model("adminUser", adminUserSchema);

module.exports = adminUsers;
