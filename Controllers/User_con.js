import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { User } from '../Models/User_mod.js';
import generateToken from '../Configs/Token.js';
import { sendEmail, templates } from "../Configs/Email_service.js";


// ==============================
// Helper to generate OTP
// ==============================
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ==============================
// REGISTER USER
// ==============================
export const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, acceptedTerms } = req.body;

    if (!acceptedTerms) {
      return res.status(400).json({ message: 'You must accept the Terms and Privacy Policy' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 30 * 60 * 1000); // 10 minutes

    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password,
      otp: {
        code: otp,
        expiresAt: otpExpiry,
      },
      acceptedTerms,
    });

    // Send OTP Email using your dedicated function
        await sendEmail(
      email,
      "Your OTP Code",
      templates.otp(otp)
    );


    res.status(201).json({
      message: 'Registration successful. Please verify your email with the OTP sent.',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// VERIFY OTP
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'User is already verified' });
    }

    if (
      user.otp.code !== otp ||
      !user.otp.expiresAt ||
      user.otp.expiresAt < new Date()
    ) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.isVerified = true;
    user.otp = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully. You can now log in.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during OTP verification' });
  }
};

// LOGIN USER
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    if (!user.isVerified) {
      return res.status(400).json({ message: 'Please verify your email before logging in' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id, user.role);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login' });
  }
};


// FORGOT PASSWORD
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found with that email' });
    }

    // Create reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    await sendPasswordResetEmail(email, resetUrl);

    res.json({ message: 'Password reset link sent to email' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during password reset request' });
  }
};


// RESET PASSWORD
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: "Token and new password are required" });
    }

    // Hash the token from query
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with matching token and check if token hasn't expired
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired password reset token" });
    }

    // Update password
    user.password = password; // this will be hashed automatically if you have pre('save') in your User model
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ message: "Password has been reset successfully. Please log in with your new password." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error during password reset" });
  }
};

// GET USER PROFILE

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
};


// UPDATE USER PROFILE

export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update allowed fields
    user.firstName = req.body.firstName || user.firstName;
    user.lastName = req.body.lastName || user.lastName;
    user.password = req.body.password || user.password;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
};


// DELETE USER ACCOUNT

export const deleteUserAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.deleteOne();

    res.json({ message: 'Your account has been deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while deleting account' });
  }
};

// GET /api/auth/users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password"); // don’t send passwords
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error fetching users" });
  }
};

// GET /api/auth/users/:id
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error fetching user" });
  }
};

// PUT /api/auth/users/:id
export const updateUserByAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.firstName = req.body.firstName || user.firstName;
    user.lastName = req.body.lastName || user.lastName;
    user.email = req.body.email || user.email;
    user.role = req.body.role || user.role;
    user.isVerified = req.body.isVerified ?? user.isVerified;

    await user.save();

    res.json({ message: "User updated successfully", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error updating user" });
  }
};

// DELETE /api/auth/users/:id
export const deleteUserByAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await user.deleteOne();
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error deleting user" });
  }
};
