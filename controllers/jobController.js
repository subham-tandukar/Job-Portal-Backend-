const Job = require("../models/jobSchema");
const fs = require("fs");
const cloudinary = require("../cloudinary");

// Function to generate slug
const generateSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
};

// ---- add job ----
exports.job = async (req, res) => {
  const {
    JobID,
    ComName,
    ComLogo,
    JobDesignation,
    JobDescription,
    ExpiryDate,
    Location,
    Salary,
    CategoryID,
    Category,
    JobType,
    IsFeatured,
    IsPublished,
    FLAG,
    BulkJobID,
    UserID,
    Qualification,
    Experience,
    Gender,
  } = req.body;

  try {
    if (FLAG === "I") {
      if (
        !ComName ||
        !ComLogo ||
        !JobDesignation ||
        !JobDescription ||
        !ExpiryDate ||
        !Location ||
        !Salary ||
        !CategoryID ||
        !Qualification ||
        !Experience ||
        !Gender ||
        !JobType
      ) {
        return res.status(422).json({
          StatusCode: 422,
          Message: "Please fill the required fields",
        });
      }

      // let unique = await Job.findOne({ ComName: ComName });
      // if (unique) {
      //   return res.status(422).json({
      //     Message: "This Company name already exist",
      //   });
      // }

      // Generate slug based on ComName and JobDesignation
      const slug = generateSlug(`${ComName}-${JobDesignation}`);

      // Check if the combination of ComName and JobDesignation already exists
      let existingJob = await Job.findOne({ ComName, JobDesignation });
      if (existingJob) {
        return res.status(422).json({
          StatusCode: 422,
          Message:
            "This Company and Job Designation combination already exists",
        });
      }

      const comLogo = await cloudinary.uploader.upload(ComLogo, {
        folder: "Company Logo",
      });

      const jobData = new Job({
        UserID,
        ComName,
        JobDesignation,
        Slug: slug,
        JobDescription,
        ExpiryDate,
        Location,
        Salary,
        CategoryID,
        JobType,
        IsFeatured,
        IsPublished,
        Qualification,
        Experience,
        Gender,
        ComLogo: {
          public_id: comLogo.public_id,
          url: comLogo.secure_url,
        },
      });
      await jobData.save();

      // Delete only the images inside the "library" folder
      try {
        const { resources } = await cloudinary.api.resources({
          type: "upload",
          prefix: "library/", // Specify the folder to delete its contents
          max_results: 500, // Adjust this value based on the number of files you have
        });

        const deletePromises = resources.map(async (resource) => {
          await cloudinary.uploader.destroy(resource.public_id);
        });

        await Promise.all(deletePromises);
      } catch (error) {
        console.error("Error deleting images inside folder:", error);
      }

      try {
        res.status(201).json({
          StatusCode: 200,
          Message: "success",
          Image: jobData.Image,
        });
      } catch (error) {
        res.status(500).json({
          StatusCode: 500,
          Message: "Error creating book",
          Error: error.message,
        });
      }
    } else if (FLAG === "U") {
      if (
        !ComName ||
        !ComLogo ||
        !JobDesignation ||
        !JobDescription ||
        !ExpiryDate ||
        !Location ||
        !Salary ||
        !CategoryID ||
        !Qualification ||
        !Experience ||
        !Gender ||
        !JobType
      ) {
        return res.status(422).json({
          StatusCode: 422,
          Message: "Please fill the required fields",
        });
      }
      let urlRegex =
        /^(?:https?|ftp):\/\/[\w-]+(?:\.[\w-]+)+[\w.,@?^=%&amp;:/~+#-]*$/;

      // Check if the combination of ComName and JobDesignation already exists
      let existingJob = await Job.findOne({ ComName, JobDesignation });
      if (existingJob) {
        return res.status(422).json({
          StatusCode: 422,
          Message:
            "This Company and Job Designation combination already exists",
        });
      }

      // Check if the URL matches the regex pattern
      const changeImage = urlRegex.test(ComLogo);

      // let unique = await Job.findOne({ ComName: ComName });
      // if (unique) {
      //   return res.status(422).json({
      //     Message: "This Company name already exist",
      //   });
      // }

      // Generate slug based on ComName and JobDesignation
      const slug = generateSlug(`${ComName}-${JobDesignation}`);

      let comLogo;

      const updateBook = await Job.findById({ _id: JobID });
      const oldImg = updateBook.ComLogo.url;

      if (oldImg !== ComLogo) {
        await cloudinary.uploader.destroy(updateBook.ComLogo.public_id);

        comLogo = await cloudinary.uploader.upload(ComLogo, {
          folder: "Company Logo",
        });
      }

      let update;

      if (oldImg !== ComLogo) {
        update = {
          UserID,
          ComName,
          JobDesignation,
          Slug: slug,
          JobDescription,
          ExpiryDate,
          Location,
          Salary,
          CategoryID,
          JobType,
          IsFeatured,
          IsPublished,
          Qualification,
          Experience,
          Gender,
          ComLogo: {
            public_id: comLogo.public_id,
            url: comLogo.secure_url,
          },
        };
      } else {
        update = {
          UserID,
          ComName,
          JobDesignation,
          Slug: slug,
          JobDescription,
          ExpiryDate,
          Location,
          Salary,
          CategoryID,
          JobType,
          IsFeatured,
          IsPublished,
          Qualification,
          Experience,
          Gender,
        };
      }

      await Job.findByIdAndUpdate(JobID, update, {
        new: true,
      });

      // Delete only the images inside the "library" folder
      try {
        const { resources } = await cloudinary.api.resources({
          type: "upload",
          prefix: "library/", // Specify the folder to delete its contents
          max_results: 500, // Adjust this value based on the number of files you have
        });

        const deletePromises = resources.map(async (resource) => {
          await cloudinary.uploader.destroy(resource.public_id);
        });

        await Promise.all(deletePromises);
      } catch (error) {
        console.error("Error deleting images inside folder:", error);
      }

      try {
        res.status(200).json({
          StatusCode: 200,
          Message: "success",
        });
      } catch (error) {
        res.status(500).json({
          StatusCode: 500,
          Message: "Error updating book",
          Error: error.message,
        });
      }
    } else if (FLAG === "D") {
      const deleteJob = await Job.findByIdAndDelete({ _id: JobID });

      if (!deleteJob) {
        return res.status(404).json({
          StatusCode: 404,
          Message: "Job not found",
        });
      }

      // Delete the image from Cloudinary
      await cloudinary.uploader.destroy(deleteJob.ComLogo.public_id);

      try {
        res.status(200).json({
          StatusCode: 200,
          Message: "Success",
        });
      } catch (error) {
        res.status(500).json({
          StatusCode: 500,
          Message: "Error deleting job",
          Error: error.message,
        });
      }
    } else if (FLAG === "BD") {
      // Perform bulk delete operation in MongoDB
      const deleteResults = await Job.deleteMany({
        _id: { $in: BulkJobID },
      });

      // Loop through the deleted user IDs and delete their images from Cloudinary
      const deleteImagePromises = BulkJobID.map(async (jobid) => {
        console.log("jobid", jobid);
        const job = await Job.findById(jobid);
        console.log("JOBS", job);
        if (job && job.ComLogo && job.ComLogo.public_id) {
          // Delete image from Cloudinary
          await cloudinary.uploader.destroy(job.ComLogo.public_id);
        }
      });
      await Promise.all(deleteImagePromises);

      try {
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

// --- get job ---
exports.jobList = async (req, res) => {
  try {
    const CategoryID = req.query.CategoryID;
    let jobdata;

    // Check if CategoryID is "-1" to retrieve all jobs
    if (CategoryID === "-1") {
      jobdata = await Job.find().sort({ createdAt: -1 }).populate("CategoryID");
    } else if (CategoryID) {
      // Retrieve jobs filtered by CategoryID and populate the Category field
      jobdata = await Job.find({ CategoryID: CategoryID })
        .sort({ createdAt: -1 })
        .populate("CategoryID");
    } else {
      // Handle the case where no CategoryID is provided
      // For example, if you want to return all jobs without filtering, you can do this:
      jobdata = await Job.find().sort({ createdAt: -1 }).populate("CategoryID");
    }
    // Transform the jobdata to include CategoryID and Category separately
    const transformedData = jobdata.map((job) => ({
      ...job.toObject(),
      CategoryID: job.CategoryID._id,
      Category: job.CategoryID.Category,
    }));

    res.status(200).json({
      StatusCode: 200,
      Message: "success",
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

// --- get job ---
exports.singleJob = async (req, res) => {
  try {
    const { slug } = req.params;

    // Retrieve jobs filtered by CategoryID and populate the Category field
    const jobdata = await Job.find({ Slug: slug })
      .sort({ createdAt: -1 })
      .populate("CategoryID");

    // Transform the jobdata to include CategoryID and Category separately
    const transformedData = jobdata.map((job) => ({
      ...job.toObject(),
      CategoryID: job.CategoryID._id,
      Category: job.CategoryID.Category,
    }));

    res.status(200).json({
      StatusCode: 200,
      Message: "success",
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

// get featured job
exports.featuredJob = async (req, res) => {
  try {
    const jobdata = await Job.find({ IsFeatured: "Y" })
      .sort({ createdAt: -1 })
      .populate("CategoryID");

    // Transform the jobdata to include CategoryID and Category separately
    const transformedData = jobdata.map((job) => ({
      ...job.toObject(),
      CategoryID: job.CategoryID._id,
      Category: job.CategoryID.Category,
    }));

    res.status(200).json({
      StatusCode: 200,
      Message: "success",
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
