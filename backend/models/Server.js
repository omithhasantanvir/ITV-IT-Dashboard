import mongoose from 'mongoose';

const serverSchema = new mongoose.Schema({
  serverName: { type: String, required: true, unique: true, index: true },
  hostname: { type: String },
  ipAddress: { type: String },
  serverType: { type: String, enum: ['Domain Controller', 'File Server', 'Application Server', 'Database Server', 'Backup Server', 'Web Server', 'Other'] },
  operatingSystem: { type: String },
  location: { type: String },
  cpu: { type: String },
  ram: { type: String },
  diskUsage: { type: String },
  uptime: { type: String },
  lastChecked: { type: Date },
  status: { type: String, enum: ['Online', 'Offline', 'Warning', 'Maintenance', 'Unknown'], default: 'Unknown' },
  purpose: { type: String },
  administrator: { type: String },
  remarks: { type: String },
  monitoringInterval: { type: String, enum: ['30s', '1m', '5m', '10m'], default: '1m' },
  port: { type: Number, default: 80 },
}, { timestamps: true });

export default mongoose.model('Server', serverSchema);
