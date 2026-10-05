import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const DEFAULT_PASSWORD = process.env.SEED_PASSWORD || 'Welcome@123';

// One-off repair: a Super Admin row stored a base64 blob in `password` instead
// of a bcrypt hash, so bcrypt.compare() could never succeed for that account.
const run = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/it_management');

  const username = process.argv[2] || 'omith.hasan';
  const user = await mongoose.connection.collection('users').findOne({ username });
  if (!user) {
    console.log(`No user found with username "${username}".`);
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`Before: role=${user.role} hashPrefix=${String(user.password).slice(0, 7)}`);

  const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  await mongoose.connection.collection('users').updateOne({ username }, { $set: { password: hash } });

  // Verify the new hash really validates, rather than assuming it does.
  const check = await mongoose.connection.collection('users').findOne({ username });
  const ok = await bcrypt.compare(DEFAULT_PASSWORD, check.password);

  console.log(`After:  hashPrefix=${check.password.slice(0, 7)}`);
  console.log(`bcrypt.compare("${DEFAULT_PASSWORD}") = ${ok}`);
  console.log(`Login username "${username}" / password "${DEFAULT_PASSWORD}" (${check.role}).`);

  await mongoose.disconnect();
};

run().catch((error) => {
  console.error('Password reset failed:', error.message);
  process.exit(1);
});
