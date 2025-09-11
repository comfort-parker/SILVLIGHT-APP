import { Blog } from "../Models/Blog_Mod.js";

// ✅ Create Blog
export const createBlog = async (req, res) => {
  try {
    const { title, content, image } = req.body;

    const blog = await Blog.create({
      title,
      content,
      image, // Cloudinary URL sent from frontend
      author: req.user._id,
    });

    res.status(201).json({ message: "Blog created successfully", blog });
  } catch (error) {
    console.error("Create Blog Error:", error.message);
    res.status(500).json({ message: "Server error creating blog" });
  }
};

// ✅ Get All Blogs
export const getBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().populate("author", "firstName lastName email");
    res.json(blogs);
  } catch (error) {
    console.error("Get Blogs Error:", error.message);
    res.status(500).json({ message: "Server error fetching blogs" });
  }
};

// ✅ Get Blog by ID
export const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate("author", "firstName lastName email");
    if (!blog) return res.status(404).json({ message: "Blog not found" });
    res.json(blog);
  } catch (error) {
    console.error("Get Blog Error:", error.message);
    res.status(500).json({ message: "Server error fetching blog" });
  }
};

// ✅ Update Blog
export const updateBlog = async (req, res) => {
  try {
    const { title, content, published, image } = req.body;
    const blog = await Blog.findById(req.params.id);

    if (!blog) return res.status(404).json({ message: "Blog not found" });

    blog.title = title || blog.title;
    blog.content = content || blog.content;
    blog.published = published !== undefined ? published : blog.published;
    if (image) blog.image = image;

    await blog.save();
    res.json({ message: "Blog updated successfully", blog });
  } catch (error) {
    console.error("Update Blog Error:", error.message);
    res.status(500).json({ message: "Server error updating blog" });
  }
};

// ✅ Delete Blog
export const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    await blog.deleteOne();
    res.json({ message: "Blog deleted successfully" });
  } catch (error) {
    console.error("Delete Blog Error:", error.message);
    res.status(500).json({ message: "Server error deleting blog" });
  }
};
