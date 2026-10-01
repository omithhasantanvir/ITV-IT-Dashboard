import 'dotenv/config';
import mongoose from 'mongoose';

import { PABX_LINES } from '../config/keyPersons.js';
import Extension from '../models/Extension.js';

// Upserts the office PABX plan (backend/config/keyPersons.js) into the `extensions`
// collection without touching any other collection, so an existing database can pick
// up the real key-person directory without running the full (destructive) seed.
//
//   npm run seed:extensions
//
// Rows written by the original demo seed are removed: they were three-digit
// placeholders (101–112) with no holder and would show up as unassigned lines.
const LEGACY_PLACEHOLDER_PATTERN = /^\d{3}$/;

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/it_management';

const run = async () => {
  await mongoose.connect(MONGO_URI);
  console.log(`Connected to database "${mongoose.connection.name}"`);

  let created = 0;
  let updated = 0;

  for (const line of PABX_LINES) {
    const result = await Extension.updateOne(
      { extensionNumber: line.extensionNumber },
      {
        $set: {
          holderName: line.holders.join(' / '),
          mobile: line.mobile || undefined,
          department: line.sections.join(' / '),
          deskRoom: line.kind === 'Common' ? 'Shared line' : undefined,
          status: line.kind === 'Common' ? 'Reserved' : 'Assigned',
          remarks: line.holders.length > 1 ? `Shared line held by ${line.holders.join(', ')}` : undefined,
        },
      },
      { upsert: true }
    );
    if (result.upsertedCount) created += 1;
    else updated += 1;
  }

  const removed = await Extension.deleteMany({
    extensionNumber: LEGACY_PLACEHOLDER_PATTERN,
    holderName: { $exists: false },
  });

  console.log(`Extensions created: ${created}`);
  console.log(`Extensions updated: ${updated}`);
  console.log(`Legacy placeholder rows removed: ${removed.deletedCount}`);
  console.log(`Total extensions now: ${await Extension.countDocuments({})}`);

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error('Extension sync failed:', error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
