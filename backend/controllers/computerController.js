import Computer from '../models/Computer.js';

export const listComputers = async (req, res) => {
  const computers = await Computer.find().sort({ createdAt: -1 });
  res.json({ success: true, data: computers });
};

export const createComputer = async (req, res) => {
  const payload = req.body;
  const assetId = payload.assetId || `PC-DHK-${Date.now().toString().slice(-4)}`;
  const computer = await Computer.create({ ...payload, assetId, barcode: payload.barcode || assetId });
  res.status(201).json({ success: true, data: computer });
};

export const getComputerById = async (req, res) => {
  const computer = await Computer.findById(req.params.id);
  if (!computer) return res.status(404).json({ success: false, message: 'Computer not found' });
  res.json({ success: true, data: computer });
};

export const updateComputer = async (req, res) => {
  const computer = await Computer.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!computer) return res.status(404).json({ success: false, message: 'Computer not found' });
  res.json({ success: true, data: computer });
};

export const deleteComputer = async (req, res) => {
  const computer = await Computer.findByIdAndDelete(req.params.id);
  if (!computer) return res.status(404).json({ success: false, message: 'Computer not found' });
  res.json({ success: true, data: computer });
};
