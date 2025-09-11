import express from "express";
import { 
  createNotification, 
  getUserNotifications, 
  markAsRead, 
  deleteNotification 
} from "../Controllers/Note_Con.js";    
import { protect } from "../Middleware/auth.js";

const noteRoute = express.Router();

// Create (admin/system can trigger)
noteRoute.post("/", protect, createNotification);

// Get all for user
noteRoute.get("/", protect, getUserNotifications);

// Mark as read
noteRoute.put("/:id/read", protect, markAsRead);

// Delete
noteRoute.delete("/:id", protect, deleteNotification);

export default noteRoute;
