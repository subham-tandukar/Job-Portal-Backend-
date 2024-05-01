const application = require("../models/applicationSchema");
const Job = require("../models/jobSchema");
const express = require("express");
const fs = require("fs");
const path = require("path");
const cloudinary = require("../cloudinary");

// ---- apply form ----
exports.applyJob = async (req, res) => {
  const { JobID, Name, Email, PhoneNumber, CV } = req.body;

  const user = req.user;

  const userId = user.User.Id;

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

    const base64Pdf = CV.split(",")[1];
    // Decode base64 string to binary
    const pdfBuffer = Buffer.from(base64Pdf, "base64");

    // Create a unique filename
    const filename = `pdf_${Date.now()}.pdf`;

    // Upload the CV file to Cloudinary
    const cloudinaryUploadResponse = await cloudinary.uploader.upload(CV, {
      folder: "cv_files", // Optional: Specify a folder in Cloudinary to organize your CV files
    });

    const cvUrl = cloudinaryUploadResponse.secure_url;

    // Save the PDF file to the server
    const filePath = path.join(__dirname, "../uploads", filename);
    fs.writeFileSync(filePath, pdfBuffer);
    // Return the URL for accessing the uploaded PDF
    const fileUrl = `${process.env.REACT_APP_URL}/uploads/${filename}`;

    const applicationData = new application({
      Name,
      PhoneNumber,
      Email,
      JobID,
      CV: fileUrl,
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

// Serve PDF file
exports.viewPdf = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, "../uploads", filename);
    res.sendFile(filePath);
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

    const transformedData = applications.map((application) => ({
      ...application.toObject(),
      JobID: application.JobID._id,
      Job: application.JobID.JobDesignation,
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
      .find({ JobID: jobId })
      .sort({ createdAt: -1 })
      .populate("JobID");

    const transformedData = applications.map((application) => ({
      ...application.toObject(),
      JobID: application.JobID._id,
      Job: application.JobID.JobDesignation,
    }));

    const job = transformedData[0]?.Job;

    res.status(200).json({
      StatusCode: 200,
      Message: "Success",
      Count: transformedData.length,
      Job: job,
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
  const userId = user.User.Id;

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

//
exports.application = async (req, res) => {
  const { FLAG, JobStatus, ApplicationID, BulkApplicationID } = req.body;

  try {
    if (FLAG === "US") {
      const update = {
        Status,
      };
      await category.findByIdAndUpdate(CategoryID, update, {
        new: true,
      });

      try {
        res.status(200).json({
          StatusCode: 200,
          Message: "Success",
        });
      } catch (error) {
        res.status(500).json({
          StatusCode: 500,
          Message: "Error updating category status",
          Error: error.message,
        });
      }
    } else if (FLAG === "D") {
      try {
        const deleteApplication = await application.findByIdAndDelete(
          ApplicationID
        );

        if (!deleteApplication) {
          return res.status(404).json({
            StatusCode: 404,
            Message: "Application not found",
          });
        }

        // Retrieve the PDF filename from the application object
        const pdfFilename = deleteApplication.CV;

        if (!pdfFilename) {
          return res.status(400).json({
            StatusCode: 400,
            Message: "PDF filename not found for the application",
          });
        }

        // Construct the file path to the associated PDF file
        const pdfFilePath = path.join(
          __dirname,
          "../uploads",
          pdfFilename.split("/")[4]
        );

        // Check if the file exists before attempting to delete
        if (fs.existsSync(pdfFilePath)) {
          // Delete the file synchronously
          fs.unlinkSync(pdfFilePath);
        }
        res.status(200).json({
          StatusCode: 200,
          Message: "Success",
        });
      } catch (error) {
        res.status(500).json({
          StatusCode: 500,
          Message: "Error deleting application",
          Error: error.message,
        });
      }
    } else if (FLAG === "BD") {
      try {
        // Perform bulk delete operation in MongoDB
        const deleteResults = await application.deleteMany({
          _id: { $in: BulkApplicationID },
        });

        // Retrieve the list of deleted applications
        const bulkApplications = await application.find({
          _id: { $in: BulkApplicationID },
        });

        bulkApplications.forEach((app) => {
          const pdfFilename = app.pdfFilename;
          if (pdfFilename) {
            const pdfFilePath = path.join(__dirname, "../uploads", pdfFilename);
            // Check if the file exists before attempting to delete
            if (fs.existsSync(pdfFilePath)) {
              // Delete the file synchronously
              fs.unlinkSync(pdfFilePath);
            }
          }
        });

        res.status(200).json({
          StatusCode: 200,
          Message: "Success",
          DeletedCount: deleteResults.deletedCount,
        });
      } catch (error) {
        res.status(500).json({
          StatusCode: 500,
          Message: "An error occurred while performing bulk delete",
          Error: error.message,
        });
      }
    } else {
      res.status(400).json({ StatusCode: 400, Message: "Invalid flag" });
    }
  } catch (error) {
    res.status(500).json({
      StatusCode: 500,
      Message: "Internal Server Error",
      Error: error.message,
    });
  }
};
