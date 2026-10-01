import 'dotenv/config';
import mongoose from 'mongoose';

import DEFAULT_SERVERS from '../config/defaultServers.js';
import Server from '../models/Server.js';

// Upserts the monitored inventory into MongoDB without touching any other
// collection, so an existing database can pick up the real server list without
// running the full (destructive) seed.
//
//   npm run seed:servers
//
// Rows created by the original demo seed are removed: they pointed at fake
// 192.168.10.x hosts and would show up as permanently red in the monitor.
const LEGACY_PLACEHOLDERS = ['SERVER-01', 'FILE-SERVER-02', 'BACKUP-SERVER', 'DB-SERVER-04', 'APP-SERVER-05'];

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/it_management';

const run = async () => {
  await mongoose.connect(MONGO_URI);
  console.log(`Connected to database "${mongoose.connection.name}"`);

  let created = 0;
  let updated = 0;

  for (const server of DEFAULT_SERVERS) {
    const result = await Server.updateOne(
      { serverName: server.serverName },
      { $set: { ...server, lastChecked: new Date() } },
      { upsert: true }
    );
    if (result.upsertedCount) created += 1;
    else updated += 1;
  }

  const removed = await Server.deleteMany({ serverName: { $in: LEGACY_PLACEHOLDERS } });

  console.log(`Servers created: ${created}`);
  console.log(`Servers updated: ${updated}`);
  console.log(`Legacy placeholder rows removed: ${removed.deletedCount}`);
  console.log(`Total servers now: ${await Server.countDocuments({})}`);

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error('Server sync failed:', error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
