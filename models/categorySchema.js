const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    UserID: {
      type: String,
      required: true,
    },
    Category: {
      type: String,
      required: true,
      trim: true,
    },
    Status: {
      type: String,
      default: "A",
    },
  },
  { timestamps: true }
);

const category = new mongoose.model("category", categorySchema);

module.exports = category;
