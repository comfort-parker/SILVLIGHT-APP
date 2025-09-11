import express from 'express';
import { 
  register,
  verifyOTP,
  login,
  forgotPassword,
  resetPassword, getUserProfile, updateUserProfile, deleteUserAccount, getAllUsers, getUserById, updateUserByAdmin, deleteUserByAdmin}  from '../Controllers/User_con.js';

  import { protect, adminOnly } from '../Middleware/auth.js';
const userRoute = express.Router();

// @route   POST /api/auth/register
userRoute.post('/register', register);

// @route   POST /api/auth/verify-otp
userRoute.post('/verify-otp', verifyOTP);

// @route   POST /api/auth/login
userRoute.post('/login', login);

// @route   POST /api/auth/forgot-password
userRoute.post('/forgot-password', forgotPassword);

// @route   PUT /api/auth/reset-password
userRoute.put('/reset-password/:token', resetPassword);

userRoute.get('/profile', protect, getUserProfile);
userRoute.put('/profile', protect, updateUserProfile);
userRoute.delete('/profile', protect, deleteUserAccount);

// ADMIN ROUTES
userRoute.get('/users', protect, adminOnly, getAllUsers);
userRoute.get('/users/:id', protect, adminOnly, getUserById);
userRoute.put('/users/:id', protect, adminOnly, updateUserByAdmin);
userRoute.delete('/users/:id', protect, adminOnly, deleteUserByAdmin);


export default userRoute;
