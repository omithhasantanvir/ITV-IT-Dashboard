import bcrypt from 'bcryptjs';
import User from '../models/User.js';

// Every read below strips `password`. A bare User.find() ships the bcrypt hash
// to the browser, where it can be lifted out of devtools and cracked offline.
const SAFE_FIELDS = '-password';

export const listEmployees = async (req, res) => {
  const users = await User.find().select(SAFE_FIELDS).sort({ createdAt: -1 });
  res.json({ success: true, data: users });
};

export const createEmployee = async (req, res) => {
  const body = req.body;
  const exists = await User.findOne({ $or: [{ employeeId: body.employeeId }, { username: body.username }, { email: body.email }] });
  if (exists) return res.status(400).json({ success: false, message: 'Employee already exists' });

  const user = await User.create({
    ...body,
    password: await bcrypt.hash(body.password || 'Welcome@123', 10),
  });

  res.status(201).json({ success: true, data: user });
};

export const getEmployeeById = async (req, res) => {
  const user = await User.findById(req.params.id).select(SAFE_FIELDS);
  if (!user) return res.status(404).json({ success: false, message: 'Employee not found' });
  res.json({ success: true, data: user });
};

export const updateEmployee = async (req, res) => {
  // Guard the update so a client cannot overwrite a password with plaintext.
  // Password changes belong to the seeded hash / an explicit reset flow.
  const { password, ...rest } = req.body || {};
  const user = await User.findByIdAndUpdate(req.params.id, rest, { new: true }).select(SAFE_FIELDS);
  if (!user) return res.status(404).json({ success: false, message: 'Employee not found' });
  res.json({ success: true, data: user });
};

export const deleteEmployee = async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'Employee not found' });
  res.json({ success: true, data: user });
};

export const getITTeam = async (req, res) => {
  const team = await User.find({ isITTeam: true }).select(SAFE_FIELDS).sort({ name: 1 });
  res.json({ success: true, data: team });
};

export const getFormerEmployees = async (req, res) => {
  const former = await User.find({ employmentStatus: 'Former Employee' }).select(SAFE_FIELDS).sort({ leavingDate: -1 });
  res.json({ success: true, data: former });
};
