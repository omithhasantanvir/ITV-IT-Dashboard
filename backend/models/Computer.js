import mongoose from 'mongoose';

const computerSchema = new mongoose.Schema({
  assetId: { type: String, required: true, unique: true, index: true },
  barcode: { type: String, unique: true },
  computerType: { type: String, default: 'Desktop' },
  brand: { type: String },
  model: { type: String },
  serialNumber: { type: String, unique: true },
  processor: { type: String },
  ram: { type: String },
  storage: { type: String },
  ssd: { type: String },
  monitor: { type: String },
  operatingSystem: { type: String },
  macAddress: { type: String },
  ipAddress: { type: String },
  purchaseDate: { type: Date },
  warranty: { type: String },
  location: { type: String },
  department: { type: String },
  assignedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['Available', 'Assigned', 'Repair', 'Maintenance', 'Retired', 'Lost', 'Disposed'], default: 'Available' },
  condition: { type: String, enum: ['Excellent', 'Good', 'Fair', 'Poor'], default: 'Good' },
  remarks: { type: String },
}, { timestamps: true });

export default mongoose.model('Computer', computerSchema);
