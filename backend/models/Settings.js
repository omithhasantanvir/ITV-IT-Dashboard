import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  companyName: { type: String, default: 'IT Management & Asset Control System' },
  subtitle: { type: String, default: 'Internal IT Operations Dashboard' },
  monitoringInterval: { type: String, default: '1m' },
  allowLANAccess: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('Settings', settingsSchema);
