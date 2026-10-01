import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

import ActivityLog from '../models/ActivityLog.js';
import Computer from '../models/Computer.js';
import Extension from '../models/Extension.js';
import Server from '../models/Server.js';
import SSD from '../models/SSD.js';
import User from '../models/User.js';
import Settings from '../models/Settings.js';
import { PABX_LINES } from '../config/keyPersons.js';
import DEFAULT_SERVERS from '../config/defaultServers.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/it_management';
const RESET = !process.argv.includes('--no-reset');
const DEFAULT_PASSWORD = process.env.SEED_PASSWORD || 'Welcome@123';

const DEPARTMENTS = ['HR', 'Finance', 'Operations', 'Sales', 'Support', 'Logistics'];
const LOCATIONS = ['Floor 1', 'Floor 2', 'Floor 3', 'Server Room'];

// Deterministic pseudo-random generator so repeated seeds produce identical data.
let cursor = 42;
const rand = () => {
  cursor = (cursor * 1103515245 + 12345) % 2147483648;
  return cursor / 2147483648;
};
const pick = (list) => list[Math.floor(rand() * list.length)];
const pad = (n) => String(n).padStart(4, '0');
const slug = (value) => value.toLowerCase().replace(/[^a-z]+/g, '.');

const buildUsers = (hash) => {
  const itMembers = [
    { name: 'Omith Hasan', designation: 'IT Administrator', itStatus: 'Available' },
    { name: 'Rashid Ali', designation: 'IT Administrator', itStatus: 'Busy' },
    { name: 'Sajid Karim', designation: 'IT Support Engineer', itStatus: 'Available' },
    { name: 'Farhan Malik', designation: 'Network Engineer', itStatus: 'Away' },
    { name: 'Daniel George', designation: 'IT Support Officer', itStatus: 'Offline' },
  ];

  const users = itMembers.map((member, index) => ({
    employeeId: `EMP-${pad(index + 1)}`,
    name: member.name,
    username: slug(member.name),
    password: hash,
    email: `${slug(member.name)}@company.local`,
    department: 'Information Technology',
    designation: member.designation,
    extensionNumber: `1${pad(100 + index)}`,
    phone: `+92-300-${pad(1000 + index)}`,
    joiningDate: new Date(2021, index, 15),
    employmentStatus: 'Active',
    role: index === 0 ? 'Super Admin' : 'IT Admin',
    isITTeam: true,
    itStatus: member.itStatus,
    officeLocation: 'Head Office',
  }));

  const firstNames = ['Ayesha', 'Hassan', 'Nadia', 'Bilal', 'Sara', 'Usman', 'Maryam', 'Zain'];
  const lastNames = ['Khan', 'Ahmed', 'Malik', 'Raza', 'Sheikh'];

  for (let i = 0; i < 22; i += 1) {
    const name = `${pick(firstNames)} ${pick(lastNames)}`;
    const employeeId = `EMP-${pad(users.length + 1)}`;
    const isFormer = i >= 19;
    users.push({
      employeeId,
      name,
      username: employeeId.toLowerCase(),
      password: hash,
      email: `${employeeId.toLowerCase()}@company.local`,
      department: pick(DEPARTMENTS),
      designation: pick(['Executive', 'Officer', 'Manager', 'Assistant Manager', 'Clerk']),
      extensionNumber: `2${pad(200 + i)}`,
      joiningDate: new Date(2022 + (i % 3), i % 12, ((i * 3) % 27) + 1),
      employmentStatus: isFormer ? 'Former Employee' : 'Active',
      leavingDate: isFormer ? new Date(2025, i % 12, 10) : undefined,
      role: 'Viewer',
      isITTeam: false,
      officeLocation: 'Head Office',
    });
  }

  return users;
};

// The monitored inventory lives in backend/config/defaultServers.js so the seed,
// the MongoDB asset register and the ping monitor never drift apart.

const run = async () => {
  await mongoose.connect(MONGO_URI);
  console.log(`Connected to database "${mongoose.connection.name}"`);

  const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  if (RESET) {
    console.log('Resetting seeded collections...');
    await Promise.all([
      User.deleteMany({}),
      Computer.deleteMany({}),
      Server.deleteMany({}),
      Extension.deleteMany({}),
      SSD.deleteMany({}),
      ActivityLog.deleteMany({}),
      Settings.deleteMany({}),
    ]);
  }

  await Settings.create({
    companyName: 'IT Management & Asset Control System',
    subtitle: 'Internal IT Operations Dashboard',
    monitoringInterval: '1m',
    allowLANAccess: true,
  });

  const users = await User.create(buildUsers(hash));
  console.log(`Users created: ${users.length}`);

  const itMembers = users.filter((user) => user.isITTeam);

  const servers = await Server.create(DEFAULT_SERVERS.map((server) => ({ ...server, lastChecked: new Date() })));
  console.log(`Servers created: ${servers.length}`);


const computerBrands = ['Dell', 'HP', 'Lenovo'];
const computerModels = ['OptiPlex 7090', 'ProDesk 600 G6', 'ThinkCentre M70'];
const processors = ['i5-11500', 'i7-11700', 'Ryzen 5 5600G'];
const ramSizes = ['8GB', '16GB', '32GB'];
const storages = ['256GB SSD', '512GB SSD', '1TB HDD'];

const buildComputers = (users, assetOffset) =>
  Array.from({ length: 24 }, (_, i) => {
    const status = i < 15 ? 'Assigned' : i < 20 ? 'Available' : i < 22 ? 'Repair' : 'Maintenance';
    const assetId = `PC-DHK-${pad(i + 1 + assetOffset)}`;
    return {
      assetId,
      barcode: assetId,
      computerType: i % 3 === 0 ? 'Laptop' : 'Desktop',
      brand: pick(computerBrands),
      model: pick(computerModels),
      serialNumber: `SN-${pad(1000 + i)}`,
      processor: pick(processors),
      ram: pick(ramSizes),
      storage: pick(storages),
      operatingSystem: 'Windows 11 Pro',
      macAddress: `00:1A:2B:${pad(i).slice(0, 2)}:${pad(i + 20).slice(0, 2)}:CC`,
      ipAddress: `192.168.10.${100 + i}`,
      purchaseDate: new Date(2022 + (i % 3), i % 12, 12),
      warranty: pick(['Active', 'Expired', 'Extended']),
      location: pick(LOCATIONS),
      department: pick(DEPARTMENTS),
      assignedUser: status === 'Assigned' ? users[i + 5]._id : undefined,
      status,
      condition: pick(['Excellent', 'Good', 'Fair']),
    };
  });

  const computers = await Computer.create(buildComputers(users, 0));
  console.log(`Computers created: ${computers.length}`);

  const ssds = await SSD.create(
    Array.from({ length: 10 }, (_, i) => ({
      ssdId: `SSD-${pad(i + 1)}`,
      serialNumber: `SSDSN-${pad(5000 + i)}`,
      brand: pick(['Samsung', 'Kingston', 'Crucial']),
      model: pick(['870 EVO', 'A400', 'MX500']),
      capacity: pick(['256GB', '512GB', '1TB']),
      interface: 'SATA III',
      health: pick(['Good', 'Good', 'Fair']),
      purchaseDate: new Date(2023, i % 12, 8),
      warranty: pick(['Active', 'Expired']),
      location: pick(LOCATIONS),
      assignedComputer: i < 4 ? computers[i]._id : undefined,
      status: i < 4 ? 'Installed' : i < 8 ? 'Available' : 'Spare',
    }))
  );
  console.log(`SSDs created: ${ssds.length}`);

  // Lines come from backend/config/keyPersons.js (the printed ITV PABX plan) so the
  // seed, the MongoDB asset register and the Extensions page agree — same idea as
  // DEFAULT_SERVERS above. The IT desk lines are seeded from the user records.
  const extensionRecords = [
    ...itMembers.map((user) => ({
      extensionNumber: user.extensionNumber,
      employee: user._id,
      holderName: user.name,
      mobile: user.phone,
      department: 'Information Technology',
      location: user.officeLocation,
      status: 'Assigned',
    })),
    ...PABX_LINES.map((line) => ({
      extensionNumber: line.extensionNumber,
      holderName: line.holders.join(' / '),
      mobile: line.mobile || undefined,
      department: line.sections.join(' / '),
      location: 'Head Office',
      deskRoom: line.kind === 'Common' ? 'Shared line' : undefined,
      status: line.kind === 'Common' ? 'Reserved' : 'Assigned',
      remarks: line.holders.length > 1 ? `Shared line held by ${line.holders.join(', ')}` : undefined,
    })),
  ];

  const extensions = await Extension.create(extensionRecords);
  console.log(`Extensions created: ${extensions.length}`);

  const hoursAgo = (hours) => new Date(Date.now() - hours * 3600000);
  await ActivityLog.create([
    { user: 'Omith Hasan', action: 'Added employee EMP-0023', module: 'Employees', ipAddress: '192.168.10.50', timestamp: hoursAgo(1) },
    { user: 'Rashid Ali', action: `Assigned ${computers[0].assetId} to EMP-0006`, module: 'Computers', ipAddress: '192.168.10.51', timestamp: hoursAgo(2) },
    { user: 'Sajid Karim', action: 'Marked BACKUP-SERVER as Offline', module: 'Servers', ipAddress: '192.168.10.52', timestamp: hoursAgo(3) },
    { user: 'Farhan Malik', action: 'Updated warranty on FILE-SERVER-02', module: 'Servers', ipAddress: '192.168.10.53', timestamp: hoursAgo(24) },
    { user: 'Omith Hasan', action: 'Generated user slip US-2026-0045', module: 'Slips', ipAddress: '192.168.10.50', timestamp: hoursAgo(48) },
  ]);
  console.log('ActivityLog entries created: 5');

  console.log('\nSeed complete.');
  console.log(`Login username "omith.hasan" / password "${DEFAULT_PASSWORD}" (Super Admin).`);
  await mongoose.disconnect();
};

run().catch((error) => {
  console.error('Seed failed:', error.message);
  process.exit(1);
});


