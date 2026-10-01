import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  department: { type: String },
  designation: { type: String },
  extensionNumber: { type: String },
  phone: { type: String },
  profilePhoto: { type: String, default: '' },
  joiningDate: { type: Date },
  leavingDate: { type: Date },
  employmentStatus: { type: String, enum: ['Active', 'Former Employee', 'On Leave', 'Suspended', 'Inactive'], default: 'Active' },
  role: { type: String, enum: ['Super Admin', 'IT Admin', 'IT Support', 'Viewer'], default: 'Viewer' },
  isITTeam: { type: Boolean, default: false },
  itStatus: { type: String, enum: ['Available', 'Busy', 'Away', 'Offline'], default: 'Available' },
  reportingManager: { type: String },
  officeLocation: { type: String },
  previousDepartment: { type: String },
  previousDesignation: { type: String },
  previousComputer: { type: String },
  previousExtension: { type: String },
  remarks: { type: String },
}, { timestamps: true });

export default mongoose.model('User', userSchema);
