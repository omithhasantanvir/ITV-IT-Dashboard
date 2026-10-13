import { PrismaClient, Role, ITStatus, ComputerStatus, ComputerCondition, ExtensionStatus, ServerStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Prisma database seed...');

  const passwordHash = await bcrypt.hash('Welcome@123', 10);

  // Default Settings
  await prisma.settings.upsert({
    where: { id: 'default-settings' },
    update: {},
    create: {
      id: 'default-settings',
      companyName: 'IT Management & Asset Control System',
      subtitle: 'Internal IT Operations Dashboard v2',
      monitoringInterval: '1m',
      allowLANAccess: true,
    },
  });

  // IT Team Members
  const itMembers = [
    {
      employeeId: 'EMP-0001',
      name: 'Omith Hasan',
      username: 'omith.hasan',
      email: 'omith.hasan@company.local',
      department: 'Information Technology',
      designation: 'Lead IT Systems Administrator',
      extensionNumber: '1101',
      phone: '+880-1700-000001',
      role: Role.SUPER_ADMIN,
      isITTeam: true,
      itStatus: ITStatus.AVAILABLE,
      officeLocation: 'HQ Floor 4',
    },
    {
      employeeId: 'EMP-0002',
      name: 'Rashid Ali',
      username: 'rashid.ali',
      email: 'rashid.ali@company.local',
      department: 'Information Technology',
      designation: 'Senior Network Engineer',
      extensionNumber: '1102',
      phone: '+880-1700-000002',
      role: Role.IT_ADMIN,
      isITTeam: true,
      itStatus: ITStatus.BUSY,
      officeLocation: 'HQ Server Room',
    },
    {
      employeeId: 'EMP-0003',
      name: 'Sajid Karim',
      username: 'sajid.karim',
      email: 'sajid.karim@company.local',
      department: 'Information Technology',
      designation: 'IT Support Engineer',
      extensionNumber: '1103',
      phone: '+880-1700-000003',
      role: Role.IT_SUPPORT,
      isITTeam: true,
      itStatus: ITStatus.AVAILABLE,
      officeLocation: 'HQ Helpdesk',
    },
  ];

  for (const m of itMembers) {
    await prisma.user.upsert({
      where: { employeeId: m.employeeId },
      update: {},
      create: {
        ...m,
        password: passwordHash,
      },
    });
  }

  // Sample General Staff
  const staff = [
    {
      employeeId: 'EMP-0101',
      name: 'Ayesha Rahman',
      username: 'ayesha.rahman',
      email: 'ayesha.rahman@company.local',
      department: 'Finance',
      designation: 'Finance Manager',
      extensionNumber: '1201',
      phone: '+880-1800-111001',
      role: Role.VIEWER,
      isITTeam: false,
      officeLocation: 'HQ Floor 2',
    },
    {
      employeeId: 'EMP-0102',
      name: 'Kamal Hossain',
      username: 'kamal.hossain',
      email: 'kamal.hossain@company.local',
      department: 'Human Resources',
      designation: 'HR Executive',
      extensionNumber: '1202',
      phone: '+880-1800-111002',
      role: Role.VIEWER,
      isITTeam: false,
      officeLocation: 'HQ Floor 3',
    },
  ];

  for (const s of staff) {
    await prisma.user.upsert({
      where: { employeeId: s.employeeId },
      update: {},
      create: {
        ...s,
        password: passwordHash,
      },
    });
  }

  // Sample Computers
  const computers = [
    {
      assetId: 'COMP-001',
      barcode: 'BC-COMP-001',
      brand: 'Dell',
      model: 'OptiPlex 7090',
      serialNumber: 'SN-DELL-7090-01',
      processor: 'Intel Core i7-11700',
      ram: '16 GB DDR4',
      storage: '512 GB NVMe SSD',
      monitor: 'Dell 24" P2419H',
      operatingSystem: 'Windows 11 Pro',
      location: 'HQ Floor 4',
      department: 'Information Technology',
      status: ComputerStatus.AVAILABLE,
      condition: ComputerCondition.EXCELLENT,
    },
    {
      assetId: 'COMP-002',
      barcode: 'BC-COMP-002',
      brand: 'HP',
      model: 'EliteDesk 800 G6',
      serialNumber: 'SN-HP-800G6-02',
      processor: 'Intel Core i5-10500',
      ram: '16 GB DDR4',
      storage: '256 GB SSD + 1TB HDD',
      monitor: 'HP 22" Full HD',
      operatingSystem: 'Windows 10 Pro',
      location: 'HQ Floor 2',
      department: 'Finance',
      status: ComputerStatus.AVAILABLE,
      condition: ComputerCondition.GOOD,
    },
    {
      assetId: 'COMP-003',
      barcode: 'BC-COMP-003',
      brand: 'Lenovo',
      model: 'ThinkCentre M70q',
      serialNumber: 'SN-LENOVO-M70Q-03',
      processor: 'Intel Core i5-10400T',
      ram: '8 GB DDR4',
      storage: '256 GB SSD',
      monitor: 'Lenovo 21.5"',
      operatingSystem: 'Windows 10 Pro',
      location: 'HQ Floor 3',
      department: 'Human Resources',
      status: ComputerStatus.AVAILABLE,
      condition: ComputerCondition.GOOD,
    },
  ];

  for (const c of computers) {
    await prisma.computer.upsert({
      where: { assetId: c.assetId },
      update: {},
      create: c,
    });
  }

  // Sample Servers
  const servers = [
    {
      serverName: 'DC01-ACTIVE-DIRECTORY',
      hostname: 'dc01.company.local',
      ipAddress: '192.168.10.10',
      serverType: 'Domain Controller',
      operatingSystem: 'Windows Server 2022 Datacenter',
      location: 'HQ Server Room - Rack A1',
      cpu: '8 vCPU',
      ram: '32 GB',
      diskUsage: '35%',
      status: ServerStatus.ONLINE,
      purpose: 'Active Directory, DNS, Group Policy',
      administrator: 'Omith Hasan',
      port: 389,
    },
    {
      serverName: 'FS01-STORAGE-FILESERVER',
      hostname: 'fs01.company.local',
      ipAddress: '192.168.10.15',
      serverType: 'File Server',
      operatingSystem: 'Windows Server 2019',
      location: 'HQ Server Room - Rack A2',
      cpu: '16 vCPU',
      ram: '64 GB',
      diskUsage: '68%',
      status: ServerStatus.ONLINE,
      purpose: 'Central departmental file storage, backups',
      administrator: 'Omith Hasan',
      port: 445,
    },
    {
      serverName: 'PABX-VOIP-ASTERISK',
      hostname: 'pabx01.company.local',
      ipAddress: '192.168.10.20',
      serverType: 'Application Server',
      operatingSystem: 'Debian 12 / Asterisk 20',
      location: 'HQ Server Room - Telecom Rack',
      cpu: '4 vCPU',
      ram: '8 GB',
      diskUsage: '22%',
      status: ServerStatus.ONLINE,
      purpose: 'Internal PABX IP telephony and intercom lines',
      administrator: 'Rashid Ali',
      port: 5060,
    },
    {
      serverName: 'APP-PROD-PORTAL',
      hostname: 'portal.company.local',
      ipAddress: '192.168.10.30',
      serverType: 'Web Server',
      operatingSystem: 'Ubuntu 24.04 LTS',
      location: 'HQ Server Room - Rack B1',
      cpu: '8 vCPU',
      ram: '16 GB',
      diskUsage: '45%',
      status: ServerStatus.ONLINE,
      purpose: 'Corporate intranet and IT management dashboard',
      administrator: 'Omith Hasan',
      port: 80,
    },
  ];

  for (const s of servers) {
    await prisma.server.upsert({
      where: { serverName: s.serverName },
      update: {},
      create: s,
    });
  }

  // Sample Extensions
  const extensions = [
    { extensionNumber: '1101', holderName: 'Omith Hasan', department: 'IT', deskRoom: 'Room 401', status: ExtensionStatus.ASSIGNED },
    { extensionNumber: '1102', holderName: 'Rashid Ali', department: 'IT', deskRoom: 'Room 402', status: ExtensionStatus.ASSIGNED },
    { extensionNumber: '1103', holderName: 'Sajid Karim', department: 'IT', deskRoom: 'Helpdesk 403', status: ExtensionStatus.ASSIGNED },
    { extensionNumber: '1201', holderName: 'Ayesha Rahman', department: 'Finance', deskRoom: 'Room 205', status: ExtensionStatus.ASSIGNED },
    { extensionNumber: '1202', holderName: 'Kamal Hossain', department: 'HR', deskRoom: 'Room 304', status: ExtensionStatus.ASSIGNED },
    { extensionNumber: '1301', holderName: 'Unassigned Line', department: 'General', deskRoom: 'Floor 1 Reception', status: ExtensionStatus.AVAILABLE },
  ];

  for (const ext of extensions) {
    await prisma.extension.upsert({
      where: { extensionNumber: ext.extensionNumber },
      update: {},
      create: ext,
    });
  }

  // Activity Log
  await prisma.activityLog.create({
    data: {
      user: 'Omith Hasan',
      action: 'SYSTEM_INITIALIZED',
      module: 'MIGRATION',
      recordId: 'v2-init',
      newData: { system: 'Next.js + Express.js + TypeScript + Prisma + Tailwind CSS' },
    },
  });

  console.log('✅ Prisma database seeding complete!');
  console.log('🔑 Super Admin username: omith.hasan / password: Welcome@123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
