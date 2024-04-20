const Blog = require("../models/blogSchema");
const fs = require("fs");
const cloudinary = require("../cloudinary");

const generateSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
};

// ---- add book ----
exports.blog = async (req, res) => {
  const {
    FLAG,
    BlogID,
    Title,
    Description,
    Auther,
    Category,
    Image,
    CommentID,
    Status,
    BulkBlogID,
  } = req.body;

  try {
    if (FLAG === "I") {
      if (!Title || !Description || !Image || !Auther || !Category) {
        return res.status(422).json({
          Message: "Please fill the required fields",
        });
      }

      const slug = generateSlug(Title);

      let existingBlog = await Blog.findOne({ Title: Title });
      if (existingBlog) {
        return res.status(422).json({
          StatusCode: 422,
          Message: "This title already exists",
        });
      }

      const blogImg = await cloudinary.uploader.upload(Image, {
        folder: "blog",
      });

      const blogData = new Blog({
        Title,
        Description,
        Auther,
        Slug: slug,
        Category: Category,
        Image: {
          public_id: blogImg.public_id,
          url: blogImg.secure_url,
        },
      });
      await blogData.save();

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
        });
      } catch (error) {
        res.status(500).json({
          StatusCode: 500,
          Message: "Error creating blog",
          Error: error.message,
        });
      }
    } else if (FLAG === "U") {
      if (!Title || !Description || !Image || !Auther || !Category) {
        return res.status(422).json({
          Message: "Please fill the required fields",
        });
      }
      let urlRegex =
        /^(?:https?|ftp):\/\/[\w-]+(?:\.[\w-]+)+[\w.,@?^=%&amp;:/~+#-]*$/;

      // Check if the URL matches the regex pattern
      const changeImage = urlRegex.test(Image);

      let blogImg;

      const updateBlog = await Blog.findById({ _id: BlogID });
      const oldImg = updateBlog.Image.url;

      if (oldImg !== Image) {
        await cloudinary.uploader.destroy(updateBlog.Image.public_id);

        blogImg = await cloudinary.uploader.upload(Image, {
          folder: "blog",
        });
      }

      const slug = generateSlug(Title);

      let update;

      if (oldImg !== Image) {
        update = {
          Title,
          Auther,
          Category,
          Slug: slug,
          Description,
          Image: {
            public_id: blogImg.public_id,
            url: blogImg.secure_url,
          },
        };
      } else {
        update = {
          Title,
          Auther,
          Category,
          Slug: slug,
          Description,
        };
      }

      await Blog.findByIdAndUpdate(BlogID, update, {
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
          Message: "Error updating blog",
          Error: error.message,
        });
      }
    } else if (FLAG === "UC") {
      // Assuming req.body.Comment is an array of comments to be added
      const newComments = req.body.Comments;

      // Find the blog post by ID
      const blogPost = await Blog.findById(BlogID);

      // Add the new comments to the existing comments
      blogPost.Comments.push(...newComments);

      // Save the updated blog post
      await blogPost.save();

      try {
        res.status(200).json({
          StatusCode: 200,
          Message: "success",
        });
      } catch (error) {
        res.status(500).json({
          StatusCode: 500,
          Message: "Error updating comment",
          Error: error.message,
        });
      }
    } else if (FLAG === "DC") {
      // Assuming CommentID is provided in the request body
      if (!CommentID) {
        return res.status(422).json({
          Message: "Please provide the CommentID to delete the comment",
        });
      }

      // Find the blog post by ID
      const blogPost = await Blog.findById(BlogID);

      // Find the index of the comment to delete
      const commentIndex = blogPost.Comments.findIndex(
        (comment) => comment._id == CommentID
      );

      if (commentIndex === -1) {
        return res.status(404).json({
          StatusCode: 404,
          Message: "Comment not found",
        });
      }

      // Remove the comment from the array
      blogPost.Comments.splice(commentIndex, 1);

      // Save the updated blog post
      await blogPost.save();

      res.status(201).json({
        StatusCode: 200,
        Message: "success",
      });
    } else if (FLAG === "S") {
      try {
        // const unique = await Job.findOne({ UserID: UserID });
        // if (!unique) {
        //   return res.status(422).json({
        //     StatusCode: 422,
        //     Message: "User doesn't exist",
        //   });
        // }
        let blogdata;

        // Check if Category is "-1" to retrieve all jobs
        if (Category === "-1") {
          blogdata = await Blog.find()
            .sort({ createdAt: -1 })
            .populate("Category")
            .populate("Auther");
        } else if (Category) {
          // Retrieve jobs filtered by Category and populate the Category field
          blogdata = await Blog.find({ Category: Category })
            .sort({ createdAt: -1 })
            .populate("Category")
            .populate("Auther");
        } else {
        }

        res.status(200).json({
          StatusCode: 200,
          Message: "success",
          Count: blogdata.length,
          Values: blogdata.length <= 0 ? null : blogdata,
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
        const showblog = await Blog.find({ _id: BlogID })
          .sort({ createdAt: -1 })
          .populate("Category")
          .populate("Auther");

        res.status(200).json({
          StatusCode: 200,
          Message: "success",
          Count: showblog.length,
          Values: showblog.length <= 0 ? null : showblog,
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

      await Blog.findByIdAndUpdate(BlogID, update, {
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
          Message: "Error updating blog status",
          Error: error.message,
        });
      }
    } else if (FLAG === "D") {
      const deleteBlog = await Blog.findByIdAndDelete({ _id: BlogID });

      if (!deleteBlog) {
        return res.status(404).json({
          StatusCode: 404,
          Message: "Blog not found",
        });
      }

      // Delete the image from Cloudinary
      await cloudinary.uploader.destroy(deleteBlog.Image.public_id);

      try {
        res.status(200).json({
          StatusCode: 200,
          Message: "Success",
        });
      } catch (error) {
        res.status(500).json({
          StatusCode: 500,
          Message: "Error deleting blog",
          Error: error.message,
        });
      }
    } else if (FLAG === "BD") {
      // Perform bulk delete operation in MongoDB
      const deleteResults = await Blog.deleteMany({
        _id: { $in: BulkBlogID },
      });

      // Loop through the deleted user IDs and delete their images from Cloudinary
      const deleteImagePromises = BulkBlogID.map(async (blogid) => {
        const blog = await Blog.findById(blogid);
        if (blog && blog.ComLogo && blog.ComLogo.public_id) {
          // Delete image from Cloudinary
          await cloudinary.uploader.destroy(blog.Image.public_id);
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

// --- get single blog ---
exports.singleBlog = async (req, res) => {
  try {
    const { slug } = req.params;

    const unique = await Blog.findOne({ Slug: slug });
    if (!unique) {
      return res.status(422).json({
        StatusCode: 422,
        Message: "Blog doesn't exist",
      });
    }
    // Retrieve jobs filtered by Category and populate the Category field
    const blogdata = await Blog.find({ Slug: slug })
      .sort({ createdAt: -1 })
      .populate("Category")
      .populate("Auther");

    // Retrieve the current job based on the slug
    const currentBlog = await Blog.findOne({ Slug: slug })
      .populate("Category")
      .populate("Auther");

    if (!currentBlog) {
      return res.status(422).json({
        StatusCode: 422,
        Message: "Blog doesn't exist",
      });
    }

    const currentCategory = currentBlog.Category._id;

    const categoryJob = await Blog.find({
      Category: currentCategory,
    })
      .populate("Category")
      .populate("Auther");

    // Retrieve all jobs of the same category, excluding the current job
    const relatedBlogs = categoryJob.filter(
      (item) => item._id.toString() !== currentBlog._id.toString()
    );

    const transformedData = blogdata.map((job) => ({
      ...job.toObject(),
      RelatedBlogs: relatedBlogs.length <= 0 ? null : relatedBlogs,
    }));

    res.status(200).json({
      StatusCode: 200,
      Message: "success",
      Values: transformedData.length <= 0 ? null : transformedData[0],
    });
  } catch (error) {
    res.status(500).json({
      StatusCode: 500,
      Message: "Internal Server Error",
      Error: error.message,
    });
  }
};

// --- get blog ---
exports.blogList = async (req, res) => {
  try {
    const Category = req.query.Category;

    let blogData;

    // Check if Category is "-1" to retrieve all blogs
    if (Category === "-1") {
      blogData = await Blog.find({ Status: "A" })
        .sort({ createdAt: -1 })
        .populate("Category");
    } else if (Category) {
      // Retrieve blogs filtered by Category and populate the Category field
      blogData = await Blog.find({ Status: "A", Category: Category })
        .sort({ createdAt: -1 })
        .populate("Category");
    } else {
      // Handle the case where no Category is provided
    }

    res.status(200).json({
      StatusCode: 200,
      Message: "success",
      Count: blogData.length,
      Values: blogData.length <= 0 ? null : blogData,
    });
  } catch (error) {
    res.status(500).json({
      StatusCode: 500,
      Message: "Internal Server Error",
      Error: error.message,
    });
  }
};
