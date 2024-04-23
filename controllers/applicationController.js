const application = require("../models/applicationSchema");
const Job = require("../models/jobSchema");
const fs = require("fs");
const cloudinary = require("../cloudinary");

// ---- apply form ----
exports.applyJob = async (req, res) => {
  const { JobID, Name, Email, PhoneNumber, CV } = req.body;

  const user = req.user;

  const userId = user.user.id;
  try {
    if (!Name || !PhoneNumber || !CV) {
      return res.status(422).json({
        StatusCode: 422,
        Message: "Please fill the required fields",
      });
    }

    // Check if the user has already applied for the job
    const existingApplication = await application.findOne({
      JobID,
      CandidateID: userId,
    });
    if (existingApplication) {
      return res.status(422).json({
        StatusCode: 422,
        Message: "You have already applied for this job",
      });
    }

    // Upload the CV file to Cloudinary
    const cloudinaryUploadResponse = await cloudinary.uploader.upload(CV, {
      folder: "cv_files", // Optional: Specify a folder in Cloudinary to organize your CV files
    });

    const cvUrl = cloudinaryUploadResponse.secure_url;

    const applicationData = new application({
      Name,
      PhoneNumber,
      Email,
      JobID,
      CV: cvUrl,
      JobStatus: "P",
      CandidateID: userId,
    });
    await applicationData.save();
    try {
      res.status(201).json({
        StatusCode: 200,
        Message: "success",
      });
    } catch (error) {
      res.status(500).json({
        StatusCode: 500,
        Message: "Error applying application",
        Error: error.message,
      });
    }
  } catch (error) {
    res.status(500).json({
      StatusCode: 500,
      Message: "Internal Server Error",
      Error: error.message,
    });
  }
};

exports.applicationList = async (req, res) => {
  try {
    // Query all applications and populate the 'Job' field
    const applications = await application
      .find()
      .sort({ createdAt: -1 })
      .populate("JobID");

    // const transformedData = await Promise.all(
    //   applications.map(async (application) => {
    //     // Assuming CV is stored as a file path in the database
    //     const cvPath = application.CV;
    //     const cvUrl = `/api/applications/${application._id}/cv`; // Endpoint to download CV
    //     // Exclude CV from application data
    //     const { CV, ...applicationDataWithoutCV } = application.toObject();

    //     return {
    //       ...applicationDataWithoutCV,
    //       JobID: application.JobID._id,
    //       CvUrl: cvUrl,
    //     };
    //   })
    // );

    const transformedData = applications.map((application) => ({
      ...application.toObject(),
      JobID: application.JobID._id,
    }));

    res.status(200).json({
      StatusCode: 200,
      Message: "Success",
      Count: transformedData.length,
      Values: transformedData.length <= 0 ? null : transformedData,
    });
  } catch (error) {
    res.status(500).json({
      StatusCode: 500,
      Message: "Internal Server Error",
      Error: error.message,
    });
  }
};

exports.singleApplication = async (req, res) => {
  try {
    const jobId = req.params.jobId; // Extract jobId from request parameters

    // Query applications for the specified job
    const applications = await application
      .find({ Job: jobId })
      .populate("JobID");

    const transformedData = applications.map((application) => ({
      ...application.toObject(),
      JobID: application.JobID._id,
    }));

    res.status(200).json({
      StatusCode: 200,
      Message: "Success",
      Count: transformedData.length,
      Values: transformedData.length <= 0 ? null : transformedData,
    });
  } catch (error) {
    res.status(500).json({
      StatusCode: 500,
      Message: "Internal Server Error",
      Error: error.message,
    });
  }
};

exports.appliedList = async (req, res) => {
  const user = req.user;
  const userId = user.user.id;

  try {
    // Query applications for the specified user
    const userApplications = await application.find({ CandidateID: userId });

    // Extract job IDs from the user's applications
    const jobIds = userApplications.map((application) => application.JobID);

    // Query jobs corresponding to the extracted job IDs
    const jobs = await Job.find({ _id: { $in: jobIds } })
      .sort({ createdAt: -1 })
      .populate("Category")
      .populate("JobType");

    res.status(200).json({
      StatusCode: 200,
      Message: "Success",
      Count: jobs.length,
      Values: jobs.length <= 0 ? null : jobs,
    });
  } catch (error) {
    res.status(500).json({
      StatusCode: 500,
      Message: "Internal Server Error",
      Error: error.message,
    });
  }
};
