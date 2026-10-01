import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/it_management';

// IT Team roster from the approved list (photo column uses avatar initials in UI).
const IT_TEAM = [
  { name: 'Abu Toha Md. Anowarul Azim', designation: 'Head of Broadcast Technology and IT', phone: '01730701303', email: 'anowarul.azim@independent24.tv', role: 'IT Admin' },
  { name: 'Apu Roy', designation: 'Manager', phone: '01730701382', email: 'apu.roy@independent24.tv', role: 'IT Admin' },
  { name: 'Mohammed Abul Hossain', designation: 'Deputy Manager', phone: '01755515292', email: 'mohammed.hossain@independent24.tv', role: 'IT Admin' },
  { name: 'Md. Asaduzzaman', designation: 'Assistant Manager', phone: '01755515294', email: 'asad.zaman@independent24.tv', role: 'IT Admin' },
  { name: 'Pronojit Mallick Jit', designation: 'Broadcast Engineer', phone: '01730343798', email: 'pronojit.mallick@independent24.tv', role: 'IT Support' },
  { name: 'Md. Shofiqui Islam', designation: 'Broadcast Engineer', phone: '01755533573', email: 'shofiqui.islam@independent24.tv', role: 'IT Support' },
  { name: 'Ashraful Islam', designation: 'Junior Broadcast Engineer', phone: '01730701308', email: 'ashraful.islam@independent24.tv', role: 'IT Support' },
  { name: 'Omith Hasan', designation: 'Junior Broadcast Engineer', phone: '01713288652', email: 'omith.hasan@independent24.tv', role: 'IT Support' },
  { name: 'Nadit Rabab Shah Pranzol', designation: 'Junior Broadcast Engineer', phone: '01755533712', email: 'nadit.rabab@independent24.tv', role: 'IT Support' },
  { name: 'Md. Yeamin Islam Sakib', designation: 'Junior Broadcast Engineer', phone: '01555533611', email: 'yeamin.islam@independent24.tv', role: 'IT Support' },
  { name: 'Md Refeat Rony', designation: 'Broadcast Engineer', phone: '', email: 'refaet.rony@independent24.tv', role: 'IT Support' },
];

const slug = (value) => value.toLowerCase().replace(/[^a-z]+/g, '.').replace(/^\.|\.$/g, '');

const run = async () => {
  await mongoose.connect(MONGO_URI);
  const hash = await bcrypt.hash(process.env.SEED_PASSWORD || 'Welcome@123', 10);
  let created = 0;
  let updated = 0;

  for (let i = 0; i < IT_TEAM.length; i += 1) {
    const member = IT_TEAM[i];
    // Match existing records by email first, then by name (seed used @company.local mails).
    let user = await User.findOne({ email: member.email });
    if (!user) user = await User.findOne({ name: member.name });

    if (user) {
      user.name = member.name;
      user.email = member.email;
      user.designation = member.designation;
      user.phone = member.phone || '';
      user.department = 'Information Technology';
      user.isITTeam = true;
      user.employmentStatus = 'Active';
      user.itStatus = user.itStatus || 'Available';
      user.role = member.role;
      user.officeLocation = user.officeLocation || 'Head Office';
      await user.save();
      updated += 1;
      console.log(`updated: ${member.name}`);
    } else {
      const baseUsername = slug(member.email.split('@')[0]);
      let username = baseUsername;
      let suffix = 1;
      // eslint-disable-next-line no-await-in-loop
      while (await User.findOne({ username })) {
        suffix += 1;
        username = `${baseUsername}${suffix}`;
      }
      const employeeId = `ITV-IT-${String(i + 1).padStart(2, '0')}`;
      // eslint-disable-next-line no-await-in-loop
      await User.create({
        employeeId,
        name: member.name,
        username,
        password: hash,
        email: member.email,
        department: 'Information Technology',
        designation: member.designation,
        phone: member.phone || '',
        employmentStatus: 'Active',
        role: member.role,
        isITTeam: true,
        itStatus: 'Available',
        officeLocation: 'Head Office',
      });
      created += 1;
      console.log(`created: ${member.name} (${employeeId}/${username})`);
    }
  }

  const total = await User.countDocuments({ isITTeam: true });
  console.log(`\nDone. created=${created} updated=${updated} isITTeam total=${total}`);
  await mongoose.disconnect();
};

run().catch((error) => {
  console.error('IT team upsert failed:', error.message);
  process.exit(1);
});
