const mongoose = require("mongoose");

const advertisementSchema = new mongoose.Schema(
  {
    Position: {
      type: String,
      required: true,
    },

    Link: {
      type: String,
      required: true,
    },

    Image: {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
    Status: {
      type: String,
      default: "A",
    },
  },
  { timestamps: true }
);

const advertisements = new mongoose.model("advertisement", advertisementSchema);

module.exports = advertisements;
