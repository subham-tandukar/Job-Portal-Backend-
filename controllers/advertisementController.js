const Advertisement = require("../models/advertisementSchema");
const fs = require("fs");
const cloudinary = require("../cloudinary");

// ---- add Advertisement ----
exports.advertisement = async (req, res) => {
  const {
    FLAG,
    AdvertisementID,
    Position,
    Link,
    Image,
    Status,
    BulkAdvertisementID,
  } = req.body;

  try {
    if (FLAG === "I") {
      if (!Position || !Link || !Image) {
        return res.status(422).json({
          Message: "Please fill the required fields",
        });
      }

      let existingAd = await Advertisement.findOne({ Position });
      if (existingAd) {
        return res.status(422).json({
          StatusCode: 422,
          Message: "This advertisement placement already exists",
        });
      }

      const advertisementImg = await cloudinary.uploader.upload(Image, {
        folder: "advertisement",
      });

      const adData = new Advertisement({
        Position,
        Status,
        Link,
        Image: {
          public_id: advertisementImg.public_id,
          url: advertisementImg.secure_url,
        },
      });
      await adData.save();

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
          Message: "Error creating advertisement",
          Error: error.message,
        });
      }
    } else if (FLAG === "U") {
      if (!Position || !Link || !Image) {
        return res.status(422).json({
          Message: "Please fill the required fields",
        });
      }
      let urlRegex =
        /^(?:https?|ftp):\/\/[\w-]+(?:\.[\w-]+)+[\w.,@?^=%&amp;:/~+#-]*$/;

      // Check if the URL matches the regex pattern
      const changeImage = urlRegex.test(Image);

      let adImg;

      const updateAd = await Advertisement.findById({ _id: AdvertisementID });
      const oldImg = updateAd.Image.url;

      if (oldImg !== Image) {
        await cloudinary.uploader.destroy(updateAd.Image.public_id);

        adImg = await cloudinary.uploader.upload(Image, {
          folder: "advertisement",
        });
      }

      let update;

      if (oldImg !== Image) {
        update = {
          Position,
          Status,
          Link,
          Image: {
            public_id: adImg.public_id,
            url: adImg.secure_url,
          },
        };
      } else {
        update = {
          Position,
          Status,
          Link,
        };
      }

      await Advertisement.findByIdAndUpdate(AdvertisementID, update, {
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
          Message: "Error updating advertisement",
          Error: error.message,
        });
      }
    } else if (FLAG === "S") {
      try {
        const addata = await Advertisement.find().sort({ createdAt: -1 });;

        res.status(200).json({
          StatusCode: 200,
          Message: "success",
          Count: addata.length,
          Values: addata.length <= 0 ? null : addata,
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
        const showad = await Advertisement.find({
          _id: AdvertisementID,
        }).sort({ createdAt: -1 });

        res.status(200).json({
          StatusCode: 200,
          Message: "success",
          Count: showad.length,
          Values: showad.length <= 0 ? null : showad,
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

      await Advertisement.findByIdAndUpdate(AdvertisementID, update, {
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
          Message: "Error updating Advertisement status",
          Error: error.message,
        });
      }
    } else if (FLAG === "D") {
      const deleteAd = await Advertisement.findByIdAndDelete({
        _id: AdvertisementID,
      });

      if (!deleteAd) {
        return res.status(404).json({
          StatusCode: 404,
          Message: "Advertisement not found",
        });
      }

      // Delete the image from Cloudinary
      await cloudinary.uploader.destroy(deleteAd.Image.public_id);

      try {
        res.status(200).json({
          StatusCode: 200,
          Message: "Success",
        });
      } catch (error) {
        res.status(500).json({
          StatusCode: 500,
          Message: "Error deleting Advertisement",
          Error: error.message,
        });
      }
    } else if (FLAG === "BD") {
      // Perform bulk delete operation in MongoDB
      const deleteResults = await Advertisement.deleteMany({
        _id: { $in: BulkAdvertisementID },
      });

      // Loop through the deleted user IDs and delete their images from Cloudinary
      const deleteImagePromises = BulkAdvertisementID.map(async (adid) => {
        const ad = await Advertisement.findById(adid);
        if (ad && ad.Image && ad.Image.public_id) {
          // Delete image from Cloudinary
          await cloudinary.uploader.destroy(ad.Image.public_id);
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

// --- get advertisement ---
exports.advertisementList = async (req, res) => {
  try {
    const adData = await Advertisement.find({ Status: "A" }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      StatusCode: 200,
      Message: "success",
      Count: adData.length,
      Values: adData.length <= 0 ? null : adData,
    });
  } catch (error) {
    res.status(500).json({
      StatusCode: 500,
      Message: "Internal Server Error",
      Error: error.message,
    });
  }
};
