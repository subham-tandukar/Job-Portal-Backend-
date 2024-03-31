const User = require("../models/adminUserSchema");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cloudinary = require("../cloudinary");

// --- user ---
exports.user = async (req, res) => {
  const { Name, Email, Password, FLAG, Profile, UserID, BulkUserID } = req.body;
  try {
    if (FLAG === "I") {
      if (!Name || !Email || !Password) {
        return res.status(422).json({
          Message: "Please fill the required fields",
        });
      }
      let user = await User.findOne({ Email: Email });

      if (user) {
        return res.status(422).json({
          Message: "This email already exist",
        });
      }

      if (!Profile) {
        Profile =
          "https://res.cloudinary.com/de3eu0mvq/image/upload/v1678434591/profile/taztcmb8jl9pxe1yqzd3.png";
      }

      const profileImg = await cloudinary.uploader.upload(Profile, {
        folder: "Admin Users",
      });

      const salt = await bcrypt.genSalt(10);
      const secPass = await bcrypt.hash(Password, salt);

      user = await User.create({
        Profile: {
          public_id: profileImg.public_id,
          url: profileImg.secure_url,
        },
        Name: Name,
        Email: Email,
        Password: secPass,
      });

      const data = {
        user: {
          id: user.id,
          name: user.Name,
          email: user.Email,
        },
      };

      const authToken = jwt.sign(data, process.env.JWT_SECRET);

      try {
        res.status(201).json({
          StatusCode: 200,
          Message: "Success",
          authToken,
        });
      } catch (error) {
        res.status(500).json({
          StatusCode: 500,
          Message: "Error Creating User",
          Error: error.message,
        });
      }
    } else if (FLAG === "S") {
      const userdata = await User.find();
      try {
        res.status(200).json({
          StatusCode: 200,
          Message: "Success",
          Values: userdata.length <= 0 ? null : userdata,
        });
      } catch (error) {
        res.status(500).json({
          StatusCode: 500,
          Message: "Error fetching users",
          Error: error.message,
        });
      }
    } else if (FLAG === "V") {
      const showuser = await User.findById({ _id: UserID });
      if (showuser) {
        res.status(200).json({
          StatusCode: 200,
          Message: "Success",
          Values: [showuser],
        });
      } else {
        res.status(404).json({
          StatusCode: 404,
          Message: "User not found",
        });
      }
    } else if (FLAG === "U") {
      if (!Name || !Profile) {
        return res.status(422).json({
          Message: "Please fill the required fields",
        });
      }
      let urlRegex =
        /^(?:https?|ftp):\/\/[\w-]+(?:\.[\w-]+)+[\w.,@?^=%&amp;:/~+#-]*$/;

      // Check if the URL matches the regex pattern
      const changeImage = urlRegex.test(Profile);

      let userImage;

      if (!changeImage) {
        const updateUser = await User.findById({ _id: UserID });

        await cloudinary.uploader.destroy(updateUser.Profile.public_id);

        userImage = await cloudinary.uploader.upload(Profile, {
          folder: "Admin Users",
        });
      }

      let update;

      if (changeImage === false) {
        update = {
          Name,
          Profile: {
            public_id: userImage.public_id,
            url: userImage.secure_url,
          },
        };
      } else {
        update = {
          Name,
        };
      }

      await User.findByIdAndUpdate(UserID, update, {
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
          Message: "Error updating users",
          Error: error.message,
        });
      }
    } else if (FLAG === "D") {
      const deleteUser = await User.findByIdAndDelete({ _id: UserID });

      if (!deleteUser) {
        return res.status(404).json({
          StatusCode: 404,
          Message: "User not found",
        });
      }

      // Delete the image from Cloudinary
      await cloudinary.uploader.destroy(deleteUser.Profile.public_id);

      try {
        res.status(200).json({
          StatusCode: 200,
          Message: "Success",
        });
      } catch (error) {
        res.status(500).json({
          StatusCode: 500,
          Message: "Error deleting user",
          Error: error.message,
        });
      }
    } else if (FLAG === "BD") {
      // Perform bulk delete operation in MongoDB
      const deleteResults = await User.deleteMany({
        _id: { $in: BulkUserID },
      });

      // Loop through the deleted user IDs and delete their images from Cloudinary
      const deleteImagePromises = BulkUserID.map(async (userId) => {
        const user = await User.findById(userId);
        if (user && user.Profile && user.Profile.public_id) {
          // Delete image from Cloudinary
          await cloudinary.uploader.destroy(user.Profile.public_id);
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

// --- get user ---
exports.getUser = async (req, res) => {
  try {
    const last = req.query.last;
    const isVerified = req.query.isVerified;
    const sortby = req.query.sortby;

    const searchQuery = req.query.search || ""; // Extract the search query parameter from the request, default to an empty string if not provided

    // Constructing the query to search for users by name and apply pagination
    const query = {
      Name: { $regex: searchQuery, $options: "i" }, // Case-insensitive regex search for the provided name
    };

    let sortQuery = { createdAt: -1 }; // Default sorting by createdAt date

    if (sortby === "name") {
      sortQuery = { Name: 1 }; // Sorting by name in ascending order
      // query.collation = { locale: "en", caseLevel: false };
    } else if (sortby === "login") {
      sortQuery = { LastLoggedIn: -1 }; // Sorting by lastLoggedIn date in descending order (recently logged-in users first)
      query.LastLoggedIn = { $exists: true }; // Filter out users where lastLoggedIn exists
    }
    // Check if the 'last' parameter is true and reverse the sorting order if necessary
    if (last === "true" && sortQuery) {
      for (let key in sortQuery) {
        sortQuery[key] *= -1; // Reverse the sorting order
      }
    } else if (last === "true") {
      // If sortQuery is not set, it means no valid sortby parameter was provided, so default to sorting by createdAt
      sortQuery = { createdAt: -1 }; // Sorting by createdAt date in descending order (recently created users first)
    }

    // Adding verification status filtering to the query
    if (isVerified === "-1") {
      // No filter by verification status
    } else if (isVerified === "Y") {
      query.Status = "Verified";
    } else if (isVerified === "N") {
      query.Status = "Unverified";
    }
    // Retrieve users based on the constructed query
    const userdata = await User.find(query)
      .collation({ locale: "en", caseLevel: false })
      .sort(sortQuery);

    // Count documents based on the same query to get accurate total count
    const totalDocuments = await User.countDocuments(query);

    res.status(200).json({
      StatusCode: 200,
      Message: "success",
      Values: userdata.length <= 0 ? null : userdata,
    });
  } catch (error) {
    res.status(500).json({
      StatusCode: 500,
      Message: "Internal Server Error",
      Error: error.message,
    });
  }
};
