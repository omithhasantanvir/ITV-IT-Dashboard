import bcrypt from 'bcryptjs';
import User from '../models/User.js';

export const listEmployees = async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
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
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'Employee not found' });
  res.json({ success: true, data: user });
};

export const updateEmployee = async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!user) return res.status(404).json({ success: false, message: 'Employee not found' });
  res.json({ success: true, data: user });
};

export const deleteEmployee = async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'Employee not found' });
  res.json({ success: true, data: user });
};

export const getITTeam = async (req, res) => {
  const team = await User.find({ isITTeam: true }).sort({ name: 1 });
  res.json({ success: true, data: team });
};

export const getFormerEmployees = async (req, res) => {
  const former = await User.find({ employmentStatus: 'Former Employee' }).sort({ leavingDate: -1 });
  res.json({ success: true, data: former });
};
