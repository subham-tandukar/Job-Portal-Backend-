const category = require("../models/categorySchema");
const cloudinary = require("../cloudinary");

// ---- Category ----
exports.category = async (req, res) => {
  const { FLAG, CategoryID, Category, Status, BulkCategoryID } = req.body;

  try {
    if (FLAG === "I") {
      if (!Category) {
        return res.status(422).json({
          StatusCode: 422,
          Message: "Please fill the required fields",
        });
      }
      let unique = await category.findOne({ Category: Category });
      if (unique) {
        return res.status(422).json({
          StatusCode: 422,
          Message: "This Category already exist",
        });
      }

      const categoryData = new category({
        Category,
      });
      await categoryData.save();
      try {
        res.status(201).json({
          StatusCode: 200,
          Message: "success",
        });
      } catch (error) {
        res.status(500).json({
          StatusCode: 500,
          Message: "Error Creating Category",
          Error: error.message,
        });
      }
    } else if (FLAG === "U") {
      if (!Category) {
        return res.status(422).json({
          StatusCode: 422,
          Message: "Please fill the required fields",
        });
      }

      let update;

      update = {
        Category,
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
          Message: "Error updating category",
          Error: error.message,
        });
      }
    } else if (FLAG === "US") {
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
      const deleteCategory = await category.findByIdAndDelete({
        _id: CategoryID,
      });

      if (!deleteCategory) {
        return res.status(404).json({
          StatusCode: 404,
          Message: "Category not found",
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
          Message: "Error deleting category",
          Error: error.message,
        });
      }
    } else if (FLAG === "BD") {
      // Perform bulk delete operation in MongoDB
      const deleteResults = await category.deleteMany({
        _id: { $in: BulkCategoryID },
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

// --- get category ---
exports.categoryList = async (req, res) => {
  try {
    const Status = req.query.Status;

    let categorydata;

    // Check if CategoryID is "-1" to retrieve all blogs
    if (Status === "-1") {
      categorydata = await category
        .find()
        .select("Category Status")
        .sort({ createdAt: -1 });
    } else if (Status) {
      // Retrieve blogs filtered by CategoryID and populate the Category field
      categorydata = await category
        .find({ Status: Status })
        .select("Category Status")
        .sort({ createdAt: -1 });
    } else {
      // Handle the case where no CategoryID is provided
    }

    res.status(200).json({
      StatusCode: 200,
      Message: "success",
      Values: categorydata.length <= 0 ? null : categorydata,
    });
  } catch (error) {
    res.status(500).json({
      StatusCode: 500,
      Message: "Internal Server Error",
      Error: error.message,
    });
  }
};

exports.getCategory = async (req, res) => {
  try {
    const categorydata = await category
      .find({ Status: "A" })
      .select("Category Status")
      .sort({ createdAt: -1 });

    res.status(200).json({
      StatusCode: 200,
      Message: "success",
      Values: categorydata.length <= 0 ? null : categorydata,
    });
  } catch (error) {
    res.status(500).json({
      StatusCode: 500,
      Message: "Internal Server Error",
      Error: error.message,
    });
  }
};
