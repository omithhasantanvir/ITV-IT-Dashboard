import mongoose from 'mongoose';

const userSlipSchema = new mongoose.Schema({
  slipNumber: { type: String, required: true, unique: true },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  department: { type: String },
  designation: { type: String },
  extensionNumber: { type: String },
  joiningDate: { type: Date },
  computer: { type: mongoose.Schema.Types.ObjectId, ref: 'Computer' },
  accessories: [{ type: String }],
  issuedBy: { type: String },
  receivedBy: { type: String },
  issueDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['Issued', 'Printed', 'Downloaded'], default: 'Issued' },
}, { timestamps: true });

export default mongoose.model('UserSlip', userSlipSchema);
