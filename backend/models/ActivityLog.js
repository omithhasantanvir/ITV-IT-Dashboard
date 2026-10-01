import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  user: { type: String },
  action: { type: String },
  module: { type: String },
  recordId: { type: String },
  ipAddress: { type: String },
  oldData: { type: mongoose.Schema.Types.Mixed },
  newData: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model('ActivityLog', activityLogSchema);
