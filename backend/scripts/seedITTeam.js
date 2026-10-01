import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const TEAM = [
  { employeeId: 'ITV-IT-01', name: 'Abu Toha Md. Anowarul Azim', designation: 'IT Administrator' },
  { employeeId: 'ITV-IT-02', name: 'Apu Roy', designation: 'IT Support Engineer' },
  { employeeId: 'ITV-IT-03', name: 'Mohammed Abul Hossain', designation: 'IT Support Engineer' },
  { employeeId: 'ITV-IT-04', name: 'Md. Asaduzzaman', designation: 'Network Engineer' },
  { employeeId: 'ITV-IT-05', name: 'Pronojit Mallick Jit', designation: 'System Engineer' },
  { employeeId: 'ITV-IT-06', name: 'Md. Shofiqui Islam', designation: 'IT Support Engineer' },
  { employeeId: 'ITV-IT-07', name: 'Ashraful Islam', designation: 'IT Support Engineer' },
  { employeeId: 'ITV-IT-08', name: 'Omith Hasan', designation: 'IT Administrator' },
  { employeeId: 'ITV-IT-09', name: 'Nadit Rabab Shah Pranzol', designation: 'IT Support Engineer' },
  { employeeId: 'ITV-IT-10', name: 'Md. Yeamin Islam Sakib', designation: 'IT Support Engineer' },
  { employeeId: 'ITV-IT-11', name: 'Md Refaet Rony', designation: 'IT Support Engineer' },
];

const usernameOf = (name) =>
  name.toLowerCase().replace(/[^a-z\s]/g, '').trim().split(/\s+/).join('.');

const run = async () => {
  const { default: mongoose } = await import('mongoose');
  const { default: dotenv } = await import('dotenv');
  dotenv.config();
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/it_management');
  const password = await bcrypt.hash('Welcome@123', 10);
  let added = 0;
  let skipped = 0;
  for (const member of TEAM) {
    const email = `${usernameOf(member.name)}@independent24.tv`;
    const exists = await User.findOne({
      $or: [{ employeeId: member.employeeId }, { username: usernameOf(member.name) }, { email }],
    });
    if (exists) {
      skipped += 1;
      continue;
    }
    await User.create({
      employeeId: member.employeeId,
      name: member.name,
      username: usernameOf(member.name),
      password,
      email,
      department: 'Information Technology',
      designation: member.designation,
      role: 'IT Support',
      isITTeam: true,
      itStatus: 'Available',
      employmentStatus: 'Active',
    });
    added += 1;
  }
  console.log(`IT_TEAM_SEED added=${added} skipped=${skipped} total=${TEAM.length}`);
  await mongoose.disconnect();
};

run().catch((error) => {
  console.error('IT_TEAM_SEED_FAILED', error?.message || error);
  process.exit(1);
});
