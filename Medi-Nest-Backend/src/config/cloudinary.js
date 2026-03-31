const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dufvmaweq",
  api_key: process.env.CLOUDINARY_API_KEY || "411968967239147",
  api_secret: process.env.CLOUDINARY_API_SECRET || "mI51BWNtJbFoT-EgiBTXNL4RcUU",
});

module.exports = cloudinary;