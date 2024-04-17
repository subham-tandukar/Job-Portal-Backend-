const jobType = require("../models/jobTypeSchema");
const cloudinary = require("../cloudinary");

// ---- jobType ----
exports.jobType = async (req, res) => {
  const { FLAG, JobTypeID, JobType, Status, BulkJobTypeID } = req.body;

  try {
    if (FLAG === "I") {
      if (!JobType) {
        return res.status(422).json({
          StatusCode: 422,
          Message: "Please fill the required fields",
        });
      }

      let unique = await jobType.findOne({ JobType });
      if (unique) {
        return res.status(422).json({
          StatusCode: 422,
          Message: "This job type already exist",
        });
      }

      const jobTypeData = new jobType({
        Status,
        JobType,
      });
      await jobTypeData.save();
      try {
        res.status(201).json({
          StatusCode: 200,
          Message: "success",
        });
      } catch (error) {
        res.status(500).json({
          StatusCode: 500,
          Message: "Error Creating Job Type",
          Error: error.message,
        });
      }
    } else if (FLAG === "U") {
      if (!JobType) {
        return res.status(422).json({
          StatusCode: 422,
          Message: "Please fill the required fields",
        });
      }

      let update;

      update = {
        Status,
        JobType,
      };

      await jobType.findByIdAndUpdate(JobTypeID, update, {
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
          Message: "Error updating job type",
          Error: error.message,
        });
      }
    } else if (FLAG === "S") {
      try {
        let jobTypeData;

        // Check if Status is "-1" to retrieve all categories
        if (Status === "-1") {
          jobTypeData = await jobType
            .find()
            .select("JobType Status")
            .sort({ createdAt: -1 });
        } else if (Status) {
          // Retrieve categories filtered by jobTypeID and populate the JobType field
          jobTypeData = await jobType
            .find({
              Status: Status,
            })
            .select("JobType Status")
            .sort({ createdAt: -1 });
        } else {
        }

        res.status(200).json({
          StatusCode: 200,
          Message: "success",
          Count: jobTypeData.length,
          Values: jobTypeData.length <= 0 ? null : jobTypeData,
        });
      } catch (error) {
        res.status(500).json({
          StatusCode: 500,
          Message: "Internal Server Error",
          Error: error.message,
        });
      }
    } else if (FLAG === "SI") {
      try {
        let jobTypeData;

        // Check if Status is "-1" to retrieve all categories

        // Retrieve categories filtered by JobTypeID and populate the JobType field
        jobTypeData = await jobType
          .find({
            _id: JobTypeID,
          })
          .select("JobType Status")
          .sort({ createdAt: -1 });

        res.status(200).json({
          StatusCode: 200,
          Message: "success",
          Count: jobTypeData.length,
          Values: jobTypeData.length <= 0 ? null : jobTypeData,
        });
      } catch (error) {
        res.status(500).json({
          StatusCode: 500,
          Message: "Internal Server Error",
          Error: error.message,
        });
      }
    } else if (FLAG === "US") {
      const update = {
        Status,
      };
      await jobType.findByIdAndUpdate(JobTypeID, update, {
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
          Message: "Error updating job type status",
          Error: error.message,
        });
      }
    } else if (FLAG === "D") {
      const deleteJobType = await jobType.findByIdAndDelete({
        _id: JobTypeID,
      });

      if (!deleteJobType) {
        return res.status(404).json({
          StatusCode: 404,
          Message: "Job type not found",
        });
      }

      try {
        res.status(200).json({
          StatusCode: 200,
          Message: "Success",
        });
      } catch (error) {
        res.status(500).json({
          StatusCode: 500,
          Message: "Error deleting job type",
          Error: error.message,
        });
      }
    } else if (FLAG === "BD") {
      // Perform bulk delete operation in MongoDB
      const deleteResults = await jobType.deleteMany({
        _id: { $in: BulkJobTypeID },
      });

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

exports.getJobType = async (req, res) => {
  try {
    const jobTypedata = await jobType
      .find({ Status: "A" })
      .select("JobType Status")
      .sort({ createdAt: -1 });

    res.status(200).json({
      StatusCode: 200,
      Message: "success",
      Count: jobTypedata.length,
      Values: jobTypedata.length <= 0 ? null : jobTypedata,
    });
  } catch (error) {
    res.status(500).json({
      StatusCode: 500,
      Message: "Internal Server Error",
      Error: error.message,
    });
  }
};
