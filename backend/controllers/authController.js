import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const signToken = (user) => jwt.sign({ id: user._id, role: user.role, employeeId: user.employeeId }, process.env.JWT_SECRET || 'change_this_secret', { expiresIn: '8h' });

// A real bcrypt hash of a value nobody will ever submit. Used only to keep the
// "unknown username" path as slow as the "wrong password" path.
const DUMMY_HASH = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

export const loginUser = async (req, res) => {
  const username = typeof req.body?.username === 'string' ? req.body.username.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }

  // Compare a dummy hash when the account does not exist so a wrong username
  // and a wrong password take the same time — otherwise response latency
  // reveals which usernames are real.
  const user = await User.findOne({ username });
  const hash = user?.password || DUMMY_HASH;
  const valid = await bcrypt.compare(password, hash);

  // One message for both failure modes: never reveal which half was wrong.
  if (!user || !valid) return res.status(401).json({ success: false, message: 'Invalid credentials' });

  if (user.employmentStatus && user.employmentStatus !== 'Active') {
    return res.status(403).json({ success: false, message: `Account is ${user.employmentStatus.toLowerCase()}. Contact the IT desk.` });
  }

  res.json({
    success: true,
    token: signToken(user),
    user: {
      id: user._id,
      employeeId: user.employeeId,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      department: user.department,
      designation: user.designation,
      profilePhoto: user.profilePhoto,
    },
  });
};

export const getMe = async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, data: user });
};
