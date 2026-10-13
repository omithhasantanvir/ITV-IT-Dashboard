import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { ExtensionStatus, Role } from '@prisma/client';
import fs from 'fs';

const rawData = fs.readFileSync('C:\\Users\\OH Tanvir\\.gemini\\antigravity-ide\\brain\\d621e455-261d-4c36-9473-986fc9543202\\scratch\\extracted_pabx.json', 'utf8');
const pabxList = JSON.parse(rawData);

async function main() {
  console.log(`🚀 Starting import of ${pabxList.length} PABX extensions...`);
  const defaultPassword = await bcrypt.hash('Welcome@123', 10);

  for (const item of pabxList) {
    try {
      // 1. Upsert User/Employee
      const user = await prisma.user.upsert({
        where: { employeeId: item.pin },
        update: {
          name: item.name,
          designation: item.designation,
          department: item.department,
          extensionNumber: item.extensionNumber,
          phone: item.mobile || undefined,
          email: item.email || `${item.pin}@company.local`,
        },
        create: {
          employeeId: item.pin,
          name: item.name,
          username: item.email ? item.email.split('@')[0] : `user.${item.pin}`,
          password: defaultPassword,
          email: item.email || `${item.pin}@company.local`,
          designation: item.designation,
          department: item.department,
          extensionNumber: item.extensionNumber,
          phone: item.mobile || null,
          role: Role.VIEWER,
        },
      });

      // 2. Upsert Extension
      await prisma.extension.upsert({
        where: { extensionNumber: item.extensionNumber },
        update: {
          holderName: item.name,
          mobile: item.mobile,
          department: item.department,
          deskRoom: item.section || item.department,
          location: item.subSection || 'Head Office',
          status: ExtensionStatus.ASSIGNED,
          employeeId: user.id,
        },
        create: {
          extensionNumber: item.extensionNumber,
          holderName: item.name,
          mobile: item.mobile,
          department: item.department,
          deskRoom: item.section || item.department,
          location: item.subSection || 'Head Office',
          status: ExtensionStatus.ASSIGNED,
          employeeId: user.id,
        },
      });

      console.log(`✅ Imported: ${item.extensionNumber} - ${item.name} (${item.department})`);
    } catch (err: any) {
      console.error(`❌ Failed to import ${item.extensionNumber}:`, err.message);
    }
  }

  const count = await prisma.extension.count();
  console.log(`🎉 Total extensions in database now: ${count}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
