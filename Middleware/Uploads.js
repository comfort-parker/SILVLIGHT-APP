import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../Configs/Cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    return {
      folder: "Silvlight_Products",   // ✅ your chosen folder in Cloudinary
      allowed_formats: ["jpg", "jpeg", "png"], // ✅ only allow images
      transformation: [{ width: 500, height: 500, crop: "limit" }],
      public_id: file.originalname.split(".")[0], // ✅ use file name as public_id (optional)
    };
  },
});

// ✅ export multer middleware
export const upload = multer({ storage });
