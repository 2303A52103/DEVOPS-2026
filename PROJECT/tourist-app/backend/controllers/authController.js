const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const sendTokenResponse = (user, statusCode, res, message = '') => {
  const token = signToken(user._id);
  res.status(statusCode).json({
    success: true, message, token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
  });
};

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Please provide name, email and password' });
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ success: false, message: 'An account with this email already exists' });
    const user = await User.create({ name, email, password });
    sendTokenResponse(user, 201, res, 'Account created successfully! Welcome 🌍');
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    sendTokenResponse(user, 200, res, `Welcome back, ${user.name}! ✈️`);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ success: true, user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, createdAt: user.createdAt } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/auth/update-profile
const updateProfile = async (req, res) => {
  try {
    const { name, email, avatar } = req.body;
    const updates = {};
    if (name)   updates.name   = name.trim();
    if (email)  updates.email  = email.trim().toLowerCase();
    if (avatar !== undefined) updates.avatar = avatar;

    // Check email uniqueness if changed
    if (email) {
      const existing = await User.findOne({ email: email.trim().toLowerCase(), _id: { $ne: req.user.id } });
      if (existing)
        return res.status(409).json({ success: false, message: 'This email is already in use' });
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true });
    res.json({ success: true, message: 'Profile updated successfully!', user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar } });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// PUT /api/auth/change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ success: false, message: 'Please provide current and new password' });
    if (newPassword.length < 6)
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });

    const user = await User.findById(req.user.id).select('+password');
    if (!(await user.comparePassword(currentPassword)))
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// POST /api/auth/logout
const logout = (req, res) => {
  res.json({ success: true, message: 'Logged out successfully. Safe travels! 👋' });
};

module.exports = { register, login, getMe, updateProfile, changePassword, logout };
