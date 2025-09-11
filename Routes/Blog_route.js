import express from "express";
import { protect, adminOnly } from "../Middleware/auth.js";
import {
  createBlog,
  getBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
} from "../Controllers/Blog_Con.js";

const blogRoute = express.Router();

// Public
blogRoute.get("/", getBlogs);
blogRoute.get("/:id", getBlogById);

// Admin
blogRoute.post("/", protect, adminOnly, createBlog);
blogRoute.put("/:id", protect, adminOnly, updateBlog);
blogRoute.delete("/:id", protect, adminOnly, deleteBlog);

export default blogRoute;
