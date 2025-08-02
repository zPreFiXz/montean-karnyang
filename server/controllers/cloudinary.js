const cloudinary = require("cloudinary").v2;

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.createImage = async (req, res, next) => {
  try {
    const { image } = req.body;
    const result = await cloudinary.uploader.upload(image, {
      public_id: `${Date.now()}`,
      resource_type: "auto",
      folder: "montean-karnyang",
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.deleteImage = async (req, res, next) => {
  try {
    const { public_id } = req.body;
    console.log(public_id);
    await cloudinary.uploader.destroy(public_id, () => {
      res.json({ message: "Image deleted successfully" });
    });
  } catch (error) {
    next(error);
  }
};
