const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    UserID: {
      type: String,
      required: true,
    },
    ComName: {
      type: String,
      required: true,
      trim: true,
    },
    ComLogo: {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
    JobDesignation: {
      type: String,
      required: true,
      trim: true,
    },
    Slug: {
      type: String,
      required: true,
    },
    JobDescription: {
      type: String,
      required: true,
    },
    ExpiryDate: {
      type: String,
      required: true,
    },
    Location: {
      type: String,
      required: true,
      trim: true,
    },
    Salary: {
      type: String,
      default: "Negotiable",
    },
    Category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
    },
    JobType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "jobType",
    },
    Gender: {
      type: String,
    },
    Experience: {
      type: String,
    },
    Qualification: {
      type: String,
    },
    IsFeatured: {
      type: String,
      default: "N",
    },
    IsPublished: {
      type: String,
      default: "N",
    },
  },
  { timestamps: true }
);

const jobs = new mongoose.model("job", jobSchema);

module.exports = jobs;
