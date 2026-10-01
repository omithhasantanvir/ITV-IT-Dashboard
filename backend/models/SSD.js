import mongoose from 'mongoose';

const ssdSchema = new mongoose.Schema({
  ssdId: { type: String, required: true, unique: true, index: true },
  serialNumber: { type: String, required: true, unique: true },
  brand: { type: String },
  model: { type: String },
  capacity: { type: String },
  interface: { type: String },
  health: { type: String },
  purchaseDate: { type: Date },
  warranty: { type: String },
  location: { type: String },
  assignedComputer: { type: mongoose.Schema.Types.ObjectId, ref: 'Computer' },
  status: { type: String, enum: ['Available', 'Installed', 'Spare', 'Faulty', 'Warranty', 'Disposed'], default: 'Available' },
  remarks: { type: String },
}, { timestamps: true });

export default mongoose.model('SSD', ssdSchema);
