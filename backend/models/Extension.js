import mongoose from 'mongoose';

const extensionSchema = new mongoose.Schema({
  extensionNumber: { type: String, required: true, unique: true, index: true },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Directory fields. These mirror the printed "List of key persons (ITV)" sheet:
  // a line (extensionNumber) is held by a person (holderName) who can be reached
  // on mobile when they are away from the desk.
  holderName: { type: String },
  mobile: { type: String },
  department: { type: String },
  location: { type: String },
  deskRoom: { type: String },
  status: { type: String, enum: ['Available', 'Assigned', 'Disabled', 'Reserved'], default: 'Available' },
  remarks: { type: String },
}, { timestamps: true });

export default mongoose.model('Extension', extensionSchema);
